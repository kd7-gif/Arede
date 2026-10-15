import crypto from 'node:crypto';
import { pool } from '../db.js';
import { config } from '../config.js';
import { initializeTransaction, verifyTransaction } from './paystack.js';
import { notifyNewOrder } from './notify.js';

export const toKobo = (naira) => Math.round(Number(naira) * 100);

export async function attachItems(orders) {
  if (!orders.length) return orders;
  const [items] = await pool.query(
    `SELECT oi.order_id, oi.product_id, oi.product_name, oi.unit_price, oi.quantity, oi.line_total, p.slug, p.image_url
       FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id IN (?) ORDER BY oi.id`,
    [orders.map((o) => o.id)]
  );
  return orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) }));
}

// Puts the items of an order back on the shelf. Call inside a transaction.
export async function restockOrder(conn, orderId) {
  await conn.query(
    `UPDATE products p JOIN order_items oi ON oi.product_id = p.id
        SET p.stock = p.stock + oi.quantity WHERE oi.order_id = ?`,
    [orderId]
  );
}

/**
 * Marks an order as paid once Paystack confirms a successful transaction.
 * Safe to call many times for the same payment (verify page, webhook, expiry job).
 * Returns the updated order row, or null if the transaction doesn't match one of our orders.
 */
export async function settlePayment(txn) {
  if (!txn || txn.status !== 'success') return null;
  // Paystack echoes our metadata back; the reference (<order number>-<6 hex>) is the fallback.
  const orderNumber = txn.metadata?.order_number || String(txn.reference || '').replace(/-[0-9a-f]{6}$/, '');
  if (!orderNumber) return null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM orders WHERE order_number = ? FOR UPDATE', [orderNumber]);
    const order = rows[0];
    if (!order) {
      await conn.rollback();
      return null;
    }

    // Never trust a payment that doesn't match the order's total.
    if (txn.currency !== 'NGN' || Number(txn.amount) !== toKobo(order.total)) {
      console.error(`Payment ${txn.reference} does not match order ${orderNumber} (got ${txn.amount} ${txn.currency}).`);
      await conn.rollback();
      return null;
    }

    if (order.payment_status === 'paid' || order.payment_status === 'refund_due' || order.payment_status === 'refunded') {
      await conn.commit();
      return order;
    }

    let status = 'confirmed';
    let paymentStatus = 'paid';

    if (order.status === 'cancelled') {
      // The hold expired before the payment arrived. Take the stock again if it is still there.
      const [items] = await conn.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [order.id]);
      const ids = items.map((i) => i.product_id).filter(Boolean);
      const [prods] = ids.length
        ? await conn.query('SELECT id, stock FROM products WHERE id IN (?) FOR UPDATE', [ids])
        : [[]];
      const byId = new Map(prods.map((p) => [p.id, p]));
      const canRestore = items.length > 0 && items.every((i) => i.product_id && byId.get(i.product_id)?.stock >= i.quantity);
      if (canRestore) {
        for (const i of items) {
          await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [i.quantity, i.product_id]);
        }
      } else {
        status = 'cancelled';
        paymentStatus = 'refund_due'; // paid but we can no longer supply it: refund from the Paystack dashboard
      }
    }

    await conn.query(
      `UPDATE orders SET status = ?, payment_status = ?, paid_at = NOW(),
              paystack_transaction_id = ?, payment_reference = ? WHERE id = ?`,
      [status, paymentStatus, txn.id ? String(txn.id) : null, txn.reference || order.payment_reference, order.id]
    );
    await conn.commit();
    const [fresh] = await pool.query('SELECT * FROM orders WHERE id = ?', [order.id]);
    if (status === 'confirmed') notifyNewOrder(fresh[0]); // runs once: repeat calls return early above
    return fresh[0];
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/** Creates a Paystack payment for an order and returns the page to send the customer to. */
export async function startPayment(order, email) {
  // If an earlier attempt was actually paid, settle that instead of charging twice.
  if (order.payment_reference) {
    try {
      const earlier = await verifyTransaction(order.payment_reference);
      if (earlier.status === 'success') {
        await settlePayment(earlier);
        return { alreadyPaid: true };
      }
    } catch {
      /* no earlier payment to find, carry on */
    }
  }

  // A fresh reference per attempt, because Paystack rejects a reference it has already seen.
  const reference = `${order.order_number}-${crypto.randomBytes(3).toString('hex')}`;
  const txn = await initializeTransaction({
    email,
    amountKobo: toKobo(order.total),
    reference,
    callbackUrl: `${config.publicUrl}/payment/callback`,
    metadata: { order_number: order.order_number },
  });
  await pool.query('UPDATE orders SET payment_reference = ? WHERE id = ?', [reference, order.id]);
  return { url: txn.authorization_url };
}

/** Cancels unpaid orders whose hold time has run out and returns their stock. */
export async function expireUnpaidOrders() {
  const [stale] = await pool.query(
    `SELECT id, order_number, payment_reference FROM orders
      WHERE status = 'awaiting_payment' AND created_at < (NOW() - INTERVAL ? MINUTE)`,
    [config.unpaidHoldMinutes]
  );

  for (const o of stale) {
    // Last chance: the customer may have paid and the confirmation never reached us.
    if (o.payment_reference && config.paystack.secretKey) {
      try {
        const txn = await verifyTransaction(o.payment_reference);
        if (txn.status === 'success') {
          await settlePayment(txn);
          continue;
        }
      } catch {
        continue; // Paystack unreachable right now, try again next round
      }
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query("SELECT status FROM orders WHERE id = ? FOR UPDATE", [o.id]);
      if (rows[0]?.status === 'awaiting_payment') {
        await restockOrder(conn, o.id);
        await conn.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [o.id]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      console.error(`Could not expire order ${o.order_number}:`, err.message);
    } finally {
      conn.release();
    }
  }
}

export function startExpiryJob() {
  const run = () => expireUnpaidOrders().catch((err) => console.error('Expiry job failed:', err.message));
  run();
  setInterval(run, 5 * 60 * 1000).unref();
}

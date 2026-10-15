import crypto from 'node:crypto';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { config } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler, cleanString, toInt } from '../utils/http.js';
import { attachItems, startPayment } from '../services/orders.js';

const router = Router();
router.use(requireAuth); // every order route needs a logged-in account

const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many orders from this connection. Please wait a few minutes and try again.' },
});

const newOrderNumber = () => `AR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

router.post(
  '/',
  createLimiter,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const deliveryMethod = body.deliveryMethod === 'pickup' ? 'pickup' : 'delivery';
    const name = cleanString(body.name, 120);
    const phone = cleanString(body.phone, 30);
    const address = cleanString(body.address, 255);
    const city = cleanString(body.city, 80);
    const note = cleanString(body.note, 500);

    const fields = {};
    if (name.length < 2) fields.name = 'Enter the name for this order.';
    if (phone.replace(/\D/g, '').length < 7) fields.phone = 'Enter a phone number we can reach you on.';
    if (deliveryMethod === 'delivery') {
      if (address.length < 5) fields.address = 'Enter your delivery address.';
      if (city.length < 2) fields.city = 'Enter your city.';
    }
    if (Object.keys(fields).length) throw new HttpError(422, 'Please fix the highlighted fields.', fields);

    // Merge duplicate lines and validate quantities
    const wanted = new Map();
    for (const line of Array.isArray(body.items) ? body.items : []) {
      const id = toInt(line.productId);
      const qty = toInt(line.quantity);
      if (id <= 0 || qty <= 0 || qty > 99) throw new HttpError(422, 'One of the cart items is invalid.');
      wanted.set(id, (wanted.get(id) || 0) + qty);
    }
    if (!wanted.size) throw new HttpError(422, 'Your cart is empty.');

    const conn = await pool.getConnection();
    let orderId;
    try {
      await conn.beginTransaction();

      // Lock the product rows so two simultaneous orders cannot oversell stock.
      const [products] = await conn.query(
        'SELECT id, name, price, stock, is_active FROM products WHERE id IN (?) FOR UPDATE',
        [[...wanted.keys()]]
      );
      const byId = new Map(products.map((p) => [p.id, p]));

      const lines = [];
      for (const [id, qty] of wanted) {
        const p = byId.get(id);
        if (!p || !p.is_active) throw new HttpError(409, 'An item in your cart is no longer available. Please review your cart.');
        if (p.stock < qty) {
          throw new HttpError(
            409,
            `"${p.name}" is no longer available in that quantity. Please reduce it or remove it from your cart.`
          );
        }
        lines.push({ p, qty, total: Math.round(p.price * qty * 100) / 100 });
      }

      // Prices always come from the database, never from the browser.
      const subtotal = lines.reduce((s, l) => s + l.total, 0);
      const deliveryFee = deliveryMethod === 'delivery' ? config.deliveryFee : 0; // flat fee on every delivery, pickup is free
      const total = subtotal + deliveryFee;

      const [result] = await conn.query(
        `INSERT INTO orders
           (order_number, user_id, status, payment_status, payment_method, delivery_method, subtotal, delivery_fee, total,
            customer_name, phone, address, city, note)
         VALUES (?, ?, 'awaiting_payment', 'unpaid', 'paystack', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newOrderNumber(), req.user.id, deliveryMethod, subtotal, deliveryFee, total,
         name, phone, deliveryMethod === 'delivery' ? address : null, deliveryMethod === 'delivery' ? city : null, note || null]
      );
      orderId = result.insertId;

      // Items are held for the customer while they pay.
      for (const l of lines) {
        await conn.query(
          'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, line_total) VALUES (?, ?, ?, ?, ?, ?)',
          [orderId, l.p.id, l.p.name, l.p.price, l.qty, l.total]
        );
        await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [l.qty, l.p.id]);
      }
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }

    const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    let paymentUrl = null;
    let paymentError = null;
    try {
      ({ url: paymentUrl } = await startPayment(rows[0], req.user.email));
    } catch (err) {
      // The order is saved. The customer can retry payment from the order page.
      paymentError = err instanceof HttpError ? err.message : 'We could not start the payment. Please try again.';
    }

    const [order] = await attachItems(rows);
    res.status(201).json({ order, paymentUrl, paymentError });
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC', [req.user.id]);
    res.json({ items: await attachItems(rows) });
  })
);

async function findOwnOrder(req) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE order_number = ?', [req.params.orderNumber]);
  const order = rows[0];
  if (!order || (order.user_id !== req.user.id && req.user.role !== 'admin')) {
    throw new HttpError(404, 'We could not find that order.');
  }
  return order;
}

router.get(
  '/:orderNumber',
  asyncHandler(async (req, res) => {
    const order = await findOwnOrder(req);
    const [full] = await attachItems([order]);
    res.json({ order: full });
  })
);

// Try paying again for an order that is still waiting for payment.
router.post(
  '/:orderNumber/pay',
  asyncHandler(async (req, res) => {
    const order = await findOwnOrder(req);
    if (order.status !== 'awaiting_payment') {
      throw new HttpError(409, order.payment_status === 'paid' ? 'This order is already paid.' : 'This order can no longer be paid. Please place a new order.');
    }
    const result = await startPayment(order, req.user.email);
    res.json({ paymentUrl: result.url || null, alreadyPaid: Boolean(result.alreadyPaid) });
  })
);

export default router;

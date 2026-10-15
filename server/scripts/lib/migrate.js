// Brings an existing database up to date. Safe to run as many times as you like.
// New installs already have the latest tables from schema.sql, so this does nothing for them.

async function columnInfo(conn, table, column) {
  const [rows] = await conn.query(
    'SELECT COLUMN_TYPE AS type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  return rows[0] || null;
}

export async function migrate(conn, log = console.log) {
  // 1. Paystack payment fields on orders
  if (!(await columnInfo(conn, 'orders', 'payment_status'))) {
    log('Adding payment fields to orders...');
    await conn.query(`
      ALTER TABLE orders
        ADD COLUMN payment_status ENUM('unpaid','paid','refund_due','refunded') NOT NULL DEFAULT 'unpaid' AFTER payment_method,
        ADD COLUMN payment_reference VARCHAR(64) NULL AFTER payment_status,
        ADD COLUMN paystack_transaction_id VARCHAR(40) NULL AFTER payment_reference,
        ADD COLUMN paid_at TIMESTAMP NULL DEFAULT NULL AFTER paystack_transaction_id,
        ADD KEY idx_orders_payment (payment_status)`);
  }

  // 2. Paystack is now the only payment method
  const pm = await columnInfo(conn, 'orders', 'payment_method');
  if (pm && pm.type.startsWith('enum')) {
    log('Updating payment method...');
    await conn.query("ALTER TABLE orders MODIFY payment_method VARCHAR(20) NOT NULL DEFAULT 'paystack'");
    await conn.query("UPDATE orders SET payment_method = 'paystack'");
  }

  // 3. New order statuses (orders are now paid up front)
  const st = await columnInfo(conn, 'orders', 'status');
  if (st && !st.type.includes('awaiting_payment')) {
    log('Updating order statuses...');
    await conn.query(`ALTER TABLE orders MODIFY status
      ENUM('awaiting_payment','pending','confirmed','out_for_delivery','ready_for_pickup','completed','cancelled')
      NOT NULL DEFAULT 'awaiting_payment'`);
    // Orders made before payments existed were never paid through Paystack.
    // They go back to "awaiting payment" and are released automatically after the hold time.
    await conn.query("UPDATE orders SET status = 'awaiting_payment' WHERE status = 'pending'");
    await conn.query(`ALTER TABLE orders MODIFY status
      ENUM('awaiting_payment','confirmed','out_for_delivery','ready_for_pickup','completed','cancelled')
      NOT NULL DEFAULT 'awaiting_payment'`);
  }
}

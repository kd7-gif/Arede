import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler, cleanString } from '../utils/http.js';
import { isValidSignature, verifyTransaction } from '../services/paystack.js';
import { attachItems, settlePayment } from '../services/orders.js';

const router = Router();

// The customer is sent here by the browser after paying. We ask Paystack directly, we never trust the browser.
router.get(
  '/verify',
  requireAuth,
  asyncHandler(async (req, res) => {
    const reference = cleanString(req.query.reference || req.query.trxref || '', 80);
    if (!reference) throw new HttpError(422, 'Missing payment reference.');

    const txn = await verifyTransaction(reference);
    const [rows] = await pool.query('SELECT * FROM orders WHERE order_number = ?', [txn.metadata?.order_number || String(txn.reference || reference).replace(/-[0-9a-f]{6}$/, '')]);
    const order = rows[0];
    if (!order || (order.user_id !== req.user.id && req.user.role !== 'admin')) {
      throw new HttpError(404, 'We could not find an order for that payment.');
    }

    let current = order;
    if (txn.status === 'success') current = (await settlePayment(txn)) || order;

    const [full] = await attachItems([current]);
    res.json({ order: full, paid: current.payment_status === 'paid', gatewayStatus: txn.status });
  })
);

// Paystack calls this itself, even if the customer closes the browser after paying.
// It receives the raw request body so the signature can be checked.
export const webhook = asyncHandler(async (req, res) => {
  if (!isValidSignature(req.body, req.headers['x-paystack-signature'])) {
    return res.status(401).end();
  }
  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch {
    return res.status(400).end();
  }
  if (event.event === 'charge.success') await settlePayment(event.data);
  return res.sendStatus(200);
});

export default router;

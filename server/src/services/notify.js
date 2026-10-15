// Emails the shop owner when an order has been paid.
// Needs these in server/.env (see .env.example). Without them it only logs a line and nothing breaks.
import { attachItems } from './orders.js';

const naira = (n) => '₦' + Number(n).toLocaleString('en-NG');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export async function notifyNewOrder(order) {
  try {
    const to = process.env.NOTIFY_EMAIL;
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
    console.log(`New paid order ${order.order_number}: ${naira(order.total)}`);
    if (!to || !SMTP_HOST || !SMTP_USER || !SMTP_PASS) return;

    const [full] = await attachItems([order]);
    const lines = full.items.map((i) => `${i.quantity} x ${i.product_name} (${naira(i.line_total)})`);
    const how = order.delivery_method === 'delivery'
      ? `Delivery to: ${[order.address, order.city].filter(Boolean).join(', ')}`
      : 'Pickup from Westmead Mall, Samonda, Ibadan';
    const text = [
      `New paid order ${order.order_number}`,
      '', ...lines, '',
      `Subtotal: ${naira(order.subtotal)}`,
      `Delivery fee: ${naira(order.delivery_fee)}`,
      `Total paid: ${naira(order.total)}`, '',
      `Customer: ${order.customer_name}`,
      `Phone: ${order.phone}`,
      how,
      order.note ? `Note: ${order.note}` : '',
    ].filter((l) => l !== null).join('\n');
    const html = `<h2>New paid order ${esc(order.order_number)}</h2><pre style="font:15px/1.6 sans-serif">${esc(text)}</pre>`;

    const { default: nodemailer } = await import('nodemailer');
    const transport = nodemailer.createTransport({
      host: SMTP_HOST, port: Number(SMTP_PORT || 587), secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transport.sendMail({
      from: `"Arédè Store" <${SMTP_USER}>`, to,
      subject: `New order ${order.order_number}: ${naira(order.total)}`, text, html,
    });
  } catch (err) {
    console.error('Could not send the new-order email:', err.message);
  }
}

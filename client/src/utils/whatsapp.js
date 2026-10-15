import { formatNaira } from './format.js';

// Builds the message the customer sends to the store after paying.
export function orderMessage(o) {
  const lines = o.items.map((i) => `- ${i.quantity} x ${i.product_name} (${formatNaira(i.line_total)})`);
  const how = o.delivery_method === 'delivery'
    ? `Delivery to: ${o.address}, ${o.city}`
    : 'Pickup at Westmead Mall, Samonda, Ibadan';
  return [
    `Hello Arede, I have paid for order ${o.order_number}.`,
    '',
    ...lines,
    '',
    `Total paid: ${formatNaira(o.total)}`,
    how,
    `Name: ${o.customer_name}`,
    `Phone: ${o.phone}`,
  ].join('\n');
}

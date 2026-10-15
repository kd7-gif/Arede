const nf = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });

export const formatNaira = (n) => `₦${nf.format(Math.round(Number(n) || 0))}`;

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('en-NG', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const STATUS = {
  awaiting_payment: { label: 'Awaiting payment', tone: 'gold' },
  confirmed: { label: 'Paid, preparing your order', tone: 'green' },
  out_for_delivery: { label: 'Out for delivery', tone: 'green' },
  ready_for_pickup: { label: 'Ready for pickup', tone: 'green' },
  completed: { label: 'Completed', tone: 'done' },
  cancelled: { label: 'Cancelled', tone: 'red' },
};

export const PAYMENT_STATUS = {
  unpaid: 'Not paid',
  paid: 'Paid with Paystack',
  refund_due: 'Refund on the way',
  refunded: 'Refunded',
};

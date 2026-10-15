import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';

// Paystack sends the customer back here. We ask the server to confirm the payment, then show the order.
export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const reference = params.get('reference') || params.get('trxref');

  useEffect(() => {
    if (!reference) { setError('We could not find your payment reference.'); return; }
    let alive = true;
    api(`/payments/verify?reference=${encodeURIComponent(reference)}`)
      .then(({ order }) => alive && navigate(`/order/${order.order_number}`, { replace: true, state: { justPaid: true } }))
      .catch((e) => alive && setError(e.message));
    return () => { alive = false; };
  }, [reference, navigate]);

  return (
    <div className="container section" style={{ textAlign: 'center', padding: '4rem 0' }}>
      {error ? (
        <>
          <h1>We could not confirm your payment</h1>
          <p>{error} If money left your account, don't worry: it is matched to your order automatically.</p>
          <Link to="/orders" className="text-link">Check your orders</Link>
        </>
      ) : (
        <>
          <h1>Confirming your payment...</h1>
          <p>Please don't close this page.</p>
        </>
      )}
    </div>
  );
}

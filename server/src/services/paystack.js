// Thin wrapper around the Paystack API. The secret key never leaves the server.
import crypto from 'node:crypto';
import { config } from '../config.js';
import { HttpError } from '../utils/http.js';

async function call(path, options = {}) {
  const { secretKey, baseUrl } = config.paystack;
  if (!secretKey) {
    throw new HttpError(503, 'Online payment is not switched on yet. Please contact the store.');
  }

  let res;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${secretKey}`, 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new HttpError(502, 'We could not reach Paystack. Please try again in a moment.');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === false) {
    console.error(`Paystack ${path} failed (${res.status}): ${body.message || 'no message'}`);
    throw new HttpError(502, 'Paystack could not process this request. Please try again.');
  }
  return body.data;
}

export const initializeTransaction = ({ email, amountKobo, reference, callbackUrl, metadata }) =>
  call('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({ email, amount: amountKobo, currency: 'NGN', reference, callback_url: callbackUrl, metadata }),
  });

export const verifyTransaction = (reference) => call(`/transaction/verify/${encodeURIComponent(reference)}`);

// Paystack signs every webhook with HMAC-SHA512 of the raw body, using your secret key.
export function isValidSignature(rawBody, signature) {
  const { secretKey } = config.paystack;
  if (!secretKey || !signature || !Buffer.isBuffer(rawBody)) return false;
  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

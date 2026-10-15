import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

if (isProd && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production');
}

const clientOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim());

export const config = {
  isProd,
  port: Number(process.env.PORT || 5001),
  clientOrigins,
  // Where customers land after paying on Paystack. Defaults to the first CLIENT_ORIGIN.
  publicUrl: (process.env.PUBLIC_URL || clientOrigins[0]).replace(/\/$/, ''),
  trustProxy: process.env.TRUST_PROXY === '1',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-secret-change-me',
  db: {
    // The MYSQL* names are what hosts such as Railway fill in for you.
    host: process.env.DB_HOST || process.env.MYSQLHOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || process.env.MYSQLPORT || 3306),
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASSWORD ?? process.env.MYSQLPASSWORD ?? '',
    database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'arede',
  },
  // Customers can only check out once a live Paystack key is in place (or PAYMENTS_OPEN=true).
  // Until then the checkout shows "payments coming soon". Admin accounts can still test.
  paymentsOpen: (process.env.PAYSTACK_SECRET_KEY || '').startsWith('sk_live_') || process.env.PAYMENTS_OPEN === 'true',
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  },
  // Flat delivery fee in naira, charged on every delivered order whatever its size. Pickup is free.
  deliveryFee: Number(process.env.DELIVERY_FEE ?? 3500),
  // How long unpaid orders keep their items reserved before being cancelled.
  unpaidHoldMinutes: Number(process.env.UNPAID_HOLD_MINUTES || 30),
};

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config.js';
import { pool } from './db.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import orderRoutes from './routes/orders.js';
import paymentRoutes, { webhook } from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import { uploadDir } from './utils/images.js';
import { startExpiryJob } from './services/orders.js';
import { HttpError } from './utils/http.js';

// Friendly check: the database needs the latest tables before the server can run.
try {
  const [cols] = await pool.query(
    "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_status'",
    [config.db.database]
  );
  if (!cols.length) {
    console.error('\nYour database needs updating for Paystack payments. Run this once, then start the server again:\n\n  npm run db:migrate\n');
    process.exit(1);
  }
} catch (err) {
  console.error(`\nCould not read the database "${config.db.database}": ${err.message}\nCheck MySQL is running and the DB_ settings in server/.env. If the database does not exist yet, run: npm run db:setup\n`);
  process.exit(1);
}

if (!config.paystack.secretKey) {
  console.warn('Note: PAYSTACK_SECRET_KEY is not set in .env, so checkout cannot take payments yet.');
}

const app = express();
if (config.trustProxy) app.set('trust proxy', 1);

// Send www.<domain> visitors to the main address so logins and carts are not split between two sites.
// Only plain page loads are redirected (GET/HEAD), never form posts or the Paystack webhook.
try {
  const mainHost = new URL(config.publicUrl).hostname;
  if (mainHost && !mainHost.startsWith('www.') && !['localhost', '127.0.0.1'].includes(mainHost)) {
    app.use((req, res, next) => {
      if ((req.method === 'GET' || req.method === 'HEAD') && req.hostname === `www.${mainHost}`) {
        return res.redirect(301, `${config.publicUrl}${req.originalUrl}`);
      }
      next();
    });
  }
} catch { /* PUBLIC_URL is not a valid address, so skip the redirect */ }

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.clientOrigins, credentials: true }));

// Paystack's webhook needs the raw body to check its signature, so this comes before express.json().
app.post('/api/payments/webhook', express.raw({ type: '*/*', limit: '1mb' }), webhook);

// Extra guard against forged requests from other websites: any change-making request that
// names an origin must come from one of our own pages.
app.use('/api', (req, _res, next) => {
  const origin = req.headers.origin;
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !origin || config.clientOrigins.includes(origin)) return next();
  next(new HttpError(403, 'Request blocked.'));
});

app.use(express.json({ limit: '200kb' }));
app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api', catalogRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found.')));

// On the live site this one server also hands out the website itself (client/dist), so the site
// and the API share one address. That keeps logins simple and secure.
const siteDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(path.join(siteDir, 'index.html'))) {
  app.use(express.static(siteDir, { index: false, maxAge: '1h' }));
  app.get('*', (req, res, next) =>
    req.path.startsWith('/api') || req.path.startsWith('/uploads')
      ? next()
      : res.sendFile(path.join(siteDir, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, fields: err.details });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(422).json({ error: 'That image is larger than 8MB.' });
  }
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.' });
});

app.listen(config.port, () => {
  console.log(`Arede API running on http://localhost:${config.port}`);
  startExpiryJob();
});

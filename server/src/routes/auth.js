import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { pool } from '../db.js';
import { startSession, endSession, publicUser, requireAuth } from '../middleware/auth.js';
import { HttpError, asyncHandler, cleanString, isEmail } from '../utils/http.js';

const router = Router();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please wait a few minutes and try again.' },
});

const phoneOk = (p) => p.replace(/\D/g, '').length >= 7;

router.post(
  '/register',
  limiter,
  asyncHandler(async (req, res) => {
    const full_name = cleanString(req.body.full_name, 120);
    const email = cleanString(req.body.email, 190).toLowerCase();
    const phone = cleanString(req.body.phone, 30);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const fields = {};
    if (full_name.length < 2) fields.full_name = 'Enter your full name.';
    if (!isEmail(email)) fields.email = 'Enter a valid email address.';
    if (!phoneOk(phone)) fields.phone = 'Enter a phone number we can reach you on.';
    if (password.length < 8) fields.password = 'Use at least 8 characters.';
    else if (Buffer.byteLength(password) > 72) fields.password = 'Use 72 characters or fewer.';
    if (Object.keys(fields).length) throw new HttpError(422, 'Please fix the highlighted fields.', fields);

    const [dupe] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (dupe.length) throw new HttpError(409, 'An account with this email already exists.', { email: 'Already registered. Try logging in.' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES (?, ?, ?, ?)',
      [full_name, email, phone, hash]
    );
    const user = { id: result.insertId, full_name, email, phone, role: 'customer', address: null, city: null };
    startSession(res, user);
    res.status(201).json({ user: publicUser(user) });
  })
);

router.post(
  '/login',
  limiter,
  asyncHandler(async (req, res) => {
    const email = cleanString(req.body.email, 190).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) throw new HttpError(422, 'Enter your email and password.');

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) throw new HttpError(401, 'Email or password is incorrect.');

    startSession(res, user);
    res.json({ user: publicUser(user) });
  })
);

router.post('/logout', (_req, res) => {
  endSession(res);
  res.status(204).end();
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

router.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const full_name = cleanString(req.body.full_name, 120) || req.user.full_name;
    const phone = cleanString(req.body.phone, 30) || req.user.phone;
    const address = cleanString(req.body.address, 255);
    const city = cleanString(req.body.city, 80);
    await pool.query('UPDATE users SET full_name = ?, phone = ?, address = ?, city = ? WHERE id = ?', [
      full_name, phone, address || null, city || null, req.user.id,
    ]);
    res.json({ user: publicUser({ ...req.user, full_name, phone, address, city }) });
  })
);

export default router;

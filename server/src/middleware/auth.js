import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { pool } from '../db.js';
import { HttpError, asyncHandler } from '../utils/http.js';

const COOKIE = 'arede_session';
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const signToken = (user) =>
  jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d' });

// The login lives in an httpOnly cookie, so scripts on the page can never read it.
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
});
export const startSession = (res, user) => res.cookie(COOKIE, signToken(user), { ...cookieOptions(), maxAge: WEEK_MS });
export const endSession = (res) => res.clearCookie(COOKIE, cookieOptions());

const readCookie = (req, name) => {
  for (const part of (req.headers.cookie || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) {
      try { return decodeURIComponent(part.slice(i + 1).trim()); } catch { return null; }
    }
  }
  return null;
};

export const publicUser = (u) => ({
  id: u.id,
  full_name: u.full_name,
  email: u.email,
  phone: u.phone,
  role: u.role,
  address: u.address,
  city: u.city,
});

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readCookie(req, COOKIE);
  if (!token) throw new HttpError(401, 'Please log in to continue.');

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw new HttpError(401, 'Your session has expired. Please log in again.');
  }

  const [rows] = await pool.query(
    'SELECT id, full_name, email, phone, role, address, city FROM users WHERE id = ?',
    [payload.sub]
  );
  if (!rows.length) throw new HttpError(401, 'Account not found. Please log in again.');
  req.user = rows[0];
  next();
});

export const requireAdmin = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(new HttpError(403, 'Admin access only.'));
  next();
};

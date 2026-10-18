const BASE = import.meta.env.VITE_API_URL || '';
const HINT_KEY = 'arede_signed_in'; // only a yes/no hint, never the login itself (that is in a protected cookie)

export class ApiError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.status = status;
    this.fields = fields || {};
  }
}

export const hasSessionHint = () => {
  try { return localStorage.getItem(HINT_KEY) === '1'; } catch { return false; }
};
export const setSessionHint = (on) => {
  try { on ? localStorage.setItem(HINT_KEY, '1') : localStorage.removeItem(HINT_KEY); } catch { /* storage blocked */ }
};

// Image URLs saved by the admin uploader look like /uploads/abc.jpg and live on the API server.
export const assetUrl = (u) => (u && u.startsWith('/uploads') ? `${BASE}${u}` : u);

// Demo build (VITE_DEMO=true): answer from the in-browser fake server instead of a real API.
// When the flag is off this branch is removed at build time, so the real site never includes it.
const DEMO = import.meta.env.VITE_DEMO === 'true';
export const isDemo = DEMO;

async function demoApi(path, options) {
  const { demoRequest } = await import('./demoApi.js');
  try {
    return await demoRequest(path, options);
  } catch (e) {
    if (!e.demo) throw e;
    if (e.status === 401 && hasSessionHint()) window.dispatchEvent(new Event('arede:unauthorized'));
    throw new ApiError(e.message, e.status, e.fields);
  }
}

export async function api(path, { method = 'GET', body, form } = {}) {
  if (DEMO) return demoApi(path, { method, body, form });
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method,
      headers,
      credentials: 'include',
      body: form || (body ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }

  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && hasSessionHint()) window.dispatchEvent(new Event('arede:unauthorized'));
    throw new ApiError(data.error || 'Something went wrong. Please try again.', res.status, data.fields);
  }
  return data;
}

export const qs = (params) => {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
};

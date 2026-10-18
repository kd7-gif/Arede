// A tiny fake server that runs inside the browser. It is used ONLY when the site is built with
// VITE_DEMO=true (see README), so the store can be hosted for free on a static host and still be clickable.
// It mirrors the real API's responses and rules (stock, delivery pricing, order statuses), and keeps its
// data in this browser's localStorage. Nothing is sent anywhere.
import { DEMO_CATEGORIES, DEMO_PRODUCTS } from './demoData.js';

const DB_KEY = 'arede_demo_db_v1';
const SESSION_KEY = 'arede_demo_session_v1';
const FEE_IBADAN = 3000;
const FEE_OUTSIDE = 4000;
const DEMO_PASSWORD = 'demo1234';

class DemoError extends Error {
  constructor(message, status, fields) {
    super(message);
    this.demo = true;
    this.status = status;
    this.fields = fields || {};
  }
}

// ---------- storage (falls back to memory if the browser blocks localStorage) ----------
const memory = {};
const read = (k) => { try { return localStorage.getItem(k); } catch { return memory[k] ?? null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { memory[k] = v; } };
const drop = (k) => { try { localStorage.removeItem(k); } catch { delete memory[k]; } };

const iso = (minsAgo) => new Date(Date.now() - minsAgo * 60000).toISOString();

function seedOrder(id, number, userId, status, payment, minsAgo, name, items, method, area, city) {
  const lines = items.map(([pid, qty]) => {
    const p = DEMO_PRODUCTS.find((x) => x.id === pid);
    return { product_id: pid, product_name: p.name, unit_price: p.price, quantity: qty, line_total: p.price * qty };
  });
  const subtotal = lines.reduce((s, l) => s + l.line_total, 0);
  const fee = method === 'pickup' ? 0 : area === 'ibadan' ? FEE_IBADAN : FEE_OUTSIDE;
  return {
    id, order_number: number, user_id: userId, status, delivery_method: method, payment_method: 'paystack',
    payment_status: payment, paid_at: payment === 'paid' ? iso(minsAgo - 2) : null,
    subtotal, delivery_fee: fee, total: subtotal + fee, customer_name: name, phone: '08012345678',
    address: method === 'delivery' ? '12 Sample Street' : null, city: method === 'delivery' ? city : null,
    note: null, created_at: iso(minsAgo), items: lines,
  };
}

function freshDb() {
  return {
    users: [
      { id: 1, full_name: 'Demo Admin', email: 'admin@arede.demo', phone: '08000000001', role: 'admin', address: null, city: null, seeded: true },
      { id: 2, full_name: 'Demo Customer', email: 'customer@arede.demo', phone: '08000000002', role: 'customer', address: null, city: null, seeded: true },
      { id: 3, full_name: 'Adaeze Okafor', email: 'adaeze@arede.demo', phone: '08012345678', role: 'customer', address: '12 Sample Street', city: 'Ibadan', seeded: true, locked: true },
    ],
    products: DEMO_PRODUCTS.map((p) => ({ ...p })),
    orders: [
      seedOrder(1, 'AR-3F9A21C4', 3, 'confirmed', 'paid', 95, 'Adaeze Okafor', [[1, 1]], 'delivery', 'ibadan', 'Ibadan'),
      seedOrder(2, 'AR-7B20D5E1', 3, 'out_for_delivery', 'paid', 60 * 26, 'Adaeze Okafor', [[2, 1], [5, 2]], 'delivery', 'outside', 'Lagos'),
      seedOrder(3, 'AR-C84E0A97', 3, 'completed', 'paid', 60 * 24 * 3, 'Adaeze Okafor', [[8, 1]], 'pickup', 'ibadan', null),
    ],
    nextOrderId: 4,
    nextUserId: 4,
    nextProductId: DEMO_PRODUCTS.length + 1,
  };
}

let cache = null;
function db() {
  if (cache) return cache;
  try { cache = JSON.parse(read(DB_KEY)); } catch { cache = null; }
  if (!cache || !cache.products) cache = freshDb();
  return cache;
}
const save = () => { try { write(DB_KEY, JSON.stringify(cache)); } catch { /* keep going in memory */ } };

export function resetDemo() {
  cache = null;
  drop(DB_KEY);
  drop(SESSION_KEY);
}

// ---------- helpers ----------
const toInt = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const clean = (v, max) => String(v ?? '').trim().slice(0, max);
const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const publicUser = (u) => ({ id: u.id, full_name: u.full_name, email: u.email, phone: u.phone, role: u.role, address: u.address, city: u.city });

function currentUser() {
  const id = toInt(read(SESSION_KEY), 0);
  return db().users.find((u) => u.id === id) || null;
}
function requireUser() {
  const u = currentUser();
  if (!u) throw new DemoError('Please sign in to continue.', 401);
  return u;
}
function requireAdmin() {
  const u = requireUser();
  if (u.role !== 'admin') throw new DemoError('You do not have access to that.', 403);
  return u;
}

const categoryOf = (p) => DEMO_CATEGORIES.find((c) => c.id === p.category_id) || DEMO_CATEGORIES[0];
const shapeProduct = (p) => {
  const c = categoryOf(p);
  return {
    id: p.id, name: p.name, slug: p.slug, description: p.description, price: p.price, compare_at_price: p.compare_at_price,
    image_url: p.image_url, stock: p.stock, is_featured: p.is_featured, category_name: c.name, category_slug: c.slug, category_id: p.category_id,
  };
};
const activeProducts = () => db().products.filter((p) => p.is_active);
const withItemMeta = (o) => ({
  ...o,
  items: o.items.map((i) => {
    const p = db().products.find((x) => x.id === i.product_id);
    return { ...i, slug: p?.slug || null, image_url: p?.image_url || null };
  }),
});

function restock(order) {
  order.items.forEach((i) => {
    const p = db().products.find((x) => x.id === i.product_id);
    if (p) p.stock += i.quantity;
  });
}

// ---------- the router ----------
export async function demoRequest(path, { method = 'GET', body, form } = {}) {
  await new Promise((r) => setTimeout(r, 120)); // feels like a network call
  const [pathname, queryString = ''] = path.split('?');
  const query = Object.fromEntries(new URLSearchParams(queryString));
  const parts = pathname.split('/').filter(Boolean);
  const [area, a, b] = parts;
  const D = db();

  // ----- catalogue -----
  if (area === 'settings') {
    return { deliveryFeeIbadan: FEE_IBADAN, deliveryFeeOutside: FEE_OUTSIDE, holdMinutes: 30, paymentsOpen: true };
  }
  if (area === 'categories') {
    const items = DEMO_CATEGORIES.map((c) => {
      const mine = activeProducts().filter((p) => p.category_id === c.id);
      const newest = [...mine].filter((p) => p.image_url).sort((x, y) => y.id - x.id)[0];
      return { ...c, product_count: mine.length, image_url: newest ? newest.image_url : null };
    });
    return { items };
  }
  if (area === 'products' && !a) {
    let list = activeProducts();
    if (query.category) list = list.filter((p) => categoryOf(p).slug === query.category);
    if (query.q) {
      const q = query.q.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q));
    }
    if (query.min) list = list.filter((p) => p.price >= Number(query.min));
    if (query.max) list = list.filter((p) => p.price <= Number(query.max));
    if (query.featured === '1') list = list.filter((p) => p.is_featured);
    if (query.inStock === '1') list = list.filter((p) => p.stock > 0);
    const sorts = {
      price_asc: (x, y) => x.price - y.price,
      price_desc: (x, y) => y.price - x.price,
      name: (x, y) => x.name.localeCompare(y.name),
      newest: (x, y) => y.id - x.id,
    };
    list = [...list].sort(sorts[query.sort] || sorts.newest);
    const limit = Math.min(Math.max(toInt(query.limit, 12), 1), 48);
    const page = Math.max(toInt(query.page, 1), 1);
    return {
      items: list.slice((page - 1) * limit, page * limit).map(shapeProduct),
      total: list.length, page, pages: Math.max(Math.ceil(list.length / limit), 1),
    };
  }
  if (area === 'products' && a) {
    const p = activeProducts().find((x) => x.slug === a);
    if (!p) throw new DemoError('We could not find that product.', 404);
    const related = activeProducts().filter((x) => x.category_id === p.category_id && x.id !== p.id)
      .sort((x, y) => y.is_featured - x.is_featured || y.id - x.id).slice(0, 4).map(shapeProduct);
    return { product: shapeProduct(p), related };
  }

  // ----- accounts -----
  if (area === 'auth') {
    if (a === 'register' && method === 'POST') {
      const full_name = clean(body.full_name, 120);
      const email = clean(body.email, 160).toLowerCase();
      const phone = clean(body.phone, 30);
      const fields = {};
      if (full_name.length < 2) fields.full_name = 'Enter your full name.';
      if (!/^\S+@\S+\.\S+$/.test(email)) fields.email = 'Enter a valid email address.';
      if (String(body.password || '').length < 8) fields.password = 'Use at least 8 characters.';
      if (Object.keys(fields).length) throw new DemoError('Please fix the highlighted fields.', 422, fields);
      if (D.users.some((u) => u.email === email)) throw new DemoError('An account with that email already exists.', 409, { email: 'That email is already registered.' });
      // The password is never stored in the demo.
      const user = { id: D.nextUserId++, full_name, email, phone, role: 'customer', address: null, city: null };
      D.users.push(user);
      save();
      write(SESSION_KEY, String(user.id));
      return { user: publicUser(user) };
    }
    if (a === 'login' && method === 'POST') {
      const email = clean(body.email, 160).toLowerCase();
      const user = D.users.find((u) => u.email === email);
      const ok = user && !user.locked && (!user.seeded || body.password === DEMO_PASSWORD);
      if (!ok) throw new DemoError('That email or password is not right.', 401);
      write(SESSION_KEY, String(user.id));
      return { user: publicUser(user) };
    }
    if (a === 'logout') { drop(SESSION_KEY); return null; }
    if (a === 'me' && method === 'GET') return { user: publicUser(requireUser()) };
    if (a === 'me' && method === 'PATCH') {
      const u = requireUser();
      u.full_name = clean(body.full_name, 120) || u.full_name;
      u.phone = clean(body.phone, 30);
      u.address = clean(body.address, 255) || null;
      u.city = clean(body.city, 80) || null;
      save();
      return { user: publicUser(u) };
    }
  }

  // ----- orders (customer) -----
  if (area === 'orders') {
    const user = requireUser();
    if (!a && method === 'GET') {
      return { items: D.orders.filter((o) => o.user_id === user.id).sort((x, y) => y.id - x.id).map(withItemMeta) };
    }
    if (!a && method === 'POST') {
      const deliveryMethod = body.deliveryMethod === 'pickup' ? 'pickup' : 'delivery';
      const deliveryArea = body.deliveryArea === 'ibadan' ? 'ibadan' : 'outside';
      const name = clean(body.name, 120), phone = clean(body.phone, 30);
      const address = clean(body.address, 255), city = clean(body.city, 80), note = clean(body.note, 500);
      const fields = {};
      if (name.length < 2) fields.name = 'Enter the name for this order.';
      if (phone.replace(/\D/g, '').length < 7) fields.phone = 'Enter a phone number we can reach you on.';
      if (deliveryMethod === 'delivery') {
        if (address.length < 5) fields.address = 'Enter your delivery address.';
        if (city.length < 2) fields.city = 'Enter your city.';
      }
      if (Object.keys(fields).length) throw new DemoError('Please fix the highlighted fields.', 422, fields);

      const wanted = new Map();
      for (const line of Array.isArray(body.items) ? body.items : []) {
        const id = toInt(line.productId), qty = toInt(line.quantity);
        if (id <= 0 || qty <= 0 || qty > 99) throw new DemoError('One of the cart items is invalid.', 422);
        wanted.set(id, (wanted.get(id) || 0) + qty);
      }
      if (!wanted.size) throw new DemoError('Your cart is empty.', 422);

      const lines = [];
      for (const [id, qty] of wanted) {
        const p = D.products.find((x) => x.id === id && x.is_active);
        if (!p) throw new DemoError('One of the items is no longer available.', 409);
        if (p.stock < qty) throw new DemoError(p.stock === 0 ? `${p.name} is sold out.` : `Only ${p.stock} of ${p.name} left.`, 409);
        lines.push({ p, qty });
      }
      lines.forEach(({ p, qty }) => { p.stock -= qty; });
      const items = lines.map(({ p, qty }) => ({ product_id: p.id, product_name: p.name, unit_price: p.price, quantity: qty, line_total: p.price * qty }));
      const subtotal = items.reduce((s, i) => s + i.line_total, 0);
      const delivery_fee = deliveryMethod === 'pickup' ? 0 : deliveryArea === 'ibadan' ? FEE_IBADAN : FEE_OUTSIDE;
      const order = {
        id: D.nextOrderId++, order_number: `AR-${Math.random().toString(16).slice(2, 10).toUpperCase()}`, user_id: user.id,
        status: 'awaiting_payment', delivery_method: deliveryMethod, payment_method: 'paystack', payment_status: 'unpaid', paid_at: null,
        subtotal, delivery_fee, total: subtotal + delivery_fee, customer_name: name, phone,
        address: deliveryMethod === 'delivery' ? address : null, city: deliveryMethod === 'delivery' ? city : null,
        note: note || null, created_at: new Date().toISOString(), items,
      };
      D.orders.push(order);
      save();
      // The real site sends the customer to Paystack here. The demo skips straight to a simulated confirmation.
      return { order: withItemMeta(order), paymentUrl: `/payment/callback?reference=${order.order_number}`, paymentError: null };
    }
    const order = D.orders.find((o) => o.order_number === a);
    if (!order || (order.user_id !== user.id && user.role !== 'admin')) throw new DemoError('We could not find that order.', 404);
    if (!b && method === 'GET') return { order: withItemMeta(order) };
    if (b === 'pay' && method === 'POST') {
      if (order.status !== 'awaiting_payment') throw new DemoError('This order can no longer be paid. Please place a new order.', 409);
      return { paymentUrl: `/payment/callback?reference=${order.order_number}`, alreadyPaid: false };
    }
  }

  // ----- simulated payment confirmation -----
  if (area === 'payments' && a === 'verify') {
    const user = requireUser();
    const ref = clean(query.reference || query.trxref, 80);
    const order = D.orders.find((o) => o.order_number === ref);
    if (!order || (order.user_id !== user.id && user.role !== 'admin')) throw new DemoError('We could not find an order for that payment.', 404);
    if (order.status === 'awaiting_payment') {
      order.status = 'confirmed';
      order.payment_status = 'paid';
      order.paid_at = new Date().toISOString();
      save();
    }
    return { order: withItemMeta(order), paid: order.payment_status === 'paid', gatewayStatus: 'success' };
  }

  // ----- admin -----
  if (area === 'admin') {
    requireAdmin();
    if (a === 'stats') {
      const paid = D.orders.filter((o) => o.payment_status === 'paid' && o.status !== 'cancelled');
      const recent = D.orders.filter((o) => o.status !== 'awaiting_payment').sort((x, y) => y.id - x.id).slice(0, 6).map(withItemMeta);
      return {
        counts: {
          products: D.products.length,
          low_stock: D.products.filter((p) => p.stock <= 3 && p.is_active).length,
          customers: D.users.filter((u) => u.role === 'customer').length,
          paid_orders: D.orders.filter((o) => o.payment_status === 'paid').length,
          to_handle: D.orders.filter((o) => o.status === 'confirmed').length,
          refunds_due: D.orders.filter((o) => o.payment_status === 'refund_due').length,
          revenue: paid.reduce((s, o) => s + o.total, 0),
        },
        recent,
      };
    }
    if (a === 'upload' && method === 'POST') {
      const file = form && form.get && form.get('image');
      if (!file) throw new DemoError('Choose an image to upload.', 422);
      const url = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new DemoError('That image could not be read.', 422));
        reader.readAsDataURL(file);
      });
      return { url };
    }
    if (a === 'products') {
      const readProduct = () => {
        const name = clean(body.name, 160), price = Number(body.price), stock = toInt(body.stock, -1);
        const fields = {};
        if (name.length < 2) fields.name = 'Enter the product name.';
        if (!body.category_id) fields.category_id = 'Choose a category.';
        if (!(price >= 0) || body.price === '' || body.price == null) fields.price = 'Enter a price.';
        if (stock < 0) fields.stock = 'Enter the stock count (0 or more).';
        if (Object.keys(fields).length) throw new DemoError('Please fix the highlighted fields.', 422, fields);
        const compare = Number(body.compare_at_price);
        return {
          name, category_id: toInt(body.category_id), price, stock, description: clean(body.description, 4000),
          compare_at_price: compare > price ? compare : null, image_url: body.image_url || null,
          is_featured: body.is_featured ? 1 : 0, is_active: body.is_active === false || body.is_active === 0 ? 0 : 1,
        };
      };
      const full = (p) => ({ ...p, category_name: categoryOf(p).name });
      if (!b && method === 'GET') {
        const q = (query.q || '').toLowerCase();
        return { items: D.products.filter((p) => p.name.toLowerCase().includes(q)).sort((x, y) => y.id - x.id).map(full) };
      }
      if (!b && method === 'POST') {
        const p = readProduct();
        let slug = slugify(p.name) || 'product';
        for (let i = 2; D.products.some((x) => x.slug === slug); i += 1) slug = `${slugify(p.name)}-${i}`;
        const product = { id: D.nextProductId++, slug, ...p };
        D.products.push(product);
        save();
        return { product: full(product) };
      }
      const product = D.products.find((x) => x.id === toInt(b));
      if (!product) throw new DemoError('Product not found.', 404);
      if (method === 'PUT') {
        const p = readProduct();
        if (p.name !== product.name) {
          let slug = slugify(p.name) || 'product';
          for (let i = 2; D.products.some((x) => x.slug === slug && x.id !== product.id); i += 1) slug = `${slugify(p.name)}-${i}`;
          product.slug = slug;
        }
        Object.assign(product, p);
        save();
        return { product: full(product) };
      }
      if (method === 'DELETE') {
        D.products = D.products.filter((x) => x.id !== product.id);
        save();
        return null;
      }
    }
    if (a === 'orders') {
      if (!b && method === 'GET') {
        const list = D.orders.filter((o) => !query.status || o.status === query.status).sort((x, y) => y.id - x.id).slice(0, 200);
        return { items: list.map((o) => ({ ...withItemMeta(o), customer_email: D.users.find((u) => u.id === o.user_id)?.email || '' })) };
      }
      const order = D.orders.find((o) => o.id === toInt(b));
      if (!order) throw new DemoError('Order not found.', 404);
      if (parts[3] === 'refunded' && method === 'PATCH') {
        if (order.payment_status !== 'refund_due') throw new DemoError('This order has no refund waiting.', 409);
        order.payment_status = 'refunded';
        save();
        return { id: order.id, payment_status: 'refunded' };
      }
      if (parts[3] === 'status' && method === 'PATCH') {
        const status = body.status;
        if (!['awaiting_payment', 'confirmed', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled'].includes(status)) throw new DemoError('That status is not valid.', 422);
        if (order.status === 'cancelled') throw new DemoError('A cancelled order cannot be changed.', 409);
        if (status === 'awaiting_payment' && order.status !== 'awaiting_payment') throw new DemoError('A paid order cannot go back to awaiting payment.', 409);
        if (order.payment_status !== 'paid' && status !== 'cancelled' && status !== order.status) throw new DemoError('This order has not been paid yet.', 409);
        if (status === 'out_for_delivery' && order.delivery_method !== 'delivery') throw new DemoError('This is a pickup order. Use "Ready for pickup" instead.', 409);
        if (status === 'ready_for_pickup' && order.delivery_method !== 'pickup') throw new DemoError('This is a delivery order. Use "Out for delivery" instead.', 409);
        if (status === 'cancelled') {
          restock(order);
          if (order.payment_status === 'paid') order.payment_status = 'refund_due';
        }
        order.status = status;
        save();
        return { id: order.id, status, payment_status: order.payment_status };
      }
    }
  }

  throw new DemoError('This part of the store is not available in the demo.', 404);
}

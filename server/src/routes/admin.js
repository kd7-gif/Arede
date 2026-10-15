import { Router } from 'express';
import multer from 'multer';
import { pool } from '../db.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { HttpError, asyncHandler, cleanString, slugify, toInt } from '../utils/http.js';
import { attachItems, restockOrder } from '../services/orders.js';
import { IMAGE_TYPES, saveProductImage } from '../utils/images.js';

const router = Router();
router.use(requireAuth, requireAdmin);

/* ---------- image upload ---------- */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    IMAGE_TYPES[file.mimetype] ? cb(null, true) : cb(new HttpError(422, 'Upload a JPG, PNG or WebP image.')),
});

router.post(
  '/upload',
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(422, 'Choose an image to upload.');
    try {
      res.status(201).json({ url: await saveProductImage(req.file.buffer, req.file.mimetype) });
    } catch (err) {
      throw new HttpError(422, err.message);
    }
  })
);

/* ---------- dashboard ---------- */
router.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [[counts]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM products)                                              AS products,
         (SELECT COUNT(*) FROM products WHERE stock <= 3 AND is_active = 1)           AS low_stock,
         (SELECT COUNT(*) FROM users WHERE role = 'customer')                         AS customers,
         (SELECT COUNT(*) FROM orders WHERE payment_status = 'paid')                  AS paid_orders,
         (SELECT COUNT(*) FROM orders WHERE status = 'confirmed')                     AS to_handle,
         (SELECT COUNT(*) FROM orders WHERE payment_status = 'refund_due')            AS refunds_due,
         (SELECT COALESCE(SUM(total), 0) FROM orders
           WHERE payment_status = 'paid' AND status <> 'cancelled')                   AS revenue`
    );
    const [recent] = await pool.query(
      "SELECT * FROM orders WHERE status <> 'awaiting_payment' ORDER BY created_at DESC, id DESC LIMIT 6"
    );
    res.json({ counts, recent });
  })
);

/* ---------- products ---------- */
function readProduct(body) {
  const name = cleanString(body.name, 160);
  const category_id = toInt(body.category_id);
  const price = Number(body.price);
  const stock = toInt(body.stock, -1);
  const compare = body.compare_at_price === '' || body.compare_at_price == null ? null : Number(body.compare_at_price);

  const fields = {};
  if (name.length < 2) fields.name = 'Enter a product name.';
  if (category_id <= 0) fields.category_id = 'Choose a category.';
  if (!Number.isFinite(price) || price < 0) fields.price = 'Enter a valid price.';
  if (stock < 0) fields.stock = 'Enter the stock count (0 or more).';
  if (compare !== null && (!Number.isFinite(compare) || compare < 0)) fields.compare_at_price = 'Enter a valid price or leave blank.';
  if (Object.keys(fields).length) throw new HttpError(422, 'Please fix the highlighted fields.', fields);

  return {
    name, category_id, price, stock,
    compare_at_price: compare,
    description: cleanString(body.description, 4000) || null,
    image_url: cleanString(body.image_url, 500) || null,
    is_featured: body.is_featured ? 1 : 0,
    is_active: body.is_active === false || body.is_active === 0 ? 0 : 1,
  };
}

async function uniqueSlug(base, ignoreId = 0) {
  let slug = slugify(base);
  for (let i = 2; ; i += 1) {
    const [rows] = await pool.query('SELECT id FROM products WHERE slug = ? AND id <> ?', [slug, ignoreId]);
    if (!rows.length) return slug;
    slug = `${slugify(base)}-${i}`;
  }
}

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const q = `%${cleanString(req.query.q || '', 80)}%`;
    const [items] = await pool.query(
      `SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON c.id = p.category_id
        WHERE p.name LIKE ? ORDER BY p.created_at DESC, p.id DESC`,
      [q]
    );
    res.json({ items });
  })
);

router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const p = readProduct(req.body);
    const slug = await uniqueSlug(p.name);
    const [r] = await pool.query(
      `INSERT INTO products (category_id, name, slug, description, price, compare_at_price, image_url, stock, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [p.category_id, p.name, slug, p.description, p.price, p.compare_at_price, p.image_url, p.stock, p.is_featured, p.is_active]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [r.insertId]);
    res.status(201).json({ product: rows[0] });
  })
);

router.put(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id);
    const [existing] = await pool.query('SELECT id, name, slug FROM products WHERE id = ?', [id]);
    if (!existing.length) throw new HttpError(404, 'Product not found.');
    const p = readProduct(req.body);
    const slug = existing[0].name === p.name ? existing[0].slug : await uniqueSlug(p.name, id);
    await pool.query(
      `UPDATE products SET category_id=?, name=?, slug=?, description=?, price=?, compare_at_price=?,
              image_url=?, stock=?, is_featured=?, is_active=? WHERE id=?`,
      [p.category_id, p.name, slug, p.description, p.price, p.compare_at_price, p.image_url, p.stock, p.is_featured, p.is_active, id]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    res.json({ product: rows[0] });
  })
);

router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    await pool.query('DELETE FROM products WHERE id = ?', [toInt(req.params.id)]);
    res.status(204).end();
  })
);

/* ---------- orders ---------- */
const STATUSES = ['awaiting_payment', 'confirmed', 'out_for_delivery', 'ready_for_pickup', 'completed', 'cancelled'];

router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const status = STATUSES.includes(req.query.status) ? req.query.status : null;
    const [rows] = await pool.query(
      `SELECT o.*, u.email AS customer_email FROM orders o JOIN users u ON u.id = o.user_id
        ${status ? 'WHERE o.status = ?' : ''} ORDER BY o.created_at DESC, o.id DESC LIMIT 200`,
      status ? [status] : []
    );
    res.json({ items: await attachItems(rows) });
  })
);

router.patch(
  '/orders/:id/status',
  asyncHandler(async (req, res) => {
    const id = toInt(req.params.id);
    const status = req.body.status;
    if (!STATUSES.includes(status)) throw new HttpError(422, 'Unknown order status.');

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query('SELECT id, status, payment_status, delivery_method FROM orders WHERE id = ? FOR UPDATE', [id]);
      if (!rows.length) throw new HttpError(404, 'Order not found.');
      const order = rows[0];

      if (order.status === 'cancelled') throw new HttpError(409, 'A cancelled order cannot be changed.');
      if (status === 'awaiting_payment' && order.status !== 'awaiting_payment') {
        throw new HttpError(409, 'A paid order cannot go back to awaiting payment.');
      }
      if (order.payment_status !== 'paid' && status !== 'cancelled' && status !== order.status) {
        throw new HttpError(409, 'This order has not been paid yet.');
      }
      if (status === 'out_for_delivery' && order.delivery_method !== 'delivery') {
        throw new HttpError(409, 'This is a pickup order. Use "Ready for pickup" instead.');
      }
      if (status === 'ready_for_pickup' && order.delivery_method !== 'pickup') {
        throw new HttpError(409, 'This is a delivery order. Use "Out for delivery" instead.');
      }

      let paymentStatus = order.payment_status;
      if (status === 'cancelled') {
        await restockOrder(conn, id); // put the items back on the shelf
        if (order.payment_status === 'paid') paymentStatus = 'refund_due'; // refund from the Paystack dashboard
      }
      await conn.query('UPDATE orders SET status = ?, payment_status = ? WHERE id = ?', [status, paymentStatus, id]);
      await conn.commit();
      res.json({ id, status, payment_status: paymentStatus });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  })
);

// After you refund the customer from the Paystack dashboard, mark it here so it leaves your to-do list.
router.patch(
  '/orders/:id/refunded',
  asyncHandler(async (req, res) => {
    const [r] = await pool.query("UPDATE orders SET payment_status = 'refunded' WHERE id = ? AND payment_status = 'refund_due'", [toInt(req.params.id)]);
    if (!r.affectedRows) throw new HttpError(409, 'This order is not waiting for a refund.');
    res.json({ ok: true });
  })
);

export default router;

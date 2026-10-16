import { Router } from 'express';
import { pool } from '../db.js';
import { config } from '../config.js';
import { HttpError, asyncHandler, toInt } from '../utils/http.js';

const router = Router();

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  price_asc: 'p.price ASC, p.id ASC',
  price_desc: 'p.price DESC, p.id DESC',
  name: 'p.name ASC',
};

const PRODUCT_COLUMNS = `
  p.id, p.name, p.slug, p.description, p.price, p.compare_at_price, p.image_url,
  p.stock, p.is_featured, c.name AS category_name, c.slug AS category_slug`;

// Public store settings the checkout page needs (delivery pricing and how long unpaid orders are held).
router.get('/settings', (_req, res) => {
  res.json({
    deliveryFeeIbadan: config.deliveryFeeIbadan,
    deliveryFeeOutside: config.deliveryFeeOutside,
    holdMinutes: config.unpaidHoldMinutes,
    paymentsOpen: config.paymentsOpen,
  });
});

router.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const [rows] = await pool.query(
      `SELECT c.id, c.name, c.slug, c.description, COUNT(p.id) AS product_count,
              (SELECT p2.image_url FROM products p2 WHERE p2.category_id = c.id AND p2.is_active = 1 AND p2.image_url IS NOT NULL
                ORDER BY p2.id DESC LIMIT 1) AS image_url
         FROM categories c
         LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
        GROUP BY c.id
        ORDER BY c.sort_order, c.name`
    );
    res.json({ items: rows });
  })
);

router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const where = ['p.is_active = 1'];
    const params = [];

    if (req.query.category) {
      where.push('c.slug = ?');
      params.push(String(req.query.category));
    }
    if (req.query.q) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)');
      const like = `%${String(req.query.q).trim().slice(0, 80)}%`;
      params.push(like, like);
    }
    if (req.query.min) { where.push('p.price >= ?'); params.push(Number(req.query.min) || 0); }
    if (req.query.max) { where.push('p.price <= ?'); params.push(Number(req.query.max) || 0); }
    if (req.query.featured === '1') where.push('p.is_featured = 1');
    if (req.query.inStock === '1') where.push('p.stock > 0');

    const sort = SORTS[req.query.sort] || SORTS.newest;
    const limit = Math.min(Math.max(toInt(req.query.limit, 12), 1), 48);
    const page = Math.max(toInt(req.query.page, 1), 1);
    const whereSql = where.join(' AND ');

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM products p JOIN categories c ON c.id = p.category_id WHERE ${whereSql}`,
      params
    );
    const [items] = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products p JOIN categories c ON c.id = p.category_id
        WHERE ${whereSql}
        ORDER BY ${sort}
        LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );
    res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
  })
);

router.get(
  '/products/:slug',
  asyncHandler(async (req, res) => {
    const [rows] = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}, p.category_id
         FROM products p JOIN categories c ON c.id = p.category_id
        WHERE p.slug = ? AND p.is_active = 1`,
      [req.params.slug]
    );
    if (!rows.length) throw new HttpError(404, 'We could not find that product.');
    const product = rows[0];

    const [related] = await pool.query(
      `SELECT ${PRODUCT_COLUMNS}
         FROM products p JOIN categories c ON c.id = p.category_id
        WHERE p.category_id = ? AND p.id <> ? AND p.is_active = 1
        ORDER BY p.is_featured DESC, p.id DESC LIMIT 4`,
      [product.category_id, product.id]
    );
    res.json({ product, related });
  })
);

export default router;

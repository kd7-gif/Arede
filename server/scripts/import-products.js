// Bulk-loads your real products from a spreadsheet.
//
//   npm run import -- --check      look for mistakes, change nothing
//   npm run import                 add new products, update existing ones (matched by name)
//   npm run import -- --replace    delete ALL current products first (use once to clear the samples)
//
// Put your file at server/import/products.csv and your photos in server/import/images/.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { config } from '../src/config.js';
import { parseCsv } from './lib/csv.js';
import { saveProductImage, EXT_TO_TYPE } from '../src/utils/images.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const importDir = path.resolve(here, '../import');
const imagesDir = path.join(importDir, 'images');
const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const fileArg = args.find((a) => !a.startsWith('--')) || path.join(importDir, 'products.csv');
const checkOnly = flag('--check');
const replace = flag('--replace');

const slugify = (s) =>
  s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90);

const parseMoney = (v) => {
  const n = Number(String(v ?? '').replace(/[₦,\s]|NGN|N(?=\d)/gi, ''));
  return Number.isFinite(n) ? n : NaN;
};
const truthy = (v) => ['yes', 'y', 'true', '1'].includes(String(v ?? '').trim().toLowerCase());

if (!fs.existsSync(fileArg)) {
  console.error(`Could not find ${fileArg}\nSave your spreadsheet as CSV (UTF-8) to server/import/products.csv first.`);
  process.exit(1);
}

const rows = parseCsv(fs.readFileSync(fileArg, 'utf8'));
if (!rows.length) { console.error('The file has no product rows.'); process.exit(1); }

/* ---------- validate every row before touching anything ---------- */
const errors = [];
const seen = new Map();
const items = [];
for (const r of rows) {
  const where = `Row ${r._line}`;
  const name = r.name || '';
  const category = r.category || '';
  const price = parseMoney(r.price);
  const stockRaw = r.stock ?? '';
  const stock = Number(stockRaw);
  const oldPrice = r.old_price ? parseMoney(r.old_price) : null;

  if (!name) errors.push(`${where}: name is empty`);
  if (!category) errors.push(`${where} (${name || '?'}): category is empty`);
  if (!(price > 0)) errors.push(`${where} (${name || '?'}): price "${r.price ?? ''}" is not a valid amount`);
  if (stockRaw === '' || !Number.isInteger(stock) || stock < 0)
    errors.push(`${where} (${name || '?'}): stock must be a whole number (0 if sold out)`);
  if (oldPrice !== null && !(oldPrice > price)) errors.push(`${where} (${name}): old_price must be higher than price`);

  const slug = slugify(name);
  if (slug) {
    if (seen.has(slug)) errors.push(`${where}: "${name}" appears twice (also row ${seen.get(slug)})`);
    seen.set(slug, r._line);
  }

  const image = r.image || '';
  if (image && !/^https?:\/\//i.test(image)) {
    const f = path.join(imagesDir, path.basename(image));
    if (!fs.existsSync(f)) errors.push(`${where} (${name}): photo "${image}" is not in import/images/`);
    else if (!EXT_TO_TYPE[path.extname(f).toLowerCase()])
      errors.push(`${where} (${name}): photo "${image}" must be JPG, PNG or WebP`);
  }
  items.push({ line: r._line, name, slug, category, price, stock, oldPrice, image,
    description: r.description || null, featured: truthy(r.featured) });
}

if (errors.length) {
  console.error(`\nFound ${errors.length} problem(s). Nothing was changed:\n`);
  errors.forEach((e) => console.error('  - ' + e));
  console.error('\nFix them in your spreadsheet, export again, and re-run.');
  process.exit(1);
}

const cats = [...new Set(items.map((i) => i.category))];
console.log(`${items.length} products in ${cats.length} categories look good.`);
if (checkOnly) { console.log('Check only: nothing was changed.'); process.exit(0); }

if (replace && !flag('--yes')) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = await rl.question('This DELETES every product currently in the shop first. Type YES to continue: ');
  rl.close();
  if (a.trim() !== 'YES') { console.log('Cancelled.'); process.exit(0); }
}

/* ---------- save photos first (outside the DB transaction) ---------- */
const imageCache = new Map();
async function resolveImage(image) {
  if (!image) return null;
  if (/^https?:\/\//i.test(image)) return image;
  if (imageCache.has(image)) return imageCache.get(image);
  const f = path.join(imagesDir, path.basename(image));
  const url = await saveProductImage(fs.readFileSync(f), EXT_TO_TYPE[path.extname(f).toLowerCase()]);
  imageCache.set(image, url);
  return url;
}

const conn = await mysql.createConnection({ ...config.db, charset: 'utf8mb4' });
try {
  for (const it of items) it.imageUrl = await resolveImage(it.image);

  await conn.beginTransaction();
  if (replace) {
    await conn.query('UPDATE order_items SET product_id = NULL');
    await conn.query('DELETE FROM products');
    await conn.query('DELETE FROM categories');
  }

  const catIds = new Map();
  const [existingCats] = await conn.query('SELECT id, name, slug FROM categories');
  for (const c of existingCats) catIds.set(c.slug, c.id);
  let order = existingCats.length;
  for (const name of cats) {
    const slug = slugify(name);
    if (!catIds.has(slug)) {
      const [res] = await conn.query('INSERT INTO categories (name, slug, sort_order) VALUES (?,?,?)', [name, slug, ++order]);
      catIds.set(slug, res.insertId);
    }
  }

  let added = 0, updated = 0;
  // Insert in reverse so the first row of the sheet ends up as the newest product.
  for (const it of [...items].reverse()) {
    const categoryId = catIds.get(slugify(it.category));
    const [[found]] = await conn.query('SELECT id, image_url FROM products WHERE slug = ?', [it.slug]);
    if (found) {
      await conn.query(
        `UPDATE products SET category_id=?, name=?, description=?, price=?, compare_at_price=?, image_url=?,
           stock=?, is_featured=?, is_active=1 WHERE id=?`,
        [categoryId, it.name, it.description, it.price, it.oldPrice, it.imageUrl ?? found.image_url, it.stock, it.featured ? 1 : 0, found.id]
      );
      updated++;
    } else {
      await conn.query(
        `INSERT INTO products (category_id, name, slug, description, price, compare_at_price, image_url, stock, is_featured)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [categoryId, it.name, it.slug, it.description, it.price, it.oldPrice, it.imageUrl, it.stock, it.featured ? 1 : 0]
      );
      added++;
    }
  }

  if (replace) {
    await conn.query('DELETE FROM categories WHERE id NOT IN (SELECT DISTINCT category_id FROM products)');
  }
  await conn.commit();
  console.log(`Done. ${added} added, ${updated} updated${replace ? ', old products cleared' : ''}.`);
} catch (err) {
  await conn.rollback().catch(() => {});
  console.error('Import failed, nothing was changed:', err.message);
  process.exitCode = 1;
} finally {
  await conn.end();
}

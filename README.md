# Arede online store

A home and appliances store for Arede (Westmead Mall, Samonda, Ibadan).

- **Front end:** React (Vite) with React Router
- **Back end:** Node and Express
- **Database:** MySQL (MariaDB 10.5+ also works)
- Visitors can browse products and prices and fill a bag without an account. **Placing an order needs an account.**
- A built-in admin panel at `/admin` lets you add products, set prices, upload photos and manage orders.

```
arede/
  database/   schema.sql, seed.sql (sample products with fake prices)
  server/     Express API (auth, products, orders, admin, image upload)
  client/     React app, one folder per kind of component
```

## 1. Set up the database

You need Node 18+ and a running MySQL server.

```bash
cd server
cp .env.example .env      # then edit: DB_USER, DB_PASSWORD, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run db:setup          # creates the database, tables, sample products and your admin account
```

`db:setup` is safe to run again, it never deletes data. (`npm run db:reset` wipes everything, development only.)

Prefer to do it by hand? Create a database, then run `database/schema.sql` and `database/seed.sql`.

## 2. Run it locally

Two terminals:

```bash
cd server && npm run dev      # API on http://localhost:5001
cd client && npm install && npm run dev   # site on http://localhost:5173
```

Log in at `/login` with the admin email and password from your `.env`, then open `/admin`.

## 3. Put in your real products, prices and photos

**Many products at once (recommended for 30+):**

1. In Excel or Google Sheets, copy the columns of `server/import/products-template.csv`:
   `name, category, price, stock, description, image, featured, old_price` (the last is optional, leave it empty because nothing is on sale).
2. Fill one row per product. `stock` is required (use 0 if sold out). `featured` is `yes` for the few you want on the home page.
3. Put the photos in `server/import/images/` and write each file name in the `image` column (for example `kettle.jpg`).
4. Export as **CSV UTF-8** and save it as `server/import/products.csv`.
5. From the `server` folder:
   - `npm run import -- --check` shows every mistake without changing anything.
   - `npm run import -- --replace` deletes the sample products and loads yours (it asks you to type YES).
   - Later, `npm run import` updates products by name and adds new ones.

**One at a time:** Admin > Products > Add product, or Edit.

Products with no photo show a gold line-drawing placeholder on a green background.
Categories are created from your sheet, and the menus follow them automatically.

Other things to personalise (all in `client/src/config.js`):

| What | Where |
| --- | --- |
| Address, phone, WhatsApp, Instagram, TikTok, opening hours | `store` object |
| Real logo image | put the file in `client/public`, then set `logoSrc: '/logo.png'` |
| Home page hero photo | put the file in `client/public`, then set `heroImage: '/hero.jpg'` |

Delivery costs a flat fee on every delivered order, whatever its size (pickup is free). Set it with `DELIVERY_FEE` in `server/.env` (default 3500).

## 4. Paystack (online payment)

Every order is paid up front through Paystack, for both delivery and pickup.

1. Create a Paystack account and copy the **test** secret key (Settings > API Keys & Webhooks).
2. Put it in `server/.env` as `PAYSTACK_SECRET_KEY=sk_test_...` and restart the server.
3. Place an order and pay with Paystack's test cards. You return to the site and the order shows as paid.
4. To go live: finish Paystack's business verification, switch to the live key (`sk_live_...`), set `PUBLIC_URL` to your real domain, and in the Paystack dashboard set the **Webhook URL** to `https://yourdomain.com/api/payments/webhook`.

Safety built in: the server re-checks every payment with Paystack and compares the amount to the order, so a customer cannot pay less. Unpaid orders are held for `UNPAID_HOLD_MINUTES` (30) and then cancelled and returned to stock. If a customer pays after the hold expired and the item is gone, the order is flagged **Refund due** in Admin > Orders; refund it from your Paystack dashboard and click **Mark as refunded**.

Updating an older database: run `cd server && npm install && npm run db:migrate` once.

## How ordering works

1. A visitor adds items to the bag, then logs in or registers at checkout.
2. On **Pay with Paystack** the server re-reads prices and stock from MySQL, reserves the items, saves the order as *Awaiting payment* and sends the customer to Paystack.
3. After paying, the customer returns to the site, the server confirms the payment with Paystack (the webhook is a backup), and the order becomes *Paid*.
4. The order page then shows **Send order on WhatsApp**, pre-filled with the items, total and delivery details.
5. You see it in **Admin > Orders** and move it to Out for delivery or Ready for pickup, then Completed.

## Deploying

- Build the front end with `cd client && npm run build` and host the `client/dist` folder (Netlify, Vercel, or any static host). If the API is on a different domain, build with `VITE_API_URL=https://api.yourdomain.com`.
- Run the API with `NODE_ENV=production`, a strong `JWT_SECRET`, and `CLIENT_ORIGIN` set to your site's address.
- Uploaded product photos are saved in `server/uploads`. Many hosts wipe that folder on redeploy, so use a host with a persistent disk, or paste image links from a service like Cloudinary instead.
- Change the admin password before launch, set `TRUST_PROXY=1` if the API sits behind a proxy, and use the live Paystack key.

## API summary

| Method and path | Access |
| --- | --- |
| `POST /api/auth/register`, `POST /api/auth/login`, `GET/PATCH /api/auth/me` | public / logged in |
| `GET /api/categories`, `GET /api/products`, `GET /api/products/:slug`, `GET /api/settings` | public |
| `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:orderNumber` | **logged in** |
| `/api/admin/*` (stats, products CRUD, upload, orders, order status) | admin only |

# Arede storefront: developer handoff

This folder is the complete customer-facing UI of the Arede Homes store (React). It was built to talk to a custom Express and MySQL API. To use it with another backend, replace the API layer described below. Nothing else needs to change.

## Stack
- React 18, React Router 7, Vite 8 (Node 20.19 or newer)
- Plain CSS with design tokens (`src/styles/tokens.css`), no UI framework
- Fonts: Bodoni Moda and Figtree, installed through npm

## Run it
```bash
npm install
npm run dev                      # http://localhost:5173, expects an API on :5001 (see vite.config.js)
VITE_DEMO=true npm run dev       # runs with the built-in fake API and sample data, no backend needed
npm run build                    # production build in dist/
```
`VITE_API_URL` sets the API base address when the API is on another domain. Leave it empty if the API is on the same domain under `/api`.

## Folder map
| Path | What it is |
| --- | --- |
| `src/pages` | Home, Shop, ProductDetail, Cart, Checkout, OrderConfirmation, PaymentCallback, Orders, Account, Login, Register |
| `src/pages/admin` and `src/components/admin` | Admin screens (dashboard, products, orders). Not needed if the platform has its own admin. |
| `src/components` | Layout, header, footer, cart drawer, product cards, filters, UI pieces |
| `src/context` | Auth, cart (saved in the browser) and toast notices |
| `src/api/client.js` | **The only place the UI talks to a server.** Every call goes through `api(path, options)`. |
| `src/api/demoApi.js` | A complete in-browser fake of the API. Read it as the contract: every endpoint the UI calls and the exact response shape it expects. |
| `src/config.js` | Store details: address, phone, WhatsApp, social links, hero image |
| `public` | Hero photo, favicon and `demo/` product photos |

## How to connect another backend
1. Open `src/api/client.js`. Change `api()` so each path below is sent to the new backend and the result is returned in the shape shown. Keep the shapes and the UI does not change.
2. Login is currently a cookie session (`credentials: 'include'`). If the new backend uses tokens, add the header in `api()`.
3. Money is in naira as plain numbers. Order and payment status values are listed below.

## API calls the UI makes
All paths are relative to `/api`. Authenticated means a signed-in customer.

| Call | Purpose | Response the UI expects |
| --- | --- | --- |
| `GET /settings` | Checkout settings | `{ deliveryFeeIbadan, deliveryFeeOutside, holdMinutes, paymentsOpen }` |
| `GET /categories` | Menu and category tiles | `{ items: [{ id, name, slug, product_count, image_url }] }` |
| `GET /products?category&q&min&max&sort&inStock&featured&page&limit` | Shop grid | `{ items: [product], total, page, pages }` |
| `GET /products/:slug` | Product page | `{ product, related: [product] }` |
| `POST /auth/register`, `POST /auth/login` | Accounts | `{ user }` |
| `GET /auth/me`, `PATCH /auth/me`, `POST /auth/logout` | Session and profile | `{ user }` |
| `POST /orders` | Place an order. Body: `name, phone, address, city, note, deliveryMethod ('delivery' or 'pickup'), deliveryArea ('ibadan' or 'outside'), items: [{ productId, quantity }]` | `{ order, paymentUrl, paymentError }`. The UI redirects the browser to `paymentUrl`. |
| `GET /orders`, `GET /orders/:orderNumber` | Order history and confirmation page | `{ items: [order] }` and `{ order }` |
| `POST /orders/:orderNumber/pay` | Retry payment | `{ paymentUrl }` |
| `GET /payments/verify?reference=` | Called when the customer returns from the payment page | `{ order, paid }` |

Admin calls (only if the admin screens are kept): `GET /admin/stats`, `GET/POST/PUT/DELETE /admin/products`, `POST /admin/upload`, `GET /admin/orders`, `PATCH /admin/orders/:id/status`, `PATCH /admin/orders/:id/refunded`.

**Shapes**
- `product`: `id, name, slug, description, price, compare_at_price, image_url, stock, is_featured, category_name, category_slug`
- `user`: `id, full_name, email, phone, role ('customer' or 'admin'), address, city`
- `order`: `id, order_number, status, payment_status, delivery_method, subtotal, delivery_fee, total, customer_name, phone, address, city, note, created_at, paid_at, items: [{ product_id, product_name, unit_price, quantity, line_total, slug, image_url }]`
- `status` values: `awaiting_payment, confirmed, out_for_delivery, ready_for_pickup, completed, cancelled`
- `payment_status` values: `unpaid, paid, refund_due, refunded`

## Business rules the UI assumes
- Browsing and filling the bag need no account. Checkout needs an account (or guest checkout if the new backend supports it, in which case adjust `ProtectedRoute` on the checkout route in `src/App.jsx`).
- Delivery is priced by area: within Ibadan or outside it. Pickup is free. The backend sets the fee, the UI only displays it.
- Payment happens on a hosted payment page. The customer is redirected out and returns to `/payment/callback?reference=...`.
- Prices and stock always come from the backend, the UI never decides them.

# Arede Homes

A full-stack online store for a home and kitchen appliances business in Ibadan, Nigeria. Customers browse products, create accounts, pay through Paystack and track their orders. The owner runs everything from a built-in admin panel.

**Live demo:** [arede-production.up.railway.app](https://arede-production.up.railway.app)

Built end to end by me: design, front end, API, database, payments, deployment and domain setup.

## What it does

**For customers**
- Browse the catalogue with category filters, search, price and stock filters and sorting, with product pages and a shopping bag that works without an account
- Register and log in, then check out with delivery or store pickup
- Delivery priced by area (within Ibadan or outside it), set on the server
- Pay through Paystack, then see the order status and history
- Order page with a pre-filled WhatsApp message to the shop

**For the owner (admin panel)**
- Dashboard with order and stock figures, including a low stock count
- Add, edit and remove products, set prices and upload photos
- Move orders through Awaiting payment, Paid, Out for delivery or Ready for pickup, and Completed
- Cancelling an order puts its items back in stock; refunds due are flagged
- Email notification to the shop whenever an order is paid
- Bulk product import from a CSV spreadsheet with a dry-run check

## Stack

| Layer | Technology |
| --- | --- |
| Front end | React 18, React Router, Vite |
| Back end | Node.js, Express (ES modules) |
| Database | MySQL |
| Payments | Paystack (initialize, verify and webhook) |
| Email | Nodemailer over SMTP |
| Hosting | Railway (app, database and a persistent volume for uploads) |

## How it fits together

```
Browser (React)  ──/api──▶  Express API  ──▶  MySQL
                                 │
                                 ├──▶ Paystack (payment page, verification, webhook)
                                 └──▶ SMTP (order emails)
```

In production Express serves the built React app and the API from one domain, so sessions are a single same-site cookie and there are no cross-origin problems.

The API is organised by area: `auth`, `catalog` (products, categories, settings), `orders`, `payments` and `admin`. The React app holds no prices or stock of its own, it asks the API for everything.

## The order flow

1. The customer checks out. The browser sends only product IDs, quantities and address details.
2. The server re-reads the real prices and stock from MySQL, locks the product rows so two buyers cannot take the last item, works out the delivery fee, and saves the order as *Awaiting payment*.
3. It asks Paystack for a payment page and redirects the customer there. Card details never touch this server.
4. After payment the server verifies the transaction with Paystack and checks the amount against the order. The signed webhook acts as a backup in case the customer closes the tab.
5. The order becomes *Paid* and the owner is emailed.
6. Unpaid orders are cancelled after a hold time and their stock is released automatically.

## Security and reliability decisions

- Prices, totals and delivery fees are calculated on the server, never trusted from the browser
- Passwords hashed with bcrypt, sessions in an httpOnly, SameSite, Secure cookie holding a signed JWT
- Origin check on all state-changing API requests, plus rate limiting and Helmet security headers
- Paystack webhook signature verified, and every payment amount is compared with the order
- Stock changes happen inside database transactions with row locks to prevent overselling
- Secrets live only in environment variables and are never committed

## Project structure

```
arede/
  client/     React app (pages, components, context, API helpers)
  server/     Express API (routes, services, middleware, scripts)
  database/   schema.sql and seed.sql
```

## Run it locally

You need Node 20+ and a running MySQL server.

```bash
# 1. Database and API
cd server
cp .env.example .env       # fill in the database details, JWT_SECRET and an admin email and password
npm install
npm run db:setup           # creates the tables, sample products and the admin account
npm run dev                # API on http://localhost:5001

# 2. Front end (second terminal)
cd client
npm install
npm run dev                # site on http://localhost:5173
```

Log in with the admin details from your `.env`, then open `/admin`. The full setup guide, including bulk product import and going live with Paystack, is in [docs/SETUP.md](docs/SETUP.md). To test payments, put a Paystack **test** secret key in `PAYSTACK_SECRET_KEY`.

## Deployment

The repo deploys as one service. From the root, `npm run build` builds the React app and installs the server, and `npm start` serves everything. Set the variables from `server/.env.example`, with `NODE_ENV=production`, a long random `JWT_SECRET` and `CLIENT_ORIGIN` set to the site address. Uploaded photos need a persistent disk.

## Author

**Ayomikunle Daramola**, web developer. [LinkedIn](https://www.linkedin.com/in/ayomikunle-daramola-95b738260/) · [GitHub](https://github.com/kd7-gif)

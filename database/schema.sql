-- Arede database schema (MySQL 8 / MariaDB 10.5+)
--
-- Easiest way to install: run `npm run db:setup` inside /server (it creates the
-- database, runs this file, loads sample data and creates the admin user).
--
-- Manual install:
--   CREATE DATABASE arede CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE arede;
--   SOURCE schema.sql;
--   SOURCE seed.sql;

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  full_name     VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  phone         VARCHAR(30)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  address       VARCHAR(255) NULL,
  city          VARCHAR(80)  NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(80)  NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  description VARCHAR(255) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  category_id      INT UNSIGNED NOT NULL,
  name             VARCHAR(160) NOT NULL,
  slug             VARCHAR(190) NOT NULL,
  description      TEXT NULL,
  price            DECIMAL(12,2) NOT NULL,
  compare_at_price DECIMAL(12,2) NULL,           -- old price, shown struck through when set
  image_url        VARCHAR(500) NULL,            -- leave NULL to show the placeholder
  stock            INT NOT NULL DEFAULT 0,
  is_featured      TINYINT(1) NOT NULL DEFAULT 0,
  is_active        TINYINT(1) NOT NULL DEFAULT 1,
  created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  KEY idx_products_category (category_id),
  KEY idx_products_active_price (is_active, price),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_number    VARCHAR(20) NOT NULL,
  user_id         INT UNSIGNED NOT NULL,
  -- Orders are paid up front through Paystack. They start as awaiting_payment and become confirmed once paid.
  status          ENUM('awaiting_payment','confirmed','out_for_delivery','ready_for_pickup','completed','cancelled') NOT NULL DEFAULT 'awaiting_payment',
  delivery_method ENUM('delivery','pickup') NOT NULL DEFAULT 'delivery',
  payment_method  VARCHAR(20) NOT NULL DEFAULT 'paystack',
  payment_status  ENUM('unpaid','paid','refund_due','refunded') NOT NULL DEFAULT 'unpaid',
  payment_reference       VARCHAR(64) NULL,   -- latest Paystack reference for this order
  paystack_transaction_id VARCHAR(40) NULL,
  paid_at         TIMESTAMP NULL DEFAULT NULL,
  subtotal        DECIMAL(12,2) NOT NULL,
  delivery_fee    DECIMAL(12,2) NOT NULL DEFAULT 0,
  total           DECIMAL(12,2) NOT NULL,
  customer_name   VARCHAR(120) NOT NULL,
  phone           VARCHAR(30)  NOT NULL,
  address         VARCHAR(255) NULL,
  city            VARCHAR(80)  NULL,
  note            VARCHAR(500) NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_number (order_number),
  KEY idx_orders_user (user_id, created_at),
  KEY idx_orders_status (status),
  KEY idx_orders_payment (payment_status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED NOT NULL,
  product_id   INT UNSIGNED NULL,                -- kept NULL if the product is later deleted
  product_name VARCHAR(160) NOT NULL,            -- snapshot of the name at purchase time
  unit_price   DECIMAL(12,2) NOT NULL,           -- snapshot of the price at purchase time
  quantity     INT UNSIGNED NOT NULL,
  line_total   DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_items_order (order_id),
  CONSTRAINT fk_items_order   FOREIGN KEY (order_id)   REFERENCES orders (id)   ON DELETE CASCADE,
  CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Drop existing objects if they exist (clean rebuild)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP SEQUENCE IF EXISTS invoice_number_seq;

CREATE SEQUENCE invoice_number_seq START 1;

-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  role VARCHAR(20) DEFAULT 'staff',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table (a "style" - the size/color specific SKUs live in product_variants)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100),
  description TEXT,
  image_url VARCHAR(512),
  price DECIMAL(10, 2) NOT NULL,
  gst_rate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Product variants (size/color combinations). Every product has at least one variant,
-- even if it's just a single "default" variant with no size/color.
CREATE TABLE product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(30),
  color VARCHAR(50),
  sku VARCHAR(80) UNIQUE NOT NULL,
  price_override DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_variants_product ON product_variants(product_id);

-- Stock table - one row per variant
CREATE TABLE stock (
  id SERIAL PRIMARY KEY,
  variant_id INTEGER NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_name ON customers(name);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  tax_amount DECIMAL(12, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order Items table (snapshots product/variant details at time of sale)
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  size VARCHAR(30),
  color VARCHAR(50),
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff table
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE,
  phone VARCHAR(20),
  position VARCHAR(100),
  salary DECIMAL(10, 2),
  joining_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table (single row: shop identity, GST, invoicing, stock alert threshold)
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  shop_name VARCHAR(255) NOT NULL,
  logo_path VARCHAR(512),
  shop_address TEXT,
  shop_phone VARCHAR(20),
  gstin VARCHAR(20),
  gst_rate DECIMAL(5, 2) DEFAULT 0,
  invoice_prefix VARCHAR(20) DEFAULT 'INV',
  low_stock_threshold INTEGER DEFAULT 10,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common lookups
CREATE INDEX idx_product_code ON products(code);
CREATE INDEX idx_product_name ON products(name);
CREATE INDEX idx_order_date ON orders(order_date);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_payment_method ON orders(payment_method);

-- Seed data --------------------------------------------------------------

INSERT INTO users (username, password, email, role) VALUES
('admin', '$2b$10$rflKTX4uRPyBJ6iz2GYACeTymC780/FOi1aUHcgkYe7UAqAz.N9Yy', 'admin@textile.com', 'superadmin'),
('staff1', '$2b$10$rflKTX4uRPyBJ6iz2GYACeTymC780/FOi1aUHcgkYe7UAqAz.N9Yy', 'staff1@textile.com', 'staff');

INSERT INTO staff (name, email, phone, position, salary, joining_date) VALUES
('Rajesh Kumar', 'rajesh@textile.com', '9876543210', 'Manager', 25000.00, '2023-01-15'),
('Priya Singh', 'priya@textile.com', '9876543211', 'Sales Staff', 15000.00, '2023-06-20'),
('Amit Patel', 'amit@textile.com', '9876543212', 'Stock Handler', 12000.00, '2023-09-10');

INSERT INTO customers (name, phone, email, address) VALUES
('Walk-in Customer', NULL, NULL, NULL),
('Suresh Nair', '9847012345', 'suresh.nair@example.com', 'Kozhikode, Kerala'),
('Vishnu Menon', '9847098765', NULL, 'Kochi, Kerala');

-- Products with menswear size/color variants
INSERT INTO products (name, code, category, description, price, gst_rate) VALUES
('Classic Cotton T-Shirt', 'TS001', 'T-Shirts', 'Round neck 100% cotton t-shirt', 399.00, 5),
('Premium Formal Shirt', 'SH001', 'Shirts', 'Slim-fit formal cotton shirt', 899.00, 5),
('Slim Fit Denim Jeans', 'JN001', 'Jeans', 'Stretchable slim-fit denim', 1299.00, 12),
('Regular Fit Trousers', 'TR001', 'Trousers', 'Formal regular-fit trousers', 999.00, 12);

-- T-Shirt variants (product_id 1)
INSERT INTO product_variants (product_id, size, color, sku) VALUES
(1, 'S', 'White', 'TS001-S-WHT'),
(1, 'M', 'White', 'TS001-M-WHT'),
(1, 'L', 'White', 'TS001-L-WHT'),
(1, 'M', 'Black', 'TS001-M-BLK'),
(1, 'L', 'Black', 'TS001-L-BLK'),
(1, 'XL', 'Black', 'TS001-XL-BLK');

-- Shirt variants (product_id 2)
INSERT INTO product_variants (product_id, size, color, sku) VALUES
(2, 'M', 'White', 'SH001-M-WHT'),
(2, 'L', 'White', 'SH001-L-WHT'),
(2, 'M', 'Sky Blue', 'SH001-M-SKY'),
(2, 'L', 'Sky Blue', 'SH001-L-SKY'),
(2, 'XL', 'Sky Blue', 'SH001-XL-SKY');

-- Jeans variants (product_id 3)
INSERT INTO product_variants (product_id, size, color, sku) VALUES
(3, '30', 'Indigo Blue', 'JN001-30-IND'),
(3, '32', 'Indigo Blue', 'JN001-32-IND'),
(3, '34', 'Indigo Blue', 'JN001-34-IND'),
(3, '32', 'Black', 'JN001-32-BLK');

-- Trouser variants (product_id 4)
INSERT INTO product_variants (product_id, size, color, sku) VALUES
(4, '30', 'Charcoal', 'TR001-30-CHR'),
(4, '32', 'Charcoal', 'TR001-32-CHR'),
(4, '34', 'Charcoal', 'TR001-34-CHR'),
(4, '32', 'Beige', 'TR001-32-BEG');

-- Stock per variant (a few intentionally below the default low-stock threshold of 10)
INSERT INTO stock (variant_id, quantity)
SELECT id, CASE
  WHEN sku IN ('TS001-XL-BLK', 'SH001-XL-SKY', 'JN001-32-BLK', 'TR001-32-BEG') THEN 4
  ELSE 30
END
FROM product_variants;

-- Seed default settings
INSERT INTO settings (shop_name, shop_address, shop_phone, gstin, gst_rate, invoice_prefix, low_stock_threshold) VALUES
('Textile Billing System', 'Main Road, Kozhikode, Kerala', '9847000000', NULL, 5, 'INV', 10);

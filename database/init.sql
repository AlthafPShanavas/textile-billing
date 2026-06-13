-- Drop existing tables if they exist
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS users CASCADE;

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

-- Products table
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock table
CREATE TABLE stock (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL UNIQUE,
  quantity INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  discount_amount DECIMAL(12, 2) DEFAULT 0,
  discount_percentage DECIMAL(5, 2) DEFAULT 0,
  total DECIMAL(12, 2) NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Order Items table
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
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

-- Create indexes for better performance
CREATE INDEX idx_product_code ON products(product_code);
CREATE INDEX idx_order_date ON orders(order_date);
CREATE INDEX idx_user_id ON orders(user_id);
CREATE INDEX idx_payment_method ON orders(payment_method);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- Insert sample data
INSERT INTO users (username, password, email, role) VALUES
('admin', '$2b$10$rflKTX4uRPyBJ6iz2GYACeTymC780/FOi1aUHcgkYe7UAqAz.N9Yy', 'admin@textile.com', 'superadmin'),
('staff1', '$2b$10$rflKTX4uRPyBJ6iz2GYACeTymC780/FOi1aUHcgkYe7UAqAz.N9Yy', 'staff1@textile.com', 'staff');

INSERT INTO products (product_name, product_code, category, price) VALUES
('Cotton T-Shirt', 'SHIRT001', 'T-Shirts', 299.99),
('Denim Jeans', 'JEANS001', 'Jeans', 799.99),
('Casual Shirt', 'SHIRT002', 'Shirts', 499.99),
('Short Sleeve Tee', 'SHIRT003', 'T-Shirts', 249.99);

INSERT INTO stock (product_id, quantity) VALUES
(1, 100),
(2, 50),
(3, 75),
(4, 120);

INSERT INTO staff (name, email, phone, position, salary, joining_date) VALUES
('Rajesh Kumar', 'rajesh@textile.com', '9876543210', 'Manager', 25000.00, '2023-01-15'),
('Priya Singh', 'priya@textile.com', '9876543211', 'Sales Staff', 15000.00, '2023-06-20'),
('Amit Patel', 'amit@textile.com', '9876543212', 'Stock Handler', 12000.00, '2023-09-10');

-- Settings table (store shop name and optional logo path)
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  shop_name VARCHAR(255) NOT NULL,
  logo_path VARCHAR(512),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed default settings
INSERT INTO settings (shop_name, logo_path) VALUES
('Textile Billing System', NULL);

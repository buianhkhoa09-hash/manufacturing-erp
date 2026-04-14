-- =============================================================
--  MANUFACTURING ERP — MySQL Schema + Seed Data
--  Compatible with: MySQL 8.0+ / MySQL Workbench
-- =============================================================

CREATE DATABASE IF NOT EXISTS manufacturing_erp;
USE manufacturing_erp;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS sales_order_items;
DROP TABLE IF EXISTS sales_orders;
DROP TABLE IF EXISTS purchase_orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS employees;
DROP TABLE IF EXISTS departments;
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================
--  SCHEMA
-- =============================================================

-- -------------------------------------------------------------
-- HR — Departments
-- -------------------------------------------------------------
CREATE TABLE departments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------------
-- HR — Employees
-- -------------------------------------------------------------
CREATE TABLE employees (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    phone         VARCHAR(30),
    role          VARCHAR(100) NOT NULL,
    department_id INT NOT NULL,
    hire_date     DATE NOT NULL,
    salary        DECIMAL(12, 2) NOT NULL CHECK (salary >= 0),
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_employee_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
    CONSTRAINT fk_emp_dept FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- -------------------------------------------------------------
-- CRM — Customers
-- -------------------------------------------------------------
CREATE TABLE customers (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(150) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    phone      VARCHAR(30),
    address    TEXT,
    city       VARCHAR(100),
    country    VARCHAR(100),
    status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_customer_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- -------------------------------------------------------------
-- Inventory — Suppliers
-- -------------------------------------------------------------
CREATE TABLE suppliers (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    contact_name VARCHAR(150),
    email        VARCHAR(150) NOT NULL UNIQUE,
    phone        VARCHAR(30),
    address      TEXT,
    country      VARCHAR(100),
    status       VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_supplier_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- -------------------------------------------------------------
-- Inventory — Products
-- -------------------------------------------------------------
CREATE TABLE products (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    sku           VARCHAR(80)  NOT NULL UNIQUE,
    category      VARCHAR(100),
    description   TEXT,
    unit_price    DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    cost_price    DECIMAL(12, 2) NOT NULL CHECK (cost_price >= 0),
    stock_qty     INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
    reorder_level INT NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    unit          VARCHAR(30) NOT NULL DEFAULT 'pcs',
    supplier_id   INT,
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_product_status CHECK (status IN ('ACTIVE', 'DISCONTINUED')),
    CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- -------------------------------------------------------------
-- Inventory — Purchase Orders
-- -------------------------------------------------------------
CREATE TABLE purchase_orders (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id   INT NOT NULL,
    status        VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    order_date    DATE NOT NULL DEFAULT (CURRENT_DATE),
    expected_date DATE,
    total_amount  DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes         TEXT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_po_status CHECK (status IN ('PENDING','CONFIRMED','SHIPPED','RECEIVED','CANCELLED')),
    CONSTRAINT fk_po_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- -------------------------------------------------------------
-- Sales — Sales Orders
-- -------------------------------------------------------------
CREATE TABLE sales_orders (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    customer_id   INT NOT NULL,
    status        VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    order_date    DATE NOT NULL DEFAULT (CURRENT_DATE),
    delivery_date DATE,
    total_amount  DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    notes         TEXT,
    created_by    INT,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_so_status CHECK (status IN ('DRAFT','CONFIRMED','IN_PRODUCTION','SHIPPED','DELIVERED','CANCELLED')),
    CONSTRAINT fk_so_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
    CONSTRAINT fk_so_employee FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE SET NULL
);

-- -------------------------------------------------------------
-- Sales — Order Line Items
-- -------------------------------------------------------------
CREATE TABLE sales_order_items (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    sales_order_id INT NOT NULL,
    product_id     INT NOT NULL,
    quantity       INT NOT NULL CHECK (quantity > 0),
    unit_price     DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    line_total     DECIMAL(14, 2) AS (quantity * unit_price) STORED,
    CONSTRAINT fk_item_order   FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_item_product FOREIGN KEY (product_id)     REFERENCES products(id)
);

-- -------------------------------------------------------------
-- Finance — Invoices
-- -------------------------------------------------------------
CREATE TABLE invoices (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    sales_order_id INT NOT NULL UNIQUE,
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    issued_date    DATE NOT NULL DEFAULT (CURRENT_DATE),
    due_date       DATE NOT NULL,
    status         VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
    total_amount   DECIMAL(14, 2) NOT NULL CHECK (total_amount >= 0),
    paid_amount    DECIMAL(14, 2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
    notes          TEXT,
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_invoice_status CHECK (status IN ('UNPAID','PARTIALLY_PAID','PAID','OVERDUE','CANCELLED')),
    CONSTRAINT fk_invoice_order FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id)
);

-- -------------------------------------------------------------
-- Finance — Payments
-- -------------------------------------------------------------
CREATE TABLE payments (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id   INT NOT NULL,
    amount       DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    method       VARCHAR(50) NOT NULL,
    reference    VARCHAR(100),
    notes        TEXT,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_payment_method CHECK (method IN ('BANK_TRANSFER','CREDIT_CARD','CASH','CHECK','OTHER')),
    CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- =============================================================
--  INDEXES
-- =============================================================
CREATE INDEX idx_employees_department  ON employees(department_id);
CREATE INDEX idx_products_supplier     ON products(supplier_id);
CREATE INDEX idx_products_sku          ON products(sku);
CREATE INDEX idx_sales_orders_customer ON sales_orders(customer_id);
CREATE INDEX idx_sales_orders_status   ON sales_orders(status);
CREATE INDEX idx_order_items_order     ON sales_order_items(sales_order_id);
CREATE INDEX idx_order_items_product   ON sales_order_items(product_id);
CREATE INDEX idx_invoices_status       ON invoices(status);
CREATE INDEX idx_payments_invoice      ON payments(invoice_id);

-- =============================================================
--  SEED DATA
-- =============================================================

INSERT INTO departments (name, description) VALUES
  ('Engineering',     'Product design, R&D and manufacturing engineering'),
  ('Production',      'Factory floor, assembly and quality control'),
  ('Sales',           'Customer acquisition and account management'),
  ('Finance',         'Accounting, payroll and financial reporting'),
  ('Human Resources', 'Recruitment, onboarding and employee relations'),
  ('Logistics',       'Warehousing, shipping and supply chain management');

INSERT INTO employees (first_name, last_name, email, phone, role, department_id, hire_date, salary) VALUES
  ('Alice', 'Morgan',  'alice.morgan@erp.dev',  '+1-555-0101', 'Head of Engineering', 1, '2019-03-15', 95000.00),
  ('Bob',   'Chen',    'bob.chen@erp.dev',      '+1-555-0102', 'Mechanical Engineer', 1, '2021-06-01', 72000.00),
  ('Carol', 'Diaz',    'carol.diaz@erp.dev',    '+1-555-0103', 'Production Manager',  2, '2018-11-20', 85000.00),
  ('David', 'Kim',     'david.kim@erp.dev',     '+1-555-0104', 'Assembly Technician', 2, '2022-01-10', 48000.00),
  ('Eva',   'Novak',   'eva.novak@erp.dev',     '+1-555-0105', 'Sales Manager',       3, '2020-07-05', 80000.00),
  ('Frank', 'Osei',    'frank.osei@erp.dev',    '+1-555-0106', 'Account Executive',   3, '2022-09-12', 58000.00),
  ('Grace', 'Patel',   'grace.patel@erp.dev',   '+1-555-0107', 'CFO',                 4, '2017-04-03', 120000.00),
  ('Henry', 'Quinn',   'henry.quinn@erp.dev',   '+1-555-0108', 'Accountant',          4, '2021-03-22', 62000.00),
  ('Irene', 'Santos',  'irene.santos@erp.dev',  '+1-555-0109', 'HR Manager',          5, '2019-08-14', 75000.00),
  ('Jack',  'Torres',  'jack.torres@erp.dev',   '+1-555-0110', 'HR Specialist',       5, '2023-02-01', 52000.00),
  ('Karen', 'Ueda',    'karen.ueda@erp.dev',    '+1-555-0111', 'Logistics Manager',   6, '2020-05-17', 78000.00),
  ('Leo',   'Vasquez', 'leo.vasquez@erp.dev',   '+1-555-0112', 'Warehouse Operator',  6, '2022-11-08', 44000.00);

INSERT INTO customers (name, email, phone, address, city, country) VALUES
  ('Apex Industrial LLC',    'orders@apexindustrial.com', '+1-800-2001',   '100 Factory Blvd',     'Detroit',        'USA'),
  ('Nordic Parts AB',        'purchasing@nordicparts.se', '+46-8-5551000', 'Industrivägen 12',     'Stockholm',      'Sweden'),
  ('Rio Components Ltda.',   'compras@riocomp.br',        '+55-21-99001',  'Rua da Indústria 45',  'Rio de Janeiro', 'Brazil'),
  ('Pacific Machinery Co.',  'supply@pacificmach.jp',     '+81-3-55010',   '7-1 Kojo-dori',        'Osaka',          'Japan'),
  ('Eagle Fabricators Inc.', 'info@eaglefab.com',         '+1-800-3301',   '220 Precision Way',    'Houston',        'USA'),
  ('Euro Tech GmbH',         'bestellung@eurotech.de',    '+49-30-880100', 'Technikstrasse 9',     'Berlin',         'Germany'),
  ('Atlas Engineering Ltd.', 'orders@atlaseng.co.uk',     '+44-20-77001',  '15 Forge Road',        'Birmingham',     'UK'),
  ('Sunrise Systems Pte.',   'procurement@sunrisesys.sg', '+65-6301-0020', '30 Jurong East Ave',   'Singapore',      'Singapore');

INSERT INTO suppliers (name, contact_name, email, phone, address, country) VALUES
  ('SteelCore Materials', 'Tom Wallace', 'tom@steelcore.com',     '+1-800-7001',   '500 Steel Mill Rd, Pittsburgh, PA', 'USA'),
  ('FastenerWorld AG',    'Lena Braun',  'lena@fastenerworld.de', '+49-711-5500',  'Schraubenweg 3, Stuttgart',         'Germany'),
  ('CircuitSupply Co.',   'Yuki Tanaka', 'yuki@circuitsupply.jp', '+81-6-44010',   '2-8 Denshi-machi, Nagoya',          'Japan'),
  ('PolyPlastics Ltd.',   'Sarah Green', 'sarah@polyplastics.uk', '+44-121-4400',  'Unit 7, Polymer Park, Coventry',    'UK'),
  ('MetalWorks SA',       'Carlos Ruiz', 'carlos@metalworks.es',  '+34-91-3300',   'Poligono Industrial Norte, Madrid', 'Spain');

INSERT INTO products (name, sku, category, unit_price, cost_price, stock_qty, reorder_level, unit, supplier_id) VALUES
  ('Steel Bearing Shaft 20mm',    'SHF-20-ST',  'Mechanical Parts', 45.00,  22.00,  320,  50,  'pcs',   1),
  ('Stainless Steel Plate 5mm',   'PLT-05-SS',  'Raw Materials',    18.50,   9.00,  500, 100,  'sheet', 1),
  ('Hex Bolt M10 x 50mm',         'BLT-M10-50', 'Fasteners',         0.35,   0.12, 5000, 500,  'pcs',   2),
  ('Hex Nut M10',                 'NUT-M10',    'Fasteners',         0.15,   0.05, 6000, 600,  'pcs',   2),
  ('PCB Control Board v2',        'PCB-CTR-V2', 'Electronics',     120.00,  68.00,   85,  20,  'pcs',   3),
  ('Motor Driver Module',         'MDM-24V',    'Electronics',      75.00,  40.00,   60,  15,  'pcs',   3),
  ('ABS Plastic Housing A',       'HOU-ABS-A',  'Enclosures',       28.00,  14.00,  200,  40,  'pcs',   4),
  ('Polycarbonate Panel 300x400', 'PAN-PC-300', 'Enclosures',       22.50,  11.00,  150,  30,  'pcs',   4),
  ('Aluminium Extrusion 1000mm',  'EXT-AL-1000','Raw Materials',    14.00,   7.50,  400,  80,  'pcs',   5),
  ('Precision Gear Set 40T',      'GRS-40T',    'Mechanical Parts', 95.00,  52.00,  110,  25,  'set',   5),
  ('Hydraulic Fitting 1/4"',      'HYD-FIT-14', 'Hydraulics',       12.00,   5.50,  350,  60,  'pcs',   1),
  ('Proximity Sensor NPN',        'SNS-PRX-NPN','Electronics',      38.00,  18.00,   75,  20,  'pcs',   3),
  ('Conveyor Belt 600mm',         'CNV-600',    'Mechanical Parts', 210.00, 130.00,  30,   8,  'pcs',   5),
  ('Safety Relay Module',         'SRM-24DC',   'Electronics',      55.00,  29.00,   45,  10,  'pcs',   3);

INSERT INTO purchase_orders (supplier_id, status, order_date, expected_date, total_amount, notes) VALUES
  (1, 'RECEIVED',  '2024-10-01', '2024-10-15', 8400.00,  'Quarterly steel restock'),
  (3, 'CONFIRMED', '2024-11-05', '2024-11-20', 15300.00, 'Electronics for Q4 production run'),
  (2, 'PENDING',   '2024-11-18', '2024-12-01', 1250.00,  'Fastener replenishment');

INSERT INTO sales_orders (customer_id, status, order_date, delivery_date, total_amount, created_by) VALUES
  (1, 'DELIVERED',     '2024-09-10', '2024-09-25', 12600.00, 5),
  (2, 'DELIVERED',     '2024-10-03', '2024-10-20',  5400.00, 6),
  (3, 'SHIPPED',       '2024-10-28', '2024-11-15',  9200.00, 5),
  (5, 'IN_PRODUCTION', '2024-11-05', '2024-11-30', 18750.00, 6),
  (6, 'CONFIRMED',     '2024-11-15', '2024-12-10',  7340.00, 5),
  (7, 'DRAFT',         '2024-11-20', '2024-12-20',  3200.00, 6);

INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price) VALUES
  (1,  1,   80,  45.00),
  (1,  10,  40,  95.00),
  (2,  5,   30, 120.00),
  (2,  6,   20,  75.00),
  (2,  12,  15,  38.00),
  (3,  9,  200,  14.00),
  (3,  11, 150,  12.00),
  (3,  4, 1000,   0.15),
  (4,  13,  50, 210.00),
  (4,  1,  100,  45.00),
  (4,  10,  40,  95.00),
  (5,  5,   25, 120.00),
  (5,  14,  30,  55.00),
  (5,  6,   30,  75.00),
  (6,  7,   60,  28.00),
  (6,  8,   40,  22.50);

INSERT INTO invoices (sales_order_id, invoice_number, issued_date, due_date, status, total_amount, paid_amount) VALUES
  (1, 'INV-2024-0001', '2024-09-25', '2024-10-25', 'PAID',           12600.00, 12600.00),
  (2, 'INV-2024-0002', '2024-10-20', '2024-11-20', 'PAID',            5400.00,  5400.00),
  (3, 'INV-2024-0003', '2024-11-15', '2024-12-15', 'PARTIALLY_PAID',  9200.00,  4600.00),
  (4, 'INV-2024-0004', '2024-11-20', '2024-12-20', 'UNPAID',         18750.00,     0.00),
  (5, 'INV-2024-0005', '2024-11-25', '2024-12-25', 'UNPAID',          7340.00,     0.00);

INSERT INTO payments (invoice_id, amount, payment_date, method, reference) VALUES
  (1, 12600.00, '2024-10-22', 'BANK_TRANSFER', 'WIRE-APX-20241022'),
  (2,  5400.00, '2024-11-18', 'BANK_TRANSFER', 'WIRE-NRD-20241118'),
  (3,  4600.00, '2024-12-02', 'CREDIT_CARD',   'CC-RIO-20241202');

-- =============================================================
--  VIEWS
-- =============================================================

CREATE OR REPLACE VIEW v_outstanding_invoices AS
SELECT
    i.id,
    i.invoice_number,
    c.name           AS customer_name,
    i.issued_date,
    i.due_date,
    i.total_amount,
    i.paid_amount,
    (i.total_amount - i.paid_amount) AS balance,
    i.status
FROM invoices i
JOIN sales_orders so ON so.id = i.sales_order_id
JOIN customers c     ON c.id  = so.customer_id
WHERE i.status NOT IN ('PAID', 'CANCELLED');

CREATE OR REPLACE VIEW v_low_stock AS
SELECT
    id,
    name,
    sku,
    category,
    stock_qty,
    reorder_level,
    (reorder_level - stock_qty) AS shortage
FROM products
WHERE stock_qty <= reorder_level
  AND status = 'ACTIVE'
ORDER BY shortage DESC;

CREATE OR REPLACE VIEW v_sales_orders_summary AS
SELECT
    so.id,
    c.name AS customer_name,
    so.status,
    so.order_date,
    so.delivery_date,
    so.total_amount,
    CONCAT(e.first_name, ' ', e.last_name) AS created_by
FROM sales_orders so
JOIN customers  c ON c.id = so.customer_id
LEFT JOIN employees e ON e.id = so.created_by;

-- =============================================================
--  QUICK SELECT QUERIES 
-- =============================================================

SELECT * FROM departments;
SELECT * FROM employees;
SELECT * FROM customers;
SELECT * FROM suppliers;
SELECT * FROM products;
SELECT * FROM purchase_orders;
SELECT * FROM sales_orders;
SELECT * FROM sales_order_items;
SELECT * FROM invoices;
SELECT * FROM payments;

-- View results
SELECT * FROM v_outstanding_invoices;
SELECT * FROM v_low_stock;
SELECT * FROM v_sales_orders_summary;

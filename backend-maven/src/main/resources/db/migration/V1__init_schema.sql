-- =====================================================================
-- Flyway Migration V1__init_schema.sql
-- SmartPOS Database Schema (PostgreSQL 15+)
-- Fully adapted for Indian GST (CGST, SGST, IGST), HSN codes, and INR
-- =====================================================================

-- 1. Businesses
CREATE TABLE IF NOT EXISTS businesses (
    id VARCHAR(64) PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    tagline VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100) DEFAULT 'Maharashtra',
    state_code VARCHAR(10) DEFAULT '27',
    pincode VARCHAR(20),
    phone VARCHAR(50),
    email VARCHAR(100),
    gstin VARCHAR(50),
    pan_number VARCHAR(50),
    fssai_number VARCHAR(50),
    upi_id VARCHAR(100),
    logo_path VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'INR',
    receipt_footer TEXT,
    return_policy TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Roles
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(64) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);

-- 4. User Roles
CREATE TABLE IF NOT EXISTS user_roles (
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(64) REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 5. Categories
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT TRUE
);

-- 6. Brands
CREATE TABLE IF NOT EXISTS brands (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 7. Units
CREATE TABLE IF NOT EXISTS units (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(15) NOT NULL
);

-- 8. Products (with Indian HSN code and GST tax slab rate)
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(64) PRIMARY KEY,
    sku VARCHAR(100) NOT NULL UNIQUE,
    barcode VARCHAR(100) NOT NULL UNIQUE,
    hsn_code VARCHAR(20) NOT NULL DEFAULT '0000',
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id VARCHAR(64) REFERENCES categories(id),
    brand_id VARCHAR(64) REFERENCES brands(id),
    unit_id VARCHAR(64) REFERENCES units(id),
    cost_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00, -- GST Slab: 0, 5, 12, 18, 28
    reorder_level INT NOT NULL DEFAULT 10,
    active BOOLEAN DEFAULT TRUE,
    primary_image_path VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_hsn ON products(hsn_code);
CREATE INDEX idx_products_name ON products(product_name);

-- 9. Product Images
CREATE TABLE IF NOT EXISTS product_images (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255),
    display_order INT DEFAULT 1,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Product Price History
CREATE TABLE IF NOT EXISTS product_price_history (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    old_price NUMERIC(14, 2) NOT NULL,
    new_price NUMERIC(14, 2) NOT NULL,
    changed_by VARCHAR(150),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Suppliers (with Indian State Code & GSTIN)
CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(64) PRIMARY KEY,
    supplier_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    state VARCHAR(100) DEFAULT 'Maharashtra',
    state_code VARCHAR(10) DEFAULT '27',
    gstin VARCHAR(50),
    contact_person VARCHAR(100),
    active BOOLEAN DEFAULT TRUE
);

-- 12. Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(64) PRIMARY KEY,
    purchase_number VARCHAR(100) NOT NULL UNIQUE,
    supplier_id VARCHAR(64) REFERENCES suppliers(id),
    purchase_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by VARCHAR(150)
);

-- 13. Purchase Items
CREATE TABLE IF NOT EXISTS purchase_items (
    id VARCHAR(64) PRIMARY KEY,
    purchase_id VARCHAR(64) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id),
    hsn_code VARCHAR(20) DEFAULT '0000',
    quantity INT NOT NULL,
    unit_cost NUMERIC(14, 2) NOT NULL,
    tax_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(14, 2) NOT NULL
);

-- 14. Supplier Payments
CREATE TABLE IF NOT EXISTS supplier_payments (
    id VARCHAR(64) PRIMARY KEY,
    supplier_id VARCHAR(64) REFERENCES suppliers(id),
    purchase_id VARCHAR(64) REFERENCES purchase_orders(id),
    amount NUMERIC(14, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    paid_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Customers (with Indian GSTIN & State Code)
CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    customer_code VARCHAR(100) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(100),
    address TEXT,
    state VARCHAR(100) DEFAULT 'Maharashtra',
    state_code VARCHAR(10) DEFAULT '27',
    gstin VARCHAR(50),
    loyalty_points INT DEFAULT 0,
    credit_balance NUMERIC(14, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. Sales (with CGST, SGST, IGST, Round Off, Place of Supply)
CREATE TABLE IF NOT EXISTS sales (
    id VARCHAR(64) PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    business_id VARCHAR(64) REFERENCES businesses(id),
    customer_id VARCHAR(64) REFERENCES customers(id),
    sale_date TIMESTAMP WITH TIME ZONE NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    round_off_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(14, 2) NOT NULL,
    amount_paid NUMERIC(14, 2) NOT NULL,
    change_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    place_of_supply VARCHAR(100) DEFAULT '27 - Maharashtra',
    is_inter_state BOOLEAN DEFAULT FALSE,
    payment_status VARCHAR(50) NOT NULL,
    sale_status VARCHAR(50) NOT NULL,
    cashier_id VARCHAR(64),
    cashier_name VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sales_invoice ON sales(invoice_number);
CREATE INDEX idx_sales_date ON sales(sale_date);

-- 17. Sale Items (with HSN Snapshot and CGST/SGST/IGST breakdown)
CREATE TABLE IF NOT EXISTS sale_items (
    id VARCHAR(64) PRIMARY KEY,
    sale_id VARCHAR(64) REFERENCES sales(id) ON DELETE CASCADE,
    product_id VARCHAR(64) REFERENCES products(id),
    sku_snapshot VARCHAR(100) NOT NULL,
    product_name_snapshot VARCHAR(200) NOT NULL,
    hsn_code_snapshot VARCHAR(20) NOT NULL DEFAULT '0000',
    quantity INT NOT NULL,
    returned_quantity INT NOT NULL DEFAULT 0,
    unit_price NUMERIC(14, 2) NOT NULL,
    unit_cost_snapshot NUMERIC(14, 2) NOT NULL,
    discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) NOT NULL,
    taxable_amount NUMERIC(14, 2) NOT NULL,
    cgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(14, 2) NOT NULL
);

-- 18. Sale Payments (Supporting UPI, Cash, Card, Split)
CREATE TABLE IF NOT EXISTS sale_payments (
    id VARCHAR(64) PRIMARY KEY,
    sale_id VARCHAR(64) REFERENCES sales(id) ON DELETE CASCADE,
    payment_method VARCHAR(50) NOT NULL, -- UPI, CASH, CARD, STORE_CREDIT
    amount NUMERIC(14, 2) NOT NULL,
    reference_number VARCHAR(100), -- UPI UTR or Card Auth
    payment_status VARCHAR(50) DEFAULT 'PAID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 19. Sales Returns (GST Credit Notes)
CREATE TABLE IF NOT EXISTS sales_returns (
    id VARCHAR(64) PRIMARY KEY,
    return_number VARCHAR(100) NOT NULL UNIQUE,
    original_sale_id VARCHAR(64) REFERENCES sales(id),
    original_invoice_number VARCHAR(100),
    return_date TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT NOT NULL,
    subtotal NUMERIC(14, 2) NOT NULL,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL,
    total_refund NUMERIC(14, 2) NOT NULL,
    refund_method VARCHAR(50) NOT NULL,
    return_status VARCHAR(50) DEFAULT 'COMPLETED',
    processed_by VARCHAR(150)
);

-- 20. Sales Return Items
CREATE TABLE IF NOT EXISTS sales_return_items (
    id VARCHAR(64) PRIMARY KEY,
    return_id VARCHAR(64) REFERENCES sales_returns(id) ON DELETE CASCADE,
    original_sale_item_id VARCHAR(64) REFERENCES sale_items(id),
    product_id VARCHAR(64) REFERENCES products(id),
    hsn_code VARCHAR(20) DEFAULT '0000',
    quantity INT NOT NULL,
    refund_unit_price NUMERIC(14, 2) NOT NULL,
    cgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    sgst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    igst_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    tax_amount NUMERIC(14, 2) NOT NULL,
    restock BOOLEAN DEFAULT TRUE,
    line_total NUMERIC(14, 2) NOT NULL
);

-- 21. Sale Cancellations
CREATE TABLE IF NOT EXISTS sale_cancellations (
    id VARCHAR(64) PRIMARY KEY,
    sale_id VARCHAR(64) REFERENCES sales(id),
    cancellation_number VARCHAR(100) NOT NULL UNIQUE,
    invoice_number VARCHAR(100),
    reason TEXT NOT NULL,
    cancelled_by VARCHAR(150) NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    refund_amount NUMERIC(14, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'CANCELLED'
);

-- 22. Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) REFERENCES businesses(id),
    product_id VARCHAR(64) REFERENCES products(id) ON DELETE CASCADE,
    quantity_on_hand INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_qty_positive CHECK (quantity_on_hand >= 0)
);

CREATE UNIQUE INDEX idx_inventory_product ON inventory(business_id, product_id);

-- 23. Stock Movements (Audit Trail Ledger)
CREATE TABLE IF NOT EXISTS stock_movements (
    id VARCHAR(64) PRIMARY KEY,
    product_id VARCHAR(64) REFERENCES products(id),
    movement_type VARCHAR(50) NOT NULL,
    quantity_change INT NOT NULL,
    quantity_before INT NOT NULL,
    quantity_after INT NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id VARCHAR(100),
    reason TEXT,
    created_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_movements_prod ON stock_movements(product_id);
CREATE INDEX idx_movements_date ON stock_movements(created_at);

-- 24. Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
    id VARCHAR(64) PRIMARY KEY,
    adjustment_number VARCHAR(100) NOT NULL UNIQUE,
    product_id VARCHAR(64) REFERENCES products(id),
    adjustment_type VARCHAR(50) NOT NULL, -- RECOUNT, DAMAGE, EXPIRATION, SHRINKAGE
    quantity_adjusted INT NOT NULL,
    reason TEXT NOT NULL,
    adjusted_by VARCHAR(150),
    adjusted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 25. Expense Categories
CREATE TABLE IF NOT EXISTS expense_categories (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE
);

-- 26. Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(64) PRIMARY KEY,
    category_id VARCHAR(64) REFERENCES expense_categories(id),
    amount NUMERIC(14, 2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(50) NOT NULL,
    expense_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 27. Cash Register Sessions
CREATE TABLE IF NOT EXISTS cash_register_sessions (
    id VARCHAR(64) PRIMARY KEY,
    cashier_id VARCHAR(64) REFERENCES users(id),
    cashier_name VARCHAR(150),
    opening_balance NUMERIC(14, 2) NOT NULL,
    closing_balance NUMERIC(14, 2),
    expected_balance NUMERIC(14, 2),
    discrepancy NUMERIC(14, 2),
    cash_sales_total NUMERIC(14, 2) DEFAULT 0.00,
    cash_payout_total NUMERIC(14, 2) DEFAULT 0.00,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) NOT NULL,
    notes TEXT
);

-- 28. Cash Register Drawer Logs
CREATE TABLE IF NOT EXISTS drawer_logs (
    id VARCHAR(64) PRIMARY KEY,
    session_id VARCHAR(64) REFERENCES cash_register_sessions(id),
    action_type VARCHAR(50) NOT NULL, -- OPEN, CLOSE, CASH_IN, CASH_OUT
    amount NUMERIC(14, 2) NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 29. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64),
    user_name VARCHAR(150),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 30. Business Settings
CREATE TABLE IF NOT EXISTS business_settings (
    id VARCHAR(64) PRIMARY KEY,
    business_id VARCHAR(64) REFERENCES businesses(id),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL
);

-- 31. Barcode Label Templates
CREATE TABLE IF NOT EXISTS barcode_templates (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    width_mm NUMERIC(6, 2) NOT NULL,
    height_mm NUMERIC(6, 2) NOT NULL,
    template_config JSONB NOT NULL
);

-- 32. Held Carts
CREATE TABLE IF NOT EXISTS held_carts (
    id VARCHAR(64) PRIMARY KEY,
    customer_id VARCHAR(64) REFERENCES customers(id),
    cashier_name VARCHAR(150),
    cart_data JSONB NOT NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

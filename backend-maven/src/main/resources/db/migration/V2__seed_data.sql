-- =====================================================================
-- Flyway Migration V2__seed_data.sql
-- SmartPOS Seed Initial Data for Indian Retail & GST Billing
-- =====================================================================

INSERT INTO roles (id, role_name) VALUES
('role-admin', 'ROLE_ADMIN'),
('role-manager', 'ROLE_MANAGER'),
('role-cashier', 'ROLE_CASHIER'),
('role-inventory', 'ROLE_INVENTORY_MANAGER'),
('role-viewer', 'ROLE_REPORT_VIEWER')
ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (
    id, business_name, tagline, address, city, state, state_code, pincode, phone, email, gstin, pan_number, fssai_number, upi_id, currency, receipt_footer, return_policy
) VALUES (
    'biz-001',
    'Natura Supermarket & Kirana',
    'Fresh Quality Goods, Groceries & Daily Needs',
    'Shop 14, Plot 42, Linking Road, Bandra West',
    'Mumbai',
    'Maharashtra',
    '27',
    '400050',
    '+91 98201 55432',
    'billing@naturaretail.in',
    '27AABCN8942Q1Z8',
    'AABCN8942Q',
    '11522004000123',
    'naturaretail@okhdfcbank',
    'INR',
    'Thank you for shopping at Natura! Please retain bill for warranty & exchanges.',
    'Goods once sold can be exchanged within 7 days with original GST tax invoice. Perishable goods non-returnable.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (id, name, description, active) VALUES
('cat-1', 'Fresh Fruits & Vegetables', 'Farm-fresh certified produce & vegetables', true),
('cat-2', 'Beverages & Chai / Coffee', 'Artisan Coorg coffee, Nilgiri tea & beverages', true),
('cat-3', 'Consumer Electronics', 'Audio gadgets, mobile cables & accessories', true),
('cat-4', 'Stationery & Notebooks', 'Executive registers, fine diaries & paper supplies', true),
('cat-5', 'Bakery & Biscuits', 'Fresh artisan breads, cookies and bakery goods', true),
('cat-6', 'Pantry & Edible Oils', 'Cold-pressed oils, basmati rice, lentils and atta', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO brands (id, name, description) VALUES
('br-1', 'Natura Organic Farms', 'Certified fresh farm produce'),
('br-2', 'Aurora Coorg Roasters', 'Western Ghats single origin artisanal coffee'),
('br-3', 'AuraTek Audio India', 'High fidelity retail audio peripherals & gadgets'),
('br-4', 'Heritage Paper Co.', 'Fine bound stationery & executive journals')
ON CONFLICT (id) DO NOTHING;

INSERT INTO units (id, name, abbreviation) VALUES
('unit-1', 'Piece', 'pcs'),
('unit-2', 'Kilogram', 'kg'),
('unit-3', 'Pack', 'pk'),
('unit-4', 'Litre', 'L')
ON CONFLICT (id) DO NOTHING;

-- Products with Indian HSN Codes and GST Slabs
INSERT INTO products (
    id, sku, barcode, hsn_code, product_name, description, category_id, brand_id, unit_id, cost_price, selling_price, tax_rate, reorder_level, active
) VALUES
('prod-1', 'PROD-APP-001', '8901020000101', '08081000', 'Shimla Fresh Royal Gala Apples (1kg Box)', 'Crisp sweet Himachal apples packed in sanitized boxes', 'cat-1', 'br-1', 'unit-2', 120.00, 180.00, 5.0, 20, true),
('prod-2', 'PROD-COF-002', '8901020000200', '09012100', 'Aurora Whole Bean Arabica Coffee (250g)', 'Freshly roasted single-estate Coorg dark roast beans', 'cat-2', 'br-2', 'unit-3', 320.00, 480.00, 5.0, 15, true),
('prod-3', 'PROD-AUD-003', '8901020000309', '85183000', 'AuraTek Pro Wireless ANC Headphones', 'Over-ear active noise cancelling with 40h battery backup', 'cat-3', 'br-3', 'unit-1', 1850.00, 2499.00, 18.0, 8, true),
('prod-4', 'PROD-NOT-004', '8901020000408', '48201000', 'Executive Spiral Ruled Diary Notebook', 'Archival 120gsm paper with leatherette hard cover', 'cat-4', 'br-4', 'unit-1', 190.00, 350.00, 12.0, 25, true),
('prod-5', 'PROD-TEA-005', '8901020000507', '09024020', 'Nilgiri Orthodox Golden Pekoe Tea (500g)', 'Handpicked premium aromatic Nilgiri black tea', 'cat-2', 'br-2', 'unit-3', 280.00, 420.00, 5.0, 15, true),
('prod-6', 'PROD-OIL-006', '8901020000606', '15089091', 'Wood-Pressed Groundnut Oil (1 Litre)', 'Traditional cold-pressed unrefined edible peanut oil', 'cat-6', 'br-1', 'unit-4', 210.00, 310.00, 5.0, 20, true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO inventory (id, business_id, product_id, quantity_on_hand, reserved_quantity) VALUES
('inv-1', 'biz-001', 'prod-1', 85, 0),
('inv-2', 'biz-001', 'prod-2', 42, 0),
('inv-3', 'biz-001', 'prod-3', 14, 0),
('inv-4', 'biz-001', 'prod-4', 36, 0),
('inv-5', 'biz-001', 'prod-5', 28, 0),
('inv-6', 'biz-001', 'prod-6', 50, 0)
ON CONFLICT (id) DO NOTHING;

-- Indian Customers (Walk-in Intra-State and Registered B2B Inter-State)
INSERT INTO customers (
    id, customer_code, customer_name, phone, email, address, state, state_code, gstin, loyalty_points, active
) VALUES
('cust-walkin', 'CUST-0000', 'Walk-in Retail Customer', '', '', 'Local Store Counter, Bandra', 'Maharashtra', '27', '', 0, true),
('cust-1', 'CUST-1001', 'Priyanka Sharma', '+91 98201 44882', 'priyanka.s@gmail.com', 'Flat 402, Sea Green Apts, Worli', 'Maharashtra', '27', '', 140, true),
('cust-2', 'CUST-1002', 'TechWork Systems Pvt Ltd', '+91 80 4122 9000', 'accounts@techwork.in', 'Indiranagar 100 Feet Rd, Bengaluru', 'Karnataka', '29', '29AABCT1234F1Z8', 350, true)
ON CONFLICT (id) DO NOTHING;

-- Indian Suppliers
INSERT INTO suppliers (
    id, supplier_name, phone, email, address, state, state_code, gstin, contact_person, active
) VALUES
('sup-1', 'Himalayan Organic Orchard Coop', '+91 177 265 4321', 'orders@himorchards.in', 'Kotkhai Valley, Shimla Dist', 'Himachal Pradesh', '02', '02AAACH1234L1Z9', 'Vikram Negi', true),
('sup-2', 'Coorg Estate Planters Syndicate', '+91 8272 233 445', 'supply@coorgplanters.co.in', 'Madikeri Estate Road, Kodagu', 'Karnataka', '29', '29AABCC4321K1Z2', 'Ganesh Bopaiah', true)
ON CONFLICT (id) DO NOTHING;

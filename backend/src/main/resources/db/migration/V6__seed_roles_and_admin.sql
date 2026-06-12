-- Seed roles
INSERT INTO roles (name, description) VALUES
('CUSTOMER_ADMIN',          'Customer administrator managing company bookings'),
('SALES_AGENT',             'Airline sales agent managing customer accounts'),
('OPERATIONS_USER',         'Operations staff handling cargo processing'),
('REVENUE_MANAGEMENT_USER', 'Revenue management team handling pricing and yields'),
('FINANCE_USER',            'Finance team for billing and settlements'),
('AIRLINE_ADMINISTRATOR',   'Full system administrator for the portal');

-- Seed permissions
INSERT INTO permissions (name, description, module) VALUES
('USER_READ',         'View user accounts',            'USER_MANAGEMENT'),
('USER_WRITE',        'Create and edit user accounts', 'USER_MANAGEMENT'),
('USER_DELETE',       'Delete user accounts',          'USER_MANAGEMENT'),
('APPROVAL_READ',     'View approval requests',        'APPROVALS'),
('APPROVAL_WRITE',    'Process approval requests',     'APPROVALS'),
('ROLE_MANAGE',       'Assign and revoke roles',       'USER_MANAGEMENT'),
('BOOKING_READ',      'View cargo bookings',           'BOOKINGS'),
('BOOKING_WRITE',     'Create and modify bookings',    'BOOKINGS'),
('BOOKING_CANCEL',    'Cancel bookings',               'BOOKINGS'),
('RATE_READ',         'View cargo rates',              'RATES'),
('RATE_WRITE',        'Modify cargo rates',            'RATES'),
('REPORT_READ',       'View reports and analytics',    'REPORTS'),
('FINANCE_READ',      'View financial data',           'FINANCE'),
('FINANCE_WRITE',     'Process payments and invoices', 'FINANCE');

-- Assign permissions to roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'AIRLINE_ADMINISTRATOR';

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'SALES_AGENT'
  AND p.name IN ('USER_READ','APPROVAL_READ','APPROVAL_WRITE','BOOKING_READ','RATE_READ','REPORT_READ');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'CUSTOMER_ADMIN'
  AND p.name IN ('USER_READ','BOOKING_READ','BOOKING_WRITE','BOOKING_CANCEL','RATE_READ');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'OPERATIONS_USER'
  AND p.name IN ('BOOKING_READ','BOOKING_WRITE','REPORT_READ');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'REVENUE_MANAGEMENT_USER'
  AND p.name IN ('RATE_READ','RATE_WRITE','REPORT_READ','BOOKING_READ');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'FINANCE_USER'
  AND p.name IN ('FINANCE_READ','FINANCE_WRITE','REPORT_READ','BOOKING_READ');

-- Seed default admin user (password: Admin@1234)
INSERT INTO users (first_name, last_name, email, password, company, account_type, status)
VALUES ('System', 'Administrator', 'admin@skyfreight.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lew3pz1hNO/MnKSHS',
        'SkyFreight Airlines', 'CORPORATE', 'ACTIVE');

-- Assign AIRLINE_ADMINISTRATOR role to default admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.email = 'admin@skyfreight.com'
  AND r.name = 'AIRLINE_ADMINISTRATOR';

-- V6 seeded an admin password hash that does not correspond to the
-- documented default password (Admin@1234). Replace it with a correct
-- BCrypt(12) hash for 'Admin@1234'.
UPDATE users
SET password = '$2a$12$5epIMXO5mYLppsafJybmpe2DR.gBWX8pWZO9Gq4gd8lD4v8dxlT3m'
WHERE email = 'admin@skyfreight.com';

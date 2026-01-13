-- Update first user to admin and approved
UPDATE users SET role = 'admin', approved = 1 WHERE id = (SELECT id FROM users ORDER BY createdAt ASC LIMIT 1);

-- Approve all existing users
UPDATE users SET approved = 1 WHERE approved = 0 OR approved IS NULL;

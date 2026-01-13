-- Update first user to admin and approved
UPDATE users 
SET role = 'admin', approved = true 
WHERE id = (SELECT id FROM users ORDER BY "createdAt" ASC LIMIT 1);

-- Approve all existing users
UPDATE users 
SET approved = true 
WHERE approved = false OR approved IS NULL;

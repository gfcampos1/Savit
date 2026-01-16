-- Update all categories to inherit color from their section
-- Categories without a section will keep the default WhatsApp green

-- First, update categories that have a section to use the section's color
UPDATE categories c
SET color = cs.color
FROM category_sections cs
WHERE c."sectionId" = cs.id;

-- Categories without a section get the default color
UPDATE categories
SET color = '#25D366'
WHERE "sectionId" IS NULL;

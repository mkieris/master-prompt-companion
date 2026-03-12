-- Add management_info field to domain_knowledge table
-- This stores CEO/management quotes, philosophy, and key statements

ALTER TABLE domain_knowledge
ADD COLUMN IF NOT EXISTS management_info TEXT;

-- Add comment for documentation
COMMENT ON COLUMN domain_knowledge.management_info IS 'CEO/Management information: quotes, philosophy, key statements for content personalization';

-- Add tenant_id to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- Update existing documents if any (setting them to the first tenant as a fallback, or leaving null)
-- In a real scenario, we'd need to know which tenant they belong to via employee_id.
UPDATE documents d
SET tenant_id = e.tenant_id
FROM employees e
WHERE d.employee_id = e.id AND d.tenant_id IS NULL;

-- Make it NOT NULL after update if possible
-- ALTER TABLE documents ALTER COLUMN tenant_id SET NOT NULL;

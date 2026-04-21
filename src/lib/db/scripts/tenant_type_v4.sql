-- Add tenant_type to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS tenant_type VARCHAR(20) DEFAULT 'EDUCATION' 
CHECK (tenant_type IN ('EDUCATION', 'COMPANY'));

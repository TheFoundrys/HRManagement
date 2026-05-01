-- Add available_roles to global_templates
ALTER TABLE global_templates ADD COLUMN IF NOT EXISTS available_roles JSONB DEFAULT '[]';

-- Update existing templates with default roles
UPDATE global_templates SET available_roles = '["ADMIN", "HR", "MANAGER", "EMPLOYEE"]' WHERE org_type = 'CORPORATE' OR org_type = 'PHARMA';
UPDATE global_templates SET available_roles = '["PRINCIPAL", "HOD", "FACULTY", "STAFF"]' WHERE org_type = 'EDUCATION' OR org_type = 'SCHOOL';

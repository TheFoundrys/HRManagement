-- =============================================================================
-- Migration: add_hierarchy_columns.sql
-- Goal: Extend multitenant architecture for strong hierarchy customization.
-- =============================================================================

-- 1. Extend tenants table with organizational metadata
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS org_type TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS org_size INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en-IN';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure settings JSONB exists (it was already there, but let's be safe)
-- Note: JSONB structure is documented in the design principles.
ALTER TABLE tenants ALTER COLUMN settings SET DEFAULT '{}';

-- 2. Extend departments table for nesting and depth tracking
ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS depth INTEGER NOT NULL DEFAULT 0;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS head_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 3. Extend employees table for direct reporting (manager_id)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;

-- 4. Global Templates (Sector-agnostic, Super Admin managed)
DROP TABLE IF EXISTS template_labels CASCADE;
DROP TABLE IF EXISTS template_designations CASCADE;
DROP TABLE IF EXISTS template_departments CASCADE;
DROP TABLE IF EXISTS global_templates CASCADE;

CREATE TABLE IF NOT EXISTS global_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  org_type    TEXT,              -- open text, e.g., 'hospital', 'university'
  description      TEXT,
  hierarchy_labels JSONB DEFAULT '{}',
  is_public        BOOLEAN DEFAULT TRUE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Template Departments (Normalized tree rows for structure import)
CREATE TABLE IF NOT EXISTS template_departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES global_templates(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES template_departments(id) ON DELETE CASCADE,
  depth       INTEGER DEFAULT 0
);

-- 6. Template Designations
CREATE TABLE IF NOT EXISTS template_designations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES global_templates(id) ON DELETE CASCADE,
  name        TEXT NOT NULL
);

-- 7. Template Labels (Mapping depth to human-readable labels per sector/template)
CREATE TABLE IF NOT EXISTS template_labels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES global_templates(id) ON DELETE CASCADE,
  depth       INTEGER NOT NULL,
  label       TEXT NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_template_depts_lookup ON template_departments(template_id);
CREATE INDEX IF NOT EXISTS idx_template_desig_lookup ON template_designations(template_id);
CREATE INDEX IF NOT EXISTS idx_template_labels_lookup ON template_labels(template_id);

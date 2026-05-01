-- 1. Extend tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS org_type TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS domain TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS org_size INTEGER;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- 2. Extend departments
ALTER TABLE departments ADD COLUMN IF NOT EXISTS parent_department_id UUID REFERENCES departments(id);
ALTER TABLE departments ADD COLUMN IF NOT EXISTS depth INTEGER DEFAULT 0;

-- 3. Extend employees
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id);

-- 4. Templates
CREATE TABLE IF NOT EXISTS global_templates (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  org_type         TEXT,
  description      TEXT,
  hierarchy_labels JSONB DEFAULT '{}',
  is_active        BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS template_departments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES global_templates(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  parent_id   UUID REFERENCES template_departments(id),
  depth       INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS template_designations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES global_templates(id) ON DELETE CASCADE,
  name        TEXT NOT NULL
);

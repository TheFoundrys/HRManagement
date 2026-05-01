-- Onboarding Links table
CREATE TABLE IF NOT EXISTS onboarding_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  employee_id UUID REFERENCES employees(id),
  token TEXT NOT NULL UNIQUE,
  link_type VARCHAR(20) NOT NULL DEFAULT 'generic', -- 'specific' | 'generic'
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active' | 'submitted' | 'expired' | 'revoked'
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Submissions table
CREATE TABLE IF NOT EXISTS onboarding_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  link_id UUID NOT NULL REFERENCES onboarding_links(id),
  employee_id UUID REFERENCES employees(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  current_address TEXT,
  permanent_address TEXT,
  date_of_birth DATE,
  emergency_contact VARCHAR(100),
  blood_group VARCHAR(10),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding Documents table (stores file metadata, files go to disk)
CREATE TABLE IF NOT EXISTS onboarding_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES onboarding_submissions(id) ON DELETE CASCADE,
  doc_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, doc_type)
);

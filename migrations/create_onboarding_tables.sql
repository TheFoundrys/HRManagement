-- Create Employees Table (or alter if exists)
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  email VARCHAR(255) UNIQUE,
  phone_number VARCHAR(15),
  employee_type VARCHAR(15),  -- 'fresher' | 'employee'
  department VARCHAR(20),
  position VARCHAR(30),
  current_address TEXT,
  permanent_address TEXT,
  joining_date DATE,
  status VARCHAR(10) DEFAULT 'pending',  -- 'pending'|'accepted'|'rejected'
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  is_self_submitted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ,
  it_notification_sent BOOLEAN DEFAULT false,
  
  -- Document boolean flags
  aadhar_pan_collected BOOLEAN DEFAULT false,
  payslips_collected BOOLEAN DEFAULT false,
  educational_certificates_collected BOOLEAN DEFAULT false,
  previous_offer_letter_collected BOOLEAN DEFAULT false,
  relieving_experience_letters_collected BOOLEAN DEFAULT false,
  appraisal_hike_letters_collected BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create Documents Table
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  employee_id INT REFERENCES employees(id),
  doc_type VARCHAR(100),  
  file_data BYTEA,         -- store binary in DB
  file_name VARCHAR(255),
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, doc_type)
);

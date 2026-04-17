
-- Update users role constraint to include EMPLOYEE and TEACHING
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'HR', 'HOD', 'STAFF', 'FACULTY', 'TEACHING', 'NON_TEACHING', 'EMPLOYEE', 'PENDING'));

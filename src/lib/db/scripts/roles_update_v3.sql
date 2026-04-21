-- 1. Sync existing roles to the new functional schema
UPDATE users SET role = 'GLOBAL_ADMIN' WHERE role = 'ADMIN';
UPDATE users SET role = 'EMPLOYEE' WHERE role = 'STAFF';

-- 2. Update users role constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role IN (
    'SUPER_ADMIN', 
    'GLOBAL_ADMIN', 
    'HR_MANAGER', 
    'HR_EXECUTIVE',
    'PAYROLL_ADMIN',
    'EXPENSE_MANAGER',
    'IT_ADMIN',
    'LEARNING_ADMIN',
    'MANAGER',
    'TEAM_LEAD',
    'EMPLOYEE',
    'HOD',
    'PRINCIPAL',
    'DIRECTOR',
    'FACULTY', 
    'STAFF', 
    'NON_TEACHING', 
    'PENDING'
));

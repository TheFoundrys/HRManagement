
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
});

async function run() {
  try {
    console.log('1. Clearing old constraint...');
    await pool.query("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check");

    console.log('2. Syncing roles...');
    await pool.query("UPDATE users SET role = 'GLOBAL_ADMIN' WHERE role = 'ADMIN'");
    await pool.query("UPDATE users SET role = 'EMPLOYEE' WHERE role = 'STAFF'");

    console.log('3. Applying new constraint...');
    await pool.query(`
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
      ))
    `);

    console.log('✅ Success!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();

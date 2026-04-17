
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'hr_management_system',
});

async function checkEmployees() {
  try {
    const res = await pool.query('SELECT id, university_id, first_name, last_name, email, role, is_active, tenant_id FROM employees');
    console.log('Employees in DB:', res.rows);
    
    const tenants = await pool.query('SELECT id, name FROM tenants');
    console.log('Tenants in DB:', tenants.rows);
    
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkEmployees();

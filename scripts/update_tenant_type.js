require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});

async function run() {
  try {
    const res = await pool.query("UPDATE tenants SET tenant_type = 'COMPANY'");
    console.log(`Updated ${res.rowCount} tenant(s) to COMPANY.`);
    
    // Also update any previous employees mapped to education roles to standard employee
    const roleRes = await pool.query(`
      UPDATE employees 
      SET role = 'EMPLOYEE' 
      WHERE role IN ('FACULTY', 'STAFF', 'NON_TEACHING', 'ADMIN', 'PRINCIPAL', 'DIRECTOR', 'HOD')
    `);
    console.log(`Reset ${roleRes.rowCount} employee(s) legacy education roles to standard COMPANY 'EMPLOYEE' role.`);
    
    // Also update users
    await pool.query(`
      UPDATE users 
      SET role = 'EMPLOYEE' 
      WHERE role IN ('FACULTY', 'STAFF', 'NON_TEACHING', 'ADMIN', 'PRINCIPAL', 'DIRECTOR', 'HOD')
    `);
    
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

run();

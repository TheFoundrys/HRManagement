
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
});

async function purge() {
  try {
    console.log('Fetching inactive employees...');
    const result = await pool.query("SELECT id, university_id, email, tenant_id FROM employees WHERE is_active = false");
    
    for (const emp of result.rows) {
      console.log(`Purging ${emp.email} (ID: ${emp.university_id})...`);
      
      // 1. Delete User account if exists (Must happen first due to FK)
      await pool.query("DELETE FROM users WHERE email = $1 AND tenant_id = $2", [emp.email, emp.tenant_id]);
      
      // 2. Delete Employee (Cascades to attendance, leaves, documents)
      await pool.query("DELETE FROM employees WHERE id = $1", [emp.id]);
    }
    
    console.log(`✅ Success! Purged ${result.rows.length} records.`);
    await pool.end();
  } catch (err) {
    console.error('Purge error:', err);
    process.exit(1);
  }
}
purge();

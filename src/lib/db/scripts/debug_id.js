
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
});

async function debug() {
  try {
    const res = await pool.query("SELECT id FROM employees WHERE id = 'bce7a3d4-0e79-4571-a164-00d71e6d1436'");
    console.log('Exists:', res.rows.length > 0);
    
    // Find who this is
    const res2 = await pool.query("SELECT * FROM employees WHERE id = 'bce7a3d4-0e79-4571-a164-00d71e6d1436'");
    console.log('Row:', res2.rows[0]);
    
    await pool.end();
  } catch(e) {
    console.error(e);
  }
}
debug();

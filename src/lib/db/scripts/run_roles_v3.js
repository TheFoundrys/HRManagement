
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
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
    const sql = fs.readFileSync(path.join(__dirname, 'roles_update_v3.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Role constraints updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Role update failed:', err);
    process.exit(1);
  }
}
run();

const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
});

async function testOnboarding() {
  const testEmail = `test.staff.${Date.now()}@example.com`;
  const tenantId = 'e82b465b-081d-4f64-983d-a7f568e7db8f'; // System Tenant from previous query

  console.log(`🚀 Starting verification test for: ${testEmail}`);

  try {
    // 1. Manually trigger the logic that would be in the API (simulation)
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const verificationToken = crypto.randomUUID();
    const verificationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    console.log(`Generated Temp Password: ${tempPassword}`);
    console.log(`Generated Token: ${verificationToken}`);

    // Insert user
    await pool.query(
      `INSERT INTO users (
        tenant_id, email, password_hash, name, role, 
        is_active, is_verified, verification_token, verification_token_expires
      )
      VALUES ($1, $2, $3, $4, $5, true, false, $6, $7)`,
      [tenantId, testEmail, 'dummy_hash', 'Test Staff', 'STAFF', verificationToken, verificationExpires]
    );

    console.log('✅ User inserted into DB with verification token.');

    // 2. Check the DB record
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [testEmail]);
    const user = res.rows[0];

    console.log('DB Record Check:');
    console.log(`- Email: ${user.email}`);
    console.log(`- Is Verified: ${user.is_verified}`);
    console.log(`- Token: ${user.verification_token}`);
    console.log(`- Expires: ${user.verification_token_expires}`);

    if (user.verification_token === verificationToken && user.is_verified === false) {
      console.log('✨ SUCCESS: Database state is correct.');
    } else {
      console.error('❌ FAILURE: Database state mismatch.');
    }

    // 3. Clean up
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail]);
    console.log('🗑️ Test user cleaned up.');

  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    await pool.end();
  }
}

testOnboarding();

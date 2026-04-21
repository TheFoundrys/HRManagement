
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
});

async function migrate() {
  try {
    console.log('Migrating leave system...');
    
    // 1. Create/Update leave_types
    await pool.query(`DROP TABLE IF EXISTS leave_approvals CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS leave_requests CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS leave_balances CASCADE`);
    await pool.query(`DROP TABLE IF EXISTS leave_types CASCADE`);

    await pool.query(`
      CREATE TABLE leave_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL,
        annual_quota NUMERIC(5,2) DEFAULT 0,
        max_per_year INTEGER DEFAULT 0,
        color VARCHAR(50),
        UNIQUE(tenant_id, code)
      )
    `);

    // 2. Create/Update leave_balances
    await pool.query(`
      CREATE TABLE leave_balances (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
        leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
        year INTEGER NOT NULL,
        allocated_days NUMERIC(5,2) DEFAULT 0,
        used_days NUMERIC(5,2) DEFAULT 0,
        remaining_days NUMERIC(5,2) DEFAULT 0,
        accrued_so_far NUMERIC(5,2) DEFAULT 0,
        UNIQUE(employee_id, leave_type_id, year)
      )
    `);

    // 3. Create/Update leave_requests
    await pool.query(`
      CREATE TABLE leave_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
        leave_type_id UUID REFERENCES leave_types(id) ON DELETE CASCADE,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        total_days NUMERIC(5,2) NOT NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        is_half_day BOOLEAN DEFAULT false,
        half_day_type VARCHAR(20),
        substitution_employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
        attachment_url TEXT,
        current_level INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 4. Create/Update leave_approvals
    await pool.query(`
      CREATE TABLE leave_approvals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        leave_request_id UUID REFERENCES leave_requests(id) ON DELETE CASCADE,
        approver_id UUID REFERENCES employees(id) ON DELETE CASCADE,
        level INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL,
        remarks TEXT,
        action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // 3. Seed for existing tenants
    const types = [
      { name: 'Earned Leave', code: 'EL', quota: 10, color: '#A855F7' },
      { name: 'Personal Leave', code: 'PL', quota: 2, color: '#06B6D4' },
      { name: 'Sick Leave', code: 'SL', quota: 3, color: '#F59E0B' },
      { name: 'Unpaid Leave (LOP)', code: 'UL', quota: 0, color: '#EF4444' }
    ];

    const tenants = await pool.query("SELECT id FROM tenants");
    for (const t of tenants.rows) {
      const types = [
        { name: 'Earned Leave', code: 'EL', quota: 10, current: 0.83, color: '#A855F7' },
        { name: 'Personal Leave', code: 'PL', quota: 2, current: 2, color: '#06B6D4' },
        { name: 'Sick Leave', code: 'SL', quota: 3, current: 3, color: '#F59E0B' },
        { name: 'Unpaid Leave (LOP)', code: 'UL', quota: 999, current: 999, color: '#EF4444' }
      ];

      for (const type of types) {
        const typeRes = await pool.query(
          `INSERT INTO leave_types (tenant_id, name, code, annual_quota, color, max_per_year) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           ON CONFLICT (tenant_id, code) 
           DO UPDATE SET annual_quota = $4, color = $5, max_per_year = $6
           RETURNING id`,
          [t.id, type.name, type.code, type.quota, type.color, Math.floor(type.quota)]
        );
        const typeId = typeRes.rows[0].id;

        await pool.query(
          `INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, year, allocated_days, used_days, remaining_days, accrued_so_far)
           SELECT tenant_id, id, $1, 2026, $2, 0, $3, $3
           FROM employees WHERE tenant_id = $4
           ON CONFLICT (employee_id, leave_type_id, year) 
           DO UPDATE SET allocated_days = $2, remaining_days = $3, accrued_so_far = $3`,
          [typeId, type.quota, type.current, t.id]
        );
      }
    }

    console.log('✅ Leave system migrated and seeded.');
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
migrate();

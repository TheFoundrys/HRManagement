
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DATABASE,
});

async function fix() {
  try {
    const tenantsRes = await pool.query('SELECT id, tenant_type FROM tenants');
    for (const tenant of tenantsRes.rows) {
      console.log(`Checking tenant ${tenant.id} (${tenant.tenant_type})...`);
      
      const desigs = tenant.tenant_type === 'COMPANY' 
        ? ['CEO', 'Executive', 'HR', 'Manager', 'TL', 'Employee']
        : ['Professor', 'Dean', 'Registrar', 'Assistant Professor', 'Director', 'Principal'];

      const depts = tenant.tenant_type === 'COMPANY'
        ? ['Executive', 'HR', 'Engineering', 'Product', 'Sales', 'Marketing', 'Operations', 'Finance', 'Legal']
        : [
            'Executive', 'DeepTech_AI', 'DeepTech_CyberSecurity', 'DeepTech_Quantum', 
            'DeepTech_Blockchain', 'Entrepreneurship', 'Sustainability', 'Energy', 
            'Programs', 'Faculty_Development', 'Engineering', 'Research', 
            'Innovation_Lab', 'Startup_Incubation', 'Product', 'HR', 'Operations', 
            'Admissions', 'Partnerships', 'Marketing', 'Community', 'Finance', 'Legal'
          ];

      for (const name of desigs) {
        await pool.query(
          'INSERT INTO designations (tenant_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [tenant.id, name]
        );
      }
      
      for (const d of depts) {
        await pool.query('INSERT INTO departments (tenant_id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING', [tenant.id, d]);
      }
    }
    console.log('✅ All tenants updated with standard designations and departments.');
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
fix();

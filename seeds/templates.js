const { pool } = require('../src/lib/db/postgres');
const { v4: uuidv4 } = require('uuid');

async function seedTemplates() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const templates = [
      {
        name: 'Standard University',
        org_type: 'university',
        labels: { 0: 'University', 1: 'Faculty', 2: 'Department', 3: 'Division' },
        designations: [
          { title: 'Vice Chancellor', level: 5 },
          { title: 'Dean', level: 4 },
          { title: 'HOD', level: 3 },
          { title: 'Assoc Professor', level: 2 },
          { title: 'Asst Professor', level: 1 }
        ],
        departments: [
          { name: 'University', depth: 0, children: [
            { name: 'Faculty of Engineering', depth: 1, children: [
              { name: 'Computer Science', depth: 2 },
              { name: 'Electronics', depth: 2 },
              { name: 'Mechanical', depth: 2 }
            ]},
            { name: 'Faculty of Science', depth: 1, children: [
              { name: 'Physics', depth: 2 },
              { name: 'Chemistry', depth: 2 }
            ]}
          ]}
        ]
      },
      {
        name: 'Mid-size Corporate',
        org_type: 'corporate',
        labels: { 0: 'Company', 1: 'Division', 2: 'Department', 3: 'Team' },
        designations: [
          { title: 'CEO', level: 5 },
          { title: 'Director', level: 4 },
          { title: 'Manager', level: 3 },
          { title: 'Lead', level: 2 },
          { title: 'Employee', level: 1 }
        ],
        departments: [
          { name: 'Company', depth: 0, children: [
            { name: 'Engineering', depth: 1, children: [
              { name: 'Backend', depth: 2 },
              { name: 'Frontend', depth: 2 }
            ]},
            { name: 'Operations', depth: 1, children: [
              { name: 'HR', depth: 2 },
              { name: 'Finance', depth: 2 }
            ]}
          ]}
        ]
      },
      {
        name: 'Standard Hospital',
        org_type: 'hospital',
        labels: { 0: 'Hospital Group', 1: 'Hospital', 2: 'Department', 3: 'Ward' },
        designations: [
          { title: 'Medical Director', level: 5 },
          { title: 'Chief of Dept', level: 4 },
          { title: 'Consultant', level: 3 },
          { title: 'Resident Doctor', level: 2 },
          { title: 'Staff Nurse', level: 1 }
        ],
        departments: [
          { name: 'Hospital Group', depth: 0, children: [
            { name: 'Main Hospital', depth: 1, children: [
              { name: 'Cardiology', depth: 2, children: [{ name: 'ICU', depth: 3 }] },
              { name: 'Orthopaedics', depth: 2 },
              { name: 'Emergency', depth: 2 }
            ]},
            { name: 'Diagnostics Centre', depth: 1, children: [
              { name: 'Radiology', depth: 2 },
              { name: 'Pathology', depth: 2 }
            ]}
          ]}
        ]
      }
    ];

    for (const t of templates) {
      // 1. Insert Template
      const tRes = await client.query(
        `INSERT INTO global_templates (name, org_type, description) 
         VALUES ($1, $2, $3) 
         ON CONFLICT DO NOTHING RETURNING id`,
        [t.name, t.org_type, `${t.name} structure template`]
      );

      if (tRes.rows.length === 0) continue;
      const templateId = tRes.rows[0].id;

      // 2. Insert Labels
      for (const [depth, label] of Object.entries(t.labels)) {
        await client.query(
          `INSERT INTO template_labels (template_id, depth, label) VALUES ($1, $2, $3)`,
          [templateId, depth, label]
        );
      }

      // 3. Insert Designations
      for (const d of t.designations) {
        await client.query(
          `INSERT INTO template_designations (template_id, title, level) VALUES ($1, $2, $3)`,
          [templateId, d.title, d.level]
        );
      }

      // 4. Insert Departments (Recursive helper)
      async function insertDepts(depts, parentId = null) {
        for (const d of depts) {
          const dRes = await client.query(
            `INSERT INTO template_departments (template_id, name, depth, parent_template_dept_id) 
             VALUES ($1, $2, $3, $4) RETURNING id`,
            [templateId, d.name, d.depth, parentId]
          );
          if (d.children) {
            await insertDepts(d.children, dRes.rows[0].id);
          }
        }
      }
      await insertDepts(t.departments);
    }

    await client.query('COMMIT');
    console.log('✅ Templates seeded successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', e);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  seedTemplates();
}

module.exports = { seedTemplates };

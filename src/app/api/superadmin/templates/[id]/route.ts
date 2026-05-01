import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    // 1. Fetch Template Metadata
    const templateRes = await query('SELECT * FROM global_templates WHERE id = $1', [id]);
    if (templateRes.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const template = templateRes.rows[0];

    // 2. Fetch Departments
    const deptRes = await query('SELECT * FROM template_departments WHERE template_id = $1 ORDER BY depth ASC, name ASC', [id]);
    
    // 3. Fetch Designations
    const desigRes = await query('SELECT * FROM template_designations WHERE template_id = $1 ORDER BY name ASC', [id]);

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        departments: deptRes.rows,
        designations: desigRes.rows
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch template details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, org_type, hierarchy_labels, available_roles } = body;

    await query(`
      UPDATE global_templates 
      SET name = $1, description = $2, org_type = $3, hierarchy_labels = $4, available_roles = $5, is_active = true
      WHERE id = $6
    `, [name, description, org_type, JSON.stringify(hierarchy_labels), JSON.stringify(available_roles), id]);

    return NextResponse.json({ success: true, message: 'Blueprint updated successfully' });

  } catch (error: any) {
    console.error('Failed to update template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

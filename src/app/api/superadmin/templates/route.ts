import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

export async function GET() {
  try {
    const res = await query('SELECT * FROM global_templates WHERE is_active = true ORDER BY name ASC');
    return NextResponse.json({ success: true, templates: res.rows });
  } catch (error: any) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

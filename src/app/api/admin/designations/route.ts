import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getTenantId } from '@/lib/utils/tenant';

export async function GET(request: Request) {
  try {
    const tenantId = await getTenantId(request);
    const result = await query('SELECT id, name FROM designations WHERE tenant_id = $1 ORDER BY name ASC', [tenantId]);
    return NextResponse.json({ success: true, designations: result.rows });
  } catch (error) {
    console.error('Fetch designations error:', error);
    return NextResponse.json({ success: true, designations: [] }); // Graceful fallback
  }
}

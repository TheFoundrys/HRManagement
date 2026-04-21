import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getTenantId } from '@/lib/utils/tenant';

export async function GET(request: Request) {
  try {
    const tenantId = await getTenantId(request);
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();

    const result = await query(
      `SELECT lb.*, lt.name as type_name, lt.code as type_code, lt.color
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       JOIN employees e ON lb.employee_id = e.id
       WHERE (e.id::text = $1 OR e.university_id = $1) AND lb.tenant_id = $2 AND lb.year = $3`,
      [employeeId, tenantId, currentYear]
    );

    return NextResponse.json({ success: true, balances: result.rows });
  } catch (error) {
    console.error('Fetch leave balances error:', error);
    return NextResponse.json({ error: 'Failed to fetch leave balances' }, { status: 500 });
  }
}

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
    const now = new Date();
    const fyMonth = (now.getMonth() + 1 - 4 + 12) % 12 + 1;

    // 1. Fetch existing balances
    const result = await query(
      `SELECT lb.*, lt.name as type_name, lt.code as type_code, lt.color
       FROM leave_balances lb
       JOIN leave_types lt ON lb.leave_type_id = lt.id
       JOIN employees e ON lb.employee_id = e.id
       WHERE (e.id::text = $1 OR e.employee_id = $1 OR e.university_id = $1) AND lb.tenant_id = $2 AND lb.year = $3`,
      [employeeId, tenantId, currentYear]
    );

    let balances = result.rows;

    // 2. Fetch employee details for tenure logic
    const empRes = await query('SELECT id, join_date FROM employees WHERE (id::text = $1 OR employee_id = $1 OR university_id = $1) AND tenant_id = $2', [employeeId, tenantId]);
    
    if (empRes.rowCount && empRes.rowCount > 0) {
      const empUuid = empRes.rows[0].id;
      const joinDate = new Date(empRes.rows[0].join_date || now);
      const tenureYears = (now.getTime() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);

      // 3. If no balances, init them
      if (balances.length === 0) {
        const types = await query('SELECT id, code, max_per_year, annual_quota FROM leave_types WHERE tenant_id = $1', [tenantId]);
        for (const type of types.rows) {
          let allocated = Number(type.annual_quota || type.max_per_year || 12);
          let remaining = allocated;

          if (type.code === 'EL') {
            allocated = 10;
            if (tenureYears >= 2) allocated += 2;
            remaining = Math.min(allocated, fyMonth * 0.83);
          }

          await query(
            `INSERT INTO leave_balances (tenant_id, employee_id, leave_type_id, year, allocated_days, used_days, remaining_days)
             VALUES ($1, $2, $3, $4, $5, 0, $6)
             ON CONFLICT (employee_id, leave_type_id, year) DO UPDATE SET allocated_days = $5, remaining_days = $6`,
            [tenantId, empUuid, type.id, currentYear, allocated, remaining]
          );
        }
        
        const finalResult = await query(
          `SELECT lb.*, lt.name as type_name, lt.code as type_code, lt.color
           FROM leave_balances lb
           JOIN leave_types lt ON lb.leave_type_id = lt.id
           WHERE lb.employee_id = $1 AND lb.tenant_id = $2 AND lb.year = $3`,
          [empUuid, tenantId, currentYear]
        );
        balances = finalResult.rows;
      } else {
        // 4. Update EL accrual for existing balances (ONLY if not manually overridden)
        balances = await Promise.all(balances.map(async (b) => {
          if (b.type_code === 'EL' && !b.manual_override) {
            const limit = tenureYears >= 2 ? 12 : 10;
            const accrued = Math.min(limit, fyMonth * 0.83);
            const remaining = accrued - parseFloat(b.used_days || '0');
            
            await query(
              'UPDATE leave_balances SET allocated_days = $1, remaining_days = $2, updated_at = NOW() WHERE id = $3',
              [limit, remaining, b.id]
            );
            return { ...b, allocated_days: limit.toString(), remaining_days: remaining.toFixed(2) };
          }
          return b;
        }));
      }
    }

    return NextResponse.json({ success: true, balances });
  } catch (error: any) {
    console.error('Balances Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

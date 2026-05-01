import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getTenantId } from '@/lib/utils/tenant';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function PATCH(request: Request) {
  try {
    const tenantId = await getTenantId(request);
    
    // Check HR/Admin permissions
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);
    
    const allowedRoles = ['ADMIN', 'HR', 'HR_MANAGER', 'SUPER_ADMIN', 'GLOBAL_ADMIN', 'global_admin'];
    let currentRole = payload?.role || '';
    
    // If token role is not allowed, check DB for latest role (helps if role was just updated)
    if (!allowedRoles.includes(currentRole)) {
      const dbUser = await query('SELECT role FROM users WHERE id = $1', [payload?.id]);
      if (dbUser.rowCount && dbUser.rowCount > 0) {
        currentRole = dbUser.rows[0].role;
      }
    }

    if (!allowedRoles.includes(currentRole)) {
      return NextResponse.json({ error: 'Permission denied: Role ' + currentRole + ' not authorized' }, { status: 403 });
    }

    const { balanceId, allocatedDays, remainingDays } = await request.json();

    if (!balanceId) {
      return NextResponse.json({ error: 'Balance ID is required' }, { status: 400 });
    }

    await query(
      `UPDATE leave_balances 
       SET allocated_days = $1, remaining_days = $2, manual_override = TRUE, updated_at = NOW() 
       WHERE id = $3 AND tenant_id = $4`,
      [allocatedDays, remainingDays, balanceId, tenantId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update Balance Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

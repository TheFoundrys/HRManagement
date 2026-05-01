import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getTenantId } from '@/lib/utils/tenant';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import crypto from 'crypto';

// POST — Generate onboarding link (HR/Admin only)
export async function POST(request: Request) {
  try {
    const tenantId = await getTenantId(request);
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = await verifyToken(token);

    // Check role from DB
    const userId = (payload as any)?.userId;
    const userRes = await query('SELECT id, role FROM users WHERE id = $1', [userId]);
    const role = userRes.rows[0]?.role || '';
    const allowed = ['ADMIN', 'HR', 'HR_MANAGER', 'SUPER_ADMIN', 'GLOBAL_ADMIN'];
    if (!allowed.includes(role)) {
      return NextResponse.json({ error: 'Permission denied: Role ' + role + ' not authorized' }, { status: 403 });
    }

    const { employeeId, linkType } = await request.json();
    const isGeneric = linkType === 'generic' || !employeeId;

    // For specific links, verify employee exists
    if (!isGeneric && employeeId) {
      const empRes = await query('SELECT id FROM employees WHERE id = $1 AND tenant_id = $2', [employeeId, tenantId]);
      if (!empRes.rowCount) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
    }

    // Generate token
    const raw = isGeneric ? `GENERIC_${Date.now()}_${crypto.randomBytes(8).toString('hex')}` : `${employeeId}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    const linkToken = Buffer.from(raw).toString('base64url');

    // Expires in 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await query(
      `INSERT INTO onboarding_links (tenant_id, employee_id, token, link_type, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [tenantId, isGeneric ? null : employeeId, linkToken, isGeneric ? 'generic' : 'specific', expiresAt, userId]
    );

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${new URL(request.url).origin}`;
    const link = `${baseUrl}/onboard/${linkToken}`;

    return NextResponse.json({ success: true, link, token: linkToken, expiresAt });
  } catch (error: any) {
    console.error('Generate link error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET — List all onboarding links for this tenant (HR/Admin)
export async function GET(request: Request) {
  try {
    const tenantId = await getTenantId(request);

    const result = await query(
      `SELECT ol.*, e.first_name, e.last_name, e.employee_id as emp_code, u.name as created_by_name,
       (SELECT COUNT(*) FROM onboarding_submissions os WHERE os.link_id = ol.id) as submission_count
       FROM onboarding_links ol
       LEFT JOIN employees e ON ol.employee_id = e.id
       LEFT JOIN users u ON ol.created_by = u.id
       WHERE ol.tenant_id = $1
       ORDER BY ol.created_at DESC`,
      [tenantId]
    );

    return NextResponse.json({ success: true, links: result.rows });
  } catch (error: any) {
    console.error('Get links error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

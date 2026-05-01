import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;

    // Delete tenant (cascading deletes should handle users, etc. if FKs are set up correctly)
    const result = await query('DELETE FROM tenants WHERE id = $1 RETURNING name', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Tenant ${result.rows[0].name} deleted successfully`
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;
    
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const payload = await verifyToken(token);
        if (!payload || payload.role !== 'SUPER_ADMIN') {
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    
        const { id } = await params;
        const { name, org_type, domain, org_size } = await request.json();
    
        const result = await query(
          'UPDATE tenants SET name = COALESCE($1, name), org_type = COALESCE($2, org_type), domain = COALESCE($3, domain), org_size = COALESCE($4, org_size), updated_at = NOW() WHERE id = $5 RETURNING *',
          [name, org_type, domain, org_size, id]
        );
    
        if ((result.rowCount || 0) === 0) {
          return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
        }
    
        return NextResponse.json({
          success: true,
          tenant: result.rows[0]
        });
      } catch (error) {
        console.error('Update tenant error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
}

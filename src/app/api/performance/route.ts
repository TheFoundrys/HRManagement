import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const tenantId = payload.tenantId;

    // Fetch active cycles
    const cyclesRes = await query(
      'SELECT * FROM performance_cycles WHERE tenant_id = $1 AND status = $2 ORDER BY created_at DESC',
      [tenantId, 'active']
    );

    // Fetch recent reviews with employee details
    const reviewsRes = await query(`
      SELECT 
        pr.*, 
        e.first_name || ' ' || e.last_name as employee_name,
        e.university_id as employee_serial,
        pc.name as cycle_name
      FROM performance_reviews pr
      JOIN employees e ON pr.employee_id = e.id
      JOIN performance_cycles pc ON pr.cycle_id = pc.id
      WHERE pr.tenant_id = $1
      ORDER BY pr.created_at DESC
      LIMIT 50
    `, [tenantId]);

    // Fetch aggregate stats
    const statsRes = await query(`
      SELECT 
        AVG(score) as avg_rating,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_reviews,
        COUNT(*) as total_reviews
      FROM performance_reviews
      WHERE tenant_id = $1
    `, [tenantId]);

    // Fetch goals for the current employee
    const goalsRes = await query(
      'SELECT * FROM performance_goals WHERE employee_id = (SELECT id FROM employees WHERE user_id = $1) AND status != $2 ORDER BY created_at DESC',
      [payload.userId, 'completed']
    );

    return NextResponse.json({
      success: true,
      cycles: cyclesRes.rows,
      reviews: reviewsRes.rows,
      stats: statsRes.rows[0],
      goals: goalsRes.rows
    });

  } catch (error: any) {
    console.error('Performance API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

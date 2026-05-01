import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { verifyToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';

export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { goalId, progress, title, description } = await request.json();
    
    // Security: Only allow updating your own goals
    const goalRes = await query(
      'SELECT id FROM performance_goals WHERE id = $1 AND employee_id = (SELECT id FROM employees WHERE user_id = $2)',
      [goalId, payload.userId]
    );

    if (goalRes.rows.length === 0) {
      return NextResponse.json({ error: 'Goal not found or access denied' }, { status: 404 });
    }

    if (title || description) {
      await query(
        'UPDATE performance_goals SET title = COALESCE($1, title), description = COALESCE($2, description), updated_at = NOW() WHERE id = $3',
        [title, description, goalId]
      );
    }

    if (progress !== undefined) {
      await query(
        'UPDATE performance_goals SET progress = $1, status = CASE WHEN $1 = 100 THEN \'completed\' ELSE status END WHERE id = $2',
        [progress, goalId]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update Goal Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

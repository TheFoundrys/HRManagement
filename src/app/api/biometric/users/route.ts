import { NextResponse } from 'next/server';
import { ZKService } from '@/lib/biometric/zk-service';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { hasPermission } from '@/lib/auth/rbac';

const deviceIp = process.env.ZKTECO_DEVICE_IP;

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyToken(token);
    if (!payload || !hasPermission(payload.role, 'MANAGE_BIOMETRICS')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const requestedIp = searchParams.get('ip');
    const deviceIp = requestedIp;

    if (!deviceIp) return NextResponse.json({ success: false, error: 'No device IP provided or configured' }, { status: 400 });
    
    const zk = new ZKService(deviceIp);
    const result = await zk.getUsers();
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Biometric Users Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal Server Error' 
    }, { status: 500 });
  }
}

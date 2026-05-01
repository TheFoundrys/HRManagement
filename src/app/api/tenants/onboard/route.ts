import { NextResponse } from 'next/server';
import { handleTenantOnboard } from '../../../../../controllers/tenantOnboarding';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Simulate req/res objects for the controller
    const req = { body };
    const result = await handleTenantOnboard(req);

    return NextResponse.json(result.data, { status: result.status });

  } catch (error: any) {
    console.error('API Onboarding Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to onboard tenant',
      details: error.detail || null
    }, { status: 500 });
  }
}

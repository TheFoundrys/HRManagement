import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';

// GET — Public: validate an onboarding token
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;

    const result = await query(
      `SELECT ol.*, e.first_name, e.last_name, e.email, t.name as tenant_name
       FROM onboarding_links ol
       LEFT JOIN employees e ON ol.employee_id = e.id
       LEFT JOIN tenants t ON ol.tenant_id = t.id
       WHERE ol.token = $1`,
      [token]
    );

    if (!result.rowCount) {
      return NextResponse.json({ status: 'invalid', message: 'Link not found' });
    }

    const link = result.rows[0];

    if (link.status === 'revoked') {
      return NextResponse.json({ status: 'revoked', message: 'This link has been revoked' });
    }

    if (link.status === 'submitted') {
      return NextResponse.json({ status: 'already_submitted', message: 'Onboarding already completed' });
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json({ status: 'expired', message: 'This link has expired' });
    }

    const response: any = { 
      status: 'valid', 
      linkType: link.link_type,
      tenantName: link.tenant_name
    };

    if (link.link_type === 'specific' && link.first_name) {
      response.employee = {
        firstName: link.first_name,
        lastName: link.last_name,
        email: link.email
      };
    }

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Validate error:', error);
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}

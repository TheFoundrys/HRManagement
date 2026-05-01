import { NextResponse } from 'next/server';
import { query } from '@/lib/db/postgres';
import { getTenantId } from '@/lib/utils/tenant';

// GET — List all submissions for this tenant
export async function GET(request: Request) {
  try {
    const tenantId = await getTenantId(request);

    const result = await query(
      `SELECT os.*, ol.link_type, ol.token,
       (SELECT json_agg(json_build_object('id', od.id, 'doc_type', od.doc_type, 'file_name', od.file_name, 'file_size', od.file_size))
        FROM onboarding_documents od WHERE od.submission_id = os.id) as documents
       FROM onboarding_submissions os
       JOIN onboarding_links ol ON os.link_id = ol.id
       WHERE os.tenant_id = $1
       ORDER BY os.submitted_at DESC`,
      [tenantId]
    );

    return NextResponse.json({ success: true, submissions: result.rows });
  } catch (error: any) {
    console.error('Get submissions error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — Update submission status (approve/reject)
export async function PATCH(request: Request) {
  try {
    const tenantId = await getTenantId(request);
    const { submissionId, status } = await request.json();

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await query(
      'UPDATE onboarding_submissions SET status = $1, reviewed_at = NOW() WHERE id = $2 AND tenant_id = $3',
      [status, submissionId, tenantId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Update submission error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

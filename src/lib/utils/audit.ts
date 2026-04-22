import { query } from '@/lib/db/postgres';

export async function logAudit({
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
  ipAddress
}: {
  tenantId: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
}) {
  try {
    // Ensure table exists (Lazy initialization for demo purposes, usually handled in migrations)
    await query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        user_id TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id TEXT,
        old_value JSONB,
        new_value JSONB,
        ip_address TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, entity_type, entity_id, old_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tenantId, userId, action, entityType, entityId, oldValue, newValue, ipAddress]
    );
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
}

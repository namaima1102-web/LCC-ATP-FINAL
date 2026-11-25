import { createAdminClient } from "./supabase/server";

export interface AuditLogInput {
  actor?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
}

/**
 * Ghi nhật ký mọi thay đổi dữ liệu quan trọng vào bảng `audit_log`.
 */
export async function writeAuditLog(entry: AuditLogInput): Promise<void> {
  const adminClient = createAdminClient();
  const { error } = await adminClient.from("audit_log").insert({
    actor: entry.actor ?? null,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    reason: entry.reason ?? null,
  });

  if (error) {
    throw new Error(`Không thể ghi nhật ký audit_log: ${error.message}`);
  }
}

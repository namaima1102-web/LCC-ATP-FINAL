import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const db = createAdminClient();
  const { data } = await db
    .from("audit_log")
    .select("id, actor, action, entity, entity_id, reason, at")
    .order("at", { ascending: false })
    .limit(100);

  const entries = (data ?? []).map((r) => ({
    id: r.id,
    actor: r.actor,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    reason: r.reason,
    at: r.at,
  }));

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">
          A9 · Nhật ký thao tác hệ thống
        </h1>
        <AuditLogViewer entries={entries} />
      </main>
    </div>
  );
}

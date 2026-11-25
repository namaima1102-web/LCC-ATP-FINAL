import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { HandicapManager } from "@/components/admin/HandicapManager";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminHandicapPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const ctx = await loadCurrentSeasonContext();

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">A6 · Quản lý Bảng chấp</h1>
        {ctx ? (
          <HandicapManager rules={ctx.handicapRules} />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">Chưa có mùa giải.</p>
        )}
      </main>
    </div>
  );
}

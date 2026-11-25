import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { TeamsManager } from "@/components/admin/TeamsManager";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";

export default async function AdminTeamsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const ctx = await loadCurrentSeasonContext();

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-xl font-extrabold">A3 · Đội & Tuyển thủ</h1>
        {ctx ? (
          <TeamsManager teams={ctx.teams} players={ctx.players} />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Chưa có dữ liệu mùa giải. Hãy chạy <code>npm run seed</code>.
          </p>
        )}
      </main>
    </div>
  );
}

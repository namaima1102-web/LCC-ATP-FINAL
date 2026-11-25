import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ScheduleManager } from "@/components/admin/ScheduleManager";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminSchedulePage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
        <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
        <main className="mx-auto max-w-4xl px-4 py-6">
          <p className="text-sm text-[var(--text-muted)]">
            Chưa có dữ liệu mùa giải. Hãy chạy <code>npm run seed</code>.
          </p>
        </main>
      </div>
    );
  }

  const db = createAdminClient();
  const { data: matchRows } = await db
    .from("matches")
    .select("id, period_id")
    .eq("season_id", ctx.season.id);

  const countByPeriod = new Map<string, number>();
  for (const m of matchRows ?? []) {
    countByPeriod.set(m.period_id, (countByPeriod.get(m.period_id) ?? 0) + 1);
  }

  const periodsWithCount = ctx.periods.map((p) => ({
    ...p,
    matchCount: countByPeriod.get(p.id) ?? 0,
  }));

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-xl font-extrabold">A4 · Bộ sinh lịch & Đăng kỳ</h1>
        <ScheduleManager
          periods={periodsWithCount}
          existingMatchCount={matchRows?.length ?? 0}
          defaultPeriodsCount={ctx.season.settings.periods_count}
        />
      </main>
    </div>
  );
}

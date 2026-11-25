import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { MatchesManager } from "@/components/admin/MatchesManager";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminMatchesPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
        <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--text-muted)]">
            Chưa có dữ liệu mùa giải.
          </p>
        </main>
      </div>
    );
  }

  const db = createAdminClient();
  const { data: rows } = await db
    .from("matches")
    .select("id, kind, status, period_id, handicap_code, handicap_giver, match_sides(side, player_id)")
    .eq("season_id", ctx.season.id)
    .order("created_at", { ascending: true });

  const playerMap = new Map(ctx.players.map((p) => [p.id, p]));
  const periodMap = new Map(ctx.periods.map((p) => [p.id, p]));

  const matches = (rows ?? []).map((r) => {
    const sides = (r.match_sides ?? []) as Array<{ side: string; player_id: string }>;
    const sideANames = sides
      .filter((s) => s.side === "a")
      .map((s) => playerMap.get(s.player_id)?.fullName ?? "?")
      .join(" + ");
    const sideBNames = sides
      .filter((s) => s.side === "b")
      .map((s) => playerMap.get(s.player_id)?.fullName ?? "?")
      .join(" + ");
    const period = periodMap.get(r.period_id);

    return {
      id: r.id,
      kind: r.kind as "singles" | "doubles",
      status: r.status,
      periodId: r.period_id,
      periodNo: period?.periodNo ?? 1,
      periodStatus: period?.status ?? "draft",
      handicapCode: r.handicap_code,
      handicapGiver: r.handicap_giver as "a" | "b" | null,
      sideANames,
      sideBNames,
    };
  });

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 text-xl font-extrabold">A5 · Quản lý trận</h1>
        <MatchesManager matches={matches} periods={ctx.periods} />
      </main>
    </div>
  );
}

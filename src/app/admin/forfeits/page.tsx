import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { ForfeitsManager } from "@/components/admin/ForfeitsManager";
import { filterForfeitCandidates } from "@/lib/domain/submissions";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminForfeitsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
        <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--text-muted)]">Chưa có mùa giải.</p>
        </main>
      </div>
    );
  }

  const db = createAdminClient();
  const [matchesRes, pendingRes] = await Promise.all([
    db
      .from("matches")
      .select("id, kind, status, period_id, match_sides(side, player_id)")
      .eq("season_id", ctx.season.id),
    db
      .from("score_submissions")
      .select("match_id")
      .eq("status", "pending"),
  ]);

  const playerMap = new Map(ctx.players.map((p) => [p.id, p]));
  const pendingMatchIds = new Set((pendingRes.data ?? []).map((p) => p.match_id));

  const allMatches = (matchesRes.data ?? []).map((m) => {
    const sides = (m.match_sides ?? []) as Array<{
      side: string;
      player_id: string;
    }>;
    return {
      id: m.id,
      kind: m.kind as "singles" | "doubles",
      status: m.status,
      periodId: m.period_id,
      sideANames: sides
        .filter((s) => s.side === "a")
        .map((s) => playerMap.get(s.player_id)?.fullName ?? "?")
        .join(" + "),
      sideBNames: sides
        .filter((s) => s.side === "b")
        .map((s) => playerMap.get(s.player_id)?.fullName ?? "?")
        .join(" + "),
    };
  });

  const periodSummaries = ctx.periods.map((p) => {
    const pMatches = allMatches.filter((m) => m.periodId === p.id);
    const candidates = filterForfeitCandidates(pMatches, pendingMatchIds);
    const pendingCount = pMatches.filter(
      (m) => m.status === "scheduled" && pendingMatchIds.has(m.id)
    ).length;

    return {
      id: p.id,
      periodNo: p.periodNo,
      name: p.name,
      status: p.status,
      pendingCount,
      candidates,
    };
  });

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">
          Đóng kỳ & Xử thua trận chưa đấu (AC15)
        </h1>
        <ForfeitsManager periods={periodSummaries} />
      </main>
    </div>
  );
}

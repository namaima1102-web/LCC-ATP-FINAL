import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { RatingsManager } from "@/components/admin/RatingsManager";
import { suggestRatingAdjustments } from "@/lib/domain/rating";
import { computePlayerStats, type MatchResultRecord } from "@/lib/domain/standings";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminRatingsPage() {
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
  const [matchesRes, resultsRes] = await Promise.all([
    db
      .from("matches")
      .select("id, kind, match_sides(side, player_id)")
      .eq("season_id", ctx.season.id),
    db
      .from("results")
      .select("match_id, sets_a, sets_b, winner_side, is_forfeit, forfeit_kind"),
  ]);

  const playerTeamMap = new Map(ctx.players.map((p) => [p.id, p.teamId]));
  const matches = (matchesRes.data ?? []).map((m) => {
    const sides = (m.match_sides ?? []) as Array<{ side: string; player_id: string }>;
    const sideAPlayerIds = sides.filter((s) => s.side === "a").map((s) => s.player_id);
    const sideBPlayerIds = sides.filter((s) => s.side === "b").map((s) => s.player_id);
    return {
      id: m.id,
      kind: m.kind as "singles" | "doubles",
      sideAPlayerIds,
      sideBPlayerIds,
      teamAId: playerTeamMap.get(sideAPlayerIds[0] ?? "") ?? "",
      teamBId: playerTeamMap.get(sideBPlayerIds[0] ?? "") ?? "",
    };
  });

  const results: MatchResultRecord[] = (resultsRes.data ?? []).map((r) => ({
    matchId: r.match_id,
    setsA: r.sets_a,
    setsB: r.sets_b,
    winnerSide: (r.winner_side as "a" | "b" | null) ?? null,
    isForfeit: Boolean(r.is_forfeit),
    forfeitKind: (r.forfeit_kind as "winner_a" | "winner_b" | "both" | null) ?? null,
  }));

  const stats = computePlayerStats(
    ctx.players,
    matches,
    results,
    ctx.season.settings
  );

  const suggestions = suggestRatingAdjustments(
    stats.map((s) => ({
      playerId: s.playerId,
      fullName: s.fullName,
      ratingStart: s.ratingStart,
      singlesWins: s.singlesWins,
      singlesLosses: s.singlesLosses,
      doublesWins: s.doublesWins,
      doublesLosses: s.doublesLosses,
    })),
    ctx.season.settings
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">
          A7 · Điều chỉnh điểm cuối mùa
        </h1>
        <RatingsManager suggestions={suggestions} />
      </main>
    </div>
  );
}

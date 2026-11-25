import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { buildSeasonWorkbook } from "@/lib/domain/export-workbook";
import {
  computePlayerStats,
  computeTeamStandings,
  type MatchResultRecord,
} from "@/lib/domain/standings";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return NextResponse.json({ error: "Chưa có mùa giải." }, { status: 404 });
  }

  const db = createAdminClient();
  const [matchesRes, resultsRes] = await Promise.all([
    db
      .from("matches")
      .select("id, kind, period_id, status, handicap_code, match_sides(side, player_id)")
      .eq("season_id", ctx.season.id)
      .order("created_at", { ascending: true }),
    db
      .from("results")
      .select("match_id, sets_a, sets_b, played_on, winner_side, is_forfeit, forfeit_kind"),
  ]);

  const teamMap = new Map(ctx.teams.map((t) => [t.id, t]));
  const playerMap = new Map(ctx.players.map((p) => [p.id, p]));
  const periodMap = new Map(ctx.periods.map((p) => [p.id, p]));

  const standingMatches = (matchesRes.data ?? []).map((m) => {
    const sides = (m.match_sides ?? []) as Array<{ side: string; player_id: string }>;
    const sideAPlayerIds = sides.filter((s) => s.side === "a").map((s) => s.player_id);
    const sideBPlayerIds = sides.filter((s) => s.side === "b").map((s) => s.player_id);
    return {
      id: m.id,
      kind: m.kind as "singles" | "doubles",
      periodNo: periodMap.get(m.period_id)?.periodNo ?? 1,
      handicapCode: m.handicap_code ?? "0-0-0",
      status: m.status,
      sideAPlayerIds,
      sideBPlayerIds,
      teamAId: playerMap.get(sideAPlayerIds[0] ?? "")?.teamId ?? "",
      teamBId: playerMap.get(sideBPlayerIds[0] ?? "")?.teamId ?? "",
    };
  });

  const results: Array<MatchResultRecord & { playedOn: string | null }> = (
    resultsRes.data ?? []
  ).map((r) => ({
    matchId: r.match_id,
    setsA: r.sets_a,
    setsB: r.sets_b,
    winnerSide: (r.winner_side as "a" | "b" | null) ?? null,
    isForfeit: Boolean(r.is_forfeit),
    forfeitKind:
      (r.forfeit_kind as "winner_a" | "winner_b" | "both" | null) ?? null,
    playedOn: r.played_on,
  }));

  const teamStandings = computeTeamStandings(
    ctx.teams,
    standingMatches,
    results,
    ctx.season.settings
  );
  const playerStats = computePlayerStats(
    ctx.players,
    standingMatches,
    results,
    ctx.season.settings
  );

  const matchMap = new Map(standingMatches.map((m) => [m.id, m]));
  const joinNames = (ids: string[]) =>
    ids.map((id) => playerMap.get(id)?.fullName ?? "?").join(" + ");

  const wb = buildSeasonWorkbook({
    players: ctx.players.map((p) => ({
      fullName: p.fullName,
      nickname: p.nickname,
      teamName: teamMap.get(p.teamId)?.name ?? "",
      ratingStart: p.ratingStart,
      isProvisional: p.isProvisional,
    })),
    matches: standingMatches.map((m) => ({
      periodNo: m.periodNo,
      kind: m.kind,
      sideANames: joinNames(m.sideAPlayerIds),
      sideBNames: joinNames(m.sideBPlayerIds),
      handicapCode: m.handicapCode,
      status: m.status,
    })),
    results: results
      .filter((r) => matchMap.has(r.matchId))
      .map((r) => {
        const m = matchMap.get(r.matchId)!;
        return {
          periodNo: m.periodNo,
          kind: m.kind,
          sideANames: joinNames(m.sideAPlayerIds),
          sideBNames: joinNames(m.sideBPlayerIds),
          setsA: r.setsA,
          setsB: r.setsB,
          playedOn: r.playedOn,
          isForfeit: r.isForfeit,
        };
      }),
    teamStandings,
    playerStats,
  });

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="legend-chicks-cup-${ctx.season.code}.xlsx"`,
    },
  });
}

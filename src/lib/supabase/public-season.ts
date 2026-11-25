import type { HandicapRule, MatchKind, Side } from "@/lib/domain/handicap";
import { DEFAULT_SEASON_SETTINGS, type SeasonSettings } from "@/lib/domain/season-config";
import type { MatchResultRecord } from "@/lib/domain/standings";
import { createClient } from "./server";

export interface PublicSeasonData {
  season: {
    id: string;
    code: string;
    name: string;
    status: string;
    settings: SeasonSettings;
  };
  teams: Array<{
    id: string;
    name: string;
    color: string | null;
    sortOrder: number;
  }>;
  players: Array<{
    id: string;
    fullName: string;
    nickname: string | null;
    teamId: string;
    ratingStart: number;
    isProvisional: boolean;
  }>;
  handicapRules: HandicapRule[];
  periods: Array<{
    id: string;
    periodNo: number;
    name: string | null;
    startsOn: string;
    endsOn: string;
    status: "draft" | "published" | "closed";
  }>;
  matches: Array<{
    id: string;
    kind: MatchKind;
    setsToWin: number;
    periodId: string;
    status: "scheduled" | "played" | "forfeit" | "cancelled";
    handicapDiff: number;
    handicapCode: string;
    handicapGiver: Side | null;
    sideAPlayerIds: string[];
    sideBPlayerIds: string[];
    teamAId: string;
    teamBId: string;
  }>;
  results: Array<
    MatchResultRecord & {
      playedOn: string | null;
      approvedAt: string;
    }
  >;
  pendingFlags: Record<string, { hasPending: boolean; hasConflict: boolean }>;
}

/**
 * Tải dữ liệu công khai qua anon client (tuân thủ RLS: không đọc score_submissions,
 * không lộ trận của kỳ ở trạng thái draft).
 */
export async function loadPublicSeasonData(): Promise<PublicSeasonData | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createClient();

  const { data: seasonRow } = await supabase
    .from("seasons")
    .select("id, code, name, status, settings")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!seasonRow) return null;

  const settings: SeasonSettings = {
    ...DEFAULT_SEASON_SETTINGS,
    ...((seasonRow.settings as Partial<SeasonSettings>) ?? {}),
  };

  const [teamsRes, spRes, hcRes, periodsRes, matchesRes, resultsRes, flagsRes] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, color, sort_order")
        .eq("season_id", seasonRow.id)
        .order("sort_order", { ascending: true }),
      supabase
        .from("season_players")
        .select(
          "player_id, team_id, rating_start, is_provisional, players(id, full_name, nickname)"
        )
        .eq("season_id", seasonRow.id),
      supabase
        .from("handicap_rules")
        .select("diff, singles_code, doubles_code")
        .eq("season_id", seasonRow.id)
        .order("diff", { ascending: true }),
      supabase
        .from("periods")
        .select("id, period_no, name, starts_on, ends_on, status")
        .eq("season_id", seasonRow.id)
        .order("period_no", { ascending: true }),
      supabase
        .from("matches")
        .select(
          "id, kind, sets_to_win, period_id, status, handicap_diff, handicap_code, handicap_giver, match_sides(side, player_id)"
        )
        .eq("season_id", seasonRow.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("results")
        .select(
          "match_id, sets_a, sets_b, played_on, winner_side, is_forfeit, forfeit_kind, approved_at"
        ),
      supabase
        .from("v_pending_flags")
        .select("match_id, has_pending, has_conflict"),
    ]);

  const teams = (teamsRes.data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    sortOrder: t.sort_order,
  }));

  const players = (spRes.data ?? []).map((sp) => {
    const p = sp.players as unknown as {
      id: string;
      full_name: string;
      nickname: string | null;
    };
    return {
      id: p.id,
      fullName: p.full_name,
      nickname: p.nickname,
      teamId: sp.team_id,
      ratingStart: Number(sp.rating_start),
      isProvisional: Boolean(sp.is_provisional),
    };
  });

  const playerTeamMap = new Map(players.map((p) => [p.id, p.teamId]));

  const handicapRules: HandicapRule[] = (hcRes.data ?? []).map((r) => ({
    diff: Number(r.diff),
    singlesCode: r.singles_code,
    doublesCode: r.doubles_code,
  }));

  const periods = (periodsRes.data ?? []).map((p) => ({
    id: p.id,
    periodNo: p.period_no,
    name: p.name,
    startsOn: p.starts_on,
    endsOn: p.ends_on,
    status: p.status as "draft" | "published" | "closed",
  }));

  const matches = (matchesRes.data ?? []).map((m) => {
    const sides = (m.match_sides ?? []) as Array<{
      side: string;
      player_id: string;
    }>;
    const sideAPlayerIds = sides
      .filter((s) => s.side === "a")
      .map((s) => s.player_id);
    const sideBPlayerIds = sides
      .filter((s) => s.side === "b")
      .map((s) => s.player_id);

    return {
      id: m.id,
      kind: m.kind as MatchKind,
      setsToWin: m.sets_to_win,
      periodId: m.period_id,
      status: m.status as "scheduled" | "played" | "forfeit" | "cancelled",
      handicapDiff: Number(m.handicap_diff ?? 0),
      handicapCode: m.handicap_code ?? "0-0-0",
      handicapGiver: (m.handicap_giver as Side | null) ?? null,
      sideAPlayerIds,
      sideBPlayerIds,
      teamAId: playerTeamMap.get(sideAPlayerIds[0] ?? "") ?? "",
      teamBId: playerTeamMap.get(sideBPlayerIds[0] ?? "") ?? "",
    };
  });

  const matchIdSet = new Set(matches.map((m) => m.id));
  const results = (resultsRes.data ?? [])
    .filter((r) => matchIdSet.has(r.match_id))
    .map((r) => ({
      matchId: r.match_id,
      setsA: r.sets_a,
      setsB: r.sets_b,
      winnerSide: (r.winner_side as Side | null) ?? null,
      isForfeit: Boolean(r.is_forfeit),
      forfeitKind:
        (r.forfeit_kind as "winner_a" | "winner_b" | "both" | null) ?? null,
      playedOn: r.played_on,
      approvedAt: r.approved_at,
    }));

  const pendingFlags: Record<
    string,
    { hasPending: boolean; hasConflict: boolean }
  > = {};
  for (const f of flagsRes.data ?? []) {
    if (f.match_id && matchIdSet.has(f.match_id)) {
      pendingFlags[f.match_id] = {
        hasPending: Boolean(f.has_pending),
        hasConflict: Boolean(f.has_conflict),
      };
    }
  }

  return {
    season: {
      id: seasonRow.id,
      code: seasonRow.code,
      name: seasonRow.name,
      status: seasonRow.status,
      settings,
    },
    teams,
    players,
    handicapRules,
    periods,
    matches,
    results,
    pendingFlags,
  };
}

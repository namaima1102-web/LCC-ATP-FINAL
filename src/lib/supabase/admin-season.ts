import { DEFAULT_SEASON_SETTINGS, type SeasonSettings } from "@/lib/domain/season-config";
import type { HandicapRule } from "@/lib/domain/handicap";
import { createAdminClient } from "./server";

export interface LoadedSeasonContext {
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
    active: boolean;
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
    publishedAt: string | null;
  }>;
}

export async function loadCurrentSeasonContext(): Promise<LoadedSeasonContext | null> {
  const db = createAdminClient();

  const { data: seasonRow, error: seasonErr } = await db
    .from("seasons")
    .select("id, code, name, status, settings")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (seasonErr || !seasonRow) {
    return null;
  }

  const settings: SeasonSettings = {
    ...DEFAULT_SEASON_SETTINGS,
    ...((seasonRow.settings as Partial<SeasonSettings>) ?? {}),
  };

  const [teamsRes, spRes, hcRes, periodsRes] = await Promise.all([
    db
      .from("teams")
      .select("id, name, color, sort_order")
      .eq("season_id", seasonRow.id)
      .order("sort_order", { ascending: true }),
    db
      .from("season_players")
      .select("player_id, team_id, rating_start, is_provisional, players(id, full_name, nickname, active)")
      .eq("season_id", seasonRow.id),
    db
      .from("handicap_rules")
      .select("diff, singles_code, doubles_code")
      .eq("season_id", seasonRow.id)
      .order("diff", { ascending: true }),
    db
      .from("periods")
      .select("id, period_no, name, starts_on, ends_on, status, published_at")
      .eq("season_id", seasonRow.id)
      .order("period_no", { ascending: true }),
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
      active: boolean;
    };
    return {
      id: p.id,
      fullName: p.full_name,
      nickname: p.nickname,
      active: p.active,
      teamId: sp.team_id,
      ratingStart: Number(sp.rating_start),
      isProvisional: Boolean(sp.is_provisional),
    };
  });

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
    publishedAt: p.published_at,
  }));

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
  };
}

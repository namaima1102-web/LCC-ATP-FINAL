import type { MatchKind, Side } from "./handicap";
import type { SeasonSettings } from "./season-config";

export interface StandingTeam {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
}

export interface StandingPlayer {
  id: string;
  fullName: string;
  nickname: string | null;
  teamId: string;
  ratingStart: number;
}

export interface StandingMatch {
  id: string;
  kind: MatchKind;
  sideAPlayerIds: string[];
  sideBPlayerIds: string[];
  teamAId: string;
  teamBId: string;
}

export interface MatchResultRecord {
  matchId: string;
  setsA: number;
  setsB: number;
  winnerSide: Side | null; // null khi xử thua cả hai bên ('both')
  isForfeit: boolean;
  forfeitKind?: "winner_a" | "winner_b" | "both" | null;
}

export interface TeamStanding {
  teamId: string;
  teamName: string;
  color: string | null;
  points: number;
  played: number;
  wins: number;
  losses: number;
  setsWon: number;
  setsLost: number;
  setDiff: number;
  singlesWins: number;
}

export interface PlayerStats {
  playerId: string;
  fullName: string;
  nickname: string | null;
  teamId: string;
  ratingStart: number;
  singlesWins: number;
  singlesLosses: number;
  doublesWins: number;
  doublesLosses: number;
  totalWins: number;
  totalLosses: number;
  totalMatches: number;
  winPct: number; // làm tròn số nguyên
}

export interface PairStats {
  player1Id: string;
  player2Id: string;
  teamId: string;
  wins: number;
  losses: number;
  played: number;
  winPct: number;
}

/**
 * Tính bảng xếp hạng đội từ kết quả chính thức (`results`) theo cấu hình mùa.
 */
export function computeTeamStandings(
  teams: StandingTeam[],
  matches: StandingMatch[],
  results: MatchResultRecord[],
  settings: Pick<SeasonSettings, "doubles_counts_for_team" | "tiebreak_order">
): TeamStanding[] {
  const resultMap = new Map(results.map((r) => [r.matchId, r]));
  const stats = new Map<string, TeamStanding>();

  for (const t of teams) {
    stats.set(t.id, {
      teamId: t.id,
      teamName: t.name,
      color: t.color,
      points: 0,
      played: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      setDiff: 0,
      singlesWins: 0,
    });
  }

  // Lưu đối đầu giữa 2 đội: key = "team1Id:team2Id" -> số trận team1 thắng team2
  const h2hWins = new Map<string, number>();

  for (const m of matches) {
    const r = resultMap.get(m.id);
    if (!r) continue;

    const sA = stats.get(m.teamAId);
    const sB = stats.get(m.teamBId);
    if (!sA || !sB) continue;

    sA.played++;
    sB.played++;
    sA.setsWon += r.setsA;
    sA.setsLost += r.setsB;
    sB.setsWon += r.setsB;
    sB.setsLost += r.setsA;

    const countsForTeam =
      m.kind === "singles" || settings.doubles_counts_for_team;

    if (r.winnerSide === "a") {
      sA.wins++;
      sB.losses++;
      if (countsForTeam) sA.points += 1;
      if (m.kind === "singles") sA.singlesWins++;
      const k = `${m.teamAId}:${m.teamBId}`;
      h2hWins.set(k, (h2hWins.get(k) ?? 0) + 1);
    } else if (r.winnerSide === "b") {
      sB.wins++;
      sA.losses++;
      if (countsForTeam) sB.points += 1;
      if (m.kind === "singles") sB.singlesWins++;
      const k = `${m.teamBId}:${m.teamAId}`;
      h2hWins.set(k, (h2hWins.get(k) ?? 0) + 1);
    } else {
      // Xử thua cả hai bên ('both'): cả hai đều tính thua, không ai được điểm đội
      sA.losses++;
      sB.losses++;
    }
  }

  const list = Array.from(stats.values()).map((s) => ({
    ...s,
    setDiff: s.setsWon - s.setsLost,
  }));

  const sortOrderMap = new Map(teams.map((t) => [t.id, t.sortOrder]));

  list.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    for (const criterion of settings.tiebreak_order) {
      if (criterion === "head_to_head") {
        const aOverB = h2hWins.get(`${a.teamId}:${b.teamId}`) ?? 0;
        const bOverA = h2hWins.get(`${b.teamId}:${a.teamId}`) ?? 0;
        if (bOverA !== aOverB) return bOverA - aOverB;
      } else if (criterion === "set_diff") {
        if (b.setDiff !== a.setDiff) return b.setDiff - a.setDiff;
      } else if (criterion === "singles_wins") {
        if (b.singlesWins !== a.singlesWins) return b.singlesWins - a.singlesWins;
      }
    }

    return (sortOrderMap.get(a.teamId) ?? 0) - (sortOrderMap.get(b.teamId) ?? 0);
  });

  return list;
}

/**
 * Tính thống kê cá nhân (đơn, đôi, tổng, tỷ lệ thắng làm tròn số nguyên).
 */
export function computePlayerStats(
  players: StandingPlayer[],
  matches: StandingMatch[],
  results: MatchResultRecord[],
  settings: Pick<SeasonSettings, "forfeit_counts_in_stats">
): PlayerStats[] {
  const resultMap = new Map(results.map((r) => [r.matchId, r]));
  const stats = new Map<string, PlayerStats>();

  for (const p of players) {
    stats.set(p.id, {
      playerId: p.id,
      fullName: p.fullName,
      nickname: p.nickname,
      teamId: p.teamId,
      ratingStart: p.ratingStart,
      singlesWins: 0,
      singlesLosses: 0,
      doublesWins: 0,
      doublesLosses: 0,
      totalWins: 0,
      totalLosses: 0,
      totalMatches: 0,
      winPct: 0,
    });
  }

  for (const m of matches) {
    const r = resultMap.get(m.id);
    if (!r) continue;
    if (r.isForfeit && !settings.forfeit_counts_in_stats) continue;

    for (const pid of m.sideAPlayerIds) {
      const s = stats.get(pid);
      if (!s) continue;
      const won = r.winnerSide === "a";
      if (m.kind === "singles") {
        if (won) s.singlesWins++;
        else s.singlesLosses++;
      } else {
        if (won) s.doublesWins++;
        else s.doublesLosses++;
      }
    }

    for (const pid of m.sideBPlayerIds) {
      const s = stats.get(pid);
      if (!s) continue;
      const won = r.winnerSide === "b";
      if (m.kind === "singles") {
        if (won) s.singlesWins++;
        else s.singlesLosses++;
      } else {
        if (won) s.doublesWins++;
        else s.doublesLosses++;
      }
    }
  }

  return Array.from(stats.values()).map((s) => {
    const totalWins = s.singlesWins + s.doublesWins;
    const totalLosses = s.singlesLosses + s.doublesLosses;
    const totalMatches = totalWins + totalLosses;
    const winPct =
      totalMatches > 0 ? Math.round((totalWins / totalMatches) * 100) : 0;

    return {
      ...s,
      totalWins,
      totalLosses,
      totalMatches,
      winPct,
    };
  });
}

/**
 * Tính thống kê cặp đôi từ các trận đôi có kết quả chính thức.
 */
export function computePairStats(
  players: StandingPlayer[],
  matches: StandingMatch[],
  results: MatchResultRecord[]
): PairStats[] {
  const playerTeam = new Map(players.map((p) => [p.id, p.teamId]));
  const resultMap = new Map(results.map((r) => [r.matchId, r]));
  const pairMap = new Map<string, PairStats>();

  const recordSide = (ids: string[], won: boolean) => {
    if (ids.length !== 2) return;
    const [p1, p2] = [...ids].sort();
    const key = `${p1}:${p2}`;
    let entry = pairMap.get(key);
    if (!entry) {
      entry = {
        player1Id: p1,
        player2Id: p2,
        teamId: playerTeam.get(p1) ?? "",
        wins: 0,
        losses: 0,
        played: 0,
        winPct: 0,
      };
      pairMap.set(key, entry);
    }
    entry.played++;
    if (won) entry.wins++;
    else entry.losses++;
  };

  for (const m of matches) {
    if (m.kind !== "doubles") continue;
    const r = resultMap.get(m.id);
    if (!r) continue;
    recordSide(m.sideAPlayerIds, r.winnerSide === "a");
    recordSide(m.sideBPlayerIds, r.winnerSide === "b");
  }

  return Array.from(pairMap.values())
    .map((p) => ({
      ...p,
      winPct: p.played > 0 ? Math.round((p.wins / p.played) * 100) : 0,
    }))
    .sort((a, b) => b.wins - a.wins || b.winPct - a.winPct);
}

import { describe, expect, it } from "vitest";
import { DEFAULT_SEASON_SETTINGS } from "../../src/lib/domain/season-config";
import {
  computePairStats,
  computePlayerStats,
  computeTeamStandings,
  type MatchResultRecord,
  type StandingMatch,
  type StandingPlayer,
  type StandingTeam,
} from "../../src/lib/domain/standings";

const teams: StandingTeam[] = [
  { id: "t1", name: "Đội 1", color: "#2B6FD6", sortOrder: 1 },
  { id: "t2", name: "Đội 2", color: "#D99A12", sortOrder: 2 },
];

const players: StandingPlayer[] = [
  { id: "p1", fullName: "Nam Gai", nickname: null, teamId: "t1", ratingStart: 12 },
  { id: "p2", fullName: "Hùng", nickname: null, teamId: "t1", ratingStart: 8 },
  { id: "p3", fullName: "Kiên", nickname: null, teamId: "t2", ratingStart: 10 },
  { id: "p4", fullName: "Dương", nickname: null, teamId: "t2", ratingStart: 9 },
];

const matches: StandingMatch[] = [
  {
    id: "m1",
    kind: "singles",
    sideAPlayerIds: ["p1"],
    sideBPlayerIds: ["p3"],
    teamAId: "t1",
    teamBId: "t2",
  },
  {
    id: "m2",
    kind: "doubles",
    sideAPlayerIds: ["p1", "p2"],
    sideBPlayerIds: ["p3", "p4"],
    teamAId: "t1",
    teamBId: "t2",
  },
  {
    id: "m3",
    kind: "singles",
    sideAPlayerIds: ["p2"],
    sideBPlayerIds: ["p4"],
    teamAId: "t1",
    teamBId: "t2",
  },
];

describe("Xếp hạng đội, thống kê cá nhân & cặp đôi", () => {
  it("tính điểm đội và xử thua cả hai bên (both) không cộng điểm cho bên nào (AC15)", () => {
    const results: MatchResultRecord[] = [
      { matchId: "m1", setsA: 3, setsB: 1, winnerSide: "a", isForfeit: false },
      { matchId: "m2", setsA: 2, setsB: 3, winnerSide: "b", isForfeit: false },
      {
        matchId: "m3",
        setsA: 0,
        setsB: 0,
        winnerSide: null,
        isForfeit: true,
        forfeitKind: "both",
      },
    ];

    const standings = computeTeamStandings(
      teams,
      matches,
      results,
      DEFAULT_SEASON_SETTINGS
    );

    // Đội 1 và Đội 2 đều 1 điểm; Đội 1 xếp trên nhờ hiệu số set (+1 so với -1)
    expect(standings[0].teamId).toBe("t1");
    expect(standings[0].points).toBe(1);
    expect(standings[0].setDiff).toBe(1);
    expect(standings[1].teamId).toBe("t2");
    expect(standings[1].points).toBe(1);
    expect(standings[1].setDiff).toBe(-1);

    // Thống kê cá nhân: m3 xử thua cả 2 bên nên p2 và p4 đều tính 1 thua
    const pStats = computePlayerStats(
      players,
      matches,
      results,
      DEFAULT_SEASON_SETTINGS
    );
    const p2 = pStats.find((p) => p.playerId === "p2")!;
    expect(p2.totalWins).toBe(0);
    expect(p2.totalLosses).toBe(2);

    // Thống kê cặp đôi
    const pairStats = computePairStats(players, matches, results);
    expect(pairStats).toHaveLength(2);
    expect(pairStats[0].wins).toBe(1);
  });
});

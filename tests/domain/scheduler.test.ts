import { describe, expect, it } from "vitest";
import seed from "../../seed/season5.json";
import type { HandicapRule } from "../../src/lib/domain/handicap";
import {
  generateSchedule,
  type SchedulerPlayer,
  type SchedulerTeam,
} from "../../src/lib/domain/scheduler";
import { DEFAULT_SEASON_SETTINGS } from "../../src/lib/domain/season-config";

const teams: SchedulerTeam[] = seed.teams.map((t, idx) => ({
  id: `team-${idx + 1}`,
  name: t.name,
  sortOrder: t.sort_order,
}));

const teamIdByName = new Map(teams.map((t) => [t.name, t.id]));

const players: SchedulerPlayer[] = seed.players.map((p, idx) => ({
  id: `player-${idx + 1}`,
  fullName: p.full_name,
  teamId: teamIdByName.get(p.team)!,
  ratingStart: p.rating_start,
}));

const rules: HandicapRule[] = seed.handicap_rules.map((r) => ({
  diff: r.diff,
  singlesCode: r.singles,
  doublesCode: r.doubles,
}));

describe("Bộ sinh lịch thi đấu Mùa 5 (AC2, AC3, AC17)", () => {
  it("sinh đúng 132 trận (96 đơn, 36 đôi), 0 vi phạm R1–R5 & R8 với cấu hình 4 kỳ", () => {
    const result = generateSchedule(teams, players, rules, {
      ...DEFAULT_SEASON_SETTINGS,
      periods_count: 4,
    });

    expect(result.fixtures).toHaveLength(6);
    expect(result.matches).toHaveLength(132);
    expect(result.matches.filter((m) => m.kind === "singles")).toHaveLength(96);
    expect(result.matches.filter((m) => m.kind === "doubles")).toHaveLength(36);
    expect(result.issues.filter((i) => i.severity === "hard")).toEqual([]);
    expect(result.issues.filter((i) => i.rule === "R8")).toEqual([]);

    // AC17: 4 kỳ -> mỗi kỳ 33 trận, mỗi người 5–6 trận/kỳ, tổng 21 trận
    for (let periodNo = 1; periodNo <= 4; periodNo++) {
      const periodMatches = result.matches.filter((m) => m.periodNo === periodNo);
      expect(periodMatches).toHaveLength(33);
    }

    for (const p of players) {
      const counts = [1, 2, 3, 4].map(
        (periodNo) =>
          result.matches.filter(
            (m) =>
              m.periodNo === periodNo &&
              (m.sideAPlayerIds.includes(p.id) || m.sideBPlayerIds.includes(p.id))
          ).length
      );
      expect(counts.reduce((a, b) => a + b, 0)).toBe(21);
      for (const c of counts) {
        expect(c).toBeGreaterThanOrEqual(5);
        expect(c).toBeLessThanOrEqual(6);
      }
    }
  });

  it("khi chọn 3 kỳ -> chia đúng 44 trận mỗi kỳ, mỗi người 7 trận/kỳ (AC17)", () => {
    const result = generateSchedule(teams, players, rules, {
      ...DEFAULT_SEASON_SETTINGS,
      periods_count: 3,
    });

    expect(result.matches).toHaveLength(132);
    expect(result.issues.filter((i) => i.severity === "hard")).toEqual([]);
    expect(result.issues.filter((i) => i.rule === "R8")).toEqual([]);

    for (let periodNo = 1; periodNo <= 3; periodNo++) {
      const periodMatches = result.matches.filter((m) => m.periodNo === periodNo);
      expect(periodMatches).toHaveLength(44);
    }
  });
});

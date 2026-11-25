import { describe, expect, it } from "vitest";
import {
  computePeriodProgress,
  formatDateVN,
  type ProgressMatch,
  type ProgressPeriod,
  type ProgressPlayer,
  type ProgressTeam,
} from "../../src/lib/domain/progress";
import { DEFAULT_SEASON_SETTINGS } from "../../src/lib/domain/season-config";

const teams: ProgressTeam[] = [
  { id: "t1", name: "Đội 1", color: "#2B6FD6" },
  { id: "t2", name: "Đội 2", color: "#D99A12" },
];

const players: ProgressPlayer[] = [
  { id: "p1", fullName: "Nam Gai", nickname: null, teamId: "t1" },
  { id: "p2", fullName: "Kiên", nickname: null, teamId: "t2" },
];

const period: ProgressPeriod = {
  id: "per-1",
  periodNo: 1,
  name: "Kỳ 1",
  startsOn: "2026-11-30",
  endsOn: "2026-12-13",
  status: "published",
};

describe("M4 AC14: Cảnh báo trận tồn & tiến độ kỳ", () => {
  it("bật cảnh báo trước 3 ngày hết kỳ, phân biệt mức chậm (<70% đỏ) và bình thường (>=70% vàng)", () => {
    const matches: ProgressMatch[] = [
      {
        id: "m1",
        periodId: "per-1",
        kind: "singles",
        status: "played",
        sideAPlayerIds: ["p1"],
        sideBPlayerIds: ["p2"],
      },
      {
        id: "m2",
        periodId: "per-1",
        kind: "singles",
        status: "scheduled",
        sideAPlayerIds: ["p1"],
        sideBPlayerIds: ["p2"],
      },
      {
        id: "m3",
        periodId: "per-1",
        kind: "doubles",
        status: "scheduled",
        sideAPlayerIds: ["p1"],
        sideBPlayerIds: ["p2"],
      },
    ];

    // Còn 3 ngày (2026-12-10 -> 2026-12-13), hoàn thành 1/3 = 33% < 70%
    const slowSummary = computePeriodProgress(
      period,
      matches,
      players,
      teams,
      DEFAULT_SEASON_SETTINGS,
      "2026-12-10"
    );

    expect(slowSummary.daysLeft).toBe(3);
    expect(slowSummary.shouldAlert).toBe(true);
    expect(slowSummary.completionPct).toBe(33);
    expect(slowSummary.isSlow).toBe(true);
    expect(slowSummary.backlogCount).toBe(2);
    expect(slowSummary.playerBacklog[0].totalBacklog).toBe(2);

    // Còn 5 ngày -> chưa tới mốc cảnh báo 3 ngày
    const earlySummary = computePeriodProgress(
      period,
      matches,
      players,
      teams,
      DEFAULT_SEASON_SETTINGS,
      "2026-12-08"
    );
    expect(earlySummary.shouldAlert).toBe(false);

    // Định dạng ngày dd/MM/yyyy
    expect(formatDateVN("2026-12-13")).toBe("13/12/2026");
  });
});

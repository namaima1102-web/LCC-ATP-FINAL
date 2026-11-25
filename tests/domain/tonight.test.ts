import { describe, expect, it } from "vitest";
import { DEFAULT_SEASON_SETTINGS } from "../../src/lib/domain/season-config";
import {
  filterActiveAttendance,
  suggestTonightMatches,
  type TonightMatchCandidate,
} from "../../src/lib/domain/tonight";

describe("M6 AC13: Check-in tối nay & gợi ý trận khả thi", () => {
  it("chỉ giữ check-in còn hiệu lực trong 24 giờ", () => {
    const now = new Date("2026-12-01T12:00:00Z");
    const present = filterActiveAttendance(
      [
        { playerId: "p1", checkedInAt: "2026-12-01T11:00:00Z" }, // 1h trước -> hợp lệ
        { playerId: "p2", checkedInAt: "2026-11-30T10:00:00Z" }, // 26h trước -> hết hạn
      ],
      now
    );
    expect(present).toEqual(["p1"]);
  });

  it("check-in 4 người (2 đội) ra trận đôi khả thi, chỉ gợi ý trận đủ người và không xếp 1 người 2 trận cùng lúc", () => {
    const matches: TonightMatchCandidate[] = [
      {
        id: "m-doubles",
        kind: "doubles",
        periodId: "per-1",
        periodNo: 1,
        periodEndsOn: "2026-12-13",
        handicapCode: "0-2-0",
        sideAPlayerIds: ["a1", "a2"],
        sideBPlayerIds: ["b1", "b2"],
      },
      {
        id: "m-singles-overlap",
        kind: "singles",
        periodId: "per-1",
        periodNo: 1,
        periodEndsOn: "2026-12-13",
        handicapCode: "0-0-0",
        sideAPlayerIds: ["a1"],
        sideBPlayerIds: ["b1"],
      },
      {
        id: "m-missing-player",
        kind: "singles",
        periodId: "per-1",
        periodNo: 1,
        periodEndsOn: "2026-12-13",
        handicapCode: "0-0-0",
        sideAPlayerIds: ["a1"],
        sideBPlayerIds: ["c1"], // c1 chưa check-in
      },
    ];

    const res = suggestTonightMatches(
      matches,
      ["a1", "a2", "b1", "b2"],
      DEFAULT_SEASON_SETTINGS,
      2
    );

    // Đều khả thi: m-doubles và m-singles-overlap; m-missing-player bị loại
    expect(res.allPlayable.map((m) => m.id)).toEqual([
      "m-doubles",
      "m-singles-overlap",
    ]);

    // Xếp bàn đồng thời: ưu tiên trận đôi trước, và không xếp a1/b1 vào trận đơn cùng lúc (R6)
    expect(res.recommendedNow.map((m) => m.id)).toEqual(["m-doubles"]);
  });
});

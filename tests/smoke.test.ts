import { describe, expect, it } from "vitest";
import season5 from "../seed/season5.json";

describe("M0 smoke test: dữ liệu seed/season5.json", () => {
  it("đọc đúng thông tin mùa 5, 4 đội, 16 tuyển thủ và 13 dòng bảng chấp", () => {
    expect(season5.season.code).toBe("S5-2026");
    expect(season5.teams).toHaveLength(4);
    expect(season5.players).toHaveLength(16);
    expect(season5.handicap_rules).toHaveLength(13);
  });
});

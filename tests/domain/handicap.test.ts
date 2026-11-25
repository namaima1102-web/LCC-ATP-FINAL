import { describe, expect, it } from "vitest";
import seed from "../../seed/season5.json";
import {
  calculateHandicap,
  getHandicapBreakdown,
  handicapPerSet,
  validateScore,
  type HandicapRule,
} from "../../src/lib/domain/handicap";
import { DEFAULT_SEASON_SETTINGS } from "../../src/lib/domain/season-config";

const rules: HandicapRule[] = seed.handicap_rules.map((r) => ({
  diff: r.diff,
  singlesCode: r.singles,
  doublesCode: r.doubles,
}));

describe("PRD 13.1: Ca kiểm thử mã chấp (AC9)", () => {
  it("Hiếu (8) vs Nam Gai (12) đơn -> chênh 4 -> 4-4-4, Nam Gai chấp", () => {
    const res = calculateHandicap("singles", [8], [12], rules, DEFAULT_SEASON_SETTINGS);
    expect(res).toEqual({ diff: 4, code: "4-4-4", giver: "b" });
  });

  it("Thanh (8) vs Phương (7) đơn -> chênh 1 -> 0-2-0, Thanh chấp", () => {
    const res = calculateHandicap("singles", [8], [7], rules, DEFAULT_SEASON_SETTINGS);
    expect(res).toEqual({ diff: 1, code: "0-2-0", giver: "a" });
  });

  it("Kiên (9) vs Đức (9) đơn -> chênh 0 -> 0-0-0, ngang nhau", () => {
    const res = calculateHandicap("singles", [9], [9], rules, DEFAULT_SEASON_SETTINGS);
    expect(res).toEqual({ diff: 0, code: "0-0-0", giver: null });
  });

  it("Kiên+Vinh (16) vs Sinh+Phương (15) đôi -> chênh 0.5 -> 0-2-0 (luật Mùa 5)", () => {
    const res = calculateHandicap("doubles", [9, 7], [8, 7], rules, DEFAULT_SEASON_SETTINGS);
    expect(res).toEqual({ diff: 0.5, code: "0-2-0", giver: "a" });
  });

  it("Nam Gai+Sinh (20) vs Dương+Hùng (17) đôi -> chênh 1.5 -> 2-0-2", () => {
    const res = calculateHandicap("doubles", [12, 8], [9, 8], rules, DEFAULT_SEASON_SETTINGS);
    expect(res).toEqual({ diff: 1.5, code: "2-0-2", giver: "a" });
  });

  it("Hiếu+Thảo (15) vs Đức+Thông (15) đôi -> chênh 0 -> 0-0-0", () => {
    const res = calculateHandicap("doubles", [8, 7], [9, 6], rules, DEFAULT_SEASON_SETTINGS);
    expect(res).toEqual({ diff: 0, code: "0-0-0", giver: null });
  });
});

describe("Đọc mã chấp theo từng set (PRD 5.2)", () => {
  it("0-2-0 -> 0, 2, 0, 2, 0", () => {
    expect(getHandicapBreakdown("0-2-0", 5).map((s) => s.points)).toEqual([
      0, 2, 0, 2, 0,
    ]);
  });

  it("2-3-2 -> 2, 3, 2, 3, 2", () => {
    expect([1, 2, 3, 4, 5].map((i) => handicapPerSet("2-3-2", i))).toEqual([
      2, 3, 2, 3, 2,
    ]);
  });
});

describe("Kiểm tra tỉ số hợp lệ theo thể thức 5 set thắng 3 (AC5)", () => {
  it("chấp nhận 3-0, 3-1, 3-2 và 0-3, 1-3, 2-3", () => {
    expect(validateScore(3, 0, 3)).toEqual({ valid: true, winnerSide: "a" });
    expect(validateScore(3, 2, 3)).toEqual({ valid: true, winnerSide: "a" });
    expect(validateScore(1, 3, 3)).toEqual({ valid: true, winnerSide: "b" });
  });

  it("từ chối 3-3, 2-0, 4-1 với thông báo tiếng Việt", () => {
    for (const [a, b] of [
      [3, 3],
      [2, 0],
      [4, 1],
      [-1, 3],
    ]) {
      const res = validateScore(a, b, 3);
      expect(res.valid).toBe(false);
      if (!res.valid) {
        expect(res.error.length).toBeGreaterThan(5);
      }
    }
  });
});

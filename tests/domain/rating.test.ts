import { describe, expect, it } from "vitest";
import {
  suggestRatingAdjustments,
  type RatingInputPlayer,
} from "../../src/lib/domain/rating";
import { DEFAULT_SEASON_SETTINGS } from "../../src/lib/domain/season-config";

const makePlayer = (
  id: string,
  fullName: string,
  ratingStart: number,
  overrideWinPct: number
): RatingInputPlayer => ({
  playerId: id,
  fullName,
  ratingStart,
  singlesWins: 6,
  singlesLosses: 6,
  doublesWins: 3,
  doublesLosses: 3,
  overrideWinPct,
});

describe("PRD 13.2: Ca kiểm thử điều chỉnh điểm cuối mùa (AC9)", () => {
  it("Thanh 28% giảm 1; Nam Gai 78%, Sinh 72%, Thông 72%, Hiếu 67%, Kiên 67% giữ nguyên; Dũng 6% gợi ý giảm 1", () => {
    const inputs: RatingInputPlayer[] = [
      makePlayer("1", "Thanh", 8, 28),
      makePlayer("2", "Nam Gai", 12, 78),
      makePlayer("3", "Sinh", 8, 72),
      makePlayer("4", "Thông", 6, 72),
      makePlayer("5", "Hiếu", 8, 67),
      makePlayer("6", "Kiên", 9, 67),
      makePlayer("7", "Dũng", 6, 6),
    ];

    const out = suggestRatingAdjustments(inputs, DEFAULT_SEASON_SETTINGS);
    const byName = new Map(out.map((r) => [r.fullName, r]));

    expect(byName.get("Thanh")?.ruleRating).toBe(7);
    expect(byName.get("Nam Gai")?.ruleRating).toBe(12);
    expect(byName.get("Sinh")?.ruleRating).toBe(8);
    expect(byName.get("Thông")?.ruleRating).toBe(6);
    expect(byName.get("Hiếu")?.ruleRating).toBe(8);
    expect(byName.get("Kiên")?.ruleRating).toBe(9);
    expect(byName.get("Dũng")?.delta).toBe(-1);
  });

  it("đổi ngưỡng cấu hình làm thay đổi kết quả gợi ý mà không sửa code (AC11)", () => {
    const inputs: RatingInputPlayer[] = [makePlayer("2", "Nam Gai", 12, 78)];
    const out = suggestRatingAdjustments(inputs, {
      ...DEFAULT_SEASON_SETTINGS,
      rating_increase_min_pct: 75,
    });
    expect(out[0].delta).toBe(1);
    expect(out[0].ruleRating).toBe(13);
  });
});

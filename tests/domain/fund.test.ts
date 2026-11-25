import { describe, expect, it } from "vitest";
import {
  computeFundSummary,
  DEFAULT_SEASON5_FUND_RECORDS,
} from "../../src/lib/domain/fund";

describe("Bảng đóng quỹ CLB (50k/mùa)", () => {
  it("tính đúng Còn dư / Cần đóng cho Thanh, Sinh, Thảo, Tân, Vĩnh", () => {
    const summary = computeFundSummary(DEFAULT_SEASON5_FUND_RECORDS, 50);
    const byName = new Map(summary.rows.map((r) => [r.fullName, r]));

    // Thanh: đã đóng 200k, 4 mùa trước + M5 = 5 mùa (250k) -> cần đóng 50k
    expect(byName.get("Thanh")?.dueK).toBe(50);
    expect(byName.get("Thanh")?.surplusK).toBe(0);

    // Sinh: đã đóng 250k, 4 mùa trước + M5 = 5 mùa (250k) -> đủ 0k
    expect(byName.get("Sinh")?.dueK).toBe(0);
    expect(byName.get("Sinh")?.surplusK).toBe(0);

    // Thảo: đã đóng 150k, 5 mùa (250k) -> cần đóng 100k
    expect(byName.get("Thảo")?.dueK).toBe(100);

    // Tân: mới M5, đóng 0k -> cần đóng 50k
    expect(byName.get("Tân")?.dueK).toBe(50);

    // Vĩnh: nghỉ M5, đóng 250k cho 2 mùa (100k) -> dư 150k
    expect(byName.get("Vĩnh")?.surplusK).toBe(150);
    expect(byName.get("Vĩnh")?.dueK).toBe(0);
  });
});

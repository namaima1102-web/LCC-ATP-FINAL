import { describe, expect, it } from "vitest";
import {
  computeFundSummary,
  DEFAULT_OPENING_BALANCE_K,
  DEFAULT_SEASON5_FUND_RECORDS,
} from "../../src/lib/domain/fund";

describe("Bảng đóng quỹ & Thu chi CLB (50k/mùa)", () => {
  it("tính đúng Còn dư / Cần đóng và số dư quỹ hiện tại (1145 + 250 - chi)", () => {
    const summary = computeFundSummary(
      DEFAULT_SEASON5_FUND_RECORDS,
      50,
      DEFAULT_OPENING_BALANCE_K,
      [{ id: "e1", date: "2026-11-25", description: "Mua bóng", amountK: 100 }]
    );
    const byName = new Map(summary.rows.map((r) => [r.fullName, r]));

    // Thanh: đã đóng 200k, 4 mùa trước + M5 = 5 mùa (250k) -> cần đóng 50k
    expect(byName.get("Thanh")?.dueK).toBe(50);

    // Dương: 200k + 50k M5 = 250k -> đủ 0k
    expect(byName.get("Dương")?.dueK).toBe(0);

    // Tân: mới M5, đóng 100k -> dư 50k
    expect(byName.get("Tân")?.surplusK).toBe(50);

    // Nam Gai: 100k + 100k M5 = 200k cho 3 mùa (150k) -> dư 50k
    expect(byName.get("Nam Gai")?.surplusK).toBe(50);

    // Thu chi: 1145 + 250 (Dương 50 + Tân 100 + Nam Gai 100) - 100 = 1295k
    expect(summary.m5IncomeK).toBe(250);
    expect(summary.totalExpensesK).toBe(100);
    expect(summary.currentBalanceK).toBe(1295);
  });
});

import { describe, expect, it, vi } from "vitest";
import seed from "../seed/season5.json";
import { DEFAULT_SEASON_SETTINGS } from "../src/lib/domain/season-config";

vi.mock("@/lib/supabase/auth", () => ({
  getCurrentAdmin: vi.fn(),
}));

import { getCurrentAdmin } from "@/lib/supabase/auth";
import { GET as getAdminStatus } from "../src/app/api/admin/status/route";

describe("M1 AC1: Kiểm tra dữ liệu seed Mùa 5 & cấu hình mặc định", () => {
  it("đủ 4 đội, 16 tuyển thủ (2 provisional: Tân, Khanh), 13 dòng bảng chấp", () => {
    expect(seed.teams).toHaveLength(4);
    expect(seed.players).toHaveLength(16);
    expect(seed.handicap_rules).toHaveLength(13);

    const provisionalNames = seed.players
      .filter((p) => p.is_provisional)
      .map((p) => p.full_name)
      .sort();
    expect(provisionalNames).toEqual(["Khanh", "Tân"]);
  });

  it("cấu hình mặc định khớp PRD (5 set thắng 3, 4 kỳ, cảnh báo 3/1/0 ngày, noindex)", () => {
    expect(DEFAULT_SEASON_SETTINGS.singles_sets_to_win).toBe(3);
    expect(DEFAULT_SEASON_SETTINGS.doubles_sets_to_win).toBe(3);
    expect(DEFAULT_SEASON_SETTINGS.periods_count).toBe(4);
    expect(DEFAULT_SEASON_SETTINGS.alert_days_before).toEqual([3, 1, 0]);
    expect(DEFAULT_SEASON_SETTINGS.noindex).toBe(true);
  });
});

describe("M1 AC8: Bảo vệ API Admin khỏi người chưa đăng nhập", () => {
  it("trả về HTTP 401 khi chưa đăng nhập hoặc không phải Admin", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValueOnce(null);
    const res = await getAdminStatus();
    expect(res.status).toBe(401);
  });

  it("trả về HTTP 200 khi là Admin hợp lệ", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValueOnce({
      userId: "admin-uuid-1",
      email: "nam@example.com",
      displayName: "Anh Nam",
    });
    const res = await getAdminStatus();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.admin.email).toBe("nam@example.com");
  });
});

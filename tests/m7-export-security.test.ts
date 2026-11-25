import { describe, expect, it, vi } from "vitest";
import { buildSeasonWorkbook } from "../src/lib/domain/export-workbook";

vi.mock("@/lib/supabase/auth", () => ({
  getCurrentAdmin: vi.fn(),
}));

import { getCurrentAdmin } from "@/lib/supabase/auth";
import { GET as exportXlsx } from "../src/app/api/admin/export/route";

describe("M7 AC12: Xuất XLSX đủ 4 sheet & bảo vệ API xuất", () => {
  it("tạo workbook đủ 4 sheet: Tuyen_thu, Lich_thi_dau, Ket_qua_chinh_thuc, Bang_xep_hang", () => {
    const wb = buildSeasonWorkbook({
      players: [
        {
          fullName: "Nam Gai",
          nickname: null,
          teamName: "Đội 1",
          ratingStart: 12,
          isProvisional: false,
        },
      ],
      matches: [
        {
          periodNo: 1,
          kind: "singles",
          sideANames: "Nam Gai",
          sideBNames: "Kiên",
          handicapCode: "2-2-2",
          status: "played",
        },
      ],
      results: [
        {
          periodNo: 1,
          kind: "singles",
          sideANames: "Nam Gai",
          sideBNames: "Kiên",
          setsA: 3,
          setsB: 1,
          playedOn: "2026-12-01",
          isForfeit: false,
        },
      ],
      teamStandings: [
        {
          teamId: "t1",
          teamName: "Đội 1",
          color: "#2B6FD6",
          points: 1,
          played: 1,
          wins: 1,
          losses: 0,
          setsWon: 3,
          setsLost: 1,
          setDiff: 2,
          singlesWins: 1,
        },
      ],
      playerStats: [],
    });

    expect(wb.SheetNames).toEqual([
      "Tuyen_thu",
      "Lich_thi_dau",
      "Ket_qua_chinh_thuc",
      "Bang_xep_hang",
    ]);
  });

  it("chặn người chưa đăng nhập tải file xuất dữ liệu (401)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValueOnce(null);
    const res = await exportXlsx();
    expect(res.status).toBe(401);
  });
});

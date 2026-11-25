import { describe, expect, it, vi } from "vitest";
import {
  detectConflictMatchIds,
  filterForfeitCandidates,
} from "../src/lib/domain/submissions";

vi.mock("@/lib/supabase/auth", () => ({
  getCurrentAdmin: vi.fn(),
}));

import { getCurrentAdmin } from "@/lib/supabase/auth";
import { POST as postSubmissions } from "../src/app/api/admin/submissions/route";
import { POST as postForfeits } from "../src/app/api/admin/forfeits/route";

describe("M5 AC7: Phát hiện xung đột giữa các bản gửi chờ duyệt", () => {
  it("đánh dấu xung đột khi cùng 1 trận có 2 bản pending khác người thắng", () => {
    const conflicts = detectConflictMatchIds([
      { id: "s1", matchId: "m1", setsA: 3, setsB: 1, status: "pending" },
      { id: "s2", matchId: "m1", setsA: 2, setsB: 3, status: "pending" },
      { id: "s3", matchId: "m2", setsA: 3, setsB: 0, status: "pending" },
      { id: "s4", matchId: "m2", setsA: 3, setsB: 2, status: "pending" },
    ]);

    expect(conflicts.has("m1")).toBe(true);
    expect(conflicts.has("m2")).toBe(false);
  });
});

describe("M5 AC15: Lọc trận cần xử thua cuối kỳ", () => {
  it("loại trừ trận đang có bản gửi chờ duyệt và trận đã có kết quả", () => {
    const matches = [
      { id: "m1", periodId: "p1", status: "scheduled" },
      { id: "m2", periodId: "p1", status: "scheduled" },
      { id: "m3", periodId: "p1", status: "played" },
    ];
    const pendingSet = new Set(["m2"]);
    const candidates = filterForfeitCandidates(matches, pendingSet);
    expect(candidates.map((m) => m.id)).toEqual(["m1"]);
  });
});

describe("M5 AC8: Bảo vệ API duyệt tỉ số và xử thua", () => {
  it("trả về HTTP 401 khi người chưa đăng nhập gọi API duyệt hoặc xử thua", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null);
    const req = new Request("http://localhost/api/admin/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "bulk_approve" }),
    });
    expect((await postSubmissions(req)).status).toBe(401);
    expect((await postForfeits(req)).status).toBe(401);
  });
});

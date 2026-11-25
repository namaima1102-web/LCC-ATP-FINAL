import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/auth", () => ({
  getCurrentAdmin: vi.fn(),
}));

import { getCurrentAdmin } from "@/lib/supabase/auth";
import { PATCH as patchTeams } from "../src/app/api/admin/teams/route";
import { POST as previewSchedule } from "../src/app/api/admin/schedule/preview/route";
import { POST as saveSchedule } from "../src/app/api/admin/schedule/save/route";
import { PATCH as patchPeriods } from "../src/app/api/admin/periods/route";
import { PATCH as patchMatches } from "../src/app/api/admin/matches/route";

describe("M3: Bảo vệ các API Admin (AC8)", () => {
  it("trả về HTTP 401 khi người chưa đăng nhập gọi API đội, lịch, kỳ, trận", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null);

    const makeReq = () =>
      new Request("http://localhost/api/admin/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

    expect((await patchTeams(makeReq())).status).toBe(401);
    expect((await previewSchedule(makeReq())).status).toBe(401);
    expect((await saveSchedule(makeReq())).status).toBe(401);
    expect((await patchPeriods(makeReq())).status).toBe(401);
    expect((await patchMatches(makeReq())).status).toBe(401);
  });
});

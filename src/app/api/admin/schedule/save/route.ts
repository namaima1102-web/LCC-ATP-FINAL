import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { generateSchedule } from "@/lib/domain/scheduler";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    periodsCount?: number;
    balanceOpponents?: boolean;
    balanceHandicap?: boolean;
    replace?: boolean;
  };

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return NextResponse.json({ error: "Chưa có dữ liệu mùa giải." }, { status: 404 });
  }

  const db = createAdminClient();
  const { count: existingMatches } = await db
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("season_id", ctx.season.id);

  if ((existingMatches ?? 0) > 0 && !body.replace) {
    return NextResponse.json(
      { error: "Mùa giải đã có lịch. Hãy xác nhận tạo lại nếu muốn thay thế lịch nháp." },
      { status: 409 }
    );
  }

  // Không cho phép ghi đè nếu đã có trận đã đấu hoặc xử thua
  const { count: playedCount } = await db
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("season_id", ctx.season.id)
    .in("status", ["played", "forfeit"]);

  if ((playedCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "Đã có trận có kết quả chính thức, không thể sinh lại toàn bộ lịch." },
      { status: 400 }
    );
  }

  const periodsCount =
    body.periodsCount === 3 || body.periodsCount === 4
      ? body.periodsCount
      : ctx.season.settings.periods_count;

  const schedule = generateSchedule(ctx.teams, ctx.players, ctx.handicapRules, {
    ...ctx.season.settings,
    periods_count: periodsCount,
    balance_opponents:
      body.balanceOpponents ?? ctx.season.settings.balance_opponents,
    balance_handicap:
      body.balanceHandicap ?? ctx.season.settings.balance_handicap,
  });

  const hardIssues = schedule.issues.filter((i) => i.severity === "hard");
  if (hardIssues.length > 0) {
    return NextResponse.json(
      { error: `Lịch vi phạm quy tắc cứng: ${hardIssues[0].message}` },
      { status: 400 }
    );
  }

  // Xóa lịch cũ (nếu replace)
  if ((existingMatches ?? 0) > 0) {
    await db.from("matches").delete().eq("season_id", ctx.season.id);
    await db.from("fixtures").delete().eq("season_id", ctx.season.id);
  }

  // Đảm bảo có đủ `periodsCount` kỳ trong bảng `periods`
  const periodIdByNo = new Map(ctx.periods.map((p) => [p.periodNo, p.id]));
  for (let pNo = 1; pNo <= periodsCount; pNo++) {
    if (!periodIdByNo.has(pNo)) {
      const start = new Date("2026-11-30T00:00:00Z");
      start.setUTCDate(start.getUTCDate() + (pNo - 1) * 14);
      const end = new Date(start);
      end.setUTCDate(start.getUTCDate() + 13);
      const { data: createdPeriod } = await db
        .from("periods")
        .insert({
          season_id: ctx.season.id,
          period_no: pNo,
          name: `Kỳ ${pNo}`,
          starts_on: start.toISOString().slice(0, 10),
          ends_on: end.toISOString().slice(0, 10),
          status: "draft",
        })
        .select("id")
        .single();
      if (createdPeriod) periodIdByNo.set(pNo, createdPeriod.id);
    }
  }

  // Xóa các kỳ dư > periodsCount nếu chưa dùng
  await db
    .from("periods")
    .delete()
    .eq("season_id", ctx.season.id)
    .gt("period_no", periodsCount)
    .eq("status", "draft");

  // Lưu 6 fixtures
  const fixtureIdByIndex = new Map<number, string>();
  const { data: insertedFixtures, error: fErr } = await db
    .from("fixtures")
    .insert(
      schedule.fixtures.map((f) => ({
        season_id: ctx.season.id,
        team_a_id: f.teamAId,
        team_b_id: f.teamBId,
      }))
    )
    .select("id");

  if (fErr || !insertedFixtures) {
    return NextResponse.json({ error: fErr?.message ?? "Lỗi lưu fixtures." }, { status: 500 });
  }

  insertedFixtures.forEach((row, idx) => {
    fixtureIdByIndex.set(idx, row.id);
  });

  // Lưu 132 matches
  const matchRows = schedule.matches.map((m) => ({
    season_id: ctx.season.id,
    fixture_id: fixtureIdByIndex.get(m.fixtureIndex)!,
    kind: m.kind,
    sets_to_win: m.setsToWin,
    period_id: periodIdByNo.get(m.periodNo)!,
    status: "scheduled",
    handicap_diff: m.handicapDiff,
    handicap_code: m.handicapCode,
    handicap_giver: m.handicapGiver,
  }));

  const { data: insertedMatches, error: mErr } = await db
    .from("matches")
    .insert(matchRows)
    .select("id");

  if (mErr || !insertedMatches) {
    return NextResponse.json({ error: mErr?.message ?? "Lỗi lưu matches." }, { status: 500 });
  }

  // Lưu match_sides
  const sideRows: Array<{ match_id: string; side: "a" | "b"; player_id: string }> = [];
  insertedMatches.forEach((row, idx) => {
    const m = schedule.matches[idx];
    for (const pid of m.sideAPlayerIds) {
      sideRows.push({ match_id: row.id, side: "a", player_id: pid });
    }
    for (const pid of m.sideBPlayerIds) {
      sideRows.push({ match_id: row.id, side: "b", player_id: pid });
    }
  });

  const { error: msErr } = await db.from("match_sides").insert(sideRows);
  if (msErr) {
    return NextResponse.json({ error: msErr.message }, { status: 500 });
  }

  await writeAuditLog({
    actor: admin.userId,
    action: "generate_schedule",
    entity: "seasons",
    entityId: ctx.season.id,
    after: {
      periodsCount,
      fixturesCount: schedule.fixtures.length,
      matchesCount: schedule.matches.length,
    },
  });

  return NextResponse.json({
    ok: true,
    matchesCount: schedule.matches.length,
  });
}

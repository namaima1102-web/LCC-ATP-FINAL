import { NextResponse } from "next/server";
import { generateSchedule } from "@/lib/domain/scheduler";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    periodsCount?: number;
    balanceOpponents?: boolean;
    balanceHandicap?: boolean;
  };

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return NextResponse.json({ error: "Chưa có dữ liệu mùa giải." }, { status: 404 });
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

  return NextResponse.json({
    ok: true,
    periodsCount,
    fixtures: schedule.fixtures,
    matches: schedule.matches,
    issues: schedule.issues,
  });
}

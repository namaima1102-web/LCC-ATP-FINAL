import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { calculateHandicap, type HandicapRule } from "@/lib/domain/handicap";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json()) as {
    rules: Array<{ diff: number; singlesCode: string; doublesCode: string }>;
  };

  if (!Array.isArray(body.rules) || body.rules.length === 0) {
    return NextResponse.json({ error: "Bảng chấp không hợp lệ." }, { status: 400 });
  }

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return NextResponse.json({ error: "Chưa có mùa giải." }, { status: 404 });
  }

  const db = createAdminClient();
  const rows = body.rules.map((r) => ({
    season_id: ctx.season.id,
    diff: Number(r.diff),
    singles_code: r.singlesCode.trim(),
    doubles_code: r.doublesCode.trim(),
  }));

  const { error: upErr } = await db
    .from("handicap_rules")
    .upsert(rows, { onConflict: "season_id,diff" });

  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  // Tính lại mã chấp cho các trận chưa đấu (`scheduled`)
  const newRules: HandicapRule[] = rows.map((r) => ({
    diff: r.diff,
    singlesCode: r.singles_code,
    doublesCode: r.doubles_code,
  }));
  const ratingByPlayer = new Map(ctx.players.map((p) => [p.id, p.ratingStart]));

  const { data: scheduledMatches } = await db
    .from("matches")
    .select("id, kind, match_sides(side, player_id)")
    .eq("season_id", ctx.season.id)
    .eq("status", "scheduled");

  let updatedMatches = 0;
  for (const m of scheduledMatches ?? []) {
    const sides = (m.match_sides ?? []) as Array<{ side: string; player_id: string }>;
    const ratingsA = sides
      .filter((s) => s.side === "a")
      .map((s) => ratingByPlayer.get(s.player_id) ?? 0);
    const ratingsB = sides
      .filter((s) => s.side === "b")
      .map((s) => ratingByPlayer.get(s.player_id) ?? 0);

    const hc = calculateHandicap(
      m.kind as "singles" | "doubles",
      ratingsA,
      ratingsB,
      newRules,
      ctx.season.settings
    );

    await db
      .from("matches")
      .update({
        handicap_diff: hc.diff,
        handicap_code: hc.code,
        handicap_giver: hc.giver,
      })
      .eq("id", m.id);
    updatedMatches++;
  }

  await writeAuditLog({
    actor: admin.userId,
    action: "update_handicap_rules",
    entity: "handicap_rules",
    entityId: ctx.season.id,
    before: ctx.handicapRules,
    after: { rules: newRules, updatedScheduledMatches: updatedMatches },
  });

  return NextResponse.json({ ok: true, updatedMatches });
}

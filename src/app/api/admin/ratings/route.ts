import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json()) as {
    decisions: Array<{
      playerId: string;
      fromRating: number;
      ruleRating: number;
      finalRating: number;
      reason?: string;
    }>;
  };

  if (!Array.isArray(body.decisions) || body.decisions.length === 0) {
    return NextResponse.json({ error: "Thiếu dữ liệu quyết định điểm." }, { status: 400 });
  }

  for (const d of body.decisions) {
    if (d.finalRating !== d.ruleRating && !d.reason?.trim()) {
      return NextResponse.json(
        { error: "Khi ghi đè khác với gợi ý luật, bắt buộc phải nhập lý do." },
        { status: 400 }
      );
    }
  }

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return NextResponse.json({ error: "Chưa có mùa giải." }, { status: 404 });
  }

  const db = createAdminClient();
  const now = new Date().toISOString();

  for (const d of body.decisions) {
    const { error: rdErr } = await db.from("rating_decisions").upsert(
      {
        season_id: ctx.season.id,
        player_id: d.playerId,
        from_rating: d.fromRating,
        rule_rating: d.ruleRating,
        final_rating: d.finalRating,
        reason: d.reason?.trim() || null,
        decided_by: admin.userId,
        decided_at: now,
      },
      { onConflict: "season_id,player_id" }
    );
    if (rdErr) {
      return NextResponse.json({ error: rdErr.message }, { status: 500 });
    }

    await db
      .from("season_players")
      .update({ rating_end: d.finalRating })
      .eq("season_id", ctx.season.id)
      .eq("player_id", d.playerId);
  }

  await writeAuditLog({
    actor: admin.userId,
    action: "save_rating_decisions",
    entity: "rating_decisions",
    entityId: ctx.season.id,
    after: body.decisions,
  });

  return NextResponse.json({ ok: true, count: body.decisions.length });
}

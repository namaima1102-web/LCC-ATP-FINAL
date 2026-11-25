import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json()) as {
    action: "apply_forfeit" | "close_period";
    matchIds?: string[];
    forfeitKind?: "winner_a" | "winner_b" | "both";
    periodId?: string;
  };

  const db = createAdminClient();

  if (body.action === "apply_forfeit") {
    const matchIds = body.matchIds ?? [];
    const kind = body.forfeitKind;

    if (
      matchIds.length === 0 ||
      (kind !== "winner_a" && kind !== "winner_b" && kind !== "both")
    ) {
      return NextResponse.json(
        { error: "Vui lòng chọn trận và kết quả xử thua hợp lệ." },
        { status: 400 }
      );
    }

    const setsA = kind === "winner_a" ? 3 : 0;
    const setsB = kind === "winner_b" ? 3 : 0;
    const winnerSide =
      kind === "winner_a" ? "a" : kind === "winner_b" ? "b" : null;
    const now = new Date().toISOString();

    for (const matchId of matchIds) {
      const { error: resErr } = await db.from("results").upsert(
        {
          match_id: matchId,
          sets_a: setsA,
          sets_b: setsB,
          winner_side: winnerSide,
          is_forfeit: true,
          forfeit_kind: kind,
          approved_by: admin.userId,
          approved_at: now,
        },
        { onConflict: "match_id" }
      );
      if (resErr) {
        return NextResponse.json({ error: resErr.message }, { status: 500 });
      }

      await db.from("matches").update({ status: "forfeit" }).eq("id", matchId);
    }

    await writeAuditLog({
      actor: admin.userId,
      action: "apply_forfeit",
      entity: "results",
      after: { matchIds, forfeitKind: kind },
    });

    return NextResponse.json({ ok: true, count: matchIds.length });
  }

  if (body.action === "close_period") {
    if (!body.periodId) {
      return NextResponse.json({ error: "Thiếu periodId." }, { status: 400 });
    }

    // Kiểm tra còn trận scheduled không (AC15)
    const { count: remainingScheduled } = await db
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("period_id", body.periodId)
      .eq("status", "scheduled");

    if ((remainingScheduled ?? 0) > 0) {
      return NextResponse.json(
        {
          error: `Vẫn còn ${remainingScheduled} trận chưa đấu/chưa xử thua trong kỳ này. Không thể đóng kỳ.`,
        },
        { status: 400 }
      );
    }

    const closedAt = new Date().toISOString();
    const { error: upErr } = await db
      .from("periods")
      .update({ status: "closed", closed_at: closedAt })
      .eq("id", body.periodId);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await writeAuditLog({
      actor: admin.userId,
      action: "close_period",
      entity: "periods",
      entityId: body.periodId,
      after: { status: "closed", closed_at: closedAt },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
}

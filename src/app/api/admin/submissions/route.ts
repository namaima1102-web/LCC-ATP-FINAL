import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { validateScore } from "@/lib/domain/handicap";
import { detectConflictMatchIds } from "@/lib/domain/submissions";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json()) as {
    action: "approve" | "reject" | "bulk_approve";
    submissionId?: string;
    setsA?: number;
    setsB?: number;
    reviewNote?: string;
  };

  const db = createAdminClient();

  if (body.action === "reject") {
    if (!body.submissionId || !body.reviewNote?.trim()) {
      return NextResponse.json(
        { error: "Từ chối bản gửi bắt buộc phải nhập lý do." },
        { status: 400 }
      );
    }

    const { data: sub, error: sErr } = await db
      .from("score_submissions")
      .select("id, match_id, sets_a, sets_b, status")
      .eq("id", body.submissionId)
      .maybeSingle();

    if (sErr || !sub) {
      return NextResponse.json({ error: "Không tìm thấy bản gửi." }, { status: 404 });
    }

    const now = new Date().toISOString();
    const { error: upErr } = await db
      .from("score_submissions")
      .update({
        status: "rejected",
        reviewed_by: admin.userId,
        reviewed_at: now,
        review_note: body.reviewNote.trim(),
      })
      .eq("id", sub.id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await writeAuditLog({
      actor: admin.userId,
      action: "reject_submission",
      entity: "score_submissions",
      entityId: sub.id,
      before: sub,
      after: { status: "rejected", review_note: body.reviewNote.trim() },
      reason: body.reviewNote.trim(),
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "approve") {
    if (!body.submissionId) {
      return NextResponse.json({ error: "Thiếu submissionId." }, { status: 400 });
    }

    const { data: sub, error: sErr } = await db
      .from("score_submissions")
      .select("id, match_id, sets_a, sets_b, played_on, status, matches(sets_to_win, status)")
      .eq("id", body.submissionId)
      .maybeSingle();

    if (sErr || !sub) {
      return NextResponse.json({ error: "Không tìm thấy bản gửi." }, { status: 404 });
    }

    const matchInfo = sub.matches as unknown as {
      sets_to_win: number;
      status: string;
    };

    const finalSetsA = body.setsA !== undefined ? Number(body.setsA) : sub.sets_a;
    const finalSetsB = body.setsB !== undefined ? Number(body.setsB) : sub.sets_b;
    const check = validateScore(finalSetsA, finalSetsB, matchInfo.sets_to_win);
    if (!check.valid) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { error: resErr } = await db.from("results").upsert(
      {
        match_id: sub.match_id,
        sets_a: finalSetsA,
        sets_b: finalSetsB,
        played_on: sub.played_on,
        winner_side: check.winnerSide,
        is_forfeit: false,
        source_submission_id: sub.id,
        approved_by: admin.userId,
        approved_at: now,
      },
      { onConflict: "match_id" }
    );

    if (resErr) {
      return NextResponse.json({ error: resErr.message }, { status: 500 });
    }

    await db
      .from("matches")
      .update({ status: "played" })
      .eq("id", sub.match_id);

    await db
      .from("score_submissions")
      .update({
        status: "approved",
        reviewed_by: admin.userId,
        reviewed_at: now,
        review_note: body.reviewNote?.trim() || null,
      })
      .eq("id", sub.id);

    await db
      .from("score_submissions")
      .update({ status: "superseded", reviewed_by: admin.userId, reviewed_at: now })
      .eq("match_id", sub.match_id)
      .eq("status", "pending")
      .neq("id", sub.id);

    await writeAuditLog({
      actor: admin.userId,
      action: "approve_submission",
      entity: "results",
      entityId: sub.match_id,
      before: { submission_id: sub.id, sets_a: sub.sets_a, sets_b: sub.sets_b },
      after: { sets_a: finalSetsA, sets_b: finalSetsB, winner_side: check.winnerSide },
      reason: body.reviewNote?.trim() || null,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "bulk_approve") {
    const { data: pendingRows } = await db
      .from("score_submissions")
      .select("id, match_id, sets_a, sets_b, played_on, status, matches(sets_to_win)")
      .eq("status", "pending")
      .order("created_at", { ascending: true });

    const rows = pendingRows ?? [];
    const conflicts = detectConflictMatchIds(
      rows.map((r) => ({
        id: r.id,
        matchId: r.match_id,
        setsA: r.sets_a,
        setsB: r.sets_b,
        status: r.status,
      }))
    );

    const approvedMatches = new Set<string>();
    let approvedCount = 0;
    const now = new Date().toISOString();

    for (const sub of rows) {
      if (conflicts.has(sub.match_id)) continue;
      if (approvedMatches.has(sub.match_id)) continue;

      const setsToWin =
        (sub.matches as unknown as { sets_to_win: number })?.sets_to_win ?? 3;
      const check = validateScore(sub.sets_a, sub.sets_b, setsToWin);
      if (!check.valid) continue;

      await db.from("results").upsert(
        {
          match_id: sub.match_id,
          sets_a: sub.sets_a,
          sets_b: sub.sets_b,
          played_on: sub.played_on,
          winner_side: check.winnerSide,
          is_forfeit: false,
          source_submission_id: sub.id,
          approved_by: admin.userId,
          approved_at: now,
        },
        { onConflict: "match_id" }
      );
      await db.from("matches").update({ status: "played" }).eq("id", sub.match_id);
      await db
        .from("score_submissions")
        .update({ status: "approved", reviewed_by: admin.userId, reviewed_at: now })
        .eq("id", sub.id);
      await db
        .from("score_submissions")
        .update({ status: "superseded", reviewed_by: admin.userId, reviewed_at: now })
        .eq("match_id", sub.match_id)
        .eq("status", "pending")
        .neq("id", sub.id);

      approvedMatches.add(sub.match_id);
      approvedCount++;
    }

    if (approvedCount > 0) {
      await writeAuditLog({
        actor: admin.userId,
        action: "bulk_approve_submissions",
        entity: "results",
        after: { approvedCount },
      });
    }

    return NextResponse.json({ ok: true, approvedCount });
  }

  return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
}

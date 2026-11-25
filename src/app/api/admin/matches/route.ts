import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json()) as {
    matchId: string;
    action: "move_period" | "set_status";
    targetPeriodId?: string;
    status?: "scheduled" | "cancelled";
    reason?: string;
  };

  if (!body.matchId) {
    return NextResponse.json({ error: "Thiếu matchId." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: matchRow, error: mErr } = await db
    .from("matches")
    .select("id, period_id, status, periods(status, period_no)")
    .eq("id", body.matchId)
    .maybeSingle();

  if (mErr || !matchRow) {
    return NextResponse.json({ error: "Không tìm thấy trận đấu." }, { status: 404 });
  }

  if (body.action === "move_period") {
    if (!body.targetPeriodId) {
      return NextResponse.json({ error: "Thiếu kỳ đích." }, { status: 400 });
    }

    const currentPeriod = matchRow.periods as unknown as {
      status: string;
      period_no: number;
    } | null;

    if (currentPeriod?.status === "published" && !body.reason?.trim()) {
      return NextResponse.json(
        { error: "Kỳ hiện tại đã đăng lịch, bắt buộc phải nhập lý do khi chuyển trận." },
        { status: 400 }
      );
    }

    const { error: upErr } = await db
      .from("matches")
      .update({ period_id: body.targetPeriodId })
      .eq("id", matchRow.id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await writeAuditLog({
      actor: admin.userId,
      action: "move_match_period",
      entity: "matches",
      entityId: matchRow.id,
      before: { period_id: matchRow.period_id },
      after: { period_id: body.targetPeriodId },
      reason: body.reason?.trim() || null,
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "set_status") {
    if (body.status !== "scheduled" && body.status !== "cancelled") {
      return NextResponse.json({ error: "Trạng thái không hợp lệ." }, { status: 400 });
    }

    const { error: upErr } = await db
      .from("matches")
      .update({ status: body.status })
      .eq("id", matchRow.id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await writeAuditLog({
      actor: admin.userId,
      action: "update_match_status",
      entity: "matches",
      entityId: matchRow.id,
      before: { status: matchRow.status },
      after: { status: body.status },
      reason: body.reason?.trim() || null,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
}

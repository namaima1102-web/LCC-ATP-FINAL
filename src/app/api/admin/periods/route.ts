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
    periodId: string;
    action: "publish" | "update_dates";
    startsOn?: string;
    endsOn?: string;
  };

  if (!body.periodId) {
    return NextResponse.json({ error: "Thiếu periodId." }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: prev, error: fetchErr } = await db
    .from("periods")
    .select("id, season_id, period_no, name, starts_on, ends_on, status")
    .eq("id", body.periodId)
    .maybeSingle();

  if (fetchErr || !prev) {
    return NextResponse.json({ error: "Không tìm thấy kỳ." }, { status: 404 });
  }

  if (body.action === "publish") {
    if (prev.status !== "draft") {
      return NextResponse.json(
        { error: "Chỉ có thể đăng kỳ đang ở trạng thái nháp (draft)." },
        { status: 400 }
      );
    }

    const publishedAt = new Date().toISOString();
    const { error: upErr } = await db
      .from("periods")
      .update({ status: "published", published_at: publishedAt })
      .eq("id", prev.id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    // Chuyển mùa giải sang active nếu đang draft
    await db
      .from("seasons")
      .update({ status: "active" })
      .eq("id", prev.season_id)
      .eq("status", "draft");

    await writeAuditLog({
      actor: admin.userId,
      action: "publish_period",
      entity: "periods",
      entityId: prev.id,
      before: prev,
      after: { status: "published", published_at: publishedAt },
    });

    return NextResponse.json({ ok: true });
  }

  if (body.action === "update_dates") {
    if (!body.startsOn || !body.endsOn) {
      return NextResponse.json({ error: "Thiếu ngày bắt đầu hoặc kết thúc." }, { status: 400 });
    }

    const { error: upErr } = await db
      .from("periods")
      .update({ starts_on: body.startsOn, ends_on: body.endsOn })
      .eq("id", prev.id);

    if (upErr) {
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }

    await writeAuditLog({
      actor: admin.userId,
      action: "update_period_dates",
      entity: "periods",
      entityId: prev.id,
      before: { starts_on: prev.starts_on, ends_on: prev.ends_on },
      after: { starts_on: body.startsOn, ends_on: body.endsOn },
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Hành động không hợp lệ." }, { status: 400 });
}

import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import type { SeasonSettings } from "@/lib/domain/season-config";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json()) as {
    settings: Partial<SeasonSettings>;
    reason?: string;
  };

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return NextResponse.json({ error: "Chưa có mùa giải." }, { status: 404 });
  }

  const nextSettings: SeasonSettings = {
    ...ctx.season.settings,
    ...body.settings,
  };

  const db = createAdminClient();
  const { error } = await db
    .from("seasons")
    .update({ settings: nextSettings })
    .eq("id", ctx.season.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    actor: admin.userId,
    action: "update_season_settings",
    entity: "seasons",
    entityId: ctx.season.id,
    before: ctx.season.settings,
    after: nextSettings,
    reason: body.reason?.trim() || null,
  });

  return NextResponse.json({ ok: true, settings: nextSettings });
}

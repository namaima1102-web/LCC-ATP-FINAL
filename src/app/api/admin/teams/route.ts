import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import { calculateHandicap } from "@/lib/domain/handicap";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = await request.json();
  const db = createAdminClient();
  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return NextResponse.json({ error: "Chưa có mùa giải." }, { status: 404 });
  }

  // 1. Cập nhật đội (tên, màu)
  if (body.type === "team") {
    const { teamId, name, color } = body as {
      teamId: string;
      name: string;
      color: string;
    };
    if (!teamId || !name?.trim()) {
      return NextResponse.json({ error: "Tên đội không được trống." }, { status: 400 });
    }
    const prev = ctx.teams.find((t) => t.id === teamId);
    const { error } = await db
      .from("teams")
      .update({ name: name.trim(), color: color || null })
      .eq("id", teamId)
      .eq("season_id", ctx.season.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await writeAuditLog({
      actor: admin.userId,
      action: "update_team",
      entity: "teams",
      entityId: teamId,
      before: prev ?? null,
      after: { name: name.trim(), color },
    });

    return NextResponse.json({ ok: true });
  }

  // 2. Cập nhật tuyển thủ (điểm trình, đội, provisional, biệt danh)
  if (body.type === "player") {
    const { playerId, fullName, nickname, teamId, ratingStart, isProvisional } =
      body as {
        playerId: string;
        fullName: string;
        nickname: string | null;
        teamId: string;
        ratingStart: number;
        isProvisional: boolean;
      };

    if (!playerId || !fullName?.trim() || !teamId || Number.isNaN(Number(ratingStart))) {
      return NextResponse.json({ error: "Dữ liệu tuyển thủ không hợp lệ." }, { status: 400 });
    }

    const prev = ctx.players.find((p) => p.id === playerId);
    const nextRating = Number(ratingStart);

    const { error: pErr } = await db
      .from("players")
      .update({
        full_name: fullName.trim(),
        nickname: nickname?.trim() || null,
      })
      .eq("id", playerId);

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    const { error: spErr } = await db
      .from("season_players")
      .update({
        team_id: teamId,
        rating_start: nextRating,
        is_provisional: Boolean(isProvisional),
      })
      .eq("season_id", ctx.season.id)
      .eq("player_id", playerId);

    if (spErr) {
      return NextResponse.json({ error: spErr.message }, { status: 500 });
    }

    // Nếu điểm trình thay đổi, tính lại mã chấp cho các trận `scheduled` (chưa đấu)
    let recalculatedCount = 0;
    if (prev && prev.ratingStart !== nextRating) {
      const ratingByPlayer = new Map(
        ctx.players.map((p) => [p.id, p.id === playerId ? nextRating : p.ratingStart])
      );

      const { data: scheduledMatches } = await db
        .from("matches")
        .select("id, kind, match_sides(side, player_id)")
        .eq("season_id", ctx.season.id)
        .eq("status", "scheduled");

      for (const m of scheduledMatches ?? []) {
        const sides = (m.match_sides ?? []) as Array<{ side: string; player_id: string }>;
        const involved = sides.some((s) => s.player_id === playerId);
        if (!involved) continue;

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
          ctx.handicapRules,
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

        recalculatedCount++;
      }
    }

    await writeAuditLog({
      actor: admin.userId,
      action: "update_player",
      entity: "season_players",
      entityId: playerId,
      before: prev ?? null,
      after: {
        fullName: fullName.trim(),
        nickname: nickname?.trim() || null,
        teamId,
        ratingStart: nextRating,
        isProvisional: Boolean(isProvisional),
        recalculatedScheduledMatches: recalculatedCount,
      },
    });

    return NextResponse.json({ ok: true, recalculatedCount });
  }

  return NextResponse.json({ error: "Loại cập nhật không hỗ trợ." }, { status: 400 });
}

export async function POST(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json()) as {
    fullName: string;
    nickname?: string | null;
    teamId: string;
    ratingStart: number;
    isProvisional?: boolean;
  };

  if (!body.fullName?.trim() || !body.teamId || Number.isNaN(Number(body.ratingStart))) {
    return NextResponse.json({ error: "Vui lòng nhập đủ tên, đội và điểm trình." }, { status: 400 });
  }

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return NextResponse.json({ error: "Chưa có mùa giải." }, { status: 404 });
  }

  const db = createAdminClient();
  const { data: playerRow, error: pErr } = await db
    .from("players")
    .upsert(
      {
        full_name: body.fullName.trim(),
        nickname: body.nickname?.trim() || null,
        active: true,
      },
      { onConflict: "full_name" }
    )
    .select("id")
    .single();

  if (pErr || !playerRow) {
    return NextResponse.json({ error: pErr?.message ?? "Lỗi tạo tuyển thủ." }, { status: 500 });
  }

  const { error: spErr } = await db.from("season_players").upsert(
    {
      season_id: ctx.season.id,
      player_id: playerRow.id,
      team_id: body.teamId,
      rating_start: Number(body.ratingStart),
      is_provisional: Boolean(body.isProvisional),
    },
    { onConflict: "season_id,player_id" }
  );

  if (spErr) {
    return NextResponse.json({ error: spErr.message }, { status: 500 });
  }

  await writeAuditLog({
    actor: admin.userId,
    action: "add_player",
    entity: "season_players",
    entityId: playerRow.id,
    after: body,
  });

  return NextResponse.json({ ok: true, playerId: playerRow.id });
}

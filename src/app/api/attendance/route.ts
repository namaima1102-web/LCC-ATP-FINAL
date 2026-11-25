import { NextResponse } from "next/server";
import { getTodayVN } from "@/lib/domain/progress";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      seasonId?: string;
      playerId?: string;
      present?: boolean;
    };

    if (!body.seasonId || !body.playerId) {
      return NextResponse.json(
        { error: "Thiếu thông tin mùa giải hoặc tuyển thủ." },
        { status: 400 }
      );
    }

    const db = createAdminClient();
    const onDate = getTodayVN();

    if (body.present === false) {
      await db
        .from("attendance")
        .delete()
        .eq("season_id", body.seasonId)
        .eq("player_id", body.playerId)
        .eq("on_date", onDate);
    } else {
      const { error } = await db.from("attendance").upsert(
        {
          season_id: body.seasonId,
          player_id: body.playerId,
          on_date: onDate,
          checked_in_at: new Date().toISOString(),
        },
        { onConflict: "season_id,player_id,on_date" }
      );
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi check-in." },
      { status: 500 }
    );
  }
}

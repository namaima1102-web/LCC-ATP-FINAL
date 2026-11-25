import { NextResponse } from "next/server";
import { validateScore } from "@/lib/domain/handicap";
import { getTodayVN } from "@/lib/domain/progress";
import { DEFAULT_SEASON_SETTINGS, type SeasonSettings } from "@/lib/domain/season-config";
import { extractClientIp, hashIp, isRateLimited } from "@/lib/security/rate-limit";
import { createAdminClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let matchId = "";
    let submittedByPlayerId = "";
    let setsA = 0;
    let setsB = 0;
    let playedOn = getTodayVN();
    let note = "";
    let honeypot = "";
    let evidenceFile: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      matchId = String(form.get("matchId") ?? "");
      submittedByPlayerId = String(form.get("submittedByPlayerId") ?? "");
      setsA = Number(form.get("setsA"));
      setsB = Number(form.get("setsB"));
      playedOn = String(form.get("playedOn") || getTodayVN());
      note = String(form.get("note") ?? "");
      honeypot = String(form.get("website") ?? "");
      const fileVal = form.get("evidence");
      if (fileVal instanceof File && fileVal.size > 0) {
        evidenceFile = fileVal;
      }
    } else {
      const body = (await request.json()) as Record<string, unknown>;
      matchId = String(body.matchId ?? "");
      submittedByPlayerId = String(body.submittedByPlayerId ?? "");
      setsA = Number(body.setsA);
      setsB = Number(body.setsB);
      playedOn = String(body.playedOn || getTodayVN());
      note = String(body.note ?? "");
      honeypot = String(body.website ?? "");
    }

    // Chống bot (honeypot)
    if (honeypot.trim().length > 0) {
      return NextResponse.json(
        { error: "Yêu cầu không hợp lệ." },
        { status: 400 }
      );
    }

    if (!matchId || !submittedByPlayerId) {
      return NextResponse.json(
        { error: "Vui lòng chọn trận đấu và người gửi tỉ số." },
        { status: 400 }
      );
    }

    const db = createAdminClient();

    // Lấy thông tin trận đấu & cấu hình mùa
    const { data: matchRow, error: mErr } = await db
      .from("matches")
      .select("id, season_id, sets_to_win, status, seasons(settings)")
      .eq("id", matchId)
      .maybeSingle();

    if (mErr || !matchRow) {
      return NextResponse.json(
        { error: "Không tìm thấy trận đấu." },
        { status: 404 }
      );
    }

    if (matchRow.status === "played" || matchRow.status === "forfeit" || matchRow.status === "cancelled") {
      return NextResponse.json(
        { error: "Trận đấu này đã có kết quả chính thức hoặc đã hủy." },
        { status: 400 }
      );
    }

    const seasonSettings: SeasonSettings = {
      ...DEFAULT_SEASON_SETTINGS,
      ...(((matchRow.seasons as unknown as { settings?: Partial<SeasonSettings> })
        ?.settings) ?? {}),
    };

    // Kiểm tra tỉ số hợp lệ theo thể thức (AC5)
    const validation = validateScore(setsA, setsB, matchRow.sets_to_win);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Kiểm tra giới hạn tốc độ theo IP băm
    const ipHash = hashIp(extractClientIp(request));
    const limited = await isRateLimited(
      db,
      ipHash,
      seasonSettings.rate_limit_per_hour
    );
    if (limited) {
      return NextResponse.json(
        {
          error: `Bạn đã gửi quá ${seasonSettings.rate_limit_per_hour} lần trong 1 giờ. Vui lòng thử lại sau.`,
        },
        { status: 429 }
      );
    }

    // Upload ảnh bằng chứng nếu có
    let evidencePath: string | null = null;
    if (evidenceFile) {
      if (evidenceFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "Ảnh bằng chứng vượt quá dung lượng tối đa 5MB." },
          { status: 400 }
        );
      }
      const ext = evidenceFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${matchRow.season_id}/${matchId}/${Date.now()}.${ext}`;
      const buffer = Buffer.from(await evidenceFile.arrayBuffer());
      const { error: upErr } = await db.storage
        .from("evidence")
        .upload(filePath, buffer, {
          contentType: evidenceFile.type || "image/jpeg",
          upsert: false,
        });

      if (upErr) {
        return NextResponse.json(
          { error: `Lỗi tải ảnh bằng chứng: ${upErr.message}` },
          { status: 500 }
        );
      }
      evidencePath = filePath;
    }

    // Ghi bản gửi ở trạng thái pending (AC4: chưa thay đổi results/standings)
    const { data: inserted, error: insErr } = await db
      .from("score_submissions")
      .insert({
        match_id: matchId,
        submitted_by_player_id: submittedByPlayerId,
        sets_a: setsA,
        sets_b: setsB,
        evidence_path: evidencePath,
        note: note.trim() || null,
        played_on: playedOn,
        status: "pending",
        ip_hash: ipHash,
      })
      .select("id, status, created_at")
      .single();

    if (insErr || !inserted) {
      return NextResponse.json(
        { error: insErr?.message ?? "Không thể lưu bản gửi tỉ số." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      submissionId: inserted.id,
      status: inserted.status,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Lỗi máy chủ." },
      { status: 500 }
    );
  }
}

/**
 * Cho phép thiết bị đã gửi kiểm tra trạng thái & lý do từ chối (S12) qua ID bản gửi lưu ở localStorage.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get("ids") ?? "";
  const ids = idsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  if (ids.length === 0) {
    return NextResponse.json({ items: [] });
  }

  const db = createAdminClient();
  const { data } = await db
    .from("score_submissions")
    .select("id, status, review_note, sets_a, sets_b")
    .in("id", ids);

  return NextResponse.json({ items: data ?? [] });
}

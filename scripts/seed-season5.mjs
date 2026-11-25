import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    "Lỗi: Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const seedPath = path.resolve(process.cwd(), "seed/season5.json");
const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));

const defaultSettings = {
  subtitle: seed.season.subtitle ?? "Giải bóng bàn Gà Con · Mùa 5",
  singles_sets_to_win: 3,
  doubles_sets_to_win: 3,
  doubles_counts_for_team: true,
  doubles_diff_divisor: 2,
  handicap_pattern: "alternate",
  handicap_overflow_mode: "clamp_max",
  periods_count: 3,
  singles_mode: "all",
  balance_opponents: true,
  balance_handicap: false,
  submission_grace_hours: 48,
  alert_days_before: [3, 1, 0],
  alert_completion_threshold: 70,
  forfeit_counts_in_stats: true,
  tiebreak_order: ["head_to_head", "set_diff", "singles_wins"],
  rating_decrease_max_pct: 29,
  rating_increase_min_pct: 79,
  rating_calc_basis: "total",
  rating_min_matches: 8,
  rating_max_delta: 1,
  show_pending_score: false,
  rate_limit_per_hour: 10,
  tables_default: 2,
  tables_max: 4,
  avg_match_minutes: 18,
  weekly_target_mode: "even",
  allow_public_full_name: true,
  noindex: true,
};

async function run() {
  console.log(`Đang nạp dữ liệu ${seed.season.code} (${seed.season.name})...`);

  // 1. Upsert mùa giải
  const { data: seasonRow, error: seasonErr } = await supabase
    .from("seasons")
    .upsert(
      {
        code: seed.season.code,
        name: seed.season.name,
        status: seed.season.status ?? "draft",
        settings: defaultSettings,
      },
      { onConflict: "code" }
    )
    .select("id")
    .single();

  if (seasonErr || !seasonRow) {
    throw new Error(`Lỗi upsert seasons: ${seasonErr?.message}`);
  }
  const seasonId = seasonRow.id;

  // 2. Upsert 4 đội
  const teamIdByName = new Map();
  for (const team of seed.teams) {
    const { data: teamRow, error: teamErr } = await supabase
      .from("teams")
      .upsert(
        {
          season_id: seasonId,
          name: team.name,
          color: team.color,
          sort_order: team.sort_order,
        },
        { onConflict: "season_id,name" }
      )
      .select("id, name")
      .single();

    if (teamErr || !teamRow) {
      throw new Error(`Lỗi upsert team ${team.name}: ${teamErr?.message}`);
    }
    teamIdByName.set(teamRow.name, teamRow.id);
  }

  // 3. Upsert 16 tuyển thủ & gán vào season_players
  for (const p of seed.players) {
    const teamId = teamIdByName.get(p.team);
    if (!teamId) {
      throw new Error(`Không tìm thấy đội "${p.team}" cho ${p.full_name}`);
    }

    const { data: playerRow, error: playerErr } = await supabase
      .from("players")
      .upsert(
        {
          full_name: p.full_name,
          nickname: p.nickname,
          active: true,
        },
        { onConflict: "full_name" }
      )
      .select("id")
      .single();

    if (playerErr || !playerRow) {
      throw new Error(`Lỗi upsert player ${p.full_name}: ${playerErr?.message}`);
    }

    const { error: spErr } = await supabase.from("season_players").upsert(
      {
        season_id: seasonId,
        player_id: playerRow.id,
        team_id: teamId,
        rating_start: p.rating_start,
        is_provisional: Boolean(p.is_provisional),
      },
      { onConflict: "season_id,player_id" }
    );

    if (spErr) {
      throw new Error(`Lỗi upsert season_players ${p.full_name}: ${spErr.message}`);
    }
  }

  // 4. Upsert 13 dòng bảng chấp
  const handicapRows = seed.handicap_rules.map((r) => ({
    season_id: seasonId,
    diff: r.diff,
    singles_code: r.singles,
    doubles_code: r.doubles,
  }));

  const { error: hcErr } = await supabase
    .from("handicap_rules")
    .upsert(handicapRows, { onConflict: "season_id,diff" });

  if (hcErr) {
    throw new Error(`Lỗi upsert handicap_rules: ${hcErr.message}`);
  }

  // 5. Tạo 3 kỳ mặc định (2 tuần/kỳ = 6 tuần, trạng thái draft)
  const baseDate = new Date("2026-11-30T00:00:00Z");
  const periodRows = Array.from({ length: 3 }, (_, idx) => {
    const start = new Date(baseDate);
    start.setUTCDate(baseDate.getUTCDate() + idx * 14);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 13);
    return {
      season_id: seasonId,
      period_no: idx + 1,
      name: `Kỳ ${idx + 1}`,
      starts_on: start.toISOString().slice(0, 10),
      ends_on: end.toISOString().slice(0, 10),
      status: "draft",
    };
  });

  const { error: periodErr } = await supabase
    .from("periods")
    .upsert(periodRows, { onConflict: "season_id,period_no" });

  if (periodErr) {
    throw new Error(`Lỗi upsert periods: ${periodErr.message}`);
  }

  // Xóa kỳ dư (> 3) nếu đang draft và chưa có trận nào
  await supabase
    .from("periods")
    .delete()
    .eq("season_id", seasonId)
    .gt("period_no", 3)
    .eq("status", "draft");

  console.log(
    `Hoàn tất seed ${seed.season.code}: ${seed.teams.length} đội, ${seed.players.length} tuyển thủ, ${seed.handicap_rules.length} mức chấp, 3 kỳ.`
  );
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

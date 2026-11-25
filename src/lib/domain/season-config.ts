/**
 * Cấu hình mặc định của mùa giải (theo Phần 5, 6, 9, 15 của PRD).
 * Mọi luật giải đều đọc từ đây / cột `seasons.settings`, không viết cứng trong logic.
 */
export interface SeasonSettings {
  subtitle: string;
  singles_sets_to_win: number;
  doubles_sets_to_win: number;
  doubles_counts_for_team: boolean;
  doubles_diff_divisor: number;
  handicap_pattern: "alternate";
  handicap_overflow_mode: "clamp_max";
  periods_count: number;
  singles_mode: "all" | "limited";
  balance_opponents: boolean;
  balance_handicap: boolean;
  submission_grace_hours: number;
  alert_days_before: number[];
  alert_completion_threshold: number;
  forfeit_counts_in_stats: boolean;
  tiebreak_order: Array<"head_to_head" | "set_diff" | "singles_wins">;
  rating_decrease_max_pct: number;
  rating_increase_min_pct: number;
  rating_calc_basis: "total" | "singles";
  rating_min_matches: number;
  rating_max_delta: number;
  show_pending_score: boolean;
  rate_limit_per_hour: number;
  tables_default: number;
  tables_max: number;
  avg_match_minutes: number;
  weekly_target_mode: "even";
  allow_public_full_name: boolean;
  noindex: boolean;
}

export const DEFAULT_SEASON_SETTINGS: SeasonSettings = {
  subtitle: "Giải bóng bàn Gà Con · Mùa 5",
  singles_sets_to_win: 3,
  doubles_sets_to_win: 3,
  doubles_counts_for_team: true,
  doubles_diff_divisor: 2,
  handicap_pattern: "alternate",
  handicap_overflow_mode: "clamp_max",
  periods_count: 4,
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

import type { SeasonSettings } from "./season-config";

export interface RatingInputPlayer {
  playerId: string;
  fullName: string;
  ratingStart: number;
  singlesWins: number;
  singlesLosses: number;
  doublesWins: number;
  doublesLosses: number;
  /** Có thể truyền trực tiếp tỷ lệ thắng đã tính sẵn (ví dụ test ca Mùa 4). */
  overrideWinPct?: number;
}

export interface RatingSuggestion {
  playerId: string;
  fullName: string;
  fromRating: number;
  winPct: number;
  matchesConsidered: number;
  delta: number;
  ruleRating: number;
  eligible: boolean;
}

/**
 * Gợi ý điều chỉnh điểm cuối mùa theo cấu hình mùa giải (PRD mục 5.4).
 */
export function suggestRatingAdjustments(
  players: RatingInputPlayer[],
  settings: Pick<
    SeasonSettings,
    | "rating_decrease_max_pct"
    | "rating_increase_min_pct"
    | "rating_calc_basis"
    | "rating_min_matches"
    | "rating_max_delta"
  >
): RatingSuggestion[] {
  return players.map((p) => {
    const matchesConsidered =
      settings.rating_calc_basis === "singles"
        ? p.singlesWins + p.singlesLosses
        : p.singlesWins + p.singlesLosses + p.doublesWins + p.doublesLosses;

    const winsConsidered =
      settings.rating_calc_basis === "singles"
        ? p.singlesWins
        : p.singlesWins + p.doublesWins;

    const winPct =
      p.overrideWinPct !== undefined
        ? Math.round(p.overrideWinPct)
        : matchesConsidered > 0
          ? Math.round((winsConsidered / matchesConsidered) * 100)
          : 0;

    const eligible = matchesConsidered >= settings.rating_min_matches;

    let delta = 0;
    if (eligible) {
      if (winPct <= settings.rating_decrease_max_pct) {
        delta = -settings.rating_max_delta;
      } else if (winPct >= settings.rating_increase_min_pct) {
        delta = settings.rating_max_delta;
      }
    }

    return {
      playerId: p.playerId,
      fullName: p.fullName,
      fromRating: p.ratingStart,
      winPct,
      matchesConsidered,
      delta,
      ruleRating: p.ratingStart + delta,
      eligible,
    };
  });
}

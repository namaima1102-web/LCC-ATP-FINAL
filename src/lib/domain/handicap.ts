import type { SeasonSettings } from "./season-config";

export type MatchKind = "singles" | "doubles";
export type Side = "a" | "b";

export interface HandicapRule {
  diff: number;
  singlesCode: string;
  doublesCode: string;
}

export interface HandicapResult {
  diff: number;
  code: string;
  giver: Side | null;
}

export interface SetHandicap {
  setNo: number;
  points: number;
}

export type ScoreValidationResult =
  | { valid: true; winnerSide: Side }
  | { valid: false; error: string };

/**
 * Tính chênh điểm và tra mã chấp từ bảng `handicap_rules` theo cấu hình mùa.
 */
export function calculateHandicap(
  kind: MatchKind,
  ratingsA: number[],
  ratingsB: number[],
  rules: HandicapRule[],
  settings: Pick<
    SeasonSettings,
    "doubles_diff_divisor" | "handicap_overflow_mode"
  >
): HandicapResult {
  if (rules.length === 0) {
    throw new Error("Bảng chấp (handicap_rules) không được rỗng.");
  }

  const sumA = ratingsA.reduce((acc, r) => acc + r, 0);
  const sumB = ratingsB.reduce((acc, r) => acc + r, 0);

  const rawDiff =
    kind === "singles"
      ? Math.abs(sumA - sumB)
      : Math.abs((sumA - sumB) / settings.doubles_diff_divisor);

  const diff = Math.round(rawDiff * 10) / 10;
  const giver: Side | null = sumA > sumB ? "a" : sumB > sumA ? "b" : null;

  const sorted = [...rules].sort((a, b) => a.diff - b.diff);
  const maxRule = sorted[sorted.length - 1];

  let matched = sorted.find((r) => Math.abs(r.diff - diff) < 1e-6);

  if (!matched) {
    if (diff > maxRule.diff && settings.handicap_overflow_mode === "clamp_max") {
      matched = maxRule;
    } else {
      // Chọn mức chênh lớn nhất <= diff
      matched =
        [...sorted].reverse().find((r) => r.diff <= diff) ?? sorted[0];
    }
  }

  const code = kind === "singles" ? matched.singlesCode : matched.doublesCode;

  return {
    diff,
    code,
    giver,
  };
}

/**
 * Đọc số điểm chấp cho một set cụ thể (1-based: set 1..5).
 * Mặc định `alternate`: set lẻ dùng số đầu, set chẵn dùng số giữa.
 */
export function handicapPerSet(
  code: string,
  setIndex: number,
  pattern: SeasonSettings["handicap_pattern"] = "alternate"
): number {
  const parts = code.split("-").map((p) => Number(p.trim()));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Mã chấp không hợp lệ: "${code}"`);
  }

  if (pattern === "alternate") {
    return setIndex % 2 === 1 ? parts[0] : parts[1];
  }

  return parts[0];
}

/**
 * Trả về bảng điểm chấp cho từng set (1..maxSets) để hiển thị trên giao diện.
 */
export function getHandicapBreakdown(
  code: string,
  maxSets = 5,
  pattern: SeasonSettings["handicap_pattern"] = "alternate"
): SetHandicap[] {
  return Array.from({ length: maxSets }, (_, idx) => {
    const setNo = idx + 1;
    return {
      setNo,
      points: handicapPerSet(code, setNo, pattern),
    };
  });
}

/**
 * Kiểm tra tỉ số hợp lệ theo thể thức (ví dụ 5 set thắng 3: chỉ nhận 3-0, 3-1, 3-2).
 */
export function validateScore(
  setsA: number,
  setsB: number,
  setsToWin: number
): ScoreValidationResult {
  if (!Number.isInteger(setsA) || !Number.isInteger(setsB)) {
    return { valid: false, error: "Số set phải là số nguyên." };
  }

  if (setsA < 0 || setsB < 0) {
    return { valid: false, error: "Số set không được âm." };
  }

  if (setsA === setsB) {
    return { valid: false, error: "Tỉ số không thể hòa." };
  }

  const maxSet = Math.max(setsA, setsB);
  const minSet = Math.min(setsA, setsB);

  if (maxSet !== setsToWin || minSet >= setsToWin) {
    return {
      valid: false,
      error: `Tỉ số không hợp lệ theo thể thức thắng ${setsToWin} set (hợp lệ: ${setsToWin}-0, ${setsToWin}-1, ${setsToWin}-2).`,
    };
  }

  return {
    valid: true,
    winnerSide: setsA > setsB ? "a" : "b",
  };
}

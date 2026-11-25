import type { MatchKind } from "./handicap";
import type { SeasonSettings } from "./season-config";

export interface AttendanceRecord {
  playerId: string;
  checkedInAt: string; // ISO timestamp
}

export interface TonightMatchCandidate {
  id: string;
  kind: MatchKind;
  periodId: string;
  periodNo: number;
  periodEndsOn: string;
  handicapCode: string;
  sideAPlayerIds: string[];
  sideBPlayerIds: string[];
}

export interface TonightSuggestionResult {
  presentPlayerIds: string[];
  /** Các trận khả thi đồng thời ở lượt hiện tại (không trùng người - R6, tối đa theo số bàn). */
  recommendedNow: TonightMatchCandidate[];
  /** Toàn bộ các trận còn nợ mà mọi người tham gia đều đang có mặt. */
  allPlayable: TonightMatchCandidate[];
}

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

/**
 * Lọc danh sách người có mặt còn hiệu lực trong vòng 24 giờ (AC13).
 */
export function filterActiveAttendance(
  records: AttendanceRecord[],
  now: Date = new Date()
): string[] {
  const nowMs = now.getTime();
  const activeIds = new Set<string>();
  for (const r of records) {
    const t = new Date(r.checkedInAt).getTime();
    if (!Number.isNaN(t) && nowMs - t >= 0 && nowMs - t <= TWENTY_FOUR_HOURS_MS) {
      activeIds.add(r.playerId);
    }
  }
  return Array.from(activeIds);
}

/**
 * Gợi ý trận khả thi tối nay từ danh sách người đã check-in (PRD 6.9 & AC13).
 */
export function suggestTonightMatches(
  scheduledMatches: TonightMatchCandidate[],
  presentPlayerIds: string[],
  settings: Pick<SeasonSettings, "tables_default" | "tables_max">,
  tablesCount?: number
): TonightSuggestionResult {
  const presentSet = new Set(presentPlayerIds);

  // Đếm số trận nợ của mỗi VĐV
  const backlogByPlayer = new Map<string, number>();
  for (const m of scheduledMatches) {
    for (const pid of [...m.sideAPlayerIds, ...m.sideBPlayerIds]) {
      backlogByPlayer.set(pid, (backlogByPlayer.get(pid) ?? 0) + 1);
    }
  }

  // Chỉ giữ trận mà mọi người tham gia đều có mặt
  const allPlayable = scheduledMatches
    .filter((m) => {
      const participants = [...m.sideAPlayerIds, ...m.sideBPlayerIds];
      return (
        participants.length > 0 && participants.every((pid) => presentSet.has(pid))
      );
    })
    .sort((a, b) => {
      // 1. Ưu tiên kỳ sắp hết hạn
      if (a.periodEndsOn !== b.periodEndsOn) {
        return a.periodEndsOn.localeCompare(b.periodEndsOn);
      }
      // 2. Ưu tiên trận đôi (khó gom đủ 4 người hơn)
      if (a.kind !== b.kind) {
        return a.kind === "doubles" ? -1 : 1;
      }
      // 3. Ưu tiên người còn nhiều trận nợ nhất
      const maxBacklogA = Math.max(
        ...[...a.sideAPlayerIds, ...a.sideBPlayerIds].map(
          (id) => backlogByPlayer.get(id) ?? 0
        )
      );
      const maxBacklogB = Math.max(
        ...[...b.sideAPlayerIds, ...b.sideBPlayerIds].map(
          (id) => backlogByPlayer.get(id) ?? 0
        )
      );
      return maxBacklogB - maxBacklogA;
    });

  // Chọn các trận đồng thời không trùng người (R6), giới hạn theo số bàn
  const maxConcurrent = Math.min(
    tablesCount ?? settings.tables_default,
    settings.tables_max
  );
  const busyPlayers = new Set<string>();
  const recommendedNow: TonightMatchCandidate[] = [];

  for (const m of allPlayable) {
    if (recommendedNow.length >= maxConcurrent) break;
    const participants = [...m.sideAPlayerIds, ...m.sideBPlayerIds];
    if (participants.some((pid) => busyPlayers.has(pid))) continue;

    recommendedNow.push(m);
    for (const pid of participants) busyPlayers.add(pid);
  }

  return {
    presentPlayerIds,
    recommendedNow,
    allPlayable,
  };
}

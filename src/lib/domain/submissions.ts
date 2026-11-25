export interface PendingSubmissionLite {
  id: string;
  matchId: string;
  setsA: number;
  setsB: number;
  status: string;
}

/**
 * Xác định các trận có bản gửi chờ duyệt xung đột (AC7):
 * Một trận có >= 2 bản `pending` khác nhau về bên thắng (A thắng vs B thắng).
 */
export function detectConflictMatchIds(
  submissions: PendingSubmissionLite[]
): Set<string> {
  const winnersByMatch = new Map<string, Set<"a" | "b">>();

  for (const s of submissions) {
    if (s.status !== "pending") continue;
    const winner: "a" | "b" | null =
      s.setsA > s.setsB ? "a" : s.setsB > s.setsA ? "b" : null;
    if (!winner) continue;

    let set = winnersByMatch.get(s.matchId);
    if (!set) {
      set = new Set();
      winnersByMatch.set(s.matchId, set);
    }
    set.add(winner);
  }

  const conflicts = new Set<string>();
  for (const [matchId, winners] of winnersByMatch.entries()) {
    if (winners.size > 1) {
      conflicts.add(matchId);
    }
  }
  return conflicts;
}

export interface ForfeitCandidateMatch {
  id: string;
  periodId: string;
  status: string;
}

/**
 * Lọc danh sách "trận cần xử" khi hết kỳ (AC15):
 * Trận ở trạng thái `scheduled` và KHÔNG có bản gửi `pending` nào.
 */
export function filterForfeitCandidates<T extends ForfeitCandidateMatch>(
  matches: T[],
  pendingMatchIds: Set<string>
): T[] {
  return matches.filter(
    (m) => m.status === "scheduled" && !pendingMatchIds.has(m.id)
  );
}

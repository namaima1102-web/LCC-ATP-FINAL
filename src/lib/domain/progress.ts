import type { MatchKind } from "./handicap";
import type { SeasonSettings } from "./season-config";

export interface ProgressPeriod {
  id: string;
  periodNo: number;
  name: string | null;
  startsOn: string; // YYYY-MM-DD
  endsOn: string;   // YYYY-MM-DD
  status: "draft" | "published" | "closed";
}

export interface ProgressMatch {
  id: string;
  periodId: string;
  kind: MatchKind;
  status: "scheduled" | "played" | "forfeit" | "cancelled";
  sideAPlayerIds: string[];
  sideBPlayerIds: string[];
}

export interface ProgressPlayer {
  id: string;
  fullName: string;
  nickname: string | null;
  teamId: string;
}

export interface ProgressTeam {
  id: string;
  name: string;
  color: string | null;
}

export interface PlayerBacklogItem {
  playerId: string;
  fullName: string;
  nickname: string | null;
  teamId: string;
  singlesBacklog: number;
  doublesBacklog: number;
  totalBacklog: number;
  matchIds: string[];
}

export interface TeamBacklogItem {
  teamId: string;
  teamName: string;
  color: string | null;
  backlogCount: number;
}

export interface PeriodProgressSummary {
  period: ProgressPeriod;
  totalMatches: number;
  completedMatches: number;
  backlogCount: number;
  completionPct: number;
  isSlow: boolean; // true = Đỏ (< alert_completion_threshold), false = Vàng
  daysLeft: number;
  shouldAlert: boolean;
  playerBacklog: PlayerBacklogItem[];
  teamBacklog: TeamBacklogItem[];
}

/**
 * Định dạng YYYY-MM-DD sang dd/MM/yyyy.
 */
export function formatDateVN(ymd: string): string {
  const parts = ymd.split("-");
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

/**
 * Lấy ngày hiện tại theo múi giờ Asia/Ho_Chi_Minh dạng YYYY-MM-DD.
 */
export function getTodayVN(now: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(now);
}

/**
 * Số ngày chênh lệch (toYmd - fromYmd).
 */
export function diffDaysVN(fromYmd: string, toYmd: string): number {
  const [fy, fm, fd] = fromYmd.split("-").map(Number);
  const [ty, tm, td] = toYmd.split("-").map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/**
 * Tính tiến độ, mức cảnh báo và danh sách trận tồn cho một kỳ (PRD 6.8 & A11).
 */
export function computePeriodProgress(
  period: ProgressPeriod,
  allMatches: ProgressMatch[],
  players: ProgressPlayer[],
  teams: ProgressTeam[],
  settings: Pick<
    SeasonSettings,
    "alert_days_before" | "alert_completion_threshold"
  >,
  todayYmd: string = getTodayVN()
): PeriodProgressSummary {
  const periodMatches = allMatches.filter(
    (m) => m.periodId === period.id && m.status !== "cancelled"
  );

  const totalMatches = periodMatches.length;
  const completedMatches = periodMatches.filter(
    (m) => m.status === "played" || m.status === "forfeit"
  ).length;
  const scheduledMatches = periodMatches.filter((m) => m.status === "scheduled");
  const backlogCount = scheduledMatches.length;

  const completionPct =
    totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;

  const isSlow = completionPct < settings.alert_completion_threshold;
  const daysLeft = diffDaysVN(todayYmd, period.endsOn);

  const maxAlertDays =
    settings.alert_days_before.length > 0
      ? Math.max(...settings.alert_days_before)
      : 3;

  const shouldAlert =
    period.status === "published" &&
    backlogCount > 0 &&
    daysLeft >= 0 &&
    daysLeft <= maxAlertDays;

  const playerMap = new Map<string, PlayerBacklogItem>();
  for (const p of players) {
    playerMap.set(p.id, {
      playerId: p.id,
      fullName: p.fullName,
      nickname: p.nickname,
      teamId: p.teamId,
      singlesBacklog: 0,
      doublesBacklog: 0,
      totalBacklog: 0,
      matchIds: [],
    });
  }

  const teamBacklogCount = new Map<string, number>();
  for (const t of teams) teamBacklogCount.set(t.id, 0);

  for (const m of scheduledMatches) {
    const involvedTeams = new Set<string>();
    for (const pid of [...m.sideAPlayerIds, ...m.sideBPlayerIds]) {
      const item = playerMap.get(pid);
      if (!item) continue;
      if (m.kind === "singles") item.singlesBacklog++;
      else item.doublesBacklog++;
      item.totalBacklog++;
      item.matchIds.push(m.id);
      involvedTeams.add(item.teamId);
    }
    for (const tid of involvedTeams) {
      teamBacklogCount.set(tid, (teamBacklogCount.get(tid) ?? 0) + 1);
    }
  }

  const playerBacklog = Array.from(playerMap.values())
    .filter((p) => p.totalBacklog > 0)
    .sort((a, b) => b.totalBacklog - a.totalBacklog || a.fullName.localeCompare(b.fullName, "vi"));

  const teamBacklog = teams
    .map((t) => ({
      teamId: t.id,
      teamName: t.name,
      color: t.color,
      backlogCount: teamBacklogCount.get(t.id) ?? 0,
    }))
    .sort((a, b) => b.backlogCount - a.backlogCount);

  return {
    period,
    totalMatches,
    completedMatches,
    backlogCount,
    completionPct,
    isSlow,
    daysLeft,
    shouldAlert,
    playerBacklog,
    teamBacklog,
  };
}

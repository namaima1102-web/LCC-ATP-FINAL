"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getHandicapBreakdown } from "@/lib/domain/handicap";
import { formatDateVN } from "@/lib/domain/progress";

interface PeriodOption {
  id: string;
  periodNo: number;
  name: string | null;
  startsOn: string;
  endsOn: string;
  status: string;
}

interface TeamOption {
  id: string;
  name: string;
  color: string | null;
}

interface PlayerOption {
  id: string;
  fullName: string;
  teamId: string;
}

interface MatchItem {
  id: string;
  kind: "singles" | "doubles";
  periodId: string;
  status: "scheduled" | "played" | "forfeit" | "cancelled";
  handicapCode: string;
  handicapGiver: "a" | "b" | null;
  sideAPlayerIds: string[];
  sideBPlayerIds: string[];
  teamAId: string;
  teamBId: string;
  setsA?: number;
  setsB?: number;
  isForfeit?: boolean;
  hasPending: boolean;
  hasConflict: boolean;
}

export function ScheduleBrowser({
  periods,
  teams,
  players,
  matches,
}: {
  periods: PeriodOption[];
  teams: TeamOption[];
  players: PlayerOption[];
  matches: MatchItem[];
}) {
  const defaultPeriod =
    periods.find((p) => p.status === "published")?.id ??
    periods[0]?.id ??
    "all";

  const [periodId, setPeriodId] = useState<string>(defaultPeriod);
  const [teamId, setTeamId] = useState<string>("all");
  const [playerId, setPlayerId] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);
  const periodMap = useMemo(
    () => new Map(periods.map((p) => [p.id, p])),
    [periods]
  );

  const selectedPeriod = periodMap.get(periodId);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (periodId !== "all" && m.periodId !== periodId) return false;
      if (teamId !== "all" && m.teamAId !== teamId && m.teamBId !== teamId)
        return false;
      if (
        playerId !== "all" &&
        !m.sideAPlayerIds.includes(playerId) &&
        !m.sideBPlayerIds.includes(playerId)
      ) {
        return false;
      }
      if (kind !== "all" && m.kind !== kind) return false;
      if (status !== "all" && m.status !== status) return false;
      return true;
    });
  }, [matches, periodId, teamId, playerId, kind, status]);

  if (periods.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-muted)]">
        Ban Tổ Chức chưa đăng lịch kỳ nào. Vui lòng quay lại sau khi Kỳ 1 được
        công bố.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Bộ lọc */}
      <div className="grid grid-cols-2 gap-2.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 sm:p-4 lg:grid-cols-5">
        <select
          aria-label="Lọc theo kỳ"
          value={periodId}
          onChange={(e) => setPeriodId(e.target.value)}
          className="col-span-2 h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-xs font-semibold lg:col-span-1"
        >
          <option value="all">Tất cả kỳ đã đăng</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name || `Kỳ ${p.periodNo}`} (hạn {formatDateVN(p.endsOn)})
            </option>
          ))}
        </select>

        <select
          aria-label="Lọc theo đội"
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-xs font-semibold"
        >
          <option value="all">Tất cả đội</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Lọc theo tuyển thủ"
          value={playerId}
          onChange={(e) => setPlayerId(e.target.value)}
          className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-xs font-semibold"
        >
          <option value="all">Tất cả tuyển thủ</option>
          {players.map((p) => (
            <option key={p.id} value={p.id}>
              {p.fullName}
            </option>
          ))}
        </select>

        <select
          aria-label="Lọc loại trận"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-xs font-semibold"
        >
          <option value="all">Đơn & Đôi</option>
          <option value="singles">Chỉ đơn</option>
          <option value="doubles">Chỉ đôi</option>
        </select>

        <select
          aria-label="Lọc trạng thái"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-xs font-semibold"
        >
          <option value="all">Mọi trạng thái</option>
          <option value="scheduled">Chưa đấu</option>
          <option value="played">Đã có kết quả</option>
          <option value="forfeit">Xử thua</option>
        </select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
        <span>
          Hiển thị <strong>{filtered.length}</strong> trận đấu
        </span>
        {selectedPeriod && (
          <span>
            {selectedPeriod.name || `Kỳ ${selectedPeriod.periodNo}`}:{" "}
            {formatDateVN(selectedPeriod.startsOn)} –{" "}
            <strong>{formatDateVN(selectedPeriod.endsOn)}</strong>
          </span>
        )}
      </div>

      {/* Danh sách trận */}
      <div className="grid gap-3 md:grid-cols-2">
        {filtered.map((m) => {
          const sideANames = m.sideAPlayerIds
            .map((id) => playerMap.get(id)?.fullName ?? "?")
            .join(" + ");
          const sideBNames = m.sideBPlayerIds
            .map((id) => playerMap.get(id)?.fullName ?? "?")
            .join(" + ");
          const teamA = teamMap.get(m.teamAId);
          const teamB = teamMap.get(m.teamBId);
          const breakdown = getHandicapBreakdown(m.handicapCode, 5);
          const giverText =
            m.handicapGiver === "a"
              ? `${sideANames} chấp`
              : m.handicapGiver === "b"
                ? `${sideBNames} chấp`
                : "Ngang nhau";

          return (
            <Link
              key={m.id}
              href={`/matches/${m.id}`}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
            >
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-md bg-[var(--brand-purple)]/15 px-2 py-0.5 font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                      {m.kind === "singles" ? "Đơn" : "Đôi"}
                    </span>
                    <span className="text-[var(--text-muted)]">
                      Kỳ {periodMap.get(m.periodId)?.periodNo ?? "?"}
                    </span>
                    {m.hasPending && (
                      <span className="rounded-full bg-[var(--brand-orange)]/20 px-2 py-0.5 font-bold text-[#b45309] dark:text-[var(--brand-yellow)]">
                        {m.hasConflict ? "Xung đột" : "Chờ duyệt"}
                      </span>
                    )}
                  </div>

                  {m.status === "played" || m.status === "forfeit" ? (
                    <span className="rounded-lg bg-emerald-500/15 px-2.5 py-0.5 font-extrabold text-emerald-700 dark:text-emerald-300">
                      {m.setsA}-{m.setsB}
                      {m.isForfeit ? " (Xử)" : ""}
                    </span>
                  ) : m.status === "cancelled" ? (
                    <span className="text-red-500">Đã hủy</span>
                  ) : (
                    <span className="text-[var(--brand-blue)]">Chưa đấu</span>
                  )}
                </div>

                <div className="mt-2.5 flex flex-col gap-1 text-sm font-bold">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: teamA?.color ?? "#2B6FD6" }}
                    />
                    <span className="truncate">{sideANames}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: teamB?.color ?? "#D99A12" }}
                    />
                    <span className="truncate">{sideBNames}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-[var(--bg-page)] px-3 py-2 text-xs">
                <p className="font-semibold">
                  Mã chấp: <strong>{m.handicapCode}</strong> ·{" "}
                  <span className="text-[var(--text-muted)]">{giverText}</span>
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                  {breakdown.map((s) => `S${s.setNo}: ${s.points}`).join(" · ")}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

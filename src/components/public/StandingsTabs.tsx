"use client";

import Link from "next/link";
import { Fragment, useState } from "react";
import type {
  PairStats,
  PlayerStats,
  TeamStanding,
} from "@/lib/domain/standings";

interface TeamRef {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
}

export function StandingsTabs({
  teams,
  teamStandings,
  playerStats,
  pairStats,
  playerNames,
  teamMap,
  playerTotalScheduled,
  decreaseThresholdPct,
  increaseThresholdPct,
}: {
  teams: TeamRef[];
  teamStandings: TeamStanding[];
  playerStats: PlayerStats[];
  pairStats: PairStats[];
  playerNames: Record<string, string>;
  teamMap: Record<string, { name: string; color: string | null }>;
  playerTotalScheduled: Record<string, number>;
  decreaseThresholdPct: number;
  increaseThresholdPct: number;
}) {
  const [tab, setTab] = useState<"summary" | "teams" | "players" | "pairs">(
    "summary"
  );
  const [playerSort, setPlayerSort] = useState<
    "total" | "singles" | "doubles" | "pct"
  >("total");

  const sortedPlayers = [...playerStats].sort((a, b) => {
    if (playerSort === "singles")
      return b.singlesWins - a.singlesWins || b.winPct - a.winPct;
    if (playerSort === "doubles")
      return b.doublesWins - a.doublesWins || b.winPct - a.winPct;
    if (playerSort === "pct")
      return b.winPct - a.winPct || b.totalWins - a.totalWins;
    return b.totalWins - a.totalWins || b.winPct - a.winPct;
  });

  const teamStandingMap = new Map(teamStandings.map((t) => [t.teamId, t]));

  const pctBadgeClass = (pct: number, played: number) => {
    if (played === 0) return "text-[var(--text-muted)]";
    if (pct >= increaseThresholdPct)
      return "font-extrabold text-emerald-600 dark:text-emerald-400";
    if (pct <= decreaseThresholdPct)
      return "font-bold text-red-600 dark:text-red-400";
    return "font-semibold";
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTab("summary")}
          className={`h-10 rounded-xl px-4 text-xs font-bold transition ${
            tab === "summary"
              ? "bg-[var(--brand-purple)] text-white"
              : "border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          }`}
        >
          Tổng hợp chi tiết
        </button>
        <button
          type="button"
          onClick={() => setTab("teams")}
          className={`h-10 rounded-xl px-4 text-xs font-bold transition ${
            tab === "teams"
              ? "bg-[var(--brand-purple)] text-white"
              : "border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          }`}
        >
          Đội ({teamStandings.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("players")}
          className={`h-10 rounded-xl px-4 text-xs font-bold transition ${
            tab === "players"
              ? "bg-[var(--brand-purple)] text-white"
              : "border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          }`}
        >
          Cá nhân ({playerStats.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("pairs")}
          className={`h-10 rounded-xl px-4 text-xs font-bold transition ${
            tab === "pairs"
              ? "bg-[var(--brand-purple)] text-white"
              : "border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          }`}
        >
          Cặp đôi ({pairStats.length})
        </button>
      </div>

      {tab === "summary" && (
        <div className="flex flex-col gap-5">
          {/* Bảng đóng góp theo 4 đội (giống mẫu Ảnh 2) */}
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {teams.map((team) => {
              const members = playerStats
                .filter((p) => p.teamId === team.id)
                .sort((a, b) => b.ratingStart - a.ratingStart);
              const ts = teamStandingMap.get(team.id);
              const teamSinglesWins = ts?.singlesWins ?? 0;
              const teamDoublesWins = Math.max(
                0,
                (ts?.points ?? 0) - teamSinglesWins
              );

              return (
                <div
                  key={team.id}
                  className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
                >
                  <div
                    className="flex items-center justify-between px-3.5 py-2.5 text-xs font-extrabold text-white"
                    style={{ backgroundColor: team.color ?? "#2B6FD6" }}
                  >
                    <span>{team.name}</span>
                    <span>Tổng: {ts?.points ?? 0} điểm</span>
                  </div>
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-page)] text-[11px] text-[var(--text-muted)]">
                        <th className="px-2.5 py-1.5">#</th>
                        <th className="px-2 py-1.5">Thành viên</th>
                        <th className="px-2 py-1.5 text-center">Thắng Đơn</th>
                        <th className="px-2.5 py-1.5 text-center">Thắng Đôi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m, i) => (
                        <tr
                          key={m.playerId}
                          className="border-b border-[var(--border-subtle)]/50"
                        >
                          <td className="px-2.5 py-2 text-[var(--text-muted)]">
                            {i + 1}
                          </td>
                          <td className="px-2 py-2 font-bold">
                            <Link
                              href={`/players/${m.playerId}`}
                              className="hover:text-[var(--brand-purple)] hover:underline"
                            >
                              {m.fullName}
                            </Link>
                          </td>
                          <td className="px-2 py-2 text-center">
                            {m.singlesWins}
                          </td>
                          <td className="px-2.5 py-2 text-center">
                            {m.doublesWins}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-[var(--bg-page)] font-extrabold">
                        <td className="px-2.5 py-2" colSpan={2}>
                          Điểm đội (Đơn / Đôi)
                        </td>
                        <td className="px-2 py-2 text-center">
                          {teamSinglesWins}
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          {teamDoublesWins}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              );
            })}
          </section>

          {/* Bảng tổng hợp chi tiết từng tuyển thủ nhóm theo đội (giống mẫu Ảnh 1) */}
          <section className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <h2 className="mb-3 text-sm font-extrabold">
              Bảng tổng hợp chi tiết theo đội & tuyển thủ
            </h2>
            <table className="w-full min-w-[780px] text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--brand-navy)] text-white">
                  <th className="rounded-tl-lg px-2.5 py-2.5">STT</th>
                  <th className="px-2.5 py-2.5">Tuyển thủ</th>
                  <th className="px-2 py-2.5 text-center">Đã đấu</th>
                  <th className="px-2 py-2.5 text-center">Còn lại</th>
                  <th className="px-2 py-2.5 text-center">% Mùa giải</th>
                  <th className="px-2 py-2.5 text-center">Đơn đấu</th>
                  <th className="px-2 py-2.5 text-center">Thắng</th>
                  <th className="px-2 py-2.5 text-center">% Đơn</th>
                  <th className="px-2 py-2.5 text-center">Đôi đấu</th>
                  <th className="px-2 py-2.5 text-center">Thắng</th>
                  <th className="px-2 py-2.5 text-center">% Đôi</th>
                  <th className="rounded-tr-lg px-2.5 py-2.5 text-center">
                    Điểm trình
                  </th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team) => {
                  const members = playerStats
                    .filter((p) => p.teamId === team.id)
                    .sort((a, b) => b.ratingStart - a.ratingStart);

                  const teamTotalMatches = members.reduce(
                    (s, m) => s + m.totalMatches,
                    0
                  );
                  const teamSinglesPlayed = members.reduce(
                    (s, m) => s + m.singlesWins + m.singlesLosses,
                    0
                  );
                  const teamSinglesWins = members.reduce(
                    (s, m) => s + m.singlesWins,
                    0
                  );
                  const teamDoublesPlayed = members.reduce(
                    (s, m) => s + m.doublesWins + m.doublesLosses,
                    0
                  );
                  const teamDoublesWins = members.reduce(
                    (s, m) => s + m.doublesWins,
                    0
                  );
                  const teamTotalWins = teamSinglesWins + teamDoublesWins;
                  const teamRemaining = members.reduce((s, m) => {
                    const goal = playerTotalScheduled[m.playerId] ?? 21;
                    return s + Math.max(0, goal - m.totalMatches);
                  }, 0);

                  const teamWinPct =
                    teamTotalMatches > 0
                      ? Math.round((teamTotalWins / teamTotalMatches) * 100)
                      : 0;
                  const teamSinglesPct =
                    teamSinglesPlayed > 0
                      ? Math.round((teamSinglesWins / teamSinglesPlayed) * 100)
                      : 0;
                  const teamDoublesPct =
                    teamDoublesPlayed > 0
                      ? Math.round((teamDoublesWins / teamDoublesPlayed) * 100)
                      : 0;

                  return (
                    <Fragment key={team.id}>
                      <tr
                        className="border-y border-[var(--border-subtle)] font-extrabold"
                        style={{
                          backgroundColor: `${team.color ?? "#2B6FD6"}22`,
                        }}
                      >
                        <td className="px-2.5 py-2" colSpan={2}>
                          <span className="inline-flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: team.color ?? "#2B6FD6",
                              }}
                            />
                            {team.name}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center">
                          {teamTotalMatches}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {teamRemaining}
                        </td>
                        <td className="px-2 py-2 text-center">{teamWinPct}%</td>
                        <td className="px-2 py-2 text-center">
                          {teamSinglesPlayed}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {teamSinglesWins}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {teamSinglesPct}%
                        </td>
                        <td className="px-2 py-2 text-center">
                          {teamDoublesPlayed}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {teamDoublesWins}
                        </td>
                        <td className="px-2 py-2 text-center">
                          {teamDoublesPct}%
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          {teamStandingMap.get(team.id)?.points ?? 0}đ đội
                        </td>
                      </tr>

                      {members.map((m, idx) => {
                        const singlesPlayed = m.singlesWins + m.singlesLosses;
                        const doublesPlayed = m.doublesWins + m.doublesLosses;
                        const singlesPct =
                          singlesPlayed > 0
                            ? Math.round((m.singlesWins / singlesPlayed) * 100)
                            : 0;
                        const doublesPct =
                          doublesPlayed > 0
                            ? Math.round((m.doublesWins / doublesPlayed) * 100)
                            : 0;
                        const goal = playerTotalScheduled[m.playerId] ?? 21;
                        const remaining = Math.max(0, goal - m.totalMatches);

                        return (
                          <tr
                            key={m.playerId}
                            className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-page)]"
                          >
                            <td className="px-2.5 py-2 text-[var(--text-muted)]">
                              {idx + 1}
                            </td>
                            <td className="px-2.5 py-2 font-bold">
                              <Link
                                href={`/players/${m.playerId}`}
                                className="hover:text-[var(--brand-purple)] hover:underline"
                              >
                                {m.fullName}
                              </Link>
                            </td>
                            <td className="px-2 py-2 text-center">
                              {m.totalMatches}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {remaining}
                            </td>
                            <td
                              className={`px-2 py-2 text-center ${pctBadgeClass(
                                m.winPct,
                                m.totalMatches
                              )}`}
                            >
                              {m.winPct}%
                            </td>
                            <td className="px-2 py-2 text-center">
                              {singlesPlayed}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {m.singlesWins}
                            </td>
                            <td
                              className={`px-2 py-2 text-center ${pctBadgeClass(
                                singlesPct,
                                singlesPlayed
                              )}`}
                            >
                              {singlesPct}%
                            </td>
                            <td className="px-2 py-2 text-center">
                              {doublesPlayed}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {m.doublesWins}
                            </td>
                            <td
                              className={`px-2 py-2 text-center ${pctBadgeClass(
                                doublesPct,
                                doublesPlayed
                              )}`}
                            >
                              {doublesPct}%
                            </td>
                            <td className="px-2.5 py-2 text-center font-extrabold">
                              {m.ratingStart}
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {tab === "teams" && (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                <th className="py-2 pr-2">#</th>
                <th className="py-2 pr-3">Đội</th>
                <th className="px-2 py-2 text-center">Trận</th>
                <th className="px-2 py-2 text-center">Thắng</th>
                <th className="px-2 py-2 text-center">Thua</th>
                <th className="px-2 py-2 text-center">Đơn thắng</th>
                <th className="px-2 py-2 text-center">HS Set</th>
                <th className="py-2 pl-2 text-right">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {teamStandings.map((t, idx) => (
                <tr
                  key={t.teamId}
                  className="border-b border-[var(--border-subtle)]/60 last:border-0"
                >
                  <td className="py-3 pr-2 font-bold text-[var(--text-muted)]">
                    {idx + 1}
                  </td>
                  <td className="py-3 pr-3 font-bold">
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: t.color ?? "#2B6FD6" }}
                      />
                      {t.teamName}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-center">{t.played}</td>
                  <td className="px-2 py-3 text-center">{t.wins}</td>
                  <td className="px-2 py-3 text-center">{t.losses}</td>
                  <td className="px-2 py-3 text-center">{t.singlesWins}</td>
                  <td className="px-2 py-3 text-center">
                    {t.setDiff > 0 ? `+${t.setDiff}` : t.setDiff}
                  </td>
                  <td className="py-3 pl-2 text-right font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                    {t.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "players" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-[var(--text-muted)]">Sắp xếp:</span>
            {[
              { key: "total", label: "Tổng thắng" },
              { key: "singles", label: "Đơn thắng" },
              { key: "doubles", label: "Đôi thắng" },
              { key: "pct", label: "Tỷ lệ %" },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() =>
                  setPlayerSort(s.key as "total" | "singles" | "doubles" | "pct")
                }
                className={`rounded-lg px-2.5 py-1 font-semibold ${
                  playerSort === s.key
                    ? "bg-[var(--brand-blue)] text-white"
                    : "border border-[var(--border-subtle)] bg-[var(--bg-card)]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-3">Tuyển thủ</th>
                  <th className="px-2 py-2 text-center">Điểm</th>
                  <th className="px-2 py-2 text-center">Đơn</th>
                  <th className="px-2 py-2 text-center">Đôi</th>
                  <th className="px-2 py-2 text-center">Tổng</th>
                  <th className="py-2 pl-2 text-right">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((p, idx) => {
                  const tm = teamMap[p.teamId];
                  return (
                    <tr
                      key={p.playerId}
                      className="border-b border-[var(--border-subtle)]/60 last:border-0"
                    >
                      <td className="py-2.5 pr-2 text-xs font-bold text-[var(--text-muted)]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 pr-3">
                        <Link
                          href={`/players/${p.playerId}`}
                          className="inline-flex items-center gap-2 font-bold hover:text-[var(--brand-purple)] hover:underline"
                        >
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: tm?.color ?? "#2B6FD6" }}
                          />
                          <span>{p.fullName}</span>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-center">{p.ratingStart}</td>
                      <td className="px-2 py-2.5 text-center">
                        {p.singlesWins}-{p.singlesLosses}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        {p.doublesWins}-{p.doublesLosses}
                      </td>
                      <td className="px-2 py-2.5 text-center font-bold">
                        {p.totalWins}-{p.totalLosses}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                        {p.winPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "pairs" && (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          {pairStats.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Chưa có trận đôi nào có kết quả chính thức.
            </p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                  <th className="py-2 pr-2">#</th>
                  <th className="py-2 pr-3">Cặp đôi</th>
                  <th className="px-2 py-2 text-center">Trận</th>
                  <th className="px-2 py-2 text-center">Thắng-Thua</th>
                  <th className="py-2 pl-2 text-right">Tỷ lệ</th>
                </tr>
              </thead>
              <tbody>
                {pairStats.map((pr, idx) => {
                  const tm = teamMap[pr.teamId];
                  return (
                    <tr
                      key={`${pr.player1Id}-${pr.player2Id}`}
                      className="border-b border-[var(--border-subtle)]/60 last:border-0"
                    >
                      <td className="py-2.5 pr-2 text-xs font-bold text-[var(--text-muted)]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 pr-3 font-bold">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: tm?.color ?? "#2B6FD6" }}
                          />
                          <span>
                            {playerNames[pr.player1Id] ?? "?"} +{" "}
                            {playerNames[pr.player2Id] ?? "?"}
                          </span>
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center">{pr.played}</td>
                      <td className="px-2 py-2.5 text-center">
                        {pr.wins}-{pr.losses}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                        {pr.winPct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

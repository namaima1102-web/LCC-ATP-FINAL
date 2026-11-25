"use client";

import Link from "next/link";
import { useState } from "react";
import type {
  PairStats,
  PlayerStats,
  TeamStanding,
} from "@/lib/domain/standings";

export function StandingsTabs({
  teamStandings,
  playerStats,
  pairStats,
  playerNames,
  teamMap,
}: {
  teamStandings: TeamStanding[];
  playerStats: PlayerStats[];
  pairStats: PairStats[];
  playerNames: Record<string, string>;
  teamMap: Record<string, { name: string; color: string | null }>;
}) {
  const [tab, setTab] = useState<"teams" | "players" | "pairs">("teams");
  const [playerSort, setPlayerSort] = useState<"total" | "singles" | "doubles" | "pct">("total");

  const sortedPlayers = [...playerStats].sort((a, b) => {
    if (playerSort === "singles") return b.singlesWins - a.singlesWins || b.winPct - a.winPct;
    if (playerSort === "doubles") return b.doublesWins - a.doublesWins || b.winPct - a.winPct;
    if (playerSort === "pct") return b.winPct - a.winPct || b.totalWins - a.totalWins;
    return b.totalWins - a.totalWins || b.winPct - a.winPct;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
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

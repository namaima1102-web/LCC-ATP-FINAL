"use client";

import { Fragment, useMemo, useState } from "react";

export interface HistoryPlayer {
  fullName: string;
  singlesPlayed: number;
  singlesWins: number;
  doublesPlayed: number;
  doublesWins: number;
  totalPlayed: number;
  remaining: number;
  winPct: number;
  ratingStart: string | number;
  ratingEnd: string | number;
}

export interface HistoryTeam {
  name: string;
  color: string;
  singlesPoints: number;
  doublesPoints: number;
  totalPoints: number;
  players: HistoryPlayer[];
}

export interface HistorySeason {
  code: string;
  name: string;
  note?: string;
  teams: HistoryTeam[];
}

export function HistoryBrowser({ seasons }: { seasons: HistorySeason[] }) {
  const [seasonCode, setSeasonCode] = useState<string>(seasons[0]?.code ?? "");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [playerQuery, setPlayerQuery] = useState<string>("");

  const currentSeason = useMemo(
    () => seasons.find((s) => s.code === seasonCode) ?? seasons[0],
    [seasons, seasonCode]
  );

  const filteredTeams = useMemo(() => {
    if (!currentSeason) return [];
    const q = playerQuery.trim().toLowerCase();
    return currentSeason.teams
      .filter((t) => teamFilter === "all" || t.name === teamFilter)
      .map((t) => ({
        ...t,
        players: q
          ? t.players.filter((p) => p.fullName.toLowerCase().includes(q))
          : t.players,
      }))
      .filter((t) => t.players.length > 0);
  }, [currentSeason, teamFilter, playerQuery]);

  const pctClass = (pct: number) => {
    if (pct >= 79) return "font-extrabold text-emerald-600 dark:text-emerald-400";
    if (pct <= 29) return "font-bold text-red-600 dark:text-red-400";
    return "font-semibold";
  };

  if (!currentSeason) {
    return (
      <p className="text-sm text-[var(--text-muted)]">
        Chưa có dữ liệu lịch sử các mùa.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Bộ lọc */}
      <div className="grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Chọn mùa giải</span>
          <select
            value={currentSeason.code}
            onChange={(e) => {
              setSeasonCode(e.target.value);
              setTeamFilter("all");
            }}
            className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm font-bold"
          >
            {seasons.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Lọc theo đội</span>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
          >
            <option value="all">Tất cả đội ({currentSeason.teams.length})</option>
            {currentSeason.teams.map((t) => (
              <option key={t.name} value={t.name}>
                {t.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Tìm tuyển thủ</span>
          <input
            type="text"
            placeholder="Nhập tên tuyển thủ..."
            value={playerQuery}
            onChange={(e) => setPlayerQuery(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
          />
        </label>
      </div>

      {currentSeason.note && (
        <p className="text-xs text-[var(--text-muted)]">
          Ghi chú mùa giải: <strong>{currentSeason.note}</strong>
        </p>
      )}

      {/* Khối 1: Bảng đóng góp theo đội (đồng bộ mẫu Mùa 5) */}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredTeams.map((team) => (
          <div
            key={team.name}
            className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          >
            <div
              className="flex items-center justify-between px-3.5 py-2.5 text-xs font-extrabold text-white"
              style={{ backgroundColor: team.color }}
            >
              <span>{team.name}</span>
              <span>Tổng: {team.totalPoints} điểm</span>
            </div>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-page)] text-[11px] text-[var(--text-muted)]">
                  <th className="px-2.5 py-1.5">#</th>
                  <th className="px-2 py-1.5">Thành viên</th>
                  <th className="px-2 py-1.5 text-center">Điểm Đơn</th>
                  <th className="px-2.5 py-1.5 text-center">Trận/Điểm Đôi</th>
                </tr>
              </thead>
              <tbody>
                {team.players.map((p, idx) => (
                  <tr
                    key={p.fullName}
                    className="border-b border-[var(--border-subtle)]/50"
                  >
                    <td className="px-2.5 py-2 text-[var(--text-muted)]">
                      {idx + 1}
                    </td>
                    <td className="px-2 py-2 font-bold">{p.fullName}</td>
                    <td className="px-2 py-2 text-center">{p.singlesWins}</td>
                    <td className="px-2.5 py-2 text-center">{p.doublesWins}</td>
                  </tr>
                ))}
                <tr className="bg-[var(--bg-page)] font-extrabold">
                  <td className="px-2.5 py-2" colSpan={2}>
                    Tổng điểm đội (Đơn / Đôi)
                  </td>
                  <td className="px-2 py-2 text-center">
                    {team.singlesPoints}
                  </td>
                  <td className="px-2.5 py-2 text-center">
                    {team.doublesPoints}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}
      </section>

      {/* Khối 2: Bảng tổng hợp chi tiết đồng bộ mẫu Mùa 5 */}
      <section className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <h2 className="mb-3 text-sm font-extrabold">
          Bảng tổng hợp chi tiết · {currentSeason.name}
        </h2>
        <table className="w-full min-w-[820px] text-left text-xs">
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
              <th className="px-2 py-2.5 text-center">Hạng đầu</th>
              <th className="rounded-tr-lg px-2.5 py-2.5 text-center">
                Hạng cuối
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTeams.map((team) => {
              const sPlayed = team.players.reduce((a, p) => a + p.singlesPlayed, 0);
              const sWins = team.players.reduce((a, p) => a + p.singlesWins, 0);
              const dPlayed = team.players.reduce((a, p) => a + p.doublesPlayed, 0);
              const dWins = team.players.reduce((a, p) => a + p.doublesWins, 0);
              const tPlayed = team.players.reduce((a, p) => a + p.totalPlayed, 0);
              const tRem = team.players.reduce((a, p) => a + p.remaining, 0);
              const tPct =
                tPlayed > 0 ? Math.round(((sWins + dWins) / tPlayed) * 100) : 0;
              const sPct = sPlayed > 0 ? Math.round((sWins / sPlayed) * 100) : 0;
              const dPct = dPlayed > 0 ? Math.round((dWins / dPlayed) * 100) : 0;

              return (
                <Fragment key={team.name}>
                  <tr
                    className="border-y border-[var(--border-subtle)] font-extrabold"
                    style={{ backgroundColor: `${team.color}22` }}
                  >
                    <td className="px-2.5 py-2" colSpan={2}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        {team.name}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">{tPlayed}</td>
                    <td className="px-2 py-2 text-center">{tRem}</td>
                    <td className="px-2 py-2 text-center">{tPct}%</td>
                    <td className="px-2 py-2 text-center">{sPlayed}</td>
                    <td className="px-2 py-2 text-center">{sWins}</td>
                    <td className="px-2 py-2 text-center">{sPct}%</td>
                    <td className="px-2 py-2 text-center">{dPlayed}</td>
                    <td className="px-2 py-2 text-center">{dWins}</td>
                    <td className="px-2 py-2 text-center">{dPct}%</td>
                    <td className="px-2.5 py-2 text-center" colSpan={2}>
                      {team.totalPoints}đ đội
                    </td>
                  </tr>

                  {team.players.map((p, idx) => {
                    const sP =
                      p.singlesPlayed > 0
                        ? Math.round((p.singlesWins / p.singlesPlayed) * 100)
                        : 0;
                    const dP =
                      p.doublesPlayed > 0
                        ? Math.round((p.doublesWins / p.doublesPlayed) * 100)
                        : 0;
                    return (
                      <tr
                        key={p.fullName}
                        className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-page)]"
                      >
                        <td className="px-2.5 py-2 text-[var(--text-muted)]">
                          {idx + 1}
                        </td>
                        <td className="px-2.5 py-2 font-bold">{p.fullName}</td>
                        <td className="px-2 py-2 text-center">{p.totalPlayed}</td>
                        <td className="px-2 py-2 text-center">{p.remaining}</td>
                        <td className={`px-2 py-2 text-center ${pctClass(p.winPct)}`}>
                          {p.winPct}%
                        </td>
                        <td className="px-2 py-2 text-center">
                          {p.singlesPlayed}
                        </td>
                        <td className="px-2 py-2 text-center">{p.singlesWins}</td>
                        <td className={`px-2 py-2 text-center ${pctClass(sP)}`}>
                          {sP}%
                        </td>
                        <td className="px-2 py-2 text-center">
                          {p.doublesPlayed}
                        </td>
                        <td className="px-2 py-2 text-center">{p.doublesWins}</td>
                        <td className={`px-2 py-2 text-center ${pctClass(dP)}`}>
                          {dP}%
                        </td>
                        <td className="px-2 py-2 text-center font-semibold">
                          {p.ratingStart}
                        </td>
                        <td className="px-2.5 py-2 text-center font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                          {p.ratingEnd}
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
  );
}

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

export interface Season5PlayerRef {
  fullName: string;
  ratingStart: number;
}

const M3_NUMERIC_RATING: Record<string, number | null> = {
  "Nam Gai": 11,
  Dương: 9,
  Nhất: 9,
  Đức: 9,
  Kiên: 9,
  Hiếu: 8,
  Thanh: 8,
  Sinh: 8,
  Hùng: null,
  Nam: 8,
  Vinh: 7,
  Thảo: 7,
  Thông: 7,
  Tân: null,
  Dũng: null,
  Khanh: 7,
};

function normalizePlayerName(name: string): string {
  if (name.startsWith("Vinh ")) return "Vinh";
  if (name.startsWith("Thùy ")) return "Thùy";
  if (name.startsWith("Thảo ")) return "Thảo";
  return name;
}

interface SeasonSliceStats {
  singlesPct: number | null;
  doublesPct: number | null;
  totalPct: number | null;
  singlesPlayed: number;
  singlesWins: number;
  doublesPlayed: number;
  doublesWins: number;
  totalPlayed: number;
  totalWins: number;
}

export function HistoryBrowser({
  seasons,
  season5Players,
}: {
  seasons: HistorySeason[];
  season5Players: Season5PlayerRef[];
}) {
  const [viewMode, setViewMode] = useState<"cross" | "by_season">("cross");
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

  // Tổng hợp phong độ qua 3 mùa (Mùa 2, Mùa 3, Mùa 4)
  const crossSeasonForm = useMemo(() => {
    const byPlayer = new Map<
      string,
      Record<string, SeasonSliceStats | undefined>
    >();

    for (const s of seasons) {
      for (const t of s.teams) {
        for (const p of t.players) {
          const canon = normalizePlayerName(p.fullName);
          if (!byPlayer.has(canon)) byPlayer.set(canon, {});
          const sPct =
            p.singlesPlayed > 0
              ? Math.round((p.singlesWins / p.singlesPlayed) * 100)
              : null;
          const dPct =
            p.doublesPlayed > 0
              ? Math.round((p.doublesWins / p.doublesPlayed) * 100)
              : null;
          byPlayer.get(canon)![s.code] = {
            singlesPct: sPct,
            doublesPct: dPct,
            totalPct: p.winPct,
            singlesPlayed: p.singlesPlayed,
            singlesWins: p.singlesWins,
            doublesPlayed: p.doublesPlayed,
            doublesWins: p.doublesWins,
            totalPlayed: p.totalPlayed,
            totalWins: p.singlesWins + p.doublesWins,
          };
        }
      }
    }

    const rows = Array.from(byPlayer.entries()).map(([name, map]) => {
      const slices = Object.values(map).filter(
        (x): x is SeasonSliceStats => Boolean(x)
      );
      const sPlayed = slices.reduce((a, x) => a + x.singlesPlayed, 0);
      const sWins = slices.reduce((a, x) => a + x.singlesWins, 0);
      const dPlayed = slices.reduce((a, x) => a + x.doublesPlayed, 0);
      const dWins = slices.reduce((a, x) => a + x.doublesWins, 0);
      const tPlayed = slices.reduce((a, x) => a + x.totalPlayed, 0);
      const tWins = sWins + dWins;

      return {
        name,
        m2: map["S2-2026"],
        m3: map["S3-2026"],
        m4: map["S4-2026"],
        aggSinglesPct: sPlayed > 0 ? Math.round((sWins / sPlayed) * 100) : null,
        aggDoublesPct: dPlayed > 0 ? Math.round((dWins / dPlayed) * 100) : null,
        aggTotalPct: tPlayed > 0 ? Math.round((tWins / tPlayed) * 100) : 0,
        totalMatches: tPlayed,
      };
    });

    const q = playerQuery.trim().toLowerCase();
    return rows
      .filter((r) => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => b.aggTotalPct - a.aggTotalPct || b.totalMatches - a.totalMatches);
  }, [seasons, playerQuery]);

  // Bảng biến động điểm trình M3 -> M4 -> M5
  const ratingProgression = useMemo(() => {
    const m3Map = new Map<string, HistoryPlayer>();
    const m4Map = new Map<string, HistoryPlayer>();

    const s3 = seasons.find((s) => s.code === "S3-2026");
    const s4 = seasons.find((s) => s.code === "S4-2026");
    for (const t of s3?.teams ?? []) {
      for (const p of t.players) m3Map.set(normalizePlayerName(p.fullName), p);
    }
    for (const t of s4?.teams ?? []) {
      for (const p of t.players) m4Map.set(normalizePlayerName(p.fullName), p);
    }

    const q = playerQuery.trim().toLowerCase();
    return season5Players
      .filter((p) => !q || p.fullName.toLowerCase().includes(q))
      .map((p) => {
        const m3 = m3Map.get(p.fullName);
        const m4 = m4Map.get(p.fullName);
        return {
          fullName: p.fullName,
          m3Rating: M3_NUMERIC_RATING[p.fullName] ?? null,
          m3WinPct: m3?.winPct ?? null,
          m3Wins: m3 ? m3.singlesWins + m3.doublesWins : null,
          m4RatingStart: m4 ? Number(m4.ratingStart) : null,
          m4WinPct: m4?.winPct ?? null,
          m5RatingStart: p.ratingStart,
        };
      });
  }, [seasons, season5Players, playerQuery]);

  const pctClass = (pct: number) => {
    if (pct >= 79) return "font-extrabold text-emerald-600 dark:text-emerald-400";
    if (pct <= 29) return "font-bold text-red-600 dark:text-red-400";
    return "font-semibold";
  };

  const heatBg = (pct: number | null | undefined) => {
    if (pct === null || pct === undefined) return "";
    if (pct >= 80) return "bg-emerald-600/25 font-extrabold";
    if (pct >= 60) return "bg-emerald-500/15 font-bold";
    if (pct >= 40) return "bg-emerald-500/5";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Thanh chuyển chế độ xem & tìm kiếm */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewMode("cross")}
            className={`h-10 rounded-xl px-4 text-xs font-bold transition ${
              viewMode === "cross"
                ? "bg-[var(--brand-purple)] text-white"
                : "border border-[var(--border-subtle)] bg-[var(--bg-page)]"
            }`}
          >
            Phong độ qua 3 mùa & Điểm trình
          </button>
          <button
            type="button"
            onClick={() => setViewMode("by_season")}
            className={`h-10 rounded-xl px-4 text-xs font-bold transition ${
              viewMode === "by_season"
                ? "bg-[var(--brand-purple)] text-white"
                : "border border-[var(--border-subtle)] bg-[var(--bg-page)]"
            }`}
          >
            Chi tiết từng mùa (M2 / M3 / M4)
          </button>
        </div>

        <input
          type="text"
          placeholder="Tìm nhanh tuyển thủ..."
          value={playerQuery}
          onChange={(e) => setPlayerQuery(e.target.value)}
          className="h-10 w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm sm:w-64"
        />
      </div>

      {viewMode === "cross" && (
        <div className="flex flex-col gap-5">
          {/* Bảng 1: Phong độ bóng bàn qua 3 mùa */}
          <section className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <h2 className="text-base font-extrabold text-[var(--brand-navy)] dark:text-[var(--brand-yellow)]">
              PHONG ĐỘ BÓNG BÀN QUA 3 MÙA (MÙA 2 · MÙA 3 · MÙA 4)
            </h2>
            <p className="mt-0.5 mb-3 text-xs text-[var(--text-muted)]">
              Xếp theo tỷ lệ thắng gộp · <code>—</code> = không có dữ liệu · Tỷ
              lệ làm tròn đến % nguyên
            </p>

            <table className="w-full min-w-[920px] text-center text-xs">
              <thead>
                <tr className="bg-[var(--brand-navy)] text-white">
                  <th rowSpan={2} className="rounded-tl-lg px-2.5 py-2 text-left">
                    Tuyển thủ
                  </th>
                  <th colSpan={3} className="border-l border-white/20 py-1.5">
                    MÙA 2
                  </th>
                  <th colSpan={3} className="border-l border-white/20 py-1.5">
                    MÙA 3
                  </th>
                  <th colSpan={3} className="border-l border-white/20 py-1.5">
                    MÙA 4
                  </th>
                  <th
                    colSpan={4}
                    className="rounded-tr-lg border-l border-white/20 py-1.5"
                  >
                    TỔNG HỢP 3 MÙA
                  </th>
                </tr>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-page)] text-[11px] font-bold text-[var(--text-muted)]">
                  <th className="border-l border-[var(--border-subtle)] px-2 py-1.5">
                    Đơn
                  </th>
                  <th className="px-2 py-1.5">Đôi</th>
                  <th className="px-2 py-1.5">Chung</th>
                  <th className="border-l border-[var(--border-subtle)] px-2 py-1.5">
                    Đơn
                  </th>
                  <th className="px-2 py-1.5">Đôi</th>
                  <th className="px-2 py-1.5">Chung</th>
                  <th className="border-l border-[var(--border-subtle)] px-2 py-1.5">
                    Đơn
                  </th>
                  <th className="px-2 py-1.5">Đôi</th>
                  <th className="px-2 py-1.5">Chung</th>
                  <th className="border-l border-[var(--border-subtle)] px-2 py-1.5">
                    Đơn gộp
                  </th>
                  <th className="px-2 py-1.5">Đôi gộp</th>
                  <th className="px-2 py-1.5">Tổng gộp</th>
                  <th className="px-2 py-1.5">Số lượt</th>
                </tr>
              </thead>
              <tbody>
                {crossSeasonForm.map((r) => {
                  const cell = (val: number | null | undefined) =>
                    val === null || val === undefined ? "—" : `${val}%`;
                  return (
                    <tr
                      key={r.name}
                      className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-page)]"
                    >
                      <td className="px-2.5 py-2 text-left font-bold">
                        {r.name}
                      </td>
                      <td className={`border-l border-[var(--border-subtle)]/50 px-2 py-2 ${heatBg(r.m2?.singlesPct)}`}>
                        {cell(r.m2?.singlesPct)}
                      </td>
                      <td className={`px-2 py-2 ${heatBg(r.m2?.doublesPct)}`}>
                        {cell(r.m2?.doublesPct)}
                      </td>
                      <td className={`px-2 py-2 ${heatBg(r.m2?.totalPct)}`}>
                        {cell(r.m2?.totalPct)}
                      </td>
                      <td className={`border-l border-[var(--border-subtle)]/50 px-2 py-2 ${heatBg(r.m3?.singlesPct)}`}>
                        {cell(r.m3?.singlesPct)}
                      </td>
                      <td className={`px-2 py-2 ${heatBg(r.m3?.doublesPct)}`}>
                        {cell(r.m3?.doublesPct)}
                      </td>
                      <td className={`px-2 py-2 ${heatBg(r.m3?.totalPct)}`}>
                        {cell(r.m3?.totalPct)}
                      </td>
                      <td className={`border-l border-[var(--border-subtle)]/50 px-2 py-2 ${heatBg(r.m4?.singlesPct)}`}>
                        {cell(r.m4?.singlesPct)}
                      </td>
                      <td className={`px-2 py-2 ${heatBg(r.m4?.doublesPct)}`}>
                        {cell(r.m4?.doublesPct)}
                      </td>
                      <td className={`px-2 py-2 ${heatBg(r.m4?.totalPct)}`}>
                        {cell(r.m4?.totalPct)}
                      </td>
                      <td className="border-l border-[var(--border-subtle)]/50 px-2 py-2 font-semibold">
                        {cell(r.aggSinglesPct)}
                      </td>
                      <td className="px-2 py-2 font-semibold">
                        {cell(r.aggDoublesPct)}
                      </td>
                      <td className="px-2 py-2 font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                        {r.aggTotalPct}%
                      </td>
                      <td className="px-2 py-2 font-semibold">
                        {r.totalMatches}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* Bảng 2: Tiến trình điểm trình Mùa 3 -> Mùa 4 -> Mùa 5 */}
          <section className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <h2 className="mb-3 text-base font-extrabold text-[var(--brand-navy)] dark:text-[var(--brand-yellow)]">
              Biến động điểm trình qua các mùa (Mùa 3 → Mùa 4 → Mùa 5)
            </h2>
            <table className="w-full min-w-[680px] text-center text-xs">
              <thead>
                <tr className="bg-[var(--brand-navy)] text-white">
                  <th className="rounded-tl-lg px-2.5 py-2.5 text-left">STT</th>
                  <th className="px-2.5 py-2.5 text-left">Tuyển thủ</th>
                  <th className="px-2 py-2.5">Điểm Mùa 3</th>
                  <th className="px-2 py-2.5">Tỷ lệ thắng M3</th>
                  <th className="px-2 py-2.5">Trận thắng M3</th>
                  <th className="px-2 py-2.5">Điểm đầu Mùa 4</th>
                  <th className="px-2 py-2.5">Tỷ lệ thắng M4</th>
                  <th className="rounded-tr-lg px-2.5 py-2.5">
                    Điểm đầu Mùa 5
                  </th>
                </tr>
              </thead>
              <tbody>
                {ratingProgression.map((r, idx) => (
                  <tr
                    key={r.fullName}
                    className="border-b border-[var(--border-subtle)]/50 last:border-0 hover:bg-[var(--bg-page)]"
                  >
                    <td className="px-2.5 py-2 text-left text-[var(--text-muted)]">
                      {idx + 1}
                    </td>
                    <td className="px-2.5 py-2 text-left font-bold">
                      {r.fullName}
                    </td>
                    <td className="px-2 py-2">{r.m3Rating ?? "—"}</td>
                    <td className="px-2 py-2">
                      {r.m3WinPct !== null ? `${r.m3WinPct}%` : "—"}
                    </td>
                    <td className="px-2 py-2">{r.m3Wins ?? "—"}</td>
                    <td className="px-2 py-2 font-bold">
                      {r.m4RatingStart ?? "—"}
                    </td>
                    <td className="px-2 py-2">
                      {r.m4WinPct !== null ? `${r.m4WinPct}%` : "—"}
                    </td>
                    <td className="px-2.5 py-2 font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                      {r.m5RatingStart}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {viewMode === "by_season" && currentSeason && (
        <div className="flex flex-col gap-5">
          {/* Bộ lọc chi tiết từng mùa */}
          <div className="grid gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:grid-cols-2">
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
                <option value="all">
                  Tất cả đội ({currentSeason.teams.length})
                </option>
                {currentSeason.teams.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Khối 1: Bảng đóng góp theo đội */}
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
                      <th className="px-2.5 py-1.5 text-center">
                        Trận/Điểm Đôi
                      </th>
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
                        <td className="px-2 py-2 text-center">
                          {p.singlesWins}
                        </td>
                        <td className="px-2.5 py-2 text-center">
                          {p.doublesWins}
                        </td>
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
                  const sPlayed = team.players.reduce(
                    (a, p) => a + p.singlesPlayed,
                    0
                  );
                  const sWins = team.players.reduce(
                    (a, p) => a + p.singlesWins,
                    0
                  );
                  const dPlayed = team.players.reduce(
                    (a, p) => a + p.doublesPlayed,
                    0
                  );
                  const dWins = team.players.reduce(
                    (a, p) => a + p.doublesWins,
                    0
                  );
                  const tPlayed = team.players.reduce(
                    (a, p) => a + p.totalPlayed,
                    0
                  );
                  const tRem = team.players.reduce(
                    (a, p) => a + p.remaining,
                    0
                  );
                  const tPct =
                    tPlayed > 0
                      ? Math.round(((sWins + dWins) / tPlayed) * 100)
                      : 0;
                  const sPct =
                    sPlayed > 0 ? Math.round((sWins / sPlayed) * 100) : 0;
                  const dPct =
                    dPlayed > 0 ? Math.round((dWins / dPlayed) * 100) : 0;

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
                            <td className="px-2.5 py-2 font-bold">
                              {p.fullName}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {p.totalPlayed}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {p.remaining}
                            </td>
                            <td
                              className={`px-2 py-2 text-center ${pctClass(p.winPct)}`}
                            >
                              {p.winPct}%
                            </td>
                            <td className="px-2 py-2 text-center">
                              {p.singlesPlayed}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {p.singlesWins}
                            </td>
                            <td
                              className={`px-2 py-2 text-center ${pctClass(sP)}`}
                            >
                              {sP}%
                            </td>
                            <td className="px-2 py-2 text-center">
                              {p.doublesPlayed}
                            </td>
                            <td className="px-2 py-2 text-center">
                              {p.doublesWins}
                            </td>
                            <td
                              className={`px-2 py-2 text-center ${pctClass(dP)}`}
                            >
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
      )}
    </div>
  );
}

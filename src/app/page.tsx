import Image from "next/image";
import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { computePeriodProgress, formatDateVN } from "@/lib/domain/progress";
import { computeTeamStandings } from "@/lib/domain/standings";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";
import season5Seed from "../../seed/season5.json";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await loadPublicSeasonData();

  const seasonName = data?.season.name ?? season5Seed.season.name;
  const subtitle =
    data?.season.settings.subtitle ?? season5Seed.season.subtitle;

  const standings = data
    ? computeTeamStandings(
        data.teams,
        data.matches,
        data.results,
        data.season.settings
      )
    : season5Seed.teams.map((t, i) => ({
        teamId: `seed-${i}`,
        teamName: t.name,
        color: t.color,
        points: 0,
        played: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        setDiff: 0,
        singlesWins: 0,
      }));

  const publishedPeriods =
    data?.periods.filter(
      (p) => p.status === "published" || p.status === "closed"
    ) ?? [];

  const progressList = data
    ? publishedPeriods.map((p) =>
        computePeriodProgress(
          p,
          data.matches,
          data.players,
          data.teams,
          data.season.settings
        )
      )
    : [];

  const alertingPeriods = progressList.filter((pr) => pr.shouldAlert);
  const activeProgress =
    progressList.find((pr) => pr.period.status === "published") ??
    progressList[progressList.length - 1] ??
    null;

  const totalMatchesGoal = 132;
  const completedCount = data
    ? data.matches.filter((m) => m.status === "played" || m.status === "forfeit")
        .length
    : 0;
  const remainingCount = Math.max(0, totalMatchesGoal - completedCount);

  const playerMap = new Map(
    (data?.players ?? []).map((p) => [p.id, p.fullName])
  );
  const matchMap = new Map((data?.matches ?? []).map((m) => [m.id, m]));

  const latestResults = [...(data?.results ?? [])]
    .sort((a, b) => b.approvedAt.localeCompare(a.approvedAt))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader seasonName={seasonName} subtitle={subtitle} />

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        {/* Dải cảnh báo trận tồn (AC14) */}
        {alertingPeriods.map((al) => (
          <div
            key={al.period.id}
            role="alert"
            className={`rounded-2xl border-2 px-4 py-3 text-sm font-semibold ${
              al.isSlow
                ? "border-red-500 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-200"
                : "border-[var(--brand-orange)] bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
            }`}
          >
            ⚠️ {al.period.name || `Kỳ ${al.period.periodNo}`} còn{" "}
            <strong>{al.daysLeft}</strong> ngày (hạn{" "}
            {formatDateVN(al.period.endsOn)}), còn{" "}
            <strong>{al.backlogCount}</strong> trận chưa đấu. Trận không đấu kịp
            sẽ bị xử thua.{" "}
            <Link href="/schedule" className="underline">
              Xem lịch ngay →
            </Link>
          </div>
        ))}

        {/* Khối giới thiệu giải & chỉ số */}
        <section className="rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-col items-center gap-5 lg:flex-row lg:justify-between">
            <div className="flex flex-col items-center text-center lg:flex-row lg:text-left">
              <div className="rounded-2xl bg-[var(--brand-navy-deep)]/5 p-2.5 dark:bg-white/5">
                <Image
                  src="/logo-legend-chicks-cup.png"
                  alt="Logo Legend Chicks Cup 2026"
                  width={96}
                  height={96}
                  className="h-20 w-20 object-contain sm:h-24 sm:w-24"
                  priority
                />
              </div>
              <div className="mt-3 lg:ml-4 lg:mt-0">
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--brand-navy)] dark:text-white sm:text-3xl">
                  {seasonName}
                </h1>
                <p className="mt-1 text-sm font-medium text-[var(--text-muted)]">
                  {subtitle} · 3 kỳ (6 tuần) · 5 set thắng 3
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-2 lg:justify-start">
                  <Link
                    href="/schedule"
                    className="inline-flex h-10 items-center rounded-xl bg-[var(--brand-purple)] px-4 text-xs font-bold text-white transition hover:bg-[var(--brand-purple-vivid)]"
                  >
                    Xem lịch & Nhập tỉ số
                  </Link>
                  <Link
                    href="/standings"
                    className="inline-flex h-10 items-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-4 text-xs font-bold hover:border-[var(--brand-purple)]"
                  >
                    Bảng xếp hạng chi tiết
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3 text-center sm:grid-cols-4 lg:w-auto lg:min-w-[440px]">
              <div className="rounded-xl bg-[var(--bg-page)] p-3">
                <p className="text-xl font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                  {standings.length}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Đội thi đấu
                </p>
              </div>
              <div className="rounded-xl bg-[var(--bg-page)] p-3">
                <p className="text-xl font-extrabold text-[var(--brand-blue)] dark:text-[#60a5fa]">
                  {data?.players.length ?? season5Seed.players.length}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Tuyển thủ
                </p>
              </div>
              <div className="rounded-xl bg-[var(--bg-page)] p-3">
                <p className="text-xl font-extrabold text-[var(--brand-orange)]">
                  {remainingCount}/{totalMatchesGoal}
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Trận còn lại
                </p>
              </div>
              <div className="rounded-xl bg-[var(--bg-page)] p-3">
                <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  12 / 9
                </p>
                <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                  Đơn / Đôi mỗi VĐV
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bố cục 2 cột trên màn hình lớn */}
        <div className="grid gap-5 lg:grid-cols-12">
          {/* Xếp hạng 4 đội */}
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 lg:col-span-7">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold">Bảng xếp hạng 4 đội</h2>
              <Link
                href="/standings"
                className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
              >
                Xem cá nhân & đôi →
              </Link>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
                    <th className="py-2 pr-2">#</th>
                    <th className="py-2 pr-3">Đội</th>
                    <th className="px-2 py-2 text-center">Trận</th>
                    <th className="px-2 py-2 text-center">T-B</th>
                    <th className="px-2 py-2 text-center">HS Set</th>
                    <th className="py-2 pl-2 text-right">Điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((t, idx) => (
                    <tr
                      key={t.teamId}
                      className="border-b border-[var(--border-subtle)]/60 last:border-0"
                    >
                      <td className="py-2.5 pr-2 font-bold text-[var(--text-muted)]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 pr-3 font-bold">
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="h-3 w-3 shrink-0 rounded-full"
                            style={{ backgroundColor: t.color ?? "#2B6FD6" }}
                          />
                          <span>{t.teamName}</span>
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center">{t.played}</td>
                      <td className="px-2 py-2.5 text-center">
                        {t.wins}-{t.losses}
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        {t.setDiff > 0 ? `+${t.setDiff}` : t.setDiff}
                      </td>
                      <td className="py-2.5 pl-2 text-right font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                        {t.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Tiến độ kỳ & Kết quả mới nhất */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            {activeProgress && (
              <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-extrabold">
                    Tiến độ {activeProgress.period.name || `Kỳ ${activeProgress.period.periodNo}`}
                  </h2>
                  <span className="text-xs text-[var(--text-muted)]">
                    Hạn {formatDateVN(activeProgress.period.endsOn)}
                  </span>
                </div>
                <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-page)]">
                  <div
                    className={`h-full rounded-full ${
                      activeProgress.isSlow
                        ? "bg-red-500"
                        : "bg-[var(--brand-yellow)]"
                    }`}
                    style={{ width: `${activeProgress.completionPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  Đã xong{" "}
                  <strong className="text-[var(--text-main)]">
                    {activeProgress.completedMatches}/{activeProgress.totalMatches}
                  </strong>{" "}
                  trận ({activeProgress.completionPct}%) · Còn{" "}
                  <strong>{activeProgress.backlogCount}</strong> trận chưa đấu.
                </p>
              </section>
            )}

            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-extrabold">Kết quả mới nhất</h2>
                <Link
                  href="/schedule"
                  className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
                >
                  Tất cả →
                </Link>
              </div>

              {latestResults.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  Chưa có kết quả chính thức nào được duyệt.
                </p>
              ) : (
                <div className="mt-3 flex flex-col gap-2.5">
                  {latestResults.map((r) => {
                    const m = matchMap.get(r.matchId);
                    if (!m) return null;
                    const sideA = m.sideAPlayerIds
                      .map((id) => playerMap.get(id) ?? "?")
                      .join(" + ");
                    const sideB = m.sideBPlayerIds
                      .map((id) => playerMap.get(id) ?? "?")
                      .join(" + ");
                    return (
                      <Link
                        key={r.matchId}
                        href={`/matches/${r.matchId}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-2 text-xs transition hover:border-[var(--brand-purple)]"
                      >
                        <span className="min-w-0 truncate font-semibold">
                          {sideA} vs {sideB}
                        </span>
                        <span className="shrink-0 font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                          {r.setsA}-{r.setsB}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { calculateHandicap } from "@/lib/domain/handicap";
import { formatDateVN } from "@/lib/domain/progress";
import { suggestRatingAdjustments } from "@/lib/domain/rating";
import { computePlayerStats } from "@/lib/domain/standings";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadPublicSeasonData();
  if (!data) notFound();

  const player = data.players.find((p) => p.id === id);
  if (!player) notFound();

  const team = data.teams.find((t) => t.id === player.teamId);
  const playerMap = new Map(data.players.map((p) => [p.id, p]));
  const periodMap = new Map(data.periods.map((p) => [p.id, p]));
  const resultMap = new Map(data.results.map((r) => [r.matchId, r]));

  const stats = computePlayerStats(
    [player],
    data.matches,
    data.results,
    data.season.settings
  )[0];

  const ratingSuggestion = suggestRatingAdjustments(
    [
      {
        playerId: player.id,
        fullName: player.fullName,
        ratingStart: player.ratingStart,
        singlesWins: stats.singlesWins,
        singlesLosses: stats.singlesLosses,
        doublesWins: stats.doublesWins,
        doublesLosses: stats.doublesLosses,
      },
    ],
    data.season.settings
  )[0];

  const myMatches = data.matches.filter(
    (m) =>
      m.sideAPlayerIds.includes(player.id) ||
      m.sideBPlayerIds.includes(player.id)
  );

  const activePeriod =
    data.periods.find((p) => p.status === "published") ?? null;
  const backlogInActive = activePeriod
    ? myMatches.filter(
        (m) => m.periodId === activePeriod.id && m.status === "scheduled"
      )
    : [];

  // Bảng mã chấp đơn với tất cả đối thủ khác đội
  const opponents = data.players
    .filter((p) => p.teamId !== player.teamId)
    .sort((a, b) => b.ratingStart - a.ratingStart);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data.season.name}
        subtitle={data.season.settings.subtitle}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/players"
            className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
          >
            ← Danh sách tuyển thủ
          </Link>
        </div>

        {/* Thông tin chung */}
        <section className="rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--bg-card)] p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: team?.color ?? "#2B6FD6" }}
                />
                <span className="text-xs font-bold text-[var(--text-muted)]">
                  {team?.name}
                </span>
                {player.isProvisional && (
                  <span className="rounded-full bg-[var(--brand-orange)]/20 px-2 py-0.5 text-[11px] font-bold text-[#b45309] dark:text-[var(--brand-yellow)]">
                    Điểm tạm (provisional)
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-extrabold">
                {player.fullName}
                {player.nickname ? (
                  <span className="ml-2 text-base font-normal text-[var(--text-muted)]">
                    ({player.nickname})
                  </span>
                ) : null}
              </h1>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-center sm:grid-cols-4">
              <div className="rounded-xl bg-[var(--bg-page)] px-3 py-2">
                <p className="text-lg font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                  {player.ratingStart}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">Điểm trình</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-page)] px-3 py-2">
                <p className="text-lg font-extrabold">
                  {stats.singlesWins}-{stats.singlesLosses}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">Đơn (T-B)</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-page)] px-3 py-2">
                <p className="text-lg font-extrabold">
                  {stats.doublesWins}-{stats.doublesLosses}
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">Đôi (T-B)</p>
              </div>
              <div className="rounded-xl bg-[var(--bg-page)] px-3 py-2">
                <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                  {stats.winPct}% → {ratingSuggestion.ruleRating}đ
                </p>
                <p className="text-[11px] text-[var(--text-muted)]">
                  Tỷ lệ & Dự kiến
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Trận còn nợ trong kỳ hiện tại */}
        {activePeriod && (
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
            <h2 className="text-base font-extrabold">
              Trận còn nợ trong {activePeriod.name || `Kỳ ${activePeriod.periodNo}`}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Bạn còn <strong>{backlogInActive.length}</strong> trận cần đấu trước{" "}
              <strong>{formatDateVN(activePeriod.endsOn)}</strong>.
            </p>

            {backlogInActive.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {backlogInActive.map((m) => {
                  const sideA = m.sideAPlayerIds
                    .map((pid) => playerMap.get(pid)?.fullName ?? "?")
                    .join(" + ");
                  const sideB = m.sideBPlayerIds
                    .map((pid) => playerMap.get(pid)?.fullName ?? "?")
                    .join(" + ");
                  return (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-2 text-xs hover:border-[var(--brand-purple)]"
                    >
                      <span className="font-semibold">
                        [{m.kind === "singles" ? "Đơn" : "Đôi"}] {sideA} vs {sideB}
                      </span>
                      <span className="shrink-0 font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                        {m.handicapCode}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="grid gap-5 lg:grid-cols-12">
          {/* Lịch & kết quả cá nhân */}
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 lg:col-span-7">
            <h2 className="text-base font-extrabold">
              Lịch & Kết quả cá nhân ({myMatches.length} trận đã đăng)
            </h2>
            {myMatches.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--text-muted)]">
                Chưa có trận nào được đăng công khai.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {myMatches.map((m) => {
                  const res = resultMap.get(m.id);
                  const sideA = m.sideAPlayerIds
                    .map((pid) => playerMap.get(pid)?.fullName ?? "?")
                    .join(" + ");
                  const sideB = m.sideBPlayerIds
                    .map((pid) => playerMap.get(pid)?.fullName ?? "?")
                    .join(" + ");
                  return (
                    <Link
                      key={m.id}
                      href={`/matches/${m.id}`}
                      className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-2 text-xs hover:border-[var(--brand-purple)]"
                    >
                      <div className="min-w-0">
                        <span className="mr-1.5 font-bold text-[var(--text-muted)]">
                          Kỳ {periodMap.get(m.periodId)?.periodNo} ·{" "}
                          {m.kind === "singles" ? "Đơn" : "Đôi"}
                        </span>
                        <span className="font-semibold">
                          {sideA} vs {sideB}
                        </span>
                      </div>
                      <span className="shrink-0 font-extrabold">
                        {res ? `${res.setsA}-${res.setsB}` : m.handicapCode}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Bảng mã chấp với từng đối thủ */}
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 lg:col-span-5">
            <h2 className="text-base font-extrabold">
              Mã chấp đơn với từng đối thủ
            </h2>
            <div className="mt-3 flex flex-col gap-1.5 text-xs">
              {opponents.map((opp) => {
                const hc = calculateHandicap(
                  "singles",
                  [player.ratingStart],
                  [opp.ratingStart],
                  data.handicapRules,
                  data.season.settings
                );
                const note =
                  hc.giver === "a"
                    ? "Bạn chấp"
                    : hc.giver === "b"
                      ? `${opp.fullName} chấp`
                      : "Ngang";
                return (
                  <div
                    key={opp.id}
                    className="flex items-center justify-between rounded-lg bg-[var(--bg-page)] px-3 py-2"
                  >
                    <span className="font-semibold">
                      {opp.fullName} ({opp.ratingStart}đ)
                    </span>
                    <span>
                      <strong className="text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                        {hc.code}
                      </strong>{" "}
                      <span className="text-[var(--text-muted)]">· {note}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

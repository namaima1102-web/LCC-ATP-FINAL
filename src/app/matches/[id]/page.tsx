import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { getHandicapBreakdown } from "@/lib/domain/handicap";
import { formatDateVN } from "@/lib/domain/progress";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadPublicSeasonData();
  if (!data) notFound();

  const match = data.matches.find((m) => m.id === id);
  if (!match) notFound();

  const playerMap = new Map(data.players.map((p) => [p.id, p]));
  const teamMap = new Map(data.teams.map((t) => [t.id, t]));
  const period = data.periods.find((p) => p.id === match.periodId);
  const result = data.results.find((r) => r.matchId === match.id);
  const flag = data.pendingFlags[match.id];

  const sideAPlayers = match.sideAPlayerIds
    .map((pid) => playerMap.get(pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const sideBPlayers = match.sideBPlayerIds
    .map((pid) => playerMap.get(pid))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  const sideANames = sideAPlayers.map((p) => p.fullName).join(" + ");
  const sideBNames = sideBPlayers.map((p) => p.fullName).join(" + ");
  const teamA = teamMap.get(match.teamAId);
  const teamB = teamMap.get(match.teamBId);

  const breakdown = getHandicapBreakdown(
    match.handicapCode,
    match.setsToWin * 2 - 1,
    data.season.settings.handicap_pattern
  );

  const giverLabel =
    match.handicapGiver === "a"
      ? `${sideANames} nhường ${sideBNames}`
      : match.handicapGiver === "b"
        ? `${sideBNames} nhường ${sideANames}`
        : "Hai bên ngang điểm (không chấp)";

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data.season.name}
        subtitle={data.season.settings.subtitle}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/schedule"
            className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
          >
            ← Quay lại Lịch & Kết quả
          </Link>
        </div>

        <section className="rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--bg-card)] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-[var(--brand-purple)]/15 px-2.5 py-1 font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                {match.kind === "singles" ? "Trận Đơn" : "Trận Đôi"} · Thắng{" "}
                {match.setsToWin} set
              </span>
              {period && (
                <span className="text-[var(--text-muted)]">
                  {period.name || `Kỳ ${period.periodNo}`} (hạn{" "}
                  {formatDateVN(period.endsOn)})
                </span>
              )}
            </div>
            {flag?.hasPending && (
              <span className="rounded-full bg-[var(--brand-orange)]/20 px-2.5 py-1 font-bold text-[#b45309] dark:text-[var(--brand-yellow)]">
                {flag.hasConflict ? "Đang có bản gửi xung đột" : "Đang chờ duyệt"}
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3 sm:items-center">
            <div className="rounded-xl bg-[var(--bg-page)] p-4">
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                <span
                  className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: teamA?.color ?? "#2B6FD6" }}
                />
                {teamA?.name}
              </p>
              <div className="mt-1.5 flex flex-col gap-1">
                {sideAPlayers.map((p) => (
                  <Link
                    key={p.id}
                    href={`/players/${p.id}`}
                    className="text-base font-extrabold hover:text-[var(--brand-purple)] hover:underline"
                  >
                    {p.fullName} ({p.ratingStart}đ)
                  </Link>
                ))}
              </div>
            </div>

            <div className="text-center">
              {result ? (
                <div>
                  <p className="text-3xl font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                    {result.setsA} - {result.setsB}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {result.isForfeit
                      ? "Kết quả xử thua"
                      : result.playedOn
                        ? `Đấu ngày ${formatDateVN(result.playedOn)}`
                        : "Kết quả chính thức"}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xl font-extrabold text-[var(--text-muted)]">
                    VS
                  </p>
                  <p className="mt-1 text-xs text-[var(--brand-blue)]">
                    {match.status === "cancelled" ? "Đã hủy" : "Chưa có kết quả"}
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-[var(--bg-page)] p-4 sm:text-right">
              <p className="text-xs font-semibold text-[var(--text-muted)]">
                <span
                  className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: teamB?.color ?? "#D99A12" }}
                />
                {teamB?.name}
              </p>
              <div className="mt-1.5 flex flex-col gap-1">
                {sideBPlayers.map((p) => (
                  <Link
                    key={p.id}
                    href={`/players/${p.id}`}
                    className="text-base font-extrabold hover:text-[var(--brand-purple)] hover:underline"
                  >
                    {p.fullName} ({p.ratingStart}đ)
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bảng chấp theo từng set */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <h2 className="text-base font-extrabold">
            Bảng điểm chấp theo từng set · Mã {match.handicapCode}
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{giverLabel}</p>

          <div className="mt-3 grid grid-cols-5 gap-2 text-center">
            {breakdown.map((s) => (
              <div
                key={s.setNo}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3"
              >
                <p className="text-xs text-[var(--text-muted)]">Set {s.setNo}</p>
                <p className="mt-1 text-lg font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                  {s.points}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Khung chờ form gửi tỉ số (Milestone M5) */}
        <section className="rounded-2xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 text-sm text-[var(--text-muted)]">
          Chức năng gửi tỉ số công khai & đính kèm ảnh bằng chứng cho trận này sẽ
          được mở ở <strong>Milestone M5</strong>.
        </section>
      </main>
    </div>
  );
}

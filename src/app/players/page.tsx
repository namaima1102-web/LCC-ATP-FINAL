import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { computePlayerStats } from "@/lib/domain/standings";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";

export const dynamic = "force-dynamic";

export default async function PlayersListPage() {
  const data = await loadPublicSeasonData();

  const statsMap = new Map(
    (data
      ? computePlayerStats(
          data.players,
          data.matches,
          data.results,
          data.season.settings
        )
      : []
    ).map((s) => [s.playerId, s])
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data?.season.name}
        subtitle={data?.season.settings.subtitle}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">
          W4 · Danh sách Tuyển thủ ({data?.players.length ?? 0})
        </h1>

        {!data ? (
          <p className="text-sm text-[var(--text-muted)]">
            Chưa có dữ liệu mùa giải.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {data.teams.map((team) => {
              const teamPlayers = data.players
                .filter((p) => p.teamId === team.id)
                .sort((a, b) => b.ratingStart - a.ratingStart);

              return (
                <section
                  key={team.id}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4"
                >
                  <div className="mb-3 flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: team.color ?? "#2B6FD6" }}
                    />
                    <h2 className="text-sm font-extrabold">{team.name}</h2>
                  </div>

                  <div className="flex flex-col gap-2">
                    {teamPlayers.map((p) => {
                      const st = statsMap.get(p.id);
                      return (
                        <Link
                          key={p.id}
                          href={`/players/${p.id}`}
                          className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-2.5 transition hover:border-[var(--brand-purple)]"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold">
                              {p.fullName}
                              {p.nickname ? (
                                <span className="ml-1 text-xs font-normal text-[var(--text-muted)]">
                                  ({p.nickname})
                                </span>
                              ) : null}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              Điểm: <strong>{p.ratingStart}</strong>
                              {p.isProvisional ? " · Tạm" : ""}
                            </p>
                          </div>
                          <span className="shrink-0 text-xs font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                            {st ? `${st.totalWins}-${st.totalLosses}` : "0-0"}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

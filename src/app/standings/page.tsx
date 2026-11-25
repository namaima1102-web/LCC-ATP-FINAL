import { PublicHeader } from "@/components/public/PublicHeader";
import { StandingsTabs } from "@/components/public/StandingsTabs";
import {
  computePairStats,
  computePlayerStats,
  computeTeamStandings,
} from "@/lib/domain/standings";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";

export const dynamic = "force-dynamic";

export default async function PublicStandingsPage() {
  const data = await loadPublicSeasonData();

  const teamStandings = data
    ? computeTeamStandings(
        data.teams,
        data.matches,
        data.results,
        data.season.settings
      )
    : [];

  const playerStats = data
    ? computePlayerStats(
        data.players,
        data.matches,
        data.results,
        data.season.settings
      )
    : [];

  const pairStats = data
    ? computePairStats(data.players, data.matches, data.results)
    : [];

  const playerNames: Record<string, string> = {};
  for (const p of data?.players ?? []) {
    playerNames[p.id] = p.fullName;
  }

  const teamMap: Record<string, { name: string; color: string | null }> = {};
  for (const t of data?.teams ?? []) {
    teamMap[t.id] = { name: t.name, color: t.color };
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data?.season.name}
        subtitle={data?.season.settings.subtitle}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">W5 · Bảng xếp hạng</h1>
        <StandingsTabs
          teamStandings={teamStandings}
          playerStats={playerStats}
          pairStats={pairStats}
          playerNames={playerNames}
          teamMap={teamMap}
        />
      </main>
    </div>
  );
}

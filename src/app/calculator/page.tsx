import { PublicHeader } from "@/components/public/PublicHeader";
import { HandicapCalculator } from "@/components/public/HandicapCalculator";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";

export const dynamic = "force-dynamic";

export default async function CalculatorPage() {
  const data = await loadPublicSeasonData();
  const teamMap = new Map((data?.teams ?? []).map((t) => [t.id, t.name]));

  const calcPlayers = (data?.players ?? []).map((p) => ({
    id: p.id,
    fullName: p.fullName,
    ratingStart: p.ratingStart,
    teamId: p.teamId,
    teamName: teamMap.get(p.teamId) ?? "",
  }));

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data?.season.name}
        subtitle={data?.season.settings.subtitle}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">W6 · Máy tính mã chấp</h1>
        {data ? (
          <HandicapCalculator
            players={calcPlayers}
            rules={data.handicapRules}
            settings={data.season.settings}
          />
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Chưa có dữ liệu mùa giải.
          </p>
        )}
      </main>
    </div>
  );
}

import { PublicHeader } from "@/components/public/PublicHeader";
import { ScheduleBrowser } from "@/components/public/ScheduleBrowser";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";

export const dynamic = "force-dynamic";

export default async function PublicSchedulePage() {
  const data = await loadPublicSeasonData();

  const publishedPeriods =
    data?.periods.filter(
      (p) => p.status === "published" || p.status === "closed"
    ) ?? [];

  const resultMap = new Map((data?.results ?? []).map((r) => [r.matchId, r]));

  const matchItems = (data?.matches ?? []).map((m) => {
    const res = resultMap.get(m.id);
    const flag = data?.pendingFlags[m.id];
    return {
      id: m.id,
      kind: m.kind,
      periodId: m.periodId,
      status: m.status,
      handicapCode: m.handicapCode,
      handicapGiver: m.handicapGiver,
      sideAPlayerIds: m.sideAPlayerIds,
      sideBPlayerIds: m.sideBPlayerIds,
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      setsA: res?.setsA,
      setsB: res?.setsB,
      isForfeit: res?.isForfeit,
      hasPending: flag?.hasPending ?? false,
      hasConflict: flag?.hasConflict ?? false,
    };
  });

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data?.season.name}
        subtitle={data?.season.settings.subtitle}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">W2 · Lịch & Kết quả</h1>
        <ScheduleBrowser
          periods={publishedPeriods}
          teams={data?.teams ?? []}
          players={data?.players ?? []}
          matches={matchItems}
        />
      </main>
    </div>
  );
}

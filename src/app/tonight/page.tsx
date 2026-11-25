import { PublicHeader } from "@/components/public/PublicHeader";
import { TonightBoard } from "@/components/public/TonightBoard";
import { filterActiveAttendance } from "@/lib/domain/tonight";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TonightPage() {
  const data = await loadPublicSeasonData();
  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
        <PublicHeader />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--text-muted)]">
            Chưa có dữ liệu mùa giải.
          </p>
        </main>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: attendanceRows } = await supabase
    .from("attendance")
    .select("player_id, checked_in_at")
    .eq("season_id", data.season.id);

  const initialPresentIds = filterActiveAttendance(
    (attendanceRows ?? []).map((a) => ({
      playerId: a.player_id,
      checkedInAt: a.checked_in_at,
    }))
  );

  const teamMap = new Map(data.teams.map((t) => [t.id, t]));
  const periodMap = new Map(data.periods.map((p) => [p.id, p]));

  const scheduledMatches = data.matches
    .filter((m) => m.status === "scheduled")
    .map((m) => {
      const period = periodMap.get(m.periodId);
      return {
        id: m.id,
        kind: m.kind,
        periodId: m.periodId,
        periodNo: period?.periodNo ?? 1,
        periodEndsOn: period?.endsOn ?? "2099-12-31",
        handicapCode: m.handicapCode,
        sideAPlayerIds: m.sideAPlayerIds,
        sideBPlayerIds: m.sideBPlayerIds,
      };
    });

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data.season.name}
        subtitle={data.season.settings.subtitle}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">
          W9 · Tối nay ai đến & Gợi ý trận khả thi
        </h1>
        <TonightBoard
          seasonId={data.season.id}
          players={data.players.map((p) => ({
            id: p.id,
            fullName: p.fullName,
            teamId: p.teamId,
            teamColor: teamMap.get(p.teamId)?.color ?? null,
          }))}
          initialPresentIds={initialPresentIds}
          scheduledMatches={scheduledMatches}
          settings={data.season.settings}
        />
      </main>
    </div>
  );
}

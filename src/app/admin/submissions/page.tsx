import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  SubmissionsQueue,
  type SubmissionQueueItem,
} from "@/components/admin/SubmissionsQueue";
import { detectConflictMatchIds } from "@/lib/domain/submissions";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
        <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--text-muted)]">Chưa có mùa giải.</p>
        </main>
      </div>
    );
  }

  const db = createAdminClient();
  const [subsRes, matchesRes] = await Promise.all([
    db
      .from("score_submissions")
      .select(
        "id, match_id, submitted_by_player_id, sets_a, sets_b, played_on, note, evidence_path, status, created_at"
      )
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    db
      .from("matches")
      .select("id, kind, period_id, match_sides(side, player_id)")
      .eq("season_id", ctx.season.id),
  ]);

  const playerMap = new Map(ctx.players.map((p) => [p.id, p]));
  const periodMap = new Map(ctx.periods.map((p) => [p.id, p]));
  const matchMap = new Map((matchesRes.data ?? []).map((m) => [m.id, m]));

  const pendingRows = subsRes.data ?? [];
  const conflicts = detectConflictMatchIds(
    pendingRows.map((r) => ({
      id: r.id,
      matchId: r.match_id,
      setsA: r.sets_a,
      setsB: r.sets_b,
      status: r.status,
    }))
  );

  const items: SubmissionQueueItem[] = await Promise.all(
    pendingRows.map(async (s) => {
      const m = matchMap.get(s.match_id);
      const sides = ((m?.match_sides ?? []) as Array<{
        side: string;
        player_id: string;
      }>);
      const sideA = sides
        .filter((x) => x.side === "a")
        .map((x) => playerMap.get(x.player_id)?.fullName ?? "?")
        .join(" + ");
      const sideB = sides
        .filter((x) => x.side === "b")
        .map((x) => playerMap.get(x.player_id)?.fullName ?? "?")
        .join(" + ");

      let evidenceUrl: string | null = null;
      if (s.evidence_path) {
        const { data: signed } = await db.storage
          .from("evidence")
          .createSignedUrl(s.evidence_path, 3600);
        evidenceUrl = signed?.signedUrl ?? null;
      }

      return {
        id: s.id,
        matchId: s.match_id,
        matchLabel: `${sideA} vs ${sideB}`,
        kind: (m?.kind as "singles" | "doubles") ?? "singles",
        periodNo: periodMap.get(m?.period_id ?? "")?.periodNo ?? 1,
        submittedByName:
          playerMap.get(s.submitted_by_player_id ?? "")?.fullName ?? "Ẩn danh",
        setsA: s.sets_a,
        setsB: s.sets_b,
        playedOn: s.played_on,
        note: s.note,
        evidenceUrl,
        createdAt: s.created_at,
        isConflict: conflicts.has(s.match_id),
      };
    })
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">A1 · Hàng đợi duyệt tỉ số</h1>
        <SubmissionsQueue items={items} />
      </main>
    </div>
  );
}

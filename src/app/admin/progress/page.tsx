import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { computePeriodProgress, formatDateVN } from "@/lib/domain/progress";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminProgressPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return (
      <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
        <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--text-muted)]">
            Chưa có dữ liệu mùa giải.
          </p>
        </main>
      </div>
    );
  }

  const db = createAdminClient();
  const [matchesRes, pendingRes] = await Promise.all([
    db
      .from("matches")
      .select("id, period_id, kind, status, match_sides(side, player_id)")
      .eq("season_id", ctx.season.id),
    db
      .from("score_submissions")
      .select("match_id")
      .eq("status", "pending"),
  ]);

  const allMatches = (matchesRes.data ?? []).map((m) => {
    const sides = (m.match_sides ?? []) as Array<{
      side: string;
      player_id: string;
    }>;
    return {
      id: m.id,
      periodId: m.period_id,
      kind: m.kind as "singles" | "doubles",
      status: m.status as "scheduled" | "played" | "forfeit" | "cancelled",
      sideAPlayerIds: sides
        .filter((s) => s.side === "a")
        .map((s) => s.player_id),
      sideBPlayerIds: sides
        .filter((s) => s.side === "b")
        .map((s) => s.player_id),
    };
  });

  const pendingMatchIds = new Set(
    (pendingRes.data ?? []).map((s) => s.match_id)
  );
  const teamMap = new Map(ctx.teams.map((t) => [t.id, t]));

  const summaries = ctx.periods.map((p) =>
    computePeriodProgress(
      p,
      allMatches,
      ctx.players,
      ctx.teams,
      ctx.season.settings
    )
  );

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold">
            A11 · Tiến độ kỳ & Cảnh báo trận tồn
          </h1>
          <span className="text-xs text-[var(--text-muted)]">
            Ngưỡng chậm: &lt; {ctx.season.settings.alert_completion_threshold}%
          </span>
        </div>

        <div className="flex flex-col gap-5">
          {summaries.map((s) => {
            const pendingInPeriod = allMatches.filter(
              (m) =>
                m.periodId === s.period.id &&
                m.status === "scheduled" &&
                pendingMatchIds.has(m.id)
            ).length;

            return (
              <section
                key={s.period.id}
                className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-extrabold">
                      {s.period.name || `Kỳ ${s.period.periodNo}`} ·{" "}
                      <span className="text-xs font-normal text-[var(--text-muted)]">
                        {formatDateVN(s.period.startsOn)} –{" "}
                        {formatDateVN(s.period.endsOn)} ({s.period.status})
                      </span>
                    </h2>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      Hoàn thành:{" "}
                      <strong>
                        {s.completedMatches}/{s.totalMatches}
                      </strong>{" "}
                      trận ({s.completionPct}%) · Tồn:{" "}
                      <strong>{s.backlogCount}</strong> trận · Chờ duyệt:{" "}
                      <strong>{pendingInPeriod}</strong> trận
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      s.isSlow
                        ? "bg-red-500/15 text-red-700 dark:text-red-300"
                        : "bg-amber-500/20 text-amber-800 dark:text-amber-300"
                    }`}
                  >
                    {s.isSlow ? "Chậm tiến độ (Đỏ)" : "Bình thường (Vàng)"}
                  </span>
                </div>

                {s.totalMatches > 0 && (
                  <div className="mt-3 grid gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                      <p className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">
                        Tuyển thủ còn nợ trận ({s.playerBacklog.length})
                      </p>
                      {s.playerBacklog.length === 0 ? (
                        <p className="text-xs text-emerald-600">
                          Tất cả tuyển thủ đã hoàn thành trận trong kỳ này.
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2">
                          {s.playerBacklog.map((pb) => {
                            const tm = teamMap.get(pb.teamId);
                            return (
                              <div
                                key={pb.playerId}
                                className="flex items-center justify-between rounded-xl bg-[var(--bg-page)] px-3 py-2 text-xs"
                              >
                                <span className="inline-flex items-center gap-2 font-semibold">
                                  <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{
                                      backgroundColor: tm?.color ?? "#2B6FD6",
                                    }}
                                  />
                                  {pb.fullName}
                                </span>
                                <span className="font-bold text-[var(--brand-orange)]">
                                  Nợ {pb.totalBacklog} ({pb.singlesBacklog}đơn,{" "}
                                  {pb.doublesBacklog}đôi)
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-4">
                      <p className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">
                        Trận tồn theo đội
                      </p>
                      <div className="flex flex-col gap-2">
                        {s.teamBacklog.map((tb) => (
                          <div
                            key={tb.teamId}
                            className="flex items-center justify-between rounded-xl bg-[var(--bg-page)] px-3 py-2 text-xs"
                          >
                            <span className="inline-flex items-center gap-2 font-semibold">
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor: tb.color ?? "#2B6FD6",
                                }}
                              />
                              {tb.teamName}
                            </span>
                            <span className="font-bold">
                              {tb.backlogCount} trận
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

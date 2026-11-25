"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface PeriodSummary {
  id: string;
  periodNo: number;
  name: string | null;
  status: "draft" | "published" | "closed";
  pendingCount: number;
  candidates: Array<{
    id: string;
    kind: "singles" | "doubles";
    sideANames: string;
    sideBNames: string;
  }>;
}

export function ForfeitsManager({ periods }: { periods: PeriodSummary[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const applyForfeit = async (
    matchIds: string[],
    forfeitKind: "winner_a" | "winner_b" | "both"
  ) => {
    setBusyId(matchIds[0] ?? "batch");
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/forfeits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_forfeit",
          matchIds,
          forfeitKind,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xử thua");
      setStatusMsg(`Đã cập nhật kết quả xử thua cho ${data.count} trận.`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi xử thua.");
    } finally {
      setBusyId(null);
    }
  };

  const closePeriod = async (periodId: string, periodNo: number) => {
    setBusyId(periodId);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/forfeits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close_period", periodId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không thể đóng kỳ");
      setStatusMsg(`Đã đóng Kỳ ${periodNo} thành công!`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Không thể đóng kỳ.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {statusMsg && (
        <div className="rounded-xl border border-[var(--brand-purple)] bg-[var(--brand-purple)]/10 px-4 py-2.5 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      {periods.map((p) => {
        const canClose =
          p.status === "published" &&
          p.candidates.length === 0 &&
          p.pendingCount === 0;

        return (
          <section
            key={p.id}
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold">
                  {p.name || `Kỳ ${p.periodNo}`} ·{" "}
                  <span className="text-xs font-semibold text-[var(--text-muted)]">
                    {p.status}
                  </span>
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Trận cần xử thua: <strong>{p.candidates.length}</strong> · Trận
                  đang có bản gửi chờ duyệt (không xử thua):{" "}
                  <strong>{p.pendingCount}</strong>
                </p>
              </div>

              {p.status === "published" && (
                <button
                  type="button"
                  disabled={!canClose || busyId === p.id}
                  onClick={() => closePeriod(p.id, p.periodNo)}
                  className="h-9 rounded-xl bg-[var(--brand-navy)] px-4 text-xs font-bold text-white disabled:opacity-40"
                >
                  Đóng Kỳ {p.periodNo}
                </button>
              )}
            </div>

            {p.candidates.length > 0 && (
              <div className="mt-4 flex flex-col gap-2.5">
                {p.candidates.map((m) => (
                  <div
                    key={m.id}
                    className="flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <p className="text-xs font-bold sm:text-sm">
                      [{m.kind === "singles" ? "Đơn" : "Đôi"}] {m.sideANames} vs{" "}
                      {m.sideBNames}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => applyForfeit([m.id], "winner_a")}
                        className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 text-xs font-semibold hover:border-[var(--brand-purple)]"
                      >
                        Thắng A (3-0)
                      </button>
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => applyForfeit([m.id], "winner_b")}
                        className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 text-xs font-semibold hover:border-[var(--brand-purple)]"
                      >
                        Thắng B (0-3)
                      </button>
                      <button
                        type="button"
                        disabled={busyId === m.id}
                        onClick={() => applyForfeit([m.id], "both")}
                        className="h-8 rounded-lg border border-red-400 px-2.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                      >
                        Cả 2 thua (0 điểm)
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

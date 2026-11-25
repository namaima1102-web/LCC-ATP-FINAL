"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface MatchItem {
  id: string;
  kind: "singles" | "doubles";
  status: string;
  periodId: string;
  periodNo: number;
  periodStatus: string;
  handicapCode: string | null;
  handicapGiver: "a" | "b" | null;
  sideANames: string;
  sideBNames: string;
}

interface PeriodOption {
  id: string;
  periodNo: number;
  status: string;
}

export function MatchesManager({
  matches,
  periods,
}: {
  matches: MatchItem[];
  periods: PeriodOption[];
}) {
  const router = useRouter();
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [kindFilter, setKindFilter] = useState<string>("all");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (periodFilter !== "all" && m.periodId !== periodFilter) return false;
      if (kindFilter !== "all" && m.kind !== kindFilter) return false;
      return true;
    });
  }, [matches, periodFilter, kindFilter]);

  const handleMovePeriod = async (match: MatchItem, targetPeriodId: string) => {
    if (targetPeriodId === match.periodId) return;

    let reason: string | undefined;
    if (match.periodStatus === "published") {
      const input = window.prompt(
        "Kỳ hiện tại đã đăng lịch. Nhập lý do chuyển trận (bắt buộc):"
      );
      if (!input?.trim()) {
        setStatusMsg("Đã hủy chuyển trận vì chưa nhập lý do.");
        return;
      }
      reason = input.trim();
    }

    setBusyId(match.id);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          action: "move_period",
          targetPeriodId,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi chuyển kỳ");
      setStatusMsg("Đã chuyển kỳ cho trận đấu và ghi nhật ký.");
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi chuyển kỳ.");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleCancel = async (match: MatchItem) => {
    const nextStatus = match.status === "cancelled" ? "scheduled" : "cancelled";
    setBusyId(match.id);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/matches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          action: "set_status",
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi đổi trạng thái");
      setStatusMsg("Đã cập nhật trạng thái trận đấu.");
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi đổi trạng thái.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {statusMsg && (
        <div className="rounded-xl border border-[var(--brand-purple)] bg-[var(--brand-purple)]/10 px-4 py-2.5 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={periodFilter}
          onChange={(e) => setPeriodFilter(e.target.value)}
          className="h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-xs font-semibold"
        >
          <option value="all">Tất cả các kỳ ({matches.length})</option>
          {periods.map((p) => (
            <option key={p.id} value={p.id}>
              Kỳ {p.periodNo} ({p.status === "published" ? "Đã đăng" : "Nháp"})
            </option>
          ))}
        </select>

        <select
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value)}
          className="h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-xs font-semibold"
        >
          <option value="all">Đơn & Đôi</option>
          <option value="singles">Chỉ đơn</option>
          <option value="doubles">Chỉ đôi</option>
        </select>

        <span className="text-xs text-[var(--text-muted)]">
          Hiển thị {filtered.length} trận
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {filtered.map((m) => (
          <div
            key={m.id}
            className="flex flex-col gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded bg-[var(--brand-purple)]/15 px-1.5 py-0.5 font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                  {m.kind === "singles" ? "Đơn" : "Đôi"}
                </span>
                <span className="text-[var(--text-muted)]">
                  Chấp: <strong>{m.handicapCode ?? "0-0-0"}</strong>
                </span>
                <span className="text-[var(--text-muted)]">· {m.status}</span>
              </div>
              <p className="mt-1 text-sm font-bold">
                {m.sideANames} <span className="text-[var(--text-muted)]">vs</span>{" "}
                {m.sideBNames}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <select
                aria-label="Chuyển kỳ"
                disabled={busyId === m.id || m.status === "played" || m.status === "forfeit"}
                value={m.periodId}
                onChange={(e) => handleMovePeriod(m, e.target.value)}
                className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2 text-xs font-semibold"
              >
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>
                    Kỳ {p.periodNo}
                  </option>
                ))}
              </select>

              {(m.status === "scheduled" || m.status === "cancelled") && (
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => handleToggleCancel(m)}
                  className="h-8 rounded-lg border border-[var(--border-subtle)] px-2.5 text-xs font-semibold hover:border-red-500"
                >
                  {m.status === "cancelled" ? "Mở lại" : "Hủy trận"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

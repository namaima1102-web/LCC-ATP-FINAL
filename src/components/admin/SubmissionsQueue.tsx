"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface SubmissionQueueItem {
  id: string;
  matchId: string;
  matchLabel: string;
  kind: "singles" | "doubles";
  periodNo: number;
  submittedByName: string;
  setsA: number;
  setsB: number;
  playedOn: string | null;
  note: string | null;
  evidenceUrl: string | null;
  createdAt: string;
  isConflict: boolean;
}

export function SubmissionsQueue({
  items: initialItems,
}: {
  items: SubmissionQueueItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [editMap, setEditMap] = useState<
    Record<string, { setsA: string; setsB: string }>
  >({});

  const nonConflictCount = items.filter((i) => !i.isConflict).length;

  const handleApprove = async (item: SubmissionQueueItem) => {
    setBusyId(item.id);
    setStatusMsg(null);
    const edited = editMap[item.id];
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          submissionId: item.id,
          setsA: edited ? Number(edited.setsA) : item.setsA,
          setsB: edited ? Number(edited.setsB) : item.setsB,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi duyệt tỉ số");
      setItems((prev) => prev.filter((x) => x.matchId !== item.matchId));
      setStatusMsg(`Đã duyệt tỉ số trận ${item.matchLabel} và cập nhật bảng xếp hạng.`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi duyệt tỉ số.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (item: SubmissionQueueItem) => {
    const reason = window.prompt("Nhập lý do từ chối (bắt buộc):");
    if (!reason?.trim()) {
      setStatusMsg("Đã hủy thao tác vì chưa nhập lý do từ chối.");
      return;
    }

    setBusyId(item.id);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          submissionId: item.id,
          reviewNote: reason.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi từ chối");
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      setStatusMsg("Đã từ chối bản gửi và lưu lý do.");
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi từ chối.");
    } finally {
      setBusyId(null);
    }
  };

  const handleBulkApprove = async () => {
    setBusyId("bulk");
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk_approve" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi duyệt hàng loạt");
      setStatusMsg(`Đã duyệt hàng loạt ${data.approvedCount} trận không xung đột.`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi duyệt hàng loạt.");
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

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-[var(--text-muted)]">
          Đang chờ duyệt: <strong>{items.length}</strong> bản gửi
        </p>

        {nonConflictCount > 0 && (
          <button
            type="button"
            disabled={busyId === "bulk"}
            onClick={handleBulkApprove}
            className="h-9 rounded-xl bg-emerald-600 px-4 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Duyệt nhanh {nonConflictCount} bản không xung đột
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-muted)]">
          Hàng đợi trống. Không có bản gửi tỉ số nào đang chờ duyệt.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => {
            const edited = editMap[item.id] ?? {
              setsA: String(item.setsA),
              setsB: String(item.setsB),
            };

            return (
              <div
                key={item.id}
                className={`flex flex-col justify-between gap-3 rounded-2xl border p-4 ${
                  item.isConflict
                    ? "border-red-500 bg-red-50/40 dark:bg-red-950/20"
                    : "border-[var(--border-subtle)] bg-[var(--bg-card)]"
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-bold text-[var(--text-muted)]">
                      Kỳ {item.periodNo} · {item.kind === "singles" ? "Đơn" : "Đôi"}
                    </span>
                    {item.isConflict && (
                      <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                        XUNG ĐỘT
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 text-sm font-extrabold">{item.matchLabel}</p>

                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Người gửi: <strong>{item.submittedByName}</strong>
                    {item.playedOn ? ` · Ngày đấu: ${item.playedOn}` : ""}
                  </p>
                  {item.note && (
                    <p className="mt-1 text-xs italic text-[var(--text-muted)]">
                      Ghi chú: {item.note}
                    </p>
                  )}

                  {item.evidenceUrl && (
                    <a
                      href={item.evidenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-[var(--brand-blue)] underline"
                    >
                      Xem ảnh bằng chứng →
                    </a>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      max={5}
                      aria-label="Set A"
                      value={edited.setsA}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: { ...edited, setsA: e.target.value },
                        }))
                      }
                      className="h-9 w-12 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-center text-sm font-extrabold"
                    />
                    <span className="font-bold">-</span>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      aria-label="Set B"
                      value={edited.setsB}
                      onChange={(e) =>
                        setEditMap((prev) => ({
                          ...prev,
                          [item.id]: { ...edited, setsB: e.target.value },
                        }))
                      }
                      className="h-9 w-12 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-center text-sm font-extrabold"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleReject(item)}
                      className="h-9 rounded-lg border border-red-400 px-3 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                    <button
                      type="button"
                      disabled={busyId === item.id}
                      onClick={() => handleApprove(item)}
                      className="h-9 rounded-lg bg-[var(--brand-purple)] px-3.5 text-xs font-bold text-white hover:bg-[var(--brand-purple-vivid)] disabled:opacity-50"
                    >
                      Duyệt
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

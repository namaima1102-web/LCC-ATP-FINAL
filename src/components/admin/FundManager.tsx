"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  computeFundSummary,
  type FundRecord,
} from "@/lib/domain/fund";

export function FundManager({
  initialRecords,
  feePerSeasonK,
}: {
  initialRecords: FundRecord[];
  feePerSeasonK: number;
}) {
  const router = useRouter();
  const [records, setRecords] = useState<FundRecord[]>(initialRecords);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPaidK, setNewPaidK] = useState("50");

  const summary = useMemo(
    () => computeFundSummary(records, feePerSeasonK),
    [records, feePerSeasonK]
  );

  const persistRecords = async (next: FundRecord[], msg?: string) => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/fund", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: next, feePerSeasonK }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu quỹ");
      setStatusMsg(msg ?? "Đã lưu bảng đóng quỹ và cập nhật ra trang công khai.");
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi lưu quỹ.");
    } finally {
      setBusy(false);
    }
  };

  const quickAdd50k = (id: string) => {
    const next = records.map((r) =>
      r.id === id ? { ...r, totalPaidK: r.totalPaidK + feePerSeasonK } : r
    );
    setRecords(next);
    const target = next.find((r) => r.id === id);
    void persistRecords(
      next,
      `Đã cộng +${feePerSeasonK}k cho ${target?.fullName} (tổng ${target?.totalPaidK}k).`
    );
  };

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const next: FundRecord[] = [
      ...records,
      {
        id: `f-${Date.now()}`,
        fullName: newName.trim(),
        totalPaidK: Number(newPaidK) || 0,
        prevSeasonsCount: 0,
        playsSeason5: true,
      },
    ];
    setRecords(next);
    setNewName("");
    void persistRecords(next, `Đã thêm ${newName.trim()} vào bảng quỹ.`);
  };

  return (
    <div className="flex flex-col gap-5">
      {statusMsg && (
        <div className="rounded-xl border border-[var(--brand-purple)] bg-[var(--brand-purple)]/10 px-4 py-2.5 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5">
          <p className="text-xl font-extrabold text-emerald-500">
            {summary.totalCollectedK.toLocaleString("vi-VN")}k
          </p>
          <p className="text-xs text-[var(--text-muted)]">Đã thu</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5">
          <p className="text-xl font-extrabold text-[var(--brand-orange)]">
            {summary.totalDueK.toLocaleString("vi-VN")}k
          </p>
          <p className="text-xs text-[var(--text-muted)]">Cần đóng thêm</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5">
          <p className="text-xl font-extrabold text-[var(--brand-blue)]">
            {summary.totalSurplusK.toLocaleString("vi-VN")}k
          </p>
          <p className="text-xs text-[var(--text-muted)]">Đóng dư</p>
        </div>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <table className="w-full min-w-[760px] text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
              <th className="py-2 pr-2">STT</th>
              <th className="px-2 py-2">Tuyển thủ</th>
              <th className="px-2 py-2">Đã đóng (k)</th>
              <th className="px-2 py-2">Mùa trước</th>
              <th className="px-2 py-2 text-center">Chơi M5</th>
              <th className="px-2 py-2 text-center">Dư / Thiếu</th>
              <th className="px-2 py-2">Ghi chú</th>
              <th className="py-2 pl-2 text-right">Thao tác nhanh</th>
            </tr>
          </thead>
          <tbody>
            {summary.rows.map((r, idx) => (
              <tr
                key={r.id}
                className="border-b border-[var(--border-subtle)]/50 last:border-0"
              >
                <td className="py-2 pr-2 text-[var(--text-muted)]">{idx + 1}</td>
                <td className="px-2 py-2 font-bold">{r.fullName}</td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    step={10}
                    value={r.totalPaidK}
                    onChange={(e) =>
                      setRecords((prev) =>
                        prev.map((x) =>
                          x.id === r.id
                            ? { ...x, totalPaidK: Number(e.target.value) }
                            : x
                        )
                      )
                    }
                    className="h-8 w-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2 text-center font-bold"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    min={0}
                    value={r.prevSeasonsCount}
                    onChange={(e) =>
                      setRecords((prev) =>
                        prev.map((x) =>
                          x.id === r.id
                            ? { ...x, prevSeasonsCount: Number(e.target.value) }
                            : x
                        )
                      )
                    }
                    className="h-8 w-14 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2 text-center"
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={r.playsSeason5}
                    onChange={(e) =>
                      setRecords((prev) =>
                        prev.map((x) =>
                          x.id === r.id
                            ? { ...x, playsSeason5: e.target.checked }
                            : x
                        )
                      )
                    }
                  />
                </td>
                <td className="px-2 py-2 text-center font-bold">
                  {r.surplusK > 0 ? (
                    <span className="text-emerald-500">Dư {r.surplusK}k</span>
                  ) : r.dueK > 0 ? (
                    <span className="text-[var(--brand-orange)]">
                      Thiếu {r.dueK}k
                    </span>
                  ) : (
                    <span className="text-emerald-500">Đủ</span>
                  )}
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={r.note ?? ""}
                    onChange={(e) =>
                      setRecords((prev) =>
                        prev.map((x) =>
                          x.id === r.id ? { ...x, note: e.target.value } : x
                        )
                      )
                    }
                    className="h-8 w-36 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2 text-xs"
                  />
                </td>
                <td className="py-2 pl-2 text-right">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => quickAdd50k(r.id)}
                    className="h-8 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    +{feePerSeasonK}k
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={() => persistRecords(records)}
            className="h-10 rounded-xl bg-[var(--brand-purple)] px-5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "Đang lưu..." : "Lưu tất cả thay đổi quỹ"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <h2 className="text-sm font-extrabold">Thêm thành viên đóng quỹ</h2>
        <form onSubmit={addMember} className="mt-3 flex flex-wrap gap-2">
          <input
            type="text"
            required
            placeholder="Tên thành viên"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-9 min-w-[160px] flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-xs"
          />
          <input
            type="number"
            step={10}
            value={newPaidK}
            onChange={(e) => setNewPaidK(e.target.value)}
            className="h-9 w-24 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2 text-center text-xs font-bold"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-9 rounded-xl bg-[var(--brand-blue)] px-4 text-xs font-bold text-white"
          >
            + Thêm
          </button>
        </form>
      </section>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  computeFundSummary,
  type FundExpense,
  type FundRecord,
} from "@/lib/domain/fund";

export function FundManager({
  initialRecords,
  feePerSeasonK,
  initialOpeningBalanceK,
  initialExpenses,
}: {
  initialRecords: FundRecord[];
  feePerSeasonK: number;
  initialOpeningBalanceK: number;
  initialExpenses: FundExpense[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState<FundRecord[]>(initialRecords);
  const [openingBalanceK, setOpeningBalanceK] = useState<number>(
    initialOpeningBalanceK
  );
  const [expenses, setExpenses] = useState<FundExpense[]>(initialExpenses);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPaidK, setNewPaidK] = useState("50");
  const [expDesc, setExpDesc] = useState("");
  const [expAmountK, setExpAmountK] = useState("");

  const summary = useMemo(
    () =>
      computeFundSummary(records, feePerSeasonK, openingBalanceK, expenses),
    [records, feePerSeasonK, openingBalanceK, expenses]
  );

  const persistAll = async (
    nextRecords: FundRecord[],
    nextOpening: number,
    nextExpenses: FundExpense[],
    msg?: string
  ) => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/fund", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          records: nextRecords,
          feePerSeasonK,
          openingBalanceK: nextOpening,
          expenses: nextExpenses,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu quỹ");
      setStatusMsg(msg ?? "Đã lưu bảng đóng quỹ & sổ thu chi ra trang công khai.");
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi lưu quỹ.");
    } finally {
      setBusy(false);
    }
  };

  const quickAdd50k = (id: string) => {
    const next = records.map((r) =>
      r.id === id
        ? {
            ...r,
            totalPaidK: r.totalPaidK + feePerSeasonK,
            m5PaidK: (r.m5PaidK ?? 0) + feePerSeasonK,
          }
        : r
    );
    setRecords(next);
    const target = next.find((r) => r.id === id);
    void persistAll(
      next,
      openingBalanceK,
      expenses,
      `Đã cộng +${feePerSeasonK}k (M5) cho ${target?.fullName}.`
    );
  };

  const addMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const paid = Number(newPaidK) || 0;
    const next: FundRecord[] = [
      ...records,
      {
        id: `f-${Date.now()}`,
        fullName: newName.trim(),
        totalPaidK: paid,
        m5PaidK: paid,
        prevSeasonsCount: 0,
        playsSeason5: true,
      },
    ];
    setRecords(next);
    setNewName("");
    void persistAll(
      next,
      openingBalanceK,
      expenses,
      `Đã thêm ${newName.trim()} vào bảng quỹ.`
    );
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(expAmountK);
    if (!expDesc.trim() || Number.isNaN(amt) || amt <= 0) return;
    const nextExp: FundExpense[] = [
      ...expenses,
      {
        id: `exp-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        description: expDesc.trim(),
        amountK: amt,
      },
    ];
    setExpenses(nextExp);
    setExpDesc("");
    setExpAmountK("");
    void persistAll(
      records,
      openingBalanceK,
      nextExp,
      `Đã thêm khoản chi "${expDesc.trim()}" (-${amt}k).`
    );
  };

  const removeExpense = (id: string) => {
    const nextExp = expenses.filter((x) => x.id !== id);
    setExpenses(nextExp);
    void persistAll(records, openingBalanceK, nextExp, "Đã xóa khoản chi.");
  };

  return (
    <div className="flex flex-col gap-5">
      {statusMsg && (
        <div className="rounded-xl border border-[var(--brand-purple)] bg-[var(--brand-purple)]/10 px-4 py-2.5 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5">
          <input
            type="number"
            aria-label="Quỹ tồn đầu mùa (k)"
            value={openingBalanceK}
            onChange={(e) => setOpeningBalanceK(Number(e.target.value))}
            className="w-24 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2 py-1 text-center text-lg font-extrabold"
          />
          <p className="mt-1 text-xs text-[var(--text-muted)]">Tồn đầu mùa (k)</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5">
          <p className="text-xl font-extrabold text-emerald-500">
            +{summary.m5IncomeK.toLocaleString("vi-VN")}k
          </p>
          <p className="text-xs text-[var(--text-muted)]">Thu mới M5</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3.5">
          <p className="text-xl font-extrabold text-red-500">
            -{summary.totalExpensesK.toLocaleString("vi-VN")}k
          </p>
          <p className="text-xs text-[var(--text-muted)]">Chi giải M5</p>
        </div>
        <div className="rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--bg-card)] p-3.5">
          <p className="text-xl font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
            {summary.currentBalanceK.toLocaleString("vi-VN")}k
          </p>
          <p className="text-xs text-[var(--text-muted)]">Quỹ hiện còn</p>
        </div>
      </div>

      <section className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <table className="w-full min-w-[820px] text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
              <th className="py-2 pr-2">STT</th>
              <th className="px-2 py-2">Tuyển thủ</th>
              <th className="px-2 py-2">Đóng M5 (k)</th>
              <th className="px-2 py-2">Tổng đóng (k)</th>
              <th className="px-2 py-2">Mùa trước</th>
              <th className="px-2 py-2 text-center">Chơi M5</th>
              <th className="px-2 py-2 text-center">Dư / Thiếu</th>
              <th className="px-2 py-2">Ghi chú</th>
              <th className="py-2 pl-2 text-right">Thao tác</th>
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
                    value={r.m5PaidK ?? 0}
                    onChange={(e) =>
                      setRecords((prev) =>
                        prev.map((x) =>
                          x.id === r.id
                            ? { ...x, m5PaidK: Number(e.target.value) }
                            : x
                        )
                      )
                    }
                    className="h-8 w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-1.5 text-center font-bold text-emerald-500"
                  />
                </td>
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
            onClick={() => persistAll(records, openingBalanceK, expenses)}
            className="h-10 rounded-xl bg-[var(--brand-purple)] px-5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "Đang lưu..." : "Lưu tất cả thay đổi quỹ"}
          </button>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Thêm khoản chi */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <h2 className="text-sm font-extrabold">Chi giải Mùa 5</h2>
          <form onSubmit={addExpense} className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              required
              placeholder="Nội dung chi (ví dụ: Mua bóng, nước uống...)"
              value={expDesc}
              onChange={(e) => setExpDesc(e.target.value)}
              className="h-9 min-w-[160px] flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-xs"
            />
            <input
              type="number"
              required
              min={1}
              placeholder="Số tiền (k)"
              value={expAmountK}
              onChange={(e) => setExpAmountK(e.target.value)}
              className="h-9 w-24 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2 text-center text-xs font-bold"
            />
            <button
              type="submit"
              disabled={busy}
              className="h-9 rounded-xl bg-red-600 px-4 text-xs font-bold text-white"
            >
              + Thêm chi
            </button>
          </form>

          {expenses.length > 0 && (
            <div className="mt-3 flex flex-col gap-1.5 text-xs">
              {expenses.map((ex) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between rounded-lg bg-[var(--bg-page)] px-3 py-2"
                >
                  <span>
                    {ex.date} · <strong>{ex.description}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-red-500">-{ex.amountK}k</span>
                    <button
                      type="button"
                      onClick={() => removeExpense(ex.id)}
                      className="text-xs text-[var(--text-muted)] hover:text-red-500"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Thêm thành viên */}
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
    </div>
  );
}

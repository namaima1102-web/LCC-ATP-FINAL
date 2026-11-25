"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { RatingSuggestion } from "@/lib/domain/rating";

interface DecisionRow extends RatingSuggestion {
  finalRating: number;
  reason: string;
}

export function RatingsManager({
  suggestions,
}: {
  suggestions: RatingSuggestion[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<DecisionRow[]>(
    suggestions.map((s) => ({
      ...s,
      finalRating: s.ruleRating,
      reason: "",
    }))
  );
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decisions: rows.map((r) => ({
            playerId: r.playerId,
            fromRating: r.fromRating,
            ruleRating: r.ruleRating,
            finalRating: r.finalRating,
            reason: r.reason,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu quyết định điểm");
      setStatusMsg(`Đã chốt điểm cuối mùa cho ${data.count} tuyển thủ.`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi lưu quyết định điểm.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {statusMsg && (
        <div className="rounded-xl border border-[var(--brand-purple)] bg-[var(--brand-purple)]/10 px-4 py-2.5 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-xs text-[var(--text-muted)]">
              <th className="py-2 pr-3">Tuyển thủ</th>
              <th className="px-2 py-2 text-center">Trận xét</th>
              <th className="px-2 py-2 text-center">Tỷ lệ</th>
              <th className="px-2 py-2 text-center">Điểm đầu</th>
              <th className="px-2 py-2 text-center">Luật gợi ý</th>
              <th className="px-2 py-2">Chốt cuối mùa</th>
              <th className="py-2 pl-2">Lý do (bắt buộc nếu ghi đè)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => {
              const overridden = r.finalRating !== r.ruleRating;
              return (
                <tr
                  key={r.playerId}
                  className="border-b border-[var(--border-subtle)]/60 last:border-0"
                >
                  <td className="py-2.5 pr-3 font-bold">{r.fullName}</td>
                  <td className="px-2 py-2.5 text-center">
                    {r.matchesConsidered}
                  </td>
                  <td className="px-2 py-2.5 text-center">{r.winPct}%</td>
                  <td className="px-2 py-2.5 text-center">{r.fromRating}</td>
                  <td className="px-2 py-2.5 text-center font-bold text-[var(--brand-blue)] dark:text-[#60a5fa]">
                    {r.ruleRating}{" "}
                    {r.delta !== 0 && (
                      <span className="text-xs">
                        ({r.delta > 0 ? `+${r.delta}` : r.delta})
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2.5">
                    <input
                      type="number"
                      step="0.5"
                      value={r.finalRating}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, finalRating: Number(e.target.value) }
                              : x
                          )
                        )
                      }
                      className="h-9 w-20 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2 text-center font-bold"
                    />
                  </td>
                  <td className="py-2.5 pl-2">
                    <input
                      type="text"
                      placeholder={overridden ? "Bắt buộc nhập lý do..." : "Tùy chọn"}
                      value={r.reason}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((x, i) =>
                            i === idx ? { ...x, reason: e.target.value } : x
                          )
                        )
                      }
                      className={`h-9 w-full min-w-[160px] rounded-lg border px-2.5 text-xs ${
                        overridden && !r.reason.trim()
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                          : "border-[var(--border-subtle)] bg-[var(--bg-page)]"
                      }`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="h-10 rounded-xl bg-[var(--brand-purple)] px-5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "Đang lưu..." : "Chốt điểm cuối mùa"}
          </button>
        </div>
      </div>
    </div>
  );
}

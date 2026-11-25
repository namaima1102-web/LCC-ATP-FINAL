"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { HandicapRule } from "@/lib/domain/handicap";

export function HandicapManager({
  rules: initialRules,
}: {
  rules: HandicapRule[];
}) {
  const router = useRouter();
  const [rules, setRules] = useState(initialRules);
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSave = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/handicap", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu bảng chấp");
      setStatusMsg(
        `Đã lưu bảng chấp và tự động cập nhật lại mã chấp cho ${data.updatedMatches} trận chưa đấu.`
      );
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi lưu bảng chấp.");
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
              <th className="py-2 pr-3">Chênh điểm</th>
              <th className="px-2 py-2">Mã chấp Đơn</th>
              <th className="px-2 py-2">Mã chấp Đôi</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r, idx) => (
              <tr
                key={r.diff}
                className="border-b border-[var(--border-subtle)]/60 last:border-0"
              >
                <td className="py-2 pr-3 font-bold">{r.diff}</td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={r.singlesCode}
                    onChange={(e) =>
                      setRules((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, singlesCode: e.target.value } : x
                        )
                      )
                    }
                    className="h-9 w-28 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2.5 font-mono text-sm font-bold"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    value={r.doublesCode}
                    onChange={(e) =>
                      setRules((prev) =>
                        prev.map((x, i) =>
                          i === idx ? { ...x, doublesCode: e.target.value } : x
                        )
                      )
                    }
                    className="h-9 w-28 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2.5 font-mono text-sm font-bold"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4">
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="h-10 rounded-xl bg-[var(--brand-purple)] px-5 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? "Đang lưu & cập nhật trận..." : "Lưu bảng chấp & Tính lại trận chưa đấu"}
          </button>
        </div>
      </div>
    </div>
  );
}

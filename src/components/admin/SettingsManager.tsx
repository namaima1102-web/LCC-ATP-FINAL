"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SeasonSettings } from "@/lib/domain/season-config";

export function SettingsManager({
  initialSettings,
}: {
  initialSettings: SeasonSettings;
}) {
  const router = useRouter();
  const [settings, setSettings] = useState<SeasonSettings>(initialSettings);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu cấu hình");
      setStatusMsg("Đã lưu cấu hình mùa giải thành công!");
      setReason("");
      router.refresh();
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : "Lỗi lưu cấu hình.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5">
      {statusMsg && (
        <div className="rounded-xl border border-[var(--brand-purple)] bg-[var(--brand-purple)]/10 px-4 py-2.5 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <h2 className="text-base font-extrabold">1. Thể thức & Điểm chấp</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Số set thắng (Đơn)</span>
              <input
                type="number"
                min={1}
                max={5}
                value={settings.singles_sets_to_win}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    singles_sets_to_win: Number(e.target.value),
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Số set thắng (Đôi)</span>
              <input
                type="number"
                min={1}
                max={5}
                value={settings.doubles_sets_to_win}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    doubles_sets_to_win: Number(e.target.value),
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Hệ số chia chênh đôi</span>
              <input
                type="number"
                step="0.5"
                min={1}
                value={settings.doubles_diff_divisor}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    doubles_diff_divisor: Number(e.target.value),
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 pt-4 text-xs font-semibold">
              <input
                type="checkbox"
                checked={settings.doubles_counts_for_team}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    doubles_counts_for_team: e.target.checked,
                  })
                }
              />
              <span>Trận đôi tính điểm đội</span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <h2 className="text-base font-extrabold">2. Điều chỉnh điểm cuối mùa (AC11)</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Ngưỡng giảm điểm (% ≤)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.rating_decrease_max_pct}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rating_decrease_max_pct: Number(e.target.value),
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Ngưỡng tăng điểm (% ≥)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.rating_increase_min_pct}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rating_increase_min_pct: Number(e.target.value),
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Cơ sở tính</span>
              <select
                value={settings.rating_calc_basis}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rating_calc_basis: e.target.value as "total" | "singles",
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              >
                <option value="total">Tổng (Đơn + Đôi)</option>
                <option value="singles">Chỉ Đơn</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Số trận tối thiểu</span>
              <input
                type="number"
                min={0}
                value={settings.rating_min_matches}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rating_min_matches: Number(e.target.value),
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <h2 className="text-base font-extrabold">3. Cảnh báo tiến độ & Bàn đấu</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Ngưỡng chậm tiến độ (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.alert_completion_threshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    alert_completion_threshold: Number(e.target.value),
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Số bàn mặc định (Tối đa)</span>
              <input
                type="number"
                min={1}
                max={8}
                value={settings.tables_default}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    tables_default: Number(e.target.value),
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <h2 className="text-base font-extrabold">4. Gửi tỉ số & Chống spam</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold">
              <span>Giới hạn gửi / IP / giờ</span>
              <input
                type="number"
                min={1}
                value={settings.rate_limit_per_hour}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rate_limit_per_hour: Number(e.target.value),
                  })
                }
                className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 pt-4 text-xs font-semibold">
              <input
                type="checkbox"
                checked={settings.show_pending_score}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    show_pending_score: e.target.checked,
                  })
                }
              />
              <span>Hiện tỉ số chờ duyệt</span>
            </label>
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <input
          type="text"
          placeholder="Ghi chú lý do thay đổi cấu hình (tùy chọn)..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-10 min-w-[200px] flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
        />
        <button
          type="submit"
          disabled={busy}
          className="h-10 rounded-xl bg-[var(--brand-purple)] px-5 text-xs font-bold text-white disabled:opacity-50"
        >
          {busy ? "Đang lưu..." : "Lưu cấu hình mùa giải"}
        </button>
      </div>
    </form>
  );
}

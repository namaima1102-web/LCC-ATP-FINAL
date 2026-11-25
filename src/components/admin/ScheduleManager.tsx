"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

interface PeriodItem {
  id: string;
  periodNo: number;
  name: string | null;
  startsOn: string;
  endsOn: string;
  status: "draft" | "published" | "closed";
  matchCount: number;
}

interface PlayerRef {
  id: string;
  fullName: string;
  teamId: string;
}

interface PreviewMatchItem {
  fixtureIndex: number;
  kind: "singles" | "doubles";
  periodNo: number;
  sideAPlayerIds: string[];
  sideBPlayerIds: string[];
  handicapCode: string;
  handicapGiver: "a" | "b" | null;
}

interface PreviewSummary {
  periodsCount: number;
  totalMatches: number;
  singlesCount: number;
  doublesCount: number;
  hardIssues: Array<{ rule: string; message: string }>;
  warnings: Array<{ rule: string; message: string }>;
  byPeriod: Array<{ periodNo: number; count: number }>;
  matches: PreviewMatchItem[];
}

export function ScheduleManager({
  periods: initialPeriods,
  players,
  existingMatchCount,
  defaultPeriodsCount,
}: {
  periods: PeriodItem[];
  players: PlayerRef[];
  existingMatchCount: number;
  defaultPeriodsCount: number;
}) {
  const router = useRouter();
  const [periods, setPeriods] = useState(initialPeriods);
  const [periodsCount, setPeriodsCount] = useState<number>(defaultPeriodsCount);
  const [balanceOpponents, setBalanceOpponents] = useState(true);
  const [balanceHandicap, setBalanceHandicap] = useState(false);
  const [preview, setPreview] = useState<PreviewSummary | null>(null);
  const [previewPeriodFilter, setPreviewPeriodFilter] = useState<number>(1);
  const [previewKindFilter, setPreviewKindFilter] = useState<string>("all");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p.fullName])),
    [players]
  );

  const handlePreview = async () => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/schedule/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodsCount,
          balanceOpponents,
          balanceHandicap,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi xem trước lịch");

      const matches = data.matches as PreviewMatchItem[];
      const issues = data.issues as Array<{
        rule: string;
        severity: string;
        message: string;
      }>;

      const byPeriod = Array.from({ length: periodsCount }, (_, i) => ({
        periodNo: i + 1,
        count: matches.filter((m) => m.periodNo === i + 1).length,
      }));

      setPreviewPeriodFilter(1);
      setPreview({
        periodsCount,
        totalMatches: matches.length,
        singlesCount: matches.filter((m) => m.kind === "singles").length,
        doublesCount: matches.filter((m) => m.kind === "doubles").length,
        hardIssues: issues.filter((i) => i.severity === "hard"),
        warnings: issues.filter((i) => i.severity === "warning"),
        byPeriod,
        matches,
      });
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi xem trước lịch.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveSchedule = async (replace: boolean) => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/schedule/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodsCount,
          balanceOpponents,
          balanceHandicap,
          replace,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu lịch");
      setStatusMsg(`Đã lưu thành công ${data.matchesCount} trận vào cơ sở dữ liệu!`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi lưu lịch.");
    } finally {
      setBusy(false);
    }
  };

  const handlePublishPeriod = async (periodId: string, periodNo: number) => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/periods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodId, action: "publish" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi đăng kỳ");
      setPeriods((prev) =>
        prev.map((p) => (p.id === periodId ? { ...p, status: "published" } : p))
      );
      setStatusMsg(`Đã đăng lịch Kỳ ${periodNo} công khai cho thành viên!`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi đăng kỳ.");
    } finally {
      setBusy(false);
    }
  };

  const handleSaveDates = async (period: PeriodItem) => {
    setBusy(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/periods", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodId: period.id,
          action: "update_dates",
          startsOn: period.startsOn,
          endsOn: period.endsOn,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi lưu ngày kỳ");
      setStatusMsg(`Đã cập nhật ngày cho Kỳ ${period.periodNo}.`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi lưu ngày kỳ.");
    } finally {
      setBusy(false);
    }
  };

  const previewMatchesFiltered = useMemo(() => {
    if (!preview) return [];
    return preview.matches.filter((m) => {
      if (m.periodNo !== previewPeriodFilter) return false;
      if (previewKindFilter !== "all" && m.kind !== previewKindFilter)
        return false;
      return true;
    });
  }, [preview, previewPeriodFilter, previewKindFilter]);

  return (
    <div className="flex flex-col gap-6">
      {statusMsg && (
        <div className="rounded-xl border border-[var(--brand-purple)] bg-[var(--brand-purple)]/10 px-4 py-2.5 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      {/* Bộ sinh lịch A4 */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-5">
        <h2 className="text-base font-extrabold">1. Bộ sinh lịch tự động (A4)</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Hiện có <strong>{existingMatchCount}</strong> trận đã lưu trong mùa giải.
        </p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex items-center gap-2 text-sm font-medium">
            <span>Số kỳ:</span>
            <select
              value={periodsCount}
              onChange={(e) => setPeriodsCount(Number(e.target.value))}
              className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2.5 text-sm font-semibold"
            >
              <option value={3}>3 kỳ (6 tuần · 44 trận/kỳ)</option>
              <option value={4}>4 kỳ (8 tuần · 33 trận/kỳ)</option>
            </select>
          </label>

          <label className="inline-flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={balanceOpponents}
              onChange={(e) => setBalanceOpponents(e.target.checked)}
            />
            <span>Cân bằng đối thủ đôi (R5)</span>
          </label>

          <label className="inline-flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={balanceHandicap}
              onChange={(e) => setBalanceHandicap(e.target.checked)}
            />
            <span>Cân bằng chênh điểm</span>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={busy}
            onClick={handlePreview}
            className="h-10 rounded-xl border border-[var(--brand-purple)] px-4 text-xs font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)] disabled:opacity-50"
          >
            {busy ? "Đang xử lý..." : "Sinh & Xem trước (132 trận)"}
          </button>

          <button
            type="button"
            disabled={busy}
            onClick={() => handleSaveSchedule(existingMatchCount > 0)}
            className="h-10 rounded-xl bg-[var(--brand-purple)] px-4 text-xs font-bold text-white disabled:opacity-50"
          >
            {existingMatchCount > 0 ? "Sinh lại & Ghi đè lịch nháp" : "Lưu lịch vào DB"}
          </button>
        </div>

        {preview && (
          <div className="mt-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-4 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-bold">
                Kết quả xem trước: {preview.totalMatches} trận ({preview.singlesCount} đơn +{" "}
                {preview.doublesCount} đôi)
              </p>
              <p className="text-xs">
                Lỗi cứng (R1–R4):{" "}
                <strong
                  className={
                    preview.hardIssues.length === 0 ? "text-emerald-600" : "text-red-600"
                  }
                >
                  {preview.hardIssues.length}
                </strong>{" "}
                · Cảnh báo (R5/R8): <strong>{preview.warnings.length}</strong>
              </p>
            </div>

            {/* Bộ lọc xem trước theo kỳ & loại trận */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {preview.byPeriod.map((p) => (
                <button
                  key={p.periodNo}
                  type="button"
                  onClick={() => setPreviewPeriodFilter(p.periodNo)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    previewPeriodFilter === p.periodNo
                      ? "bg-[var(--brand-purple)] text-white"
                      : "bg-[var(--bg-card)] text-[var(--text-main)]"
                  }`}
                >
                  Kỳ {p.periodNo} ({p.count} trận)
                </button>
              ))}

              <select
                aria-label="Lọc loại trận xem trước"
                value={previewKindFilter}
                onChange={(e) => setPreviewKindFilter(e.target.value)}
                className="ml-auto h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 text-xs font-semibold"
              >
                <option value="all">Đơn & Đôi</option>
                <option value="singles">Chỉ đơn</option>
                <option value="doubles">Chỉ đôi</option>
              </select>
            </div>

            {/* Danh sách chi tiết các trận xem trước */}
            <div className="mt-3 grid max-h-[420px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
              {previewMatchesFiltered.map((m, idx) => {
                const sideA = m.sideAPlayerIds
                  .map((id) => playerMap.get(id) ?? "?")
                  .join(" + ");
                const sideB = m.sideBPlayerIds
                  .map((id) => playerMap.get(id) ?? "?")
                  .join(" + ");
                const giver =
                  m.handicapGiver === "a"
                    ? `${sideA} chấp`
                    : m.handicapGiver === "b"
                      ? `${sideB} chấp`
                      : "Ngang";
                return (
                  <div
                    key={`${m.periodNo}-${m.kind}-${idx}`}
                    className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                      <span className="font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                        {m.kind === "singles" ? "Đơn" : "Đôi"}
                      </span>
                      <span>
                        Mã {m.handicapCode} ({giver})
                      </span>
                    </div>
                    <p className="mt-1 font-semibold">
                      {sideA} <span className="text-[var(--text-muted)]">vs</span> {sideB}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Đăng lịch từng kỳ (AC16) */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-5">
        <h2 className="text-base font-extrabold">2. Các kỳ thi đấu & Đăng lịch từng kỳ</h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Trận thuộc kỳ ở trạng thái <code>draft</code> bị ẩn với khách. Bấm{" "}
          <strong>Đăng lịch</strong> để công khai kỳ đó.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          {periods.map((period) => (
            <div
              key={period.id}
              className="flex flex-col gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold">
                    {period.name || `Kỳ ${period.periodNo}`}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      period.status === "published"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : period.status === "closed"
                          ? "bg-gray-500/15 text-gray-600 dark:text-gray-300"
                          : "bg-[var(--brand-orange)]/20 text-[#b45309] dark:text-[var(--brand-yellow)]"
                    }`}
                  >
                    {period.status === "published"
                      ? "Đã đăng"
                      : period.status === "closed"
                        ? "Đã đóng"
                        : "Nháp (ẩn)"}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    ({period.matchCount} trận)
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <input
                    type="date"
                    value={period.startsOn}
                    onChange={(e) =>
                      setPeriods((prev) =>
                        prev.map((x) =>
                          x.id === period.id ? { ...x, startsOn: e.target.value } : x
                        )
                      )
                    }
                    className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2"
                  />
                  <span>→</span>
                  <input
                    type="date"
                    value={period.endsOn}
                    onChange={(e) =>
                      setPeriods((prev) =>
                        prev.map((x) =>
                          x.id === period.id ? { ...x, endsOn: e.target.value } : x
                        )
                      )
                    }
                    className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleSaveDates(period)}
                    className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 font-semibold"
                  >
                    Lưu ngày
                  </button>
                </div>
              </div>

              {period.status === "draft" && (
                <button
                  type="button"
                  disabled={busy || period.matchCount === 0}
                  onClick={() => handlePublishPeriod(period.id, period.periodNo)}
                  className="h-9 shrink-0 rounded-xl bg-[var(--brand-blue)] px-4 text-xs font-bold text-white disabled:opacity-50"
                >
                  Đăng lịch Kỳ {period.periodNo}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

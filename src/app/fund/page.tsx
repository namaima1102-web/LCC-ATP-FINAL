import { PublicHeader } from "@/components/public/PublicHeader";
import {
  computeFundSummary,
  DEFAULT_FUND_FEE_PER_SEASON_K,
  DEFAULT_SEASON5_FUND_RECORDS,
  type FundRecord,
} from "@/lib/domain/fund";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";

export const dynamic = "force-dynamic";

export default async function PublicFundPage() {
  const data = await loadPublicSeasonData();
  const rawSettings = (data?.season.settings ?? {}) as unknown as {
    fund_records?: FundRecord[];
    fund_fee_per_season?: number;
  };

  const records =
    Array.isArray(rawSettings.fund_records) && rawSettings.fund_records.length > 0
      ? rawSettings.fund_records
      : DEFAULT_SEASON5_FUND_RECORDS;
  const feeK = rawSettings.fund_fee_per_season ?? DEFAULT_FUND_FEE_PER_SEASON_K;

  const summary = computeFundSummary(records, feeK);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data?.season.name}
        subtitle={data?.season.settings.subtitle}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-extrabold">Bảng đóng quỹ CLB</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Mức đóng: <strong>{feeK}.000đ / mùa</strong> · Số mùa tính phí = số
            mùa trước + Mùa 5 (nếu tham gia).
          </p>
        </div>

        <section className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 sm:text-2xl">
              {summary.totalCollectedK.toLocaleString("vi-VN")}k
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Tổng đã thu</p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <p className="text-lg font-extrabold text-[var(--brand-orange)] sm:text-2xl">
              {summary.totalDueK.toLocaleString("vi-VN")}k
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Cần đóng thêm</p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <p className="text-lg font-extrabold text-[var(--brand-blue)] dark:text-[#60a5fa] sm:text-2xl">
              {summary.totalSurplusK.toLocaleString("vi-VN")}k
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">Đóng dư</p>
          </div>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--brand-navy)] text-white">
                <th className="rounded-tl-lg px-3 py-2.5">STT</th>
                <th className="px-3 py-2.5">Tuyển thủ</th>
                <th className="px-3 py-2.5 text-center">Đã đóng</th>
                <th className="px-3 py-2.5 text-center">Số mùa</th>
                <th className="px-3 py-2.5 text-center">Còn dư</th>
                <th className="px-3 py-2.5 text-center">Cần đóng</th>
                <th className="rounded-tr-lg px-3 py-2.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((r, idx) => (
                <tr
                  key={r.id}
                  className={`border-b border-[var(--border-subtle)]/50 last:border-0 ${
                    !r.playsSeason5 ? "opacity-60" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 text-[var(--text-muted)]">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2.5 font-bold">
                    <span className={!r.playsSeason5 ? "line-through" : ""}>
                      {r.fullName}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center font-semibold">
                    {r.totalPaidK}k
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {r.totalSeasons}
                    {r.playsSeason5 ? " (có M5)" : ""}
                  </td>
                  <td className="px-3 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">
                    {r.surplusK > 0 ? `+${r.surplusK}k` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {r.dueK > 0 ? (
                      <span className="rounded-full bg-[var(--brand-orange)]/20 px-2.5 py-0.5 text-xs font-extrabold text-[#b45309] dark:text-[var(--brand-yellow)]">
                        {r.dueK}k
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Đủ
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-[var(--text-muted)]">
                    {r.note ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

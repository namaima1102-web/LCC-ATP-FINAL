import { PublicHeader } from "@/components/public/PublicHeader";
import {
  computeFundSummary,
  DEFAULT_FUND_FEE_PER_SEASON_K,
  DEFAULT_OPENING_BALANCE_K,
  DEFAULT_SEASON5_FUND_RECORDS,
  type FundExpense,
  type FundRecord,
} from "@/lib/domain/fund";
import { formatDateVN } from "@/lib/domain/progress";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";

export const dynamic = "force-dynamic";

export default async function PublicFundPage() {
  const data = await loadPublicSeasonData();
  const rawSettings = (data?.season.settings ?? {}) as unknown as {
    fund_records?: FundRecord[];
    fund_fee_per_season?: number;
    fund_opening_balance_k?: number;
    fund_expenses?: FundExpense[];
  };

  const records =
    Array.isArray(rawSettings.fund_records) && rawSettings.fund_records.length > 0
      ? rawSettings.fund_records
      : DEFAULT_SEASON5_FUND_RECORDS;
  const feeK = rawSettings.fund_fee_per_season ?? DEFAULT_FUND_FEE_PER_SEASON_K;
  const openingK =
    rawSettings.fund_opening_balance_k ?? DEFAULT_OPENING_BALANCE_K;
  const expenses = Array.isArray(rawSettings.fund_expenses)
    ? rawSettings.fund_expenses
    : [];

  const summary = computeFundSummary(records, feeK, openingK, expenses);

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data?.season.name}
        subtitle={data?.season.settings.subtitle}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-xl font-extrabold">Bảng đóng quỹ & Thu chi CLB</h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Mức đóng: <strong>{feeK}.000đ / mùa</strong> · Số mùa tính phí = số
            mùa trước + Mùa 5 (nếu tham gia).
          </p>
        </div>

        <section className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <p className="text-lg font-extrabold text-[var(--text-main)] sm:text-2xl">
              {summary.openingBalanceK.toLocaleString("vi-VN")}k
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Quỹ tồn đầu mùa
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <p className="text-lg font-extrabold text-emerald-500 sm:text-2xl">
              +{summary.m5IncomeK.toLocaleString("vi-VN")}k
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Thu mới Mùa 5
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
            <p className="text-lg font-extrabold text-red-500 sm:text-2xl">
              -{summary.totalExpensesK.toLocaleString("vi-VN")}k
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Chi giải Mùa 5
            </p>
          </div>
          <div className="rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--bg-card)] p-4">
            <p className="text-lg font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)] sm:text-2xl">
              {summary.currentBalanceK.toLocaleString("vi-VN")}k
            </p>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              Quỹ hiện còn
            </p>
          </div>
        </section>

        <section className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-extrabold">
              Chi tiết đóng quỹ thành viên
            </h2>
            <span className="text-xs text-[var(--text-muted)]">
              Cần thu thêm M5:{" "}
              <strong className="text-[var(--brand-orange)]">
                {summary.totalDueK.toLocaleString("vi-VN")}k
              </strong>
            </span>
          </div>
          <table className="w-full min-w-[660px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] bg-[var(--brand-navy)] text-white">
                <th className="rounded-tl-lg px-3 py-2.5">STT</th>
                <th className="px-3 py-2.5">Tuyển thủ</th>
                <th className="px-3 py-2.5 text-center">Đóng M5</th>
                <th className="px-3 py-2.5 text-center">Tổng đã đóng</th>
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
                  <td className="px-3 py-2.5 text-center font-bold text-emerald-500">
                    {(r.m5PaidK ?? 0) > 0 ? `+${r.m5PaidK}k` : "—"}
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

        {/* Bảng các khoản chi Mùa 5 */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <h2 className="mb-2 text-sm font-extrabold">
            Các khoản chi giải Mùa 5 ({expenses.length})
          </h2>
          {expenses.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)]">
              Chưa có khoản chi nào trong Mùa 5.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                    <th className="py-2 pr-3">Ngày</th>
                    <th className="px-2 py-2">Nội dung chi</th>
                    <th className="py-2 pl-2 text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((ex) => (
                    <tr
                      key={ex.id}
                      className="border-b border-[var(--border-subtle)]/50 last:border-0"
                    >
                      <td className="py-2 pr-3 whitespace-nowrap">
                        {formatDateVN(ex.date)}
                      </td>
                      <td className="px-2 py-2 font-semibold">
                        {ex.description}
                      </td>
                      <td className="py-2 pl-2 text-right font-bold text-red-500">
                        -{ex.amountK.toLocaleString("vi-VN")}k
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

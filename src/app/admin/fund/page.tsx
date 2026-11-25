import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { FundManager } from "@/components/admin/FundManager";
import {
  DEFAULT_FUND_FEE_PER_SEASON_K,
  DEFAULT_SEASON5_FUND_RECORDS,
  type FundRecord,
} from "@/lib/domain/fund";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminFundPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const ctx = await loadCurrentSeasonContext();
  const rawSettings = (ctx?.season.settings ?? {}) as unknown as {
    fund_records?: FundRecord[];
    fund_fee_per_season?: number;
  };

  const records =
    Array.isArray(rawSettings.fund_records) && rawSettings.fund_records.length > 0
      ? rawSettings.fund_records
      : DEFAULT_SEASON5_FUND_RECORDS;
  const feeK = rawSettings.fund_fee_per_season ?? DEFAULT_FUND_FEE_PER_SEASON_K;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-xl font-extrabold">
          Quản lý đóng quỹ CLB ({feeK}k/mùa)
        </h1>
        <FundManager initialRecords={records} feePerSeasonK={feeK} />
      </main>
    </div>
  );
}

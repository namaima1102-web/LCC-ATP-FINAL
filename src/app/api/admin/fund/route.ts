import { NextResponse } from "next/server";
import { writeAuditLog } from "@/lib/audit";
import type { FundExpense, FundRecord } from "@/lib/domain/fund";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function PUT(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Không có quyền Admin." }, { status: 401 });
  }

  const body = (await request.json()) as {
    records: FundRecord[];
    feePerSeasonK?: number;
    openingBalanceK?: number;
    expenses?: FundExpense[];
  };

  if (!Array.isArray(body.records)) {
    return NextResponse.json({ error: "Dữ liệu quỹ không hợp lệ." }, { status: 400 });
  }

  const ctx = await loadCurrentSeasonContext();
  if (!ctx) {
    return NextResponse.json({ error: "Chưa có mùa giải." }, { status: 404 });
  }

  const nextSettings = {
    ...ctx.season.settings,
    fund_records: body.records,
    fund_fee_per_season: body.feePerSeasonK ?? 50,
    fund_opening_balance_k: body.openingBalanceK ?? 1145,
    fund_expenses: body.expenses ?? [],
  };

  const db = createAdminClient();
  const { error } = await db
    .from("seasons")
    .update({ settings: nextSettings })
    .eq("id", ctx.season.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAuditLog({
    actor: admin.userId,
    action: "update_fund_records",
    entity: "seasons",
    entityId: ctx.season.id,
    after: {
      count: body.records.length,
      openingBalanceK: nextSettings.fund_opening_balance_k,
      expensesCount: nextSettings.fund_expenses.length,
    },
  });

  return NextResponse.json({ ok: true });
}

export interface FundRecord {
  id: string;
  fullName: string;
  /** Tổng số tiền đã đóng từ trước đến nay (đơn vị: nghìn đồng, ví dụ 200 = 200k) */
  totalPaidK: number;
  /** Số tiền đã đóng riêng trong Mùa 5 (nghìn đồng) */
  m5PaidK?: number;
  /** Số mùa đã chơi trước Mùa 5 */
  prevSeasonsCount: number;
  /** Có tham gia Mùa 5 hay không (nếu có sẽ tính thêm 1 mùa) */
  playsSeason5: boolean;
  note?: string | null;
}

export interface FundExpense {
  id: string;
  date: string;
  description: string;
  amountK: number;
}

export interface FundRowComputed extends FundRecord {
  totalSeasons: number;
  totalFeeK: number;
  surplusK: number;
  dueK: number;
}

export interface FundSummary {
  rows: FundRowComputed[];
  totalCollectedK: number;
  totalDueK: number;
  totalSurplusK: number;
  openingBalanceK: number;
  m5IncomeK: number;
  totalExpensesK: number;
  currentBalanceK: number;
}

export const DEFAULT_FUND_FEE_PER_SEASON_K = 50;
export const DEFAULT_OPENING_BALANCE_K = 1145;

/**
 * Dữ liệu quỹ khởi tạo từ bảng tổng hợp + sổ thu Mùa 5 của anh Nam (đơn vị: nghìn đồng).
 */
export const DEFAULT_SEASON5_FUND_RECORDS: FundRecord[] = [
  { id: "f-1", fullName: "Vĩnh", totalPaidK: 250, m5PaidK: 0, prevSeasonsCount: 2, playsSeason5: false, note: "Nghỉ M5" },
  { id: "f-2", fullName: "Thanh", totalPaidK: 200, m5PaidK: 0, prevSeasonsCount: 4, playsSeason5: true },
  { id: "f-3", fullName: "Dương", totalPaidK: 250, m5PaidK: 50, prevSeasonsCount: 4, playsSeason5: true, note: "Đã đóng 50k M5" },
  { id: "f-4", fullName: "Kiên", totalPaidK: 200, m5PaidK: 0, prevSeasonsCount: 4, playsSeason5: true },
  { id: "f-5", fullName: "Sinh", totalPaidK: 250, m5PaidK: 0, prevSeasonsCount: 4, playsSeason5: true, note: "Đóng dư từ mùa trước" },
  { id: "f-6", fullName: "Thảo", totalPaidK: 150, m5PaidK: 0, prevSeasonsCount: 4, playsSeason5: true },
  { id: "f-7", fullName: "Đức", totalPaidK: 150, m5PaidK: 0, prevSeasonsCount: 4, playsSeason5: true },
  { id: "f-8", fullName: "Hiếu", totalPaidK: 150, m5PaidK: 0, prevSeasonsCount: 4, playsSeason5: true },
  { id: "f-9", fullName: "Túy", totalPaidK: 100, m5PaidK: 0, prevSeasonsCount: 3, playsSeason5: false, note: "Nghỉ M5" },
  { id: "f-10", fullName: "Vinh", totalPaidK: 200, m5PaidK: 0, prevSeasonsCount: 4, playsSeason5: true },
  { id: "f-11", fullName: "Thùy", totalPaidK: 150, m5PaidK: 0, prevSeasonsCount: 3, playsSeason5: false, note: "Nghỉ M5" },
  { id: "f-12", fullName: "Nam", totalPaidK: 150, m5PaidK: 0, prevSeasonsCount: 3, playsSeason5: true },
  { id: "f-13", fullName: "Thông", totalPaidK: 150, m5PaidK: 0, prevSeasonsCount: 3, playsSeason5: true },
  { id: "f-14", fullName: "Khanh", totalPaidK: 100, m5PaidK: 0, prevSeasonsCount: 2, playsSeason5: true },
  { id: "f-15", fullName: "Nam Gai", totalPaidK: 200, m5PaidK: 100, prevSeasonsCount: 2, playsSeason5: true, note: "Đã đóng 100k M5" },
  { id: "f-16", fullName: "Nhất", totalPaidK: 150, m5PaidK: 0, prevSeasonsCount: 2, playsSeason5: true, note: "Đóng dư từ mùa trước" },
  { id: "f-17", fullName: "Dũng", totalPaidK: 50, m5PaidK: 0, prevSeasonsCount: 1, playsSeason5: true },
  { id: "f-18", fullName: "Hùng", totalPaidK: 50, m5PaidK: 0, prevSeasonsCount: 1, playsSeason5: true },
  { id: "f-19", fullName: "Phương", totalPaidK: 50, m5PaidK: 0, prevSeasonsCount: 1, playsSeason5: false, note: "Nghỉ M5" },
  { id: "f-20", fullName: "Tân", totalPaidK: 100, m5PaidK: 100, prevSeasonsCount: 0, playsSeason5: true, note: "Đã ck 100k M5" },
];

/**
 * Tính toán số tiền Còn dư / Cần đóng và số dư quỹ hiện tại.
 */
export function computeFundSummary(
  records: FundRecord[],
  feePerSeasonK: number = DEFAULT_FUND_FEE_PER_SEASON_K,
  openingBalanceK: number = DEFAULT_OPENING_BALANCE_K,
  expenses: FundExpense[] = []
): FundSummary {
  let totalCollectedK = 0;
  let totalDueK = 0;
  let totalSurplusK = 0;
  let m5IncomeK = 0;

  const rows: FundRowComputed[] = records.map((r) => {
    const totalSeasons = r.prevSeasonsCount + (r.playsSeason5 ? 1 : 0);
    const totalFeeK = totalSeasons * feePerSeasonK;
    const diff = r.totalPaidK - totalFeeK;
    const surplusK = diff > 0 ? diff : 0;
    const dueK = diff < 0 ? -diff : 0;

    totalCollectedK += r.totalPaidK;
    totalDueK += dueK;
    totalSurplusK += surplusK;
    m5IncomeK += r.m5PaidK ?? 0;

    return {
      ...r,
      totalSeasons,
      totalFeeK,
      surplusK,
      dueK,
    };
  });

  const totalExpensesK = expenses.reduce((sum, e) => sum + (e.amountK || 0), 0);
  const currentBalanceK = openingBalanceK + m5IncomeK - totalExpensesK;

  return {
    rows,
    totalCollectedK,
    totalDueK,
    totalSurplusK,
    openingBalanceK,
    m5IncomeK,
    totalExpensesK,
    currentBalanceK,
  };
}

import Link from "next/link";
import { PublicHeader } from "@/components/public/PublicHeader";
import { getHandicapBreakdown } from "@/lib/domain/handicap";
import { DEFAULT_SEASON_SETTINGS } from "@/lib/domain/season-config";
import { loadPublicSeasonData } from "@/lib/supabase/public-season";
import season5Seed from "../../../seed/season5.json";

export const dynamic = "force-dynamic";

export default async function PublicRulesPage() {
  const data = await loadPublicSeasonData();
  const settings = data?.season.settings ?? DEFAULT_SEASON_SETTINGS;

  const rules =
    data && data.handicapRules.length > 0
      ? data.handicapRules
      : season5Seed.handicap_rules.map((r) => ({
          diff: r.diff,
          singlesCode: r.singles,
          doublesCode: r.doubles,
        }));

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <PublicHeader
        seasonName={data?.season.name}
        subtitle={settings.subtitle}
      />

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-xl font-extrabold">
            Luật chấp & Quy định giải đấu
          </h1>
          <Link
            href="/schedule"
            className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
          >
            ← Trở về Lịch thi đấu
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-12">
          {/* Bảng chấp điểm */}
          <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 lg:col-span-7">
            <h2 className="text-base font-extrabold text-[var(--brand-navy)] dark:text-[var(--brand-yellow)]">
              Bảng chấp điểm (Đơn & Đôi)
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Mã <code>x-y-z</code>: set lẻ (1, 3, 5) dùng số đầu <code>x</code>,
              set chẵn (2, 4) dùng số giữa <code>y</code>. Bên điểm cao nhường
              điểm cho bên điểm thấp.
            </p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--brand-navy)] text-xs text-white">
                    <th className="rounded-tl-lg px-3 py-2.5">Chênh điểm</th>
                    <th className="px-3 py-2.5 text-center">Đơn</th>
                    <th className="px-3 py-2.5 text-center">Đôi</th>
                    <th className="rounded-tr-lg px-3 py-2.5">
                      Áp dụng từng set (S1–S5)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => {
                    const sets = getHandicapBreakdown(
                      r.singlesCode,
                      5,
                      settings.handicap_pattern
                    );
                    return (
                      <tr
                        key={r.diff}
                        className="border-b border-[var(--border-subtle)]/60 last:border-0"
                      >
                        <td className="px-3 py-2.5 font-bold">
                          {r.diff.toString().replace(".", ",")}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                          {r.singlesCode}
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono font-bold text-[var(--brand-blue)] dark:text-[#60a5fa]">
                          {r.doublesCode}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[var(--text-muted)]">
                          {r.diff === 0
                            ? "Ngang điểm (0-0-0-0-0)"
                            : sets.map((s) => `S${s.setNo}: ${s.points}`).join(" · ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Cách tính chấp & Thể thức */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
              <h2 className="text-base font-extrabold text-[var(--brand-navy)] dark:text-[var(--brand-yellow)]">
                Cách tính chênh & chấp
              </h2>
              <div className="mt-3 flex flex-col gap-3 text-sm">
                <div className="rounded-xl bg-[var(--bg-page)] p-3.5">
                  <p className="font-bold">Trận Đơn</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Chênh = |Điểm VĐV 1 − Điểm VĐV 2| → tra bảng chấp bên cạnh.
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--bg-page)] p-3.5">
                  <p className="font-bold">Trận Đôi</p>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Chênh = |(Tổng điểm cặp 1 − Tổng điểm cặp 2) /{" "}
                    {settings.doubles_diff_divisor}| → tra cùng bảng chấp.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
              <h2 className="text-base font-extrabold text-[var(--brand-navy)] dark:text-[var(--brand-yellow)]">
                Thể thức & Quy định chung
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 text-xs leading-relaxed text-[var(--text-muted)]">
                <li>
                  <strong className="text-[var(--text-main)]">Thể thức:</strong>{" "}
                  Mọi trận đơn (thắng {settings.singles_sets_to_win} set) và đôi
                  (thắng {settings.doubles_sets_to_win} set) đều đấu tối đa 5 set.
                  Tỉ số hợp lệ: <code>3-0</code>, <code>3-1</code>,{" "}
                  <code>3-2</code>.
                </li>
                <li>
                  <strong className="text-[var(--text-main)]">Số trận:</strong>{" "}
                  Tổng 132 trận (96 đơn + 36 đôi). Mỗi VĐV đánh 12 đơn + 9 đôi =
                  21 trận, chia đều vào {settings.periods_count} kỳ (mỗi kỳ 2 tuần).
                </li>
                <li>
                  <strong className="text-[var(--text-main)]">Điểm đội:</strong>{" "}
                  Mỗi trận thắng cho đội 1 điểm (kể cả đơn và đôi). Hết kỳ, trận
                  chưa đấu sẽ bị xử thua theo quyết định của BTC.
                </li>
                <li>
                  <strong className="text-[var(--text-main)]">
                    Điều chỉnh điểm cuối mùa:
                  </strong>{" "}
                  Tỷ lệ thắng ≤ {settings.rating_decrease_max_pct}% giảm{" "}
                  {settings.rating_max_delta} điểm;{" "}
                  {settings.rating_decrease_max_pct + 1}%–
                  {settings.rating_increase_min_pct - 1}% giữ nguyên; ≥{" "}
                  {settings.rating_increase_min_pct}% tăng{" "}
                  {settings.rating_max_delta} điểm (tối thiểu{" "}
                  {settings.rating_min_matches} trận).
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

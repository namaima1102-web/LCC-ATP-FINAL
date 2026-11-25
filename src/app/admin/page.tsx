import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { loadCurrentSeasonContext } from "@/lib/supabase/admin-season";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createAdminClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const ctx = await loadCurrentSeasonContext();
  let matchesCount = 0;
  if (ctx) {
    const db = createAdminClient();
    const { count } = await db
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("season_id", ctx.season.id);
    matchesCount = count ?? 0;
  }

  const publishedPeriods =
    ctx?.periods.filter((p) => p.status === "published").length ?? 0;

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />

      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-extrabold">Tổng quan mùa giải</h1>
            <Link
              href="/"
              className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
            >
              Xem trang công khai →
            </Link>
          </div>

          {ctx ? (
            <div className="mt-4">
              <p className="text-sm text-[var(--text-muted)]">
                Mùa hiện tại:{" "}
                <strong className="text-[var(--text-main)]">
                  {ctx.season.name} ({ctx.season.code})
                </strong>{" "}
                · Trạng thái: <code className="text-xs">{ctx.season.status}</code>
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                <div className="rounded-xl bg-[var(--bg-page)] p-3">
                  <p className="text-xl font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                    {ctx.teams.length}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Đội</p>
                </div>
                <div className="rounded-xl bg-[var(--bg-page)] p-3">
                  <p className="text-xl font-extrabold text-[var(--brand-blue)] dark:text-[#60a5fa]">
                    {ctx.players.length}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Tuyển thủ</p>
                </div>
                <div className="rounded-xl bg-[var(--bg-page)] p-3">
                  <p className="text-xl font-extrabold text-[var(--brand-orange)]">
                    {matchesCount}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Trận đã sinh</p>
                </div>
                <div className="rounded-xl bg-[var(--bg-page)] p-3">
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {publishedPeriods}/{ctx.periods.length}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Kỳ đã đăng</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-[var(--brand-orange)]">
              Chưa có dữ liệu mùa giải trong Supabase. Hãy chạy lệnh{" "}
              <code>npm run seed</code> để nạp Mùa 5.
            </p>
          )}
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            href="/admin/submissions"
            className="rounded-2xl border-2 border-[var(--brand-orange)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
          >
            <p className="text-sm font-extrabold">A1 · Hàng đợi duyệt tỉ số</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Duyệt, sửa rồi duyệt, từ chối bản gửi từ khách và xem cảnh báo xung đột.
            </p>
          </Link>

          <Link
            href="/admin/teams"
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
          >
            <p className="text-sm font-extrabold">A3 · Đội & Tuyển thủ</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Đổi tên đội, màu đội, sửa điểm trình và đánh dấu điểm tạm.
            </p>
          </Link>

          <Link
            href="/admin/schedule"
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
          >
            <p className="text-sm font-extrabold">A4 · Bộ sinh lịch & Kỳ</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Sinh 132 trận, chia 3 kỳ hoặc 4 kỳ, kiểm tra R1–R5 & đăng từng kỳ.
            </p>
          </Link>

          <Link
            href="/admin/matches"
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
          >
            <p className="text-sm font-extrabold">A5 · Quản lý trận</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Lọc trận theo kỳ, đổi kỳ cho trận (kèm lý do) hoặc hủy trận.
            </p>
          </Link>

          <Link
            href="/admin/progress"
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
          >
            <p className="text-sm font-extrabold">A11 · Tiến độ & Cảnh báo</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Theo dõi tỷ lệ hoàn thành, danh sách VĐV còn nợ trận và mức chậm.
            </p>
          </Link>

          <Link
            href="/admin/forfeits"
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
          >
            <p className="text-sm font-extrabold">Đóng kỳ & Xử thua</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Cập nhật kết quả xử thua cho trận tồn cuối kỳ và khóa kỳ thi đấu.
            </p>
          </Link>

          <Link
            href="/admin/handicap"
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
          >
            <p className="text-sm font-extrabold">A6 · Bảng chấp</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Sửa mã chấp từng mức chênh và tự động cập nhật lại các trận chưa đấu.
            </p>
          </Link>

          <Link
            href="/admin/ratings"
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
          >
            <p className="text-sm font-extrabold">A7 · Điều chỉnh điểm</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Xem gợi ý tăng/giảm điểm cuối mùa và chốt điểm (ghi đè kèm lý do).
            </p>
          </Link>

          <Link
            href="/admin/settings"
            className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--brand-purple)]"
          >
            <p className="text-sm font-extrabold">A8 · Cấu hình mùa giải</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Chỉnh ngưỡng tăng/giảm điểm, cảnh báo trận tồn, số bàn và chống spam.
            </p>
          </Link>
        </section>
      </main>
    </div>
  );
}

import Image from "next/image";
import { ThemeToggle } from "@/components/ThemeToggle";
import season5 from "../../seed/season5.json";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      {/* Thanh đầu trang */}
      <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo-legend-chicks-cup.png"
              alt="Logo Legend Chicks Cup 2026"
              width={40}
              height={40}
              className="h-10 w-10 shrink-0 object-contain"
              priority
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-tight text-[var(--brand-navy)] dark:text-[var(--brand-yellow)]">
                {season5.season.name}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {season5.season.subtitle}
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Nội dung trang chủ trống M0 */}
      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--bg-card)] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-2xl bg-[var(--brand-navy-deep)]/5 p-3 dark:bg-white/5">
              <Image
                src="/logo-legend-chicks-cup.png"
                alt="Logo Legend Chicks Cup 2026"
                width={140}
                height={140}
                className="h-32 w-32 object-contain sm:h-36 sm:w-36"
                priority
              />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-yellow)]/20 px-3 py-1 text-xs font-bold text-[#9a6b00] dark:text-[var(--brand-yellow)]">
              <span className="h-2 w-2 rounded-full bg-[var(--brand-orange)]" />
              Milestone M0 · Khởi tạo thành công (Local)
            </span>

            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[var(--brand-navy)] dark:text-white sm:text-3xl">
              {season5.season.name}
            </h1>
            <p className="mt-1 text-sm font-medium text-[var(--text-muted)] sm:text-base">
              {season5.season.subtitle}
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--text-muted)]">
              Khung ứng dụng Next.js + TypeScript + Tailwind CSS và nhận diện
              thương hiệu đã sẵn sàng. Các tính năng giải đấu sẽ được xây dựng
              theo từng Milestone tiếp theo.
            </p>
          </div>
        </section>

        {/* Thông tin nhanh cấu hình Mùa 5 từ seed */}
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Sẵn sàng cho Mùa 5 ({season5.season.code})
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <div className="rounded-xl bg-[var(--bg-page)] p-3">
              <p className="text-xl font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                {season5.teams.length}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Đội thi đấu</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-page)] p-3">
              <p className="text-xl font-extrabold text-[var(--brand-blue)] dark:text-[#60a5fa]">
                {season5.players.length}
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">Tuyển thủ</p>
            </div>
            <div className="rounded-xl bg-[var(--bg-page)] p-3">
              <p className="text-xl font-extrabold text-[var(--brand-orange)]">
                132
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Tổng số trận đấu
              </p>
            </div>
            <div className="rounded-xl bg-[var(--bg-page)] p-3">
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                12 / 9
              </p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                Đơn / Đôi mỗi VĐV
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {season5.teams.map((team) => (
              <span
                key={team.name}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-1.5 text-xs font-semibold"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                {team.name}
              </span>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

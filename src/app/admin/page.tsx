import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getCurrentAdmin } from "@/lib/supabase/auth";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) {
    redirect("/admin/login");
  }

  const supabase = await createClient();
  const { data: season } = await supabase
    .from("seasons")
    .select("id, code, name, status")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let teamsCount = 0;
  let playersCount = 0;
  let handicapCount = 0;

  if (season) {
    const [teamsRes, playersRes, hcRes] = await Promise.all([
      supabase
        .from("teams")
        .select("id", { count: "exact", head: true })
        .eq("season_id", season.id),
      supabase
        .from("season_players")
        .select("player_id", { count: "exact", head: true })
        .eq("season_id", season.id),
      supabase
        .from("handicap_rules")
        .select("diff", { count: "exact", head: true })
        .eq("season_id", season.id),
    ]);
    teamsCount = teamsRes.count ?? 0;
    playersCount = playersRes.count ?? 0;
    handicapCount = hcRes.count ?? 0;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              src="/logo-legend-chicks-cup.png"
              alt="Logo Legend Chicks Cup 2026"
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 object-contain"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold text-[var(--brand-navy)] dark:text-[var(--brand-yellow)]">
                Quản trị giải đấu
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {admin.displayName || admin.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-extrabold">
              Trạng thái dữ liệu (Milestone M1)
            </h1>
            <Link
              href="/"
              className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
            >
              Xem trang công khai →
            </Link>
          </div>

          {season ? (
            <div className="mt-4">
              <p className="text-sm text-[var(--text-muted)]">
                Mùa hiện tại:{" "}
                <strong className="text-[var(--text-main)]">
                  {season.name} ({season.code})
                </strong>{" "}
                · Trạng thái: <code className="text-xs">{season.status}</code>
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-[var(--bg-page)] p-3">
                  <p className="text-xl font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                    {teamsCount}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Đội</p>
                </div>
                <div className="rounded-xl bg-[var(--bg-page)] p-3">
                  <p className="text-xl font-extrabold text-[var(--brand-blue)] dark:text-[#60a5fa]">
                    {playersCount}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Tuyển thủ</p>
                </div>
                <div className="rounded-xl bg-[var(--bg-page)] p-3">
                  <p className="text-xl font-extrabold text-[var(--brand-orange)]">
                    {handicapCount}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Mức chấp</p>
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
      </main>
    </div>
  );
}

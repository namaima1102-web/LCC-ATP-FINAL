"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

const PUBLIC_NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/schedule", label: "Lịch & Kết quả" },
  { href: "/standings", label: "Bảng xếp hạng" },
  { href: "/players", label: "Tuyển thủ" },
  { href: "/calculator", label: "Máy tính chấp" },
  { href: "/tonight", label: "Tối nay ai đến" },
  { href: "/history", label: "Lịch sử các mùa" },
  { href: "/rules", label: "Luật chấp & Quy định" },
];

export function PublicHeader({
  seasonName = "Legend Chicks Cup 2026",
  subtitle = "Giải bóng bàn Gà Con · Mùa 5",
}: {
  seasonName?: string;
  subtitle?: string;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
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
              {seasonName}
            </p>
            <p className="truncate text-xs text-[var(--text-muted)]">
              {subtitle}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/admin"
            className="hidden h-10 items-center rounded-xl border border-[var(--border-subtle)] px-3 text-xs font-semibold text-[var(--text-muted)] hover:border-[var(--brand-purple)] hover:text-[var(--text-main)] sm:inline-flex"
          >
            BTC / Admin
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto px-4 pb-2.5 sm:px-6 lg:px-8"
      >
        {PUBLIC_NAV.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-[var(--brand-purple)] text-white"
                  : "border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-main)] hover:border-[var(--brand-purple)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/admin"
          className="ml-auto shrink-0 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 py-1.5 text-xs font-semibold text-[var(--text-muted)] sm:hidden"
        >
          Admin
        </Link>
      </nav>
    </header>
  );
}

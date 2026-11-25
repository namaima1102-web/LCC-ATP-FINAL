"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/app/admin/LogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/teams", label: "Đội & Tuyển thủ" },
  { href: "/admin/schedule", label: "Sinh lịch & Kỳ" },
  { href: "/admin/matches", label: "Quản lý trận" },
];

export function AdminHeader({ adminLabel }: { adminLabel: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
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
              {adminLabel}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </div>

      <nav
        aria-label="Điều hướng Admin"
        className="mx-auto flex max-w-7xl gap-1.5 overflow-x-auto px-4 pb-2.5 sm:px-6 lg:px-8"
      >
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-[var(--brand-purple)] text-white"
                  : "border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-main)] hover:border-[var(--brand-purple)]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

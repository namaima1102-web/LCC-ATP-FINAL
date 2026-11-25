"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/app/admin/LogoutButton";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan" },
  { href: "/admin/submissions", label: "Duyệt tỉ số" },
  { href: "/admin/teams", label: "Đội & Tuyển thủ" },
  { href: "/admin/schedule", label: "Sinh lịch & Kỳ" },
  { href: "/admin/matches", label: "Quản lý trận" },
  { href: "/admin/progress", label: "Tiến độ & Cảnh báo" },
  { href: "/admin/forfeits", label: "Đóng kỳ & Xử thua" },
  { href: "/admin/handicap", label: "Bảng chấp" },
  { href: "/admin/ratings", label: "Điểm cuối mùa" },
  { href: "/admin/settings", label: "Cấu hình" },
  { href: "/admin/audit", label: "Nhật ký" },
  { href: "/admin/data", label: "Xuất Excel" },
  { href: "/admin/fund", label: "Quỹ CLB" },
];

export function AdminHeader({ adminLabel }: { adminLabel: string }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel =
    NAV_ITEMS.find((i) => i.href === pathname)?.label ?? "Quản trị";

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
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Mở menu Admin"
            className="inline-flex h-10 items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2.5 text-xs font-bold md:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!mobileOpen && (
        <div className="flex items-center justify-between border-t border-[var(--border-subtle)]/60 px-4 py-1.5 text-xs md:hidden">
          <span className="font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
            {currentLabel}
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="font-semibold text-[var(--text-muted)] underline"
          >
            Danh mục Admin ▾
          </button>
        </div>
      )}

      {mobileOpen && (
        <nav
          aria-label="Menu Admin di động"
          className="grid grid-cols-2 gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 md:hidden"
        >
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex h-9 items-center justify-center rounded-xl px-2 text-center text-xs font-bold transition ${
                  active
                    ? "bg-[var(--brand-purple)] text-white"
                    : "border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-main)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}

      <nav
        aria-label="Điều hướng Admin"
        className="mx-auto hidden max-w-7xl flex-wrap gap-1.5 px-4 pb-2.5 sm:px-6 md:flex lg:px-8"
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

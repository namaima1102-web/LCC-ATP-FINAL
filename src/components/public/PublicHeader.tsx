"use client";

import { Menu, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

const PUBLIC_NAV = [
  { href: "/", label: "Trang chủ" },
  { href: "/schedule", label: "Lịch & Kết quả" },
  { href: "/standings", label: "Bảng xếp hạng" },
  { href: "/players", label: "Tuyển thủ" },
  { href: "/calculator", label: "Máy tính chấp" },
  { href: "/tonight", label: "Tối nay ai đến" },
  { href: "/history", label: "Lịch sử các mùa" },
  { href: "/fund", label: "Quỹ CLB" },
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel =
    PUBLIC_NAV.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    )?.label ?? "Menu";

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
            className="hidden h-10 items-center rounded-xl border border-[var(--border-subtle)] px-3 text-xs font-semibold text-[var(--text-muted)] hover:border-[var(--brand-purple)] hover:text-[var(--text-main)] md:inline-flex"
          >
            BTC / Admin
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Mở menu điều hướng"
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-xs font-bold md:hidden"
          >
            {mobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4 text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]" />
            )}
            <span>Menu</span>
          </button>
        </div>
      </div>

      {/* Thanh chỉ báo trang hiện tại trên mobile khi menu đóng */}
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
            Chuyển mục khác ▾
          </button>
        </div>
      )}

      {/* Menu thả xuống dạng lưới 2 cột trên mobile (không bị cắt chữ) */}
      {mobileOpen && (
        <nav
          aria-label="Menu di động"
          className="grid grid-cols-2 gap-2 border-t border-[var(--border-subtle)] bg-[var(--bg-card)] px-4 py-3 md:hidden"
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
                onClick={() => setMobileOpen(false)}
                className={`flex h-10 items-center justify-center rounded-xl px-2.5 text-center text-xs font-bold transition ${
                  active
                    ? "bg-[var(--brand-purple)] text-white"
                    : "border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-main)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className="col-span-2 flex h-9 items-center justify-center rounded-xl border border-dashed border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-muted)]"
          >
            Khu vực BTC / Admin
          </Link>
        </nav>
      )}

      {/* Menu đầy đủ trên máy tính / tablet */}
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto hidden max-w-7xl flex-wrap items-center gap-1.5 px-4 pb-2.5 sm:px-6 md:flex lg:px-8"
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
      </nav>
    </header>
  );
}

"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("lcc-theme", nextDark ? "dark" : "light");
    } catch {
      // Bỏ qua nếu trình duyệt chặn localStorage
    }
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      title={isDark ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-sm font-medium text-[var(--text-main)] shadow-xs transition hover:border-[var(--brand-purple)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-purple)]"
    >
      {mounted ? (
        isDark ? (
          <>
            <Sun className="h-4 w-4 text-[var(--brand-yellow)]" />
            <span>Sáng</span>
          </>
        ) : (
          <>
            <Moon className="h-4 w-4 text-[var(--brand-purple)]" />
            <span>Tối</span>
          </>
        )
      ) : (
        <span className="w-12 text-center">Giao diện</span>
      )}
    </button>
  );
}

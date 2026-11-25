"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notAdminError = searchParams.get("error") === "not_admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(
    notAdminError
      ? "Tài khoản này chưa được cấp quyền Admin trong hệ thống."
      : null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg("Email hoặc mật khẩu chưa đúng. Vui lòng kiểm tra lại.");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể kết nối máy chủ đăng nhập."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)] px-4 py-6 text-[var(--text-main)]">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--brand-blue)] hover:underline"
          >
            ← Trang chủ
          </Link>
          <ThemeToggle />
        </div>

        <div className="rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--bg-card)] p-6 shadow-sm">
          <div className="mb-5 flex flex-col items-center text-center">
            <Image
              src="/logo-legend-chicks-cup.png"
              alt="Logo Legend Chicks Cup 2026"
              width={64}
              height={64}
              className="h-16 w-16 object-contain"
              priority
            />
            <h1 className="mt-3 text-xl font-extrabold text-[var(--brand-navy)] dark:text-white">
              Đăng nhập Ban Tổ Chức
            </h1>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Chỉ dành cho Admin quản lý Legend Chicks Cup 2026
            </p>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="mb-4 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              <span>Email Admin</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3.5 text-base outline-none focus:border-[var(--brand-purple)]"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium">
              <span>Mật khẩu</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3.5 text-base outline-none focus:border-[var(--brand-purple)]"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-1 h-11 rounded-xl bg-[var(--brand-purple)] px-4 text-sm font-bold text-white transition hover:bg-[var(--brand-purple-vivid)] disabled:opacity-50"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập Admin"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-sm font-medium text-[var(--text-main)] transition hover:border-red-500 hover:text-red-600 disabled:opacity-50"
    >
      <LogOut className="h-4 w-4" />
      <span>{loading ? "Đang thoát..." : "Đăng xuất"}</span>
    </button>
  );
}

import { redirect } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { getCurrentAdmin } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

export default async function AdminDataPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-main)]">
      <AdminHeader adminLabel={admin.displayName || admin.email || "Admin"} />
      <main className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-xl font-extrabold">A10 · Xuất dữ liệu & Sao lưu</h1>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <h2 className="text-base font-extrabold">
            Xuất file Excel tổng hợp (.xlsx)
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            File gồm đủ 4 sheet: <code>Tuyen_thu</code>,{" "}
            <code>Lich_thi_dau</code>, <code>Ket_qua_chinh_thuc</code> và{" "}
            <code>Bang_xep_hang</code>. Khuyến nghị tải về sao lưu cuối mỗi kỳ.
          </p>

          <div className="mt-4">
            <a
              href="/api/admin/export"
              className="inline-flex h-10 items-center rounded-xl bg-[var(--brand-purple)] px-5 text-xs font-bold text-white transition hover:bg-[var(--brand-purple-vivid)]"
            >
              Tải file Excel (.xlsx)
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}

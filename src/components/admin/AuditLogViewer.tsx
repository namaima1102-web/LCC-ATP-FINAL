"use client";

import { useMemo, useState } from "react";

export interface AuditEntry {
  id: number;
  actor: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  reason: string | null;
  at: string;
}

export function AuditLogViewer({ entries }: { entries: AuditEntry[] }) {
  const [actionFilter, setActionFilter] = useState("all");

  const actions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.action))).sort(),
    [entries]
  );

  const filtered = useMemo(() => {
    if (actionFilter === "all") return entries;
    return entries.filter((e) => e.action === actionFilter);
  }, [entries, actionFilter]);

  const formatAt = (iso: string) => {
    try {
      return new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 text-xs font-semibold"
        >
          <option value="all">Tất cả hành động ({entries.length})</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <span className="text-xs text-[var(--text-muted)]">
          Hiển thị {filtered.length} dòng nhật ký
        </span>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
        <table className="w-full min-w-[600px] text-left text-xs">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
              <th className="py-2 pr-3">Thời gian</th>
              <th className="px-2 py-2">Hành động</th>
              <th className="px-2 py-2">Đối tượng</th>
              <th className="py-2 pl-2">Lý do</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr
                key={e.id}
                className="border-b border-[var(--border-subtle)]/50 last:border-0"
              >
                <td className="py-2 pr-3 whitespace-nowrap">
                  {formatAt(e.at)}
                </td>
                <td className="px-2 py-2 font-mono font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
                  {e.action}
                </td>
                <td className="px-2 py-2">
                  {e.entity}
                  {e.entityId ? ` (${e.entityId.slice(0, 8)}...)` : ""}
                </td>
                <td className="py-2 pl-2 text-[var(--text-muted)]">
                  {e.reason ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

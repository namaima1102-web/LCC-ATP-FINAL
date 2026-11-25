"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  suggestTonightMatches,
  type TonightMatchCandidate,
} from "@/lib/domain/tonight";
import type { SeasonSettings } from "@/lib/domain/season-config";

interface PlayerItem {
  id: string;
  fullName: string;
  teamId: string;
  teamColor: string | null;
}

export function TonightBoard({
  seasonId,
  players,
  initialPresentIds,
  scheduledMatches,
  settings,
}: {
  seasonId: string;
  players: PlayerItem[];
  initialPresentIds: string[];
  scheduledMatches: TonightMatchCandidate[];
  settings: Pick<SeasonSettings, "tables_default" | "tables_max">;
}) {
  const router = useRouter();
  const [presentIds, setPresentIds] = useState<string[]>(initialPresentIds);
  const [tablesCount, setTablesCount] = useState<number>(settings.tables_default);
  const [busyId, setBusyId] = useState<string | null>(null);

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const suggestions = useMemo(
    () =>
      suggestTonightMatches(
        scheduledMatches,
        presentIds,
        settings,
        tablesCount
      ),
    [scheduledMatches, presentIds, settings, tablesCount]
  );

  const toggleCheckIn = async (playerId: string) => {
    const isPresent = presentIds.includes(playerId);
    const nextPresent = !isPresent;
    setPresentIds((prev) =>
      nextPresent ? [...prev, playerId] : prev.filter((id) => id !== playerId)
    );
    setBusyId(playerId);
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seasonId, playerId, present: nextPresent }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const renderMatchRow = (m: TonightMatchCandidate) => {
    const sideA = m.sideAPlayerIds
      .map((id) => playerMap.get(id)?.fullName ?? "?")
      .join(" + ");
    const sideB = m.sideBPlayerIds
      .map((id) => playerMap.get(id)?.fullName ?? "?")
      .join(" + ");

    return (
      <Link
        key={m.id}
        href={`/matches/${m.id}`}
        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3.5 py-2.5 text-xs transition hover:border-[var(--brand-purple)]"
      >
        <div className="min-w-0">
          <span className="mr-1.5 rounded bg-[var(--brand-purple)]/15 px-1.5 py-0.5 font-bold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
            {m.kind === "singles" ? "Đơn" : "Đôi"}
          </span>
          <span className="font-bold">
            {sideA} vs {sideB}
          </span>
        </div>
        <span className="shrink-0 font-bold text-[var(--text-muted)]">
          Kỳ {m.periodNo} · {m.handicapCode}
        </span>
      </Link>
    );
  };

  return (
    <div className="grid gap-5 lg:grid-cols-12">
      {/* Check-in danh sách 16 tuyển thủ */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 lg:col-span-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-extrabold">
            1. Điểm danh có mặt ({presentIds.length}/{players.length})
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Hết hạn sau 24h</span>
        </div>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Bấm tên mình để báo tối nay có mặt tại CLB.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {players.map((p) => {
            const active = presentIds.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                disabled={busyId === p.id}
                onClick={() => toggleCheckIn(p.id)}
                className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-left text-xs font-bold transition ${
                  active
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
                    : "border-[var(--border-subtle)] bg-[var(--bg-page)]"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: p.teamColor ?? "#2B6FD6" }}
                />
                <span className="truncate">{p.fullName}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Gợi ý trận khả thi */}
      <div className="flex flex-col gap-5 lg:col-span-7">
        <section className="rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--bg-card)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-extrabold">
              2. Gợi ý xếp bàn ngay (không trùng người)
            </h2>
            <label className="flex items-center gap-2 text-xs font-semibold">
              <span>Số bàn:</span>
              <select
                value={tablesCount}
                onChange={(e) => setTablesCount(Number(e.target.value))}
                className="h-8 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2"
              >
                {Array.from(
                  { length: settings.tables_max },
                  (_, i) => i + 1
                ).map((n) => (
                  <option key={n} value={n}>
                    {n} bàn
                  </option>
                ))}
              </select>
            </label>
          </div>

          {suggestions.recommendedNow.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Chưa có trận khả thi nào (cần đủ 2 người đơn hoặc 4 người đôi
              đang có mặt).
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {suggestions.recommendedNow.map(renderMatchRow)}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
          <h2 className="text-base font-extrabold">
            3. Tất cả trận khả thi tối nay ({suggestions.allPlayable.length})
          </h2>
          {suggestions.allPlayable.length === 0 ? (
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              Bấm chọn thêm người có mặt bên trái để xem danh sách trận.
            </p>
          ) : (
            <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto">
              {suggestions.allPlayable.map(renderMatchRow)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  calculateHandicap,
  getHandicapBreakdown,
  type HandicapRule,
  type MatchKind,
} from "@/lib/domain/handicap";
import type { SeasonSettings } from "@/lib/domain/season-config";

interface CalcPlayer {
  id: string;
  fullName: string;
  ratingStart: number;
  teamId: string;
  teamName: string;
}

export function HandicapCalculator({
  players,
  rules,
  settings,
}: {
  players: CalcPlayer[];
  rules: HandicapRule[];
  settings: Pick<
    SeasonSettings,
    "doubles_diff_divisor" | "handicap_overflow_mode" | "handicap_pattern"
  >;
}) {
  const [kind, setKind] = useState<MatchKind>("singles");
  const [a1, setA1] = useState(players[0]?.id ?? "");
  const [a2, setA2] = useState(players[1]?.id ?? "");
  const [b1, setB1] = useState(players[4]?.id ?? players[0]?.id ?? "");
  const [b2, setB2] = useState(players[5]?.id ?? players[1]?.id ?? "");

  const playerMap = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const result = useMemo(() => {
    const pA1 = playerMap.get(a1);
    const pA2 = playerMap.get(a2);
    const pB1 = playerMap.get(b1);
    const pB2 = playerMap.get(b2);
    if (!pA1 || !pB1 || rules.length === 0) return null;

    const ratingsA =
      kind === "singles"
        ? [pA1.ratingStart]
        : [pA1.ratingStart, pA2?.ratingStart ?? 0];
    const ratingsB =
      kind === "singles"
        ? [pB1.ratingStart]
        : [pB1.ratingStart, pB2?.ratingStart ?? 0];

    const hc = calculateHandicap(kind, ratingsA, ratingsB, rules, settings);
    const breakdown = getHandicapBreakdown(
      hc.code,
      5,
      settings.handicap_pattern
    );

    const sideAName =
      kind === "singles"
        ? pA1.fullName
        : `${pA1.fullName} + ${pA2?.fullName ?? "?"}`;
    const sideBName =
      kind === "singles"
        ? pB1.fullName
        : `${pB1.fullName} + ${pB2?.fullName ?? "?"}`;

    const giverLabel =
      hc.giver === "a"
        ? `${sideAName} chấp ${sideBName}`
        : hc.giver === "b"
          ? `${sideBName} chấp ${sideAName}`
          : "Hai bên ngang điểm (không chấp)";

    return { hc, breakdown, giverLabel };
  }, [kind, a1, a2, b1, b2, playerMap, rules, settings]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setKind("singles")}
          className={`h-10 rounded-xl px-4 text-xs font-bold ${
            kind === "singles"
              ? "bg-[var(--brand-purple)] text-white"
              : "border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          }`}
        >
          Trận Đơn
        </button>
        <button
          type="button"
          onClick={() => setKind("doubles")}
          className={`h-10 rounded-xl px-4 text-xs font-bold ${
            kind === "doubles"
              ? "bg-[var(--brand-purple)] text-white"
              : "border border-[var(--border-subtle)] bg-[var(--bg-card)]"
          }`}
        >
          Trận Đôi
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">
            Bên A
          </p>
          <div className="flex flex-col gap-2">
            <select
              value={a1}
              onChange={(e) => setA1(e.target.value)}
              className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm font-semibold"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.ratingStart}đ · {p.teamName})
                </option>
              ))}
            </select>
            {kind === "doubles" && (
              <select
                value={a2}
                onChange={(e) => setA2(e.target.value)}
                className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm font-semibold"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.ratingStart}đ · {p.teamName})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4">
          <p className="mb-2 text-xs font-bold uppercase text-[var(--text-muted)]">
            Bên B
          </p>
          <div className="flex flex-col gap-2">
            <select
              value={b1}
              onChange={(e) => setB1(e.target.value)}
              className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm font-semibold"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.ratingStart}đ · {p.teamName})
                </option>
              ))}
            </select>
            {kind === "doubles" && (
              <select
                value={b2}
                onChange={(e) => setB2(e.target.value)}
                className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm font-semibold"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.ratingStart}đ · {p.teamName})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {result && (
        <section className="rounded-2xl border-2 border-[var(--brand-purple)] bg-[var(--bg-card)] p-5 text-center">
          <p className="text-xs font-semibold text-[var(--text-muted)]">
            Chênh lệch: <strong>{result.hc.diff}</strong> điểm
          </p>
          <p className="mt-1 text-3xl font-extrabold text-[var(--brand-purple)] dark:text-[var(--brand-yellow)]">
            {result.hc.code}
          </p>
          <p className="mt-1 text-sm font-bold">{result.giverLabel}</p>

          <div className="mt-4 grid grid-cols-5 gap-2">
            {result.breakdown.map((s) => (
              <div
                key={s.setNo}
                className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-2.5"
              >
                <p className="text-[11px] text-[var(--text-muted)]">
                  Set {s.setNo}
                </p>
                <p className="mt-0.5 text-base font-extrabold">{s.points}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

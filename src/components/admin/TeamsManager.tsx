"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface TeamItem {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
}

interface PlayerItem {
  id: string;
  fullName: string;
  nickname: string | null;
  teamId: string;
  ratingStart: number;
  isProvisional: boolean;
}

export function TeamsManager({
  teams: initialTeams,
  players: initialPlayers,
}: {
  teams: TeamItem[];
  players: PlayerItem[];
}) {
  const router = useRouter();
  const [teams, setTeams] = useState(initialTeams);
  const [players, setPlayers] = useState(initialPlayers);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  const dirtyPlayers = players.filter((p) => {
    const orig = initialPlayers.find((o) => o.id === p.id);
    if (!orig) return false;
    return (
      orig.fullName !== p.fullName ||
      (orig.nickname ?? "") !== (p.nickname ?? "") ||
      orig.teamId !== p.teamId ||
      orig.ratingStart !== p.ratingStart ||
      orig.isProvisional !== p.isProvisional
    );
  });

  // Form thêm tuyển thủ mới
  const [newName, setNewName] = useState("");
  const [newNickname, setNewNickname] = useState("");
  const [newTeamId, setNewTeamId] = useState(initialTeams[0]?.id ?? "");
  const [newRating, setNewRating] = useState("7");
  const [newProvisional, setNewProvisional] = useState(true);

  const saveTeam = async (team: TeamItem) => {
    setBusyId(team.id);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "team",
          teamId: team.id,
          name: team.name,
          color: team.color ?? "#2B6FD6",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật đội");
      setStatusMsg(`Đã lưu thông tin ${team.name}.`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi cập nhật đội.");
    } finally {
      setBusyId(null);
    }
  };

  const savePlayer = async (player: PlayerItem) => {
    setBusyId(player.id);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "player",
          playerId: player.id,
          fullName: player.fullName,
          nickname: player.nickname,
          teamId: player.teamId,
          ratingStart: player.ratingStart,
          isProvisional: player.isProvisional,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi cập nhật tuyển thủ");
      const extra =
        data.recalculatedCount > 0
          ? ` (đã tính lại mã chấp cho ${data.recalculatedCount} trận chưa đấu)`
          : "";
      setStatusMsg(`Đã lưu ${player.fullName}${extra}.`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi cập nhật tuyển thủ.");
    } finally {
      setBusyId(null);
    }
  };

  const saveAllDirtyPlayers = async () => {
    if (dirtyPlayers.length === 0) return;
    setBusyId("save-all");
    setStatusMsg(null);
    let totalRecalc = 0;
    try {
      for (const player of dirtyPlayers) {
        const res = await fetch("/api/admin/teams", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "player",
            playerId: player.id,
            fullName: player.fullName,
            nickname: player.nickname,
            teamId: player.teamId,
            ratingStart: player.ratingStart,
            isProvisional: player.isProvisional,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Lỗi lưu ${player.fullName}`);
        totalRecalc += data.recalculatedCount ?? 0;
      }
      const extra =
        totalRecalc > 0
          ? ` (đã tự động tính lại mã chấp cho ${totalRecalc} lượt trận chưa đấu)`
          : "";
      setStatusMsg(`Đã lưu ${dirtyPlayers.length} tuyển thủ${extra}.`);
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi lưu hàng loạt.");
    } finally {
      setBusyId(null);
    }
  };

  const addPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyId("add");
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: newName,
          nickname: newNickname || null,
          teamId: newTeamId,
          ratingStart: Number(newRating),
          isProvisional: newProvisional,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lỗi thêm tuyển thủ");
      setNewName("");
      setNewNickname("");
      setStatusMsg("Đã thêm tuyển thủ mới.");
      router.refresh();
    } catch (e) {
      setStatusMsg(e instanceof Error ? e.message : "Lỗi thêm tuyển thủ.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {statusMsg && (
        <div className="rounded-xl border border-[var(--brand-purple)] bg-[var(--brand-purple)]/10 px-4 py-2.5 text-sm font-medium">
          {statusMsg}
        </div>
      )}

      {/* Danh sách 4 đội */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-5">
        <h2 className="text-base font-extrabold">1. Các đội thi đấu ({teams.length})</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {teams.map((team) => (
            <div
              key={team.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3"
            >
              <input
                type="color"
                aria-label={`Màu ${team.name}`}
                value={team.color ?? "#2B6FD6"}
                onChange={(e) =>
                  setTeams((prev) =>
                    prev.map((t) =>
                      t.id === team.id ? { ...t, color: e.target.value } : t
                    )
                  )
                }
                className="h-9 w-9 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
              />
              <input
                type="text"
                value={team.name}
                onChange={(e) =>
                  setTeams((prev) =>
                    prev.map((t) =>
                      t.id === team.id ? { ...t, name: e.target.value } : t
                    )
                  )
                }
                className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 text-sm font-semibold"
              />
              <button
                type="button"
                disabled={busyId === team.id}
                onClick={() => saveTeam(team)}
                className="h-9 rounded-lg bg-[var(--brand-purple)] px-3 text-xs font-bold text-white disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Danh sách tuyển thủ */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-extrabold">
              2. Tuyển thủ & Điểm trình ({players.length})
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Khi sửa điểm trình, nhớ bấm <strong>Lưu</strong> (hoặc{" "}
              <strong>Lưu tất cả</strong>) — hệ thống sẽ tự tính lại mã chấp các trận chưa đấu.
            </p>
          </div>
          {dirtyPlayers.length > 0 && (
            <button
              type="button"
              disabled={busyId === "save-all"}
              onClick={saveAllDirtyPlayers}
              className="h-9 rounded-xl bg-[var(--brand-orange)] px-4 text-xs font-bold text-white disabled:opacity-50"
            >
              {busyId === "save-all"
                ? "Đang lưu..."
                : `Lưu ${dirtyPlayers.length} thay đổi chưa lưu`}
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {players.map((p) => {
            const isDirty = dirtyPlayers.some((d) => d.id === p.id);
            return (
            <div
              key={p.id}
              className={`flex flex-col gap-2.5 rounded-xl border p-3 sm:flex-row sm:items-center ${
                isDirty
                  ? "border-[var(--brand-orange)] bg-amber-50/40 dark:bg-amber-950/20"
                  : "border-[var(--border-subtle)] bg-[var(--bg-page)]"
              }`}
            >
              <div className="flex flex-1 gap-2">
                <input
                  type="text"
                  aria-label="Họ tên"
                  value={p.fullName}
                  onChange={(e) =>
                    setPlayers((prev) =>
                      prev.map((x) =>
                        x.id === p.id ? { ...x, fullName: e.target.value } : x
                      )
                    )
                  }
                  className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 text-sm font-semibold"
                />
                <input
                  type="text"
                  aria-label="Biệt danh"
                  placeholder="Biệt danh"
                  value={p.nickname ?? ""}
                  onChange={(e) =>
                    setPlayers((prev) =>
                      prev.map((x) =>
                        x.id === p.id ? { ...x, nickname: e.target.value } : x
                      )
                    )
                  }
                  className="h-9 w-28 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2.5 text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Đội"
                  value={p.teamId}
                  onChange={(e) =>
                    setPlayers((prev) =>
                      prev.map((x) =>
                        x.id === p.id ? { ...x, teamId: e.target.value } : x
                      )
                    )
                  }
                  className="h-9 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 text-xs font-medium"
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.5"
                  aria-label="Điểm"
                  value={p.ratingStart}
                  onChange={(e) =>
                    setPlayers((prev) =>
                      prev.map((x) =>
                        x.id === p.id
                          ? { ...x, ratingStart: Number(e.target.value) }
                          : x
                      )
                    )
                  }
                  className="h-9 w-16 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-2 text-center text-sm font-bold"
                />

                <label className="inline-flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={p.isProvisional}
                    onChange={(e) =>
                      setPlayers((prev) =>
                        prev.map((x) =>
                          x.id === p.id
                            ? { ...x, isProvisional: e.target.checked }
                            : x
                        )
                      )
                    }
                  />
                  <span>Điểm tạm</span>
                </label>

                <button
                  type="button"
                  disabled={busyId === p.id}
                  onClick={() => savePlayer(p)}
                  className={`h-9 rounded-lg px-3 text-xs font-bold text-white disabled:opacity-50 ${
                    isDirty ? "bg-[var(--brand-orange)]" : "bg-[var(--brand-purple)]"
                  }`}
                >
                  {isDirty ? "Lưu*" : "Lưu"}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </section>

      {/* Thêm tuyển thủ */}
      <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 sm:p-5">
        <h2 className="text-base font-extrabold">3. Thêm tuyển thủ vào mùa</h2>
        <form onSubmit={addPlayer} className="mt-3 flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            required
            placeholder="Tên tuyển thủ"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-10 min-w-[140px] flex-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
          />
          <input
            type="text"
            placeholder="Biệt danh (tùy chọn)"
            value={newNickname}
            onChange={(e) => setNewNickname(e.target.value)}
            className="h-10 w-36 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
          />
          <select
            value={newTeamId}
            onChange={(e) => setNewTeamId(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.5"
            value={newRating}
            onChange={(e) => setNewRating(e.target.value)}
            className="h-10 w-20 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2 text-center text-sm font-bold"
          />
          <label className="inline-flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={newProvisional}
              onChange={(e) => setNewProvisional(e.target.checked)}
            />
            <span>Điểm tạm</span>
          </label>
          <button
            type="submit"
            disabled={busyId === "add"}
            className="h-10 rounded-xl bg-[var(--brand-blue)] px-4 text-xs font-bold text-white disabled:opacity-50"
          >
            + Thêm
          </button>
        </form>
      </section>
    </div>
  );
}

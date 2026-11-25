"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PlayerOption {
  id: string;
  fullName: string;
  nickname: string | null;
}

interface PreviousSubmissionStatus {
  id: string;
  status: string;
  review_note: string | null;
  sets_a: number;
  sets_b: number;
}

export function SubmitScoreForm({
  matchId,
  sideANames,
  sideBNames,
  setsToWin,
  players,
  defaultPlayedOn,
}: {
  matchId: string;
  sideANames: string;
  sideBNames: string;
  setsToWin: number;
  players: PlayerOption[];
  defaultPlayedOn: string;
}) {
  const router = useRouter();
  const [submittedByPlayerId, setSubmittedByPlayerId] = useState(
    players[0]?.id ?? ""
  );
  const [setsA, setSetsA] = useState<string>("3");
  const [setsB, setSetsB] = useState<string>("0");
  const [playedOn, setPlayedOn] = useState(defaultPlayedOn);
  const [note, setNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [myStatuses, setMyStatuses] = useState<PreviousSubmissionStatus[]>([]);

  const storageKey = `lcc-submissions-${matchId}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const ids = JSON.parse(raw) as string[];
      if (!Array.isArray(ids) || ids.length === 0) return;

      fetch(`/api/submit-score?ids=${encodeURIComponent(ids.join(","))}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data.items)) {
            setMyStatuses(data.items);
          }
        })
        .catch(() => {});
    } catch {
      // Bỏ qua lỗi localStorage
    }
  }, [storageKey]);

  const quickPresets: Array<[number, number]> = [
    [setsToWin, 0],
    [setsToWin, 1],
    [setsToWin, 2],
    [0, setsToWin],
    [1, setsToWin],
    [2, setsToWin],
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const formData = new FormData();
      formData.append("matchId", matchId);
      formData.append("submittedByPlayerId", submittedByPlayerId);
      formData.append("setsA", setsA);
      formData.append("setsB", setsB);
      formData.append("playedOn", playedOn);
      formData.append("note", note);
      formData.append("website", honeypot);
      if (evidenceFile) {
        formData.append("evidence", evidenceFile);
      }

      const res = await fetch("/api/submit-score", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể gửi tỉ số.");
      }

      try {
        const raw = localStorage.getItem(storageKey);
        const existing = raw ? (JSON.parse(raw) as string[]) : [];
        localStorage.setItem(
          storageKey,
          JSON.stringify([data.submissionId, ...existing].slice(0, 10))
        );
      } catch {
        // ignore
      }

      setSuccessMsg(
        "Đã gửi tỉ số thành công! Kết quả đang ở trạng thái Chờ duyệt của Ban Tổ Chức."
      );
      setNote("");
      setEvidenceFile(null);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Lỗi gửi tỉ số.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5">
      <h2 className="text-base font-extrabold">Nhập tỉ số trận đấu</h2>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        Không cần đăng nhập. Kết quả chỉ lên bảng xếp hạng sau khi Admin duyệt.
      </p>

      {/* Hiển thị trạng thái bản gửi trước đó trên thiết bị này (S12) */}
      {myStatuses.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {myStatuses.map((s) => (
            <div
              key={s.id}
              className={`rounded-xl border px-3 py-2 text-xs ${
                s.status === "rejected"
                  ? "border-red-300 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                  : "border-[var(--border-subtle)] bg-[var(--bg-page)]"
              }`}
            >
              <span>
                Bản gửi của bạn (<strong>{s.sets_a}-{s.sets_b}</strong>):{" "}
                <strong>
                  {s.status === "pending"
                    ? "Đang chờ duyệt"
                    : s.status === "approved"
                      ? "Đã duyệt"
                      : s.status === "rejected"
                        ? "Bị từ chối"
                        : "Đã thay thế"}
                </strong>
              </span>
              {s.status === "rejected" && s.review_note && (
                <p className="mt-1 font-medium">Lý do: {s.review_note}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
        >
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        {/* Trường ẩn chống bot (honeypot) */}
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />

        <label className="flex flex-col gap-1.5 text-xs font-semibold">
          <span>Người gửi tỉ số</span>
          <select
            value={submittedByPlayerId}
            onChange={(e) => setSubmittedByPlayerId(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
          >
            {players.map((p) => (
              <option key={p.id} value={p.id}>
                {p.fullName}
                {p.nickname ? ` (${p.nickname})` : ""}
              </option>
            ))}
          </select>
        </label>

        <div>
          <p className="mb-2 text-xs font-semibold">Chọn nhanh tỉ số:</p>
          <div className="flex flex-wrap gap-2">
            {quickPresets.map(([a, b]) => {
              const active = setsA === String(a) && setsB === String(b);
              return (
                <button
                  key={`${a}-${b}`}
                  type="button"
                  onClick={() => {
                    setSetsA(String(a));
                    setSetsB(String(b));
                  }}
                  className={`h-9 rounded-lg px-3 text-xs font-bold transition ${
                    active
                      ? "bg-[var(--brand-purple)] text-white"
                      : "border border-[var(--border-subtle)] bg-[var(--bg-page)]"
                  }`}
                >
                  {a} - {b}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-xs font-semibold">
            <span className="truncate">Set thắng · {sideANames}</span>
            <input
              type="number"
              min={0}
              max={5}
              required
              value={setsA}
              onChange={(e) => setSetsA(e.target.value)}
              className="h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-center text-lg font-extrabold"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold">
            <span className="truncate">Set thắng · {sideBNames}</span>
            <input
              type="number"
              min={0}
              max={5}
              required
              value={setsB}
              onChange={(e) => setSetsB(e.target.value)}
              className="h-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-center text-lg font-extrabold"
            />
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-xs font-semibold">
            <span>Ngày đấu thực tế</span>
            <input
              type="date"
              required
              value={playedOn}
              onChange={(e) => setPlayedOn(e.target.value)}
              className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-semibold">
            <span>Ảnh bằng chứng (tùy chọn, ≤ 5MB)</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setEvidenceFile(e.target.files?.[0] ?? null)}
              className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-2.5 py-2 text-xs"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-xs font-semibold">
          <span>Ghi chú (tùy chọn)</span>
          <input
            type="text"
            placeholder="Ví dụ: Đấu tối thứ 4 tại CLB"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="h-10 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-3 text-sm"
          />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-xl bg-[var(--brand-purple)] px-5 text-sm font-bold text-white transition hover:bg-[var(--brand-purple-vivid)] disabled:opacity-50"
        >
          {busy ? "Đang gửi tỉ số..." : "Gửi tỉ số chờ Admin duyệt"}
        </button>
      </form>
    </section>
  );
}

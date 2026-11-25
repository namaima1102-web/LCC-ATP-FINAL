import * as XLSX from "xlsx";
import type { PlayerStats, TeamStanding } from "./standings";

export interface ExportPlayerRow {
  fullName: string;
  nickname: string | null;
  teamName: string;
  ratingStart: number;
  isProvisional: boolean;
}

export interface ExportMatchRow {
  periodNo: number;
  kind: "singles" | "doubles";
  sideANames: string;
  sideBNames: string;
  handicapCode: string;
  status: string;
}

export interface ExportResultRow {
  periodNo: number;
  kind: "singles" | "doubles";
  sideANames: string;
  sideBNames: string;
  setsA: number;
  setsB: number;
  playedOn: string | null;
  isForfeit: boolean;
}

/**
 * Tạo Workbook Excel (.xlsx) gồm đủ 4 sheet theo AC12:
 * Tuyen_thu, Lich_thi_dau, Ket_qua_chinh_thuc, Bang_xep_hang.
 */
export function buildSeasonWorkbook(input: {
  players: ExportPlayerRow[];
  matches: ExportMatchRow[];
  results: ExportResultRow[];
  teamStandings: TeamStanding[];
  playerStats: PlayerStats[];
}): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  // 1. Sheet Tuyển thủ
  const playersSheet = XLSX.utils.json_to_sheet(
    input.players.map((p, idx) => ({
      STT: idx + 1,
      "Họ tên": p.fullName,
      "Biệt danh": p.nickname ?? "",
      Đội: p.teamName,
      "Điểm trình": p.ratingStart,
      "Điểm tạm": p.isProvisional ? "Có" : "Không",
    }))
  );
  XLSX.utils.book_append_sheet(wb, playersSheet, "Tuyen_thu");

  // 2. Sheet Lịch thi đấu
  const scheduleSheet = XLSX.utils.json_to_sheet(
    input.matches.map((m, idx) => ({
      STT: idx + 1,
      Kỳ: `Kỳ ${m.periodNo}`,
      Loại: m.kind === "singles" ? "Đơn" : "Đôi",
      "Bên A": m.sideANames,
      "Bên B": m.sideBNames,
      "Mã chấp": m.handicapCode,
      "Trạng thái": m.status,
    }))
  );
  XLSX.utils.book_append_sheet(wb, scheduleSheet, "Lich_thi_dau");

  // 3. Sheet Kết quả chính thức
  const resultsSheet = XLSX.utils.json_to_sheet(
    input.results.map((r, idx) => ({
      STT: idx + 1,
      Kỳ: `Kỳ ${r.periodNo}`,
      Loại: r.kind === "singles" ? "Đơn" : "Đôi",
      "Bên A": r.sideANames,
      "Bên B": r.sideBNames,
      "Set A": r.setsA,
      "Set B": r.setsB,
      "Ngày đấu": r.playedOn ?? "",
      "Xử thua": r.isForfeit ? "Có" : "Không",
    }))
  );
  XLSX.utils.book_append_sheet(wb, resultsSheet, "Ket_qua_chinh_thuc");

  // 4. Sheet Bảng xếp hạng (Đội + Cá nhân)
  const standingsRows = [
    ...input.teamStandings.map((t, idx) => ({
      Hạng: idx + 1,
      "Tên đội": t.teamName,
      "Trận đã đấu": t.played,
      Thắng: t.wins,
      Thua: t.losses,
      "Hiệu số set": t.setDiff,
      "Điểm đội": t.points,
    })),
  ];
  const standingsSheet = XLSX.utils.json_to_sheet(standingsRows);
  XLSX.utils.book_append_sheet(wb, standingsSheet, "Bang_xep_hang");

  return wb;
}

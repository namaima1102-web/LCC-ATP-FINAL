import { calculateHandicap, type HandicapRule, type MatchKind, type Side } from "./handicap";
import type { SeasonSettings } from "./season-config";

export interface SchedulerTeam {
  id: string;
  name: string;
  sortOrder: number;
}

export interface SchedulerPlayer {
  id: string;
  fullName: string;
  teamId: string;
  ratingStart: number;
}

export interface ScheduledFixture {
  index: number;
  teamAId: string;
  teamBId: string;
  roundNo: number; // 1..3
}

export interface ScheduledMatch {
  fixtureIndex: number;
  kind: MatchKind;
  setsToWin: number;
  periodNo: number;
  sideAPlayerIds: string[];
  sideBPlayerIds: string[];
  handicapDiff: number;
  handicapCode: string;
  handicapGiver: Side | null;
}

export interface ScheduleValidationIssue {
  rule: "R1" | "R2" | "R3" | "R4" | "R5" | "R8";
  severity: "hard" | "warning";
  message: string;
}

export interface ScheduleResult {
  fixtures: ScheduledFixture[];
  matches: ScheduledMatch[];
  issues: ScheduleValidationIssue[];
}

function getAllPairs<T>(items: T[]): Array<[T, T]> {
  const pairs: Array<[T, T]> = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([items[i], items[j]]);
    }
  }
  return pairs;
}

function generatePermutations(n: number): number[][] {
  const result: number[][] = [];
  const used = new Array<boolean>(n).fill(false);
  const current: number[] = [];

  function backtrack() {
    if (current.length === n) {
      result.push([...current]);
      return;
    }
    for (let i = 0; i < n; i++) {
      if (used[i]) continue;
      used[i] = true;
      current.push(i);
      backtrack();
      current.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}

const PERMS_6 = generatePermutations(6);

/**
 * Sinh lịch thi đấu vòng tròn 1 lượt giữa các đội theo quy ước PRD Phần 6.
 */
export function generateSchedule(
  teams: SchedulerTeam[],
  players: SchedulerPlayer[],
  handicapRules: HandicapRule[],
  settings: Pick<
    SeasonSettings,
    | "singles_sets_to_win"
    | "doubles_sets_to_win"
    | "doubles_diff_divisor"
    | "handicap_overflow_mode"
    | "periods_count"
    | "balance_opponents"
    | "balance_handicap"
  >
): ScheduleResult {
  const sortedTeams = [...teams].sort((a, b) => a.sortOrder - b.sortOrder);
  const playersByTeam = new Map<string, SchedulerPlayer[]>();
  for (const team of sortedTeams) {
    playersByTeam.set(
      team.id,
      players.filter((p) => p.teamId === team.id)
    );
  }

  // Tạo 3 vòng xoay vòng chuẩn cho 4 đội (6 fixture)
  const fixtures: ScheduledFixture[] = [];
  if (sortedTeams.length === 4) {
    const [t0, t1, t2, t3] = sortedTeams;
    const rounds: Array<[SchedulerTeam, SchedulerTeam]> = [
      [t0, t1],
      [t2, t3],
      [t0, t2],
      [t1, t3],
      [t0, t3],
      [t1, t2],
    ];
    rounds.forEach(([a, b], idx) => {
      fixtures.push({
        index: idx,
        teamAId: a.id,
        teamBId: b.id,
        roundNo: Math.floor(idx / 2) + 1,
      });
    });
  } else {
    let idx = 0;
    for (let i = 0; i < sortedTeams.length; i++) {
      for (let j = i + 1; j < sortedTeams.length; j++) {
        fixtures.push({
          index: idx++,
          teamAId: sortedTeams[i].id,
          teamBId: sortedTeams[j].id,
          roundNo: 1,
        });
      }
    }
  }

  const rawMatches: Omit<ScheduledMatch, "periodNo">[] = [];

  for (const fixture of fixtures) {
    const teamAPlayers = playersByTeam.get(fixture.teamAId) ?? [];
    const teamBPlayers = playersByTeam.get(fixture.teamBId) ?? [];

    // 1. Trận đơn: mỗi người đội A gặp từng người đội B (4x4 = 16 trận)
    for (const pA of teamAPlayers) {
      for (const pB of teamBPlayers) {
        const hc = calculateHandicap(
          "singles",
          [pA.ratingStart],
          [pB.ratingStart],
          handicapRules,
          settings
        );
        rawMatches.push({
          fixtureIndex: fixture.index,
          kind: "singles",
          setsToWin: settings.singles_sets_to_win,
          sideAPlayerIds: [pA.id],
          sideBPlayerIds: [pB.id],
          handicapDiff: hc.diff,
          handicapCode: hc.code,
          handicapGiver: hc.giver,
        });
      }
    }

    // 2. Trận đôi: mỗi cặp bên A ghép 1-1 với mỗi cặp bên B
    const pairsA = getAllPairs(teamAPlayers);
    const pairsB = getAllPairs(teamBPlayers);

    if (pairsA.length === 6 && pairsB.length === 6) {
      let bestPerm = PERMS_6[0];
      let bestScore = Number.POSITIVE_INFINITY;

      for (const perm of PERMS_6) {
        let penalty = 0;

        if (settings.balance_opponents) {
          const oppCount = new Map<string, number>();
          for (let i = 0; i < 6; i++) {
            const [a1, a2] = pairsA[i];
            const [b1, b2] = pairsB[perm[i]];
            for (const pA of [a1, a2]) {
              for (const pB of [b1, b2]) {
                const key = `${pA.id}:${pB.id}`;
                oppCount.set(key, (oppCount.get(key) ?? 0) + 1);
              }
            }
          }
          for (const pA of teamAPlayers) {
            for (const pB of teamBPlayers) {
              const count = oppCount.get(`${pA.id}:${pB.id}`) ?? 0;
              if (count < 1 || count > 2) {
                penalty += 1000 * Math.abs(count - 1.5);
              }
            }
          }
        }

        if (settings.balance_handicap) {
          let totalDiff = 0;
          for (let i = 0; i < 6; i++) {
            const [a1, a2] = pairsA[i];
            const [b1, b2] = pairsB[perm[i]];
            const hc = calculateHandicap(
              "doubles",
              [a1.ratingStart, a2.ratingStart],
              [b1.ratingStart, b2.ratingStart],
              handicapRules,
              settings
            );
            totalDiff += hc.diff;
          }
          penalty += totalDiff;
        }

        if (penalty < bestScore) {
          bestScore = penalty;
          bestPerm = perm;
          if (bestScore === 0) break;
        }
      }

      for (let i = 0; i < 6; i++) {
        const [a1, a2] = pairsA[i];
        const [b1, b2] = pairsB[bestPerm[i]];
        const hc = calculateHandicap(
          "doubles",
          [a1.ratingStart, a2.ratingStart],
          [b1.ratingStart, b2.ratingStart],
          handicapRules,
          settings
        );
        rawMatches.push({
          fixtureIndex: fixture.index,
          kind: "doubles",
          setsToWin: settings.doubles_sets_to_win,
          sideAPlayerIds: [a1.id, a2.id],
          sideBPlayerIds: [b1.id, b2.id],
          handicapDiff: hc.diff,
          handicapCode: hc.code,
          handicapGiver: hc.giver,
        });
      }
    }
  }

  // 3. Chia trận vào các kỳ theo `settings.periods_count`
  const matches = assignPeriods(rawMatches, fixtures, players, settings.periods_count);
  const issues = validateSchedule(matches, players, sortedTeams, settings.periods_count);

  return { fixtures, matches, issues };
}

function assignPeriods(
  rawMatches: Omit<ScheduledMatch, "periodNo">[],
  fixtures: ScheduledFixture[],
  players: SchedulerPlayer[],
  periodsCount: number
): ScheduledMatch[] {
  if (periodsCount === 3 && fixtures.length === 6) {
    return rawMatches.map((m) => ({
      ...m,
      periodNo: fixtures[m.fixtureIndex].roundNo,
    }));
  }

  // Chia cân bằng (mặc định 4 kỳ): mỗi kỳ có số trận bằng nhau (33 trận = 24 đơn + 9 đôi)
  // và số trận mỗi người mỗi kỳ lệch không quá 1 (5 hoặc 6 trận).
  const total = rawMatches.length;
  const baseTarget = Math.floor(total / periodsCount);
  const remainder = total % periodsCount;
  const periodCaps = Array.from({ length: periodsCount }, (_, i) =>
    i < remainder ? baseTarget + 1 : baseTarget
  );

  const periodCounts = new Array<number>(periodsCount).fill(0);
  const playerPeriodCounts = new Map<string, number[]>();
  for (const p of players) {
    playerPeriodCounts.set(p.id, new Array<number>(periodsCount).fill(0));
  }

  // Xử lý trận đôi trước (khó cân bằng hơn vì có 4 người) rồi tới trận đơn
  const indexed = rawMatches.map((m, idx) => ({ m, idx }));
  indexed.sort((a, b) => {
    if (a.m.kind !== b.m.kind) return a.m.kind === "doubles" ? -1 : 1;
    return a.idx - b.idx;
  });

  const assignedPeriods = new Array<number>(rawMatches.length).fill(1);

  for (const item of indexed) {
    const matchPlayers = [...item.m.sideAPlayerIds, ...item.m.sideBPlayerIds];
    let bestPeriod = 0;
    let bestCost = Number.POSITIVE_INFINITY;

    for (let pIdx = 0; pIdx < periodsCount; pIdx++) {
      if (periodCounts[pIdx] >= periodCaps[pIdx]) continue;

      let cost = periodCounts[pIdx] * 0.01;
      for (const pid of matchPlayers) {
        const counts = playerPeriodCounts.get(pid);
        if (counts) {
          const cur = counts[pIdx];
          // Phạt nặng nếu tăng lên sẽ vượt quá trần (ví dụ > 6 với 4 kỳ)
          cost += (cur + 1) * (cur + 1);
        }
      }

      if (cost < bestCost) {
        bestCost = cost;
        bestPeriod = pIdx;
      }
    }

    assignedPeriods[item.idx] = bestPeriod + 1;
    periodCounts[bestPeriod]++;
    for (const pid of matchPlayers) {
      const counts = playerPeriodCounts.get(pid);
      if (counts) counts[bestPeriod]++;
    }
  }

  // Tối ưu cục bộ bằng hoán đổi cặp trận cùng loại nếu có người bị lệch quá 1
  const idealPerPlayer =
    players.length > 0
      ? rawMatches.reduce(
          (acc, m) => acc + m.sideAPlayerIds.length + m.sideBPlayerIds.length,
          0
        ) /
        (players.length * periodsCount)
      : 0;
  const minAllowed = Math.floor(idealPerPlayer);
  const maxAllowed = Math.ceil(idealPerPlayer);

  const playerImbalance = (pid: string): number => {
    const counts = playerPeriodCounts.get(pid);
    if (!counts) return 0;
    let pen = 0;
    for (const c of counts) {
      const diff = c - idealPerPlayer;
      pen += diff * diff;
      if (c < minAllowed) pen += (minAllowed - c) * 20;
      if (c > maxAllowed) pen += (c - maxAllowed) * 20;
    }
    return pen;
  };

  for (let pass = 0; pass < 500; pass++) {
    let improved = false;
    for (let i = 0; i < rawMatches.length; i++) {
      const p1 = assignedPeriods[i] - 1;
      const m1Players = [...rawMatches[i].sideAPlayerIds, ...rawMatches[i].sideBPlayerIds];

      for (let j = i + 1; j < rawMatches.length; j++) {
        if (rawMatches[i].kind !== rawMatches[j].kind) continue;
        const p2 = assignedPeriods[j] - 1;
        if (p1 === p2) continue;

        const m2Players = [...rawMatches[j].sideAPlayerIds, ...rawMatches[j].sideBPlayerIds];
        const affected = new Set([...m1Players, ...m2Players]);

        let beforePen = 0;
        for (const pid of affected) beforePen += playerImbalance(pid);

        // Thử hoán đổi
        for (const pid of m1Players) {
          const arr = playerPeriodCounts.get(pid);
          if (arr) {
            arr[p1]--;
            arr[p2]++;
          }
        }
        for (const pid of m2Players) {
          const arr = playerPeriodCounts.get(pid);
          if (arr) {
            arr[p2]--;
            arr[p1]++;
          }
        }

        let afterPen = 0;
        for (const pid of affected) afterPen += playerImbalance(pid);

        if (afterPen < beforePen - 1e-9) {
          assignedPeriods[i] = p2 + 1;
          assignedPeriods[j] = p1 + 1;
          improved = true;
          break;
        } else {
          // Hoàn tác
          for (const pid of m1Players) {
            const arr = playerPeriodCounts.get(pid);
            if (arr) {
              arr[p2]--;
              arr[p1]++;
            }
          }
          for (const pid of m2Players) {
            const arr = playerPeriodCounts.get(pid);
            if (arr) {
              arr[p1]--;
              arr[p2]++;
            }
          }
        }
      }
    }
    if (!improved) break;
  }

  return rawMatches.map((m, idx) => ({
    ...m,
    periodNo: assignedPeriods[idx],
  }));
}

/**
 * Kiểm tra tự động các ràng buộc R1–R5 và R8 (PRD mục 6.5).
 */
export function validateSchedule(
  matches: ScheduledMatch[],
  players: SchedulerPlayer[],
  teams: SchedulerTeam[],
  periodsCount: number
): ScheduleValidationIssue[] {
  const issues: ScheduleValidationIssue[] = [];
  const playerMap = new Map(players.map((p) => [p.id, p]));

  // R4 & R1
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const expectedPerSide = m.kind === "singles" ? 1 : 2;
    const allIds = [...m.sideAPlayerIds, ...m.sideBPlayerIds];

    if (
      m.sideAPlayerIds.length !== expectedPerSide ||
      m.sideBPlayerIds.length !== expectedPerSide ||
      new Set(allIds).size !== allIds.length
    ) {
      issues.push({
        rule: "R4",
        severity: "hard",
        message: `Trận #${i + 1} sai số lượng người hoặc bị trùng người.`,
      });
    }

    const teamsA = new Set(m.sideAPlayerIds.map((id) => playerMap.get(id)?.teamId));
    const teamsB = new Set(m.sideBPlayerIds.map((id) => playerMap.get(id)?.teamId));
    for (const tA of teamsA) {
      if (tA && teamsB.has(tA)) {
        issues.push({
          rule: "R1",
          severity: "hard",
          message: `Trận #${i + 1} có người cùng đội đối đầu nhau.`,
        });
      }
    }
  }

  // R2: Mỗi cặp đôi đánh đúng 1 trận với mỗi đội khác
  const pairVsTeamCount = new Map<string, number>();
  for (const m of matches) {
    if (m.kind !== "doubles") continue;
    const pairA = [...m.sideAPlayerIds].sort().join("+");
    const pairB = [...m.sideBPlayerIds].sort().join("+");
    const teamA = playerMap.get(m.sideAPlayerIds[0])?.teamId ?? "";
    const teamB = playerMap.get(m.sideBPlayerIds[0])?.teamId ?? "";

    const keyA = `${pairA}->${teamB}`;
    const keyB = `${pairB}->${teamA}`;
    pairVsTeamCount.set(keyA, (pairVsTeamCount.get(keyA) ?? 0) + 1);
    pairVsTeamCount.set(keyB, (pairVsTeamCount.get(keyB) ?? 0) + 1);
  }

  for (const team of teams) {
    const teamPlayers = players.filter((p) => p.teamId === team.id);
    const pairs = getAllPairs(teamPlayers).map(([a, b]) =>
      [a.id, b.id].sort().join("+")
    );
    const otherTeams = teams.filter((t) => t.id !== team.id);
    for (const pairKey of pairs) {
      for (const oppTeam of otherTeams) {
        const count = pairVsTeamCount.get(`${pairKey}->${oppTeam.id}`) ?? 0;
        if (count !== 1) {
          issues.push({
            rule: "R2",
            severity: "hard",
            message: `Cặp ${pairKey} gặp đội ${oppTeam.name} ${count} lần (quy định: đúng 1 lần).`,
          });
        }
      }
    }
  }

  // R3: Mỗi người đủ 12 đơn (4 đội x 4 người) và 9 đôi
  const expectedSingles = Math.max(0, players.length - (players.length / teams.length || 0));
  const expectedDoubles = teams.length === 4 && players.length === 16 ? 9 : -1;

  for (const p of players) {
    const pSingles = matches.filter(
      (m) =>
        m.kind === "singles" &&
        (m.sideAPlayerIds.includes(p.id) || m.sideBPlayerIds.includes(p.id))
    );
    const pDoubles = matches.filter(
      (m) =>
        m.kind === "doubles" &&
        (m.sideAPlayerIds.includes(p.id) || m.sideBPlayerIds.includes(p.id))
    );

    if (pSingles.length !== expectedSingles) {
      issues.push({
        rule: "R3",
        severity: "hard",
        message: `${p.fullName} có ${pSingles.length} trận đơn (quy định: ${expectedSingles}).`,
      });
    }
    if (expectedDoubles !== -1 && pDoubles.length !== expectedDoubles) {
      issues.push({
        rule: "R3",
        severity: "hard",
        message: `${p.fullName} có ${pDoubles.length} trận đôi (quy định: ${expectedDoubles}).`,
      });
    }
  }

  // R5: Cân bằng đối thủ trong đôi mỗi fixture (1 hoặc 2 lần)
  const fixtureIds = new Set(matches.map((m) => m.fixtureIndex));
  for (const fIdx of fixtureIds) {
    const fDoubles = matches.filter(
      (m) => m.fixtureIndex === fIdx && m.kind === "doubles"
    );
    if (fDoubles.length === 0) continue;

    const teamAId = playerMap.get(fDoubles[0].sideAPlayerIds[0])?.teamId;
    const teamBId = playerMap.get(fDoubles[0].sideBPlayerIds[0])?.teamId;
    if (!teamAId || !teamBId) continue;

    const tAPlayers = players.filter((p) => p.teamId === teamAId);
    const tBPlayers = players.filter((p) => p.teamId === teamBId);
    const oppCounts = new Map<string, number>();

    for (const m of fDoubles) {
      for (const aId of m.sideAPlayerIds) {
        for (const bId of m.sideBPlayerIds) {
          const k = `${aId}:${bId}`;
          oppCounts.set(k, (oppCounts.get(k) ?? 0) + 1);
        }
      }
    }

    for (const pA of tAPlayers) {
      for (const pB of tBPlayers) {
        const c = oppCounts.get(`${pA.id}:${pB.id}`) ?? 0;
        if (c < 1 || c > 2) {
          issues.push({
            rule: "R5",
            severity: "warning",
            message: `Fixture #${fIdx + 1}: ${pA.fullName} gặp ${pB.fullName} trong đôi ${c} lần (nên 1–2 lần).`,
          });
        }
      }
    }
  }

  // R8: Mỗi người có số trận mỗi kỳ lệch không quá 1 so với mục tiêu
  if (periodsCount > 0 && players.length > 0) {
    const avgPerPlayerPerPeriod =
      matches.reduce(
        (acc, m) => acc + m.sideAPlayerIds.length + m.sideBPlayerIds.length,
        0
      ) /
      (players.length * periodsCount);
    const minOk = Math.floor(avgPerPlayerPerPeriod);
    const maxOk = Math.ceil(avgPerPlayerPerPeriod);

    for (const p of players) {
      for (let periodNo = 1; periodNo <= periodsCount; periodNo++) {
        const count = matches.filter(
          (m) =>
            m.periodNo === periodNo &&
            (m.sideAPlayerIds.includes(p.id) || m.sideBPlayerIds.includes(p.id))
        ).length;
        if (count < minOk || count > maxOk) {
          issues.push({
            rule: "R8",
            severity: "warning",
            message: `Kỳ ${periodNo}: ${p.fullName} có ${count} trận (mục tiêu ${minOk}–${maxOk}).`,
          });
        }
      }
    }
  }

  return issues;
}

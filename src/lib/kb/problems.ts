// One problem per fix. Counted the desk's way: causes.ts files every report by its tenant. A report the
// desk read as a one-day move (desk-notes.json) is not a flipped month, so it is a problem of its own too,
// shown inside the cause its tenant files it under.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'unplaced' | 'one-day';

export type ProblemGroup = {
  problem: Problem;
  reports: number;
  tenants: number;
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
  // For one-day: the causes these reports are counted under.
  within: Problem[];
};

function group(problem: Problem, rs: Report[], within: Problem[] = []): ProblemGroup {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    reports: rs.length,
    tenants: new Set(rs.map((r) => r.tenant)).size,
    channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
    within,
  };
}

export function groupByProblem(
  reports: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { merged: number; groups: ProblemGroup[] } {
  const merged = uniqueById(reports).filter((r) => r.mergedInto === ticket);
  const causeOfReport = (r: Report): Problem => causeOf(r, tenantOf(r)) ?? 'unplaced';
  const byCause = new Map<Problem, Report[]>();
  for (const r of merged) byCause.set(causeOfReport(r), [...(byCause.get(causeOfReport(r)) ?? []), r]);
  const groups = [...byCause.entries()].map(([p, rs]) => group(p, rs)).sort((a, b) => b.reports - a.reports);

  const moved = merged.filter((r) => oneDayMove.includes(r.id));
  if (moved.length) groups.push(group('one-day', moved, [...new Set(moved.map(causeOfReport))]));
  return { merged: merged.length, groups };
}

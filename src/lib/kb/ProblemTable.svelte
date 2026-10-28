<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, type Problem } from '#lib/kb/problems';

  // `issues`: problem → link to the ticket that owns it.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, string>> } = $props();

  const LABEL: Record<Problem, string> = {
    parser: 'shared parser reads the date month first',
    hint: 'booking-v3 form hints MM/DD/YYYY',
    'one-day': 'date moves back one day',
    unplaced: 'no tenant on file',
  };

  const result = $derived(groupByProblem(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const placed = $derived(result.groups.reduce((n, g) => n + g.reports, 0));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
  const ticketName = (url: string) => '#' + url.split('/').pop();
</script>

<p class="sum">
  <strong>{result.merged}</strong> reports merged into #{ticket} ·
  <strong>{result.groups.length}</strong>
  {result.groups.length === 1 ? 'problem' : 'problems'} ·
  {placed === result.merged ? 'every report placed once' : `${result.merged - placed} reports unplaced`}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each result.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code><br /><span class="what">{LABEL[g.problem]}</span></td>
        <td>{g.reports}</td>
        <td>{g.tenants}</td>
        <td class="what">{channels(g.channels)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issues[g.problem]}<a href={issues[g.problem]}>{ticketName(issues[g.problem]!)}</a>{:else}<span class="none">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .what { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>

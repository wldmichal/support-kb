<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, type Problem } from '#lib/kb/problems';

  type Issue = { url: string; status: string };
  // `issues`: problem → the ticket that owns it, and where that ticket stands.
  let { ticket, issues = {} }: { ticket: number; issues?: Partial<Record<Problem, Issue>> } = $props();

  const LABEL: Record<Problem, string> = {
    parser: 'shared parser reads the date month first',
    hint: 'booking-v3 form hints MM/DD/YYYY',
    'one-day': 'date moves back one day',
    unplaced: 'no tenant on file',
  };

  const result = $derived(groupByProblem(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const causes = $derived(result.groups.filter((g) => g.within.length === 0));
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
  const ticketName = (url: string) => '#' + url.split('/').pop();
</script>

<p class="sum">
  <strong>{result.merged}</strong> reports merged into #{ticket} ·
  <strong>{causes.length}</strong> causes by tenant, as the desk files them
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>came in by</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each result.groups as g (g.problem)}
      {@const issue = issues[g.problem]}
      <tr class:open={issue?.status === 'open'}>
        <td>
          <code>{g.problem}</code><br /><span class="what">{LABEL[g.problem]}</span>
          {#if g.within.length}<br /><span class="what">counted under {g.within.join(', ')} above</span>{/if}
        </td>
        <td>{g.reports}</td>
        <td>{g.tenants}</td>
        <td class="what">{channels(g.channels)}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if issue}<a href={issue.url}>{ticketName(issue.url)}</a><br /><span class="status">{issue.status}</span>{:else}<span class="none">none yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.1rem; }
  .what { color: var(--muted); font-size: 0.85em; }
  .status { font-size: 0.85em; color: var(--muted); }
  .open .status { color: var(--warn); font-weight: 600; }
  .none { color: var(--warn); font-weight: 600; }
</style>

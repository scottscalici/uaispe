import type { Match, Standings, StandingRow } from './types';

const emptyRow = (): StandingRow => ({
  w: 0,
  l: 0,
  t: 0,
  pf: 0,
  pa: 0,
  pd: 0,
  pts: 0,
});

// Splits a team string like "Team A & Team B" into individual team names.
const splitTeams = (teamStr: string): string[] =>
  teamStr
    ? teamStr
        .split(' & ')
        .map((t) => t.trim())
        .filter((t) => t && t !== 'BYE' && t !== 'TBD')
    : [];

export function computeStandings(matches: Match[]): Standings {
  const standings: Standings = {};

  // Initialize every team that appears in any match
  matches.forEach((m) => {
    [...splitTeams(m.home_team), ...splitTeams(m.away_team)].forEach((t) => {
      if (!standings[t]) standings[t] = emptyRow();
    });
  });

  // Credit completed matches
  matches.filter((m) => m.completed).forEach((m) => {
    const homeTeams = splitTeams(m.home_team);
    const awayTeams = splitTeams(m.away_team);
    const hs = m.home_score ?? 0;
    const as = m.away_score ?? 0;

    let result: 'homeWin' | 'awayWin' | 'tie' = 'tie';
    if (hs > as) result = 'homeWin';
    else if (as > hs) result = 'awayWin';

    homeTeams.forEach((name) => {
      const row = standings[name];
      if (!row) return;
      row.pf += hs;
      row.pa += as;
      if (result === 'homeWin') {
        row.w += 1;
        row.pts += 3;
      } else if (result === 'awayWin') {
        row.l += 1;
      } else {
        row.t += 1;
        row.pts += 1;
      }
    });

    awayTeams.forEach((name) => {
      const row = standings[name];
      if (!row) return;
      row.pf += as;
      row.pa += hs;
      if (result === 'awayWin') {
        row.w += 1;
        row.pts += 3;
      } else if (result === 'homeWin') {
        row.l += 1;
      } else {
        row.t += 1;
        row.pts += 1;
      }
    });
  });

  // Point differential
  Object.values(standings).forEach((row) => {
    row.pd = row.pf - row.pa;
  });

  return standings;
}

export interface RankedRow extends StandingRow {
  name: string;
  rank: number;
}

export function rankStandings(standings: Standings): RankedRow[] {
  return Object.entries(standings)
    .map(([name, row]) => ({ name, ...row }))
    .sort((a, b) => {
      if (b.pts !== a.pts) return b.pts - a.pts;
      if (b.pd !== a.pd) return b.pd - a.pd;
      return b.pf - a.pf;
    })
    .map((row, i) => ({ ...row, rank: i + 1 }));
}

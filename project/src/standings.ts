import type { Match, Standings, StandingRow, Unit, DailyTeamSnapshot } from './types';

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

/**
 * Player win counts, computed fresh every time from the schedule itself - never stored or
 * manually adjusted. A match's recorded result (a score, or a mini-game's awardedTeamCounts)
 * is the only source of truth; who gets credited for it is always today's actual team roster
 * (that date's Game Day Snapshot if one exists, otherwise the current team-set/base-team
 * composition). Move a player off a team that's on record as having won, and their credit
 * disappears the next time this runs - no separate recalculation step needed.
 */
export function computeWinsFromSchedule(
  matches: Match[],
  unit: Unit,
  dailyTeams: Record<string, DailyTeamSnapshot>,
): Record<string, number> {
  const wins: Record<string, number> = {};

  const resolveTeams = (m: Match) => dailyTeams[m.date_str]
    ? dailyTeams[m.date_str].teams
    : (m.team_set_id && m.team_set_id !== 'base'
        ? unit.teamSets?.find((ts) => ts.id === m.team_set_id)?.teams
        : unit.baseTeams);

  matches.forEach((m) => {
    const teams = resolveTeams(m);
    if (!teams) return;

    if (m.match_type === 'minigame') {
      Object.entries(m.awardedTeamCounts || {}).forEach(([teamIdStr, count]) => {
        if (!count) return;
        const team = teams.find((t) => t.id === Number(teamIdStr));
        team?.players.forEach((p) => { wins[p.id] = (wins[p.id] ?? 0) + count; });
      });
      return;
    }

    if (!(m.completed && m.home_score !== null && m.away_score !== null)) return;
    const winnerName = m.home_score > m.away_score ? m.home_team : m.away_score > m.home_score ? m.away_team : null;
    if (!winnerName) return;
    const winnerTeam = teams.find((t) => t.name === winnerName);
    winnerTeam?.players.forEach((p) => { wins[p.id] = (wins[p.id] ?? 0) + 1; });
  });

  return wins;
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

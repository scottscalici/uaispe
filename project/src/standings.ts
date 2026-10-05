import type { Match, Standings, StandingRow, Unit, Team } from './types';

/** Which team-set "series" a match belongs to for standings purposes - always the team-set it
 *  was actually programmed against, regardless of any Game Day Snapshot loaded that date. A
 *  snapshot is a rare, same-day-only operational override (drastic-day substitutions); it never
 *  changes which team-set a match's record belongs to or who gets credited for its result -
 *  that always follows the assigned roster, so a temporary daily swap can't split a team-set's
 *  history across groups or silently drop a win when the snapshot doesn't match by name. Matches
 *  that share this id, on any date, are one continuous standings page. */
export function resolveMatchGroupId(m: Match): string {
  return m.team_set_id && m.team_set_id !== 'base' ? m.team_set_id : 'base';
}

/** The assigned roster to credit for a match - the current composition of the team-set it was
 *  programmed against (base teams, or a specific team-set), never a Game Day Snapshot. Move a
 *  player between teams and every match's credit follows them from then on; a one-off Game Day
 *  Snapshot substitution intentionally isn't reflected here, to keep exactly one, stable answer
 *  for "who gets this win" with no risk of double-crediting. */
export function resolveMatchTeams(m: Match, unit: Unit): Team[] | undefined {
  const groupId = resolveMatchGroupId(m);
  return groupId === 'base' ? unit.baseTeams : unit.teamSets?.find((ts) => ts.id === groupId)?.teams;
}

/** Merged matches only: the real Team objects (current name/roster) making up one side -
 *  e.g. ["Lions", "Ravens"] even if the match's display label says "Baltroit Ryans". Always
 *  resolved fresh from the team-set's current composition, same as any other standings credit. */
export function resolveMergedSideTeams(m: Match, unit: Unit, side: 'home' | 'away'): Team[] {
  const ids = side === 'home' ? m.merged_home_team_ids : m.merged_away_team_ids;
  if (!ids || ids.length === 0) return [];
  const teams = resolveMatchTeams(m, unit) || [];
  return ids.map((id) => teams.find((t) => t.id === id)).filter((t): t is Team => !!t);
}

export function getGroupLabel(groupId: string, unit: Unit): string {
  if (groupId === 'base') return 'Base Teams';
  return unit.teamSets?.find((ts) => ts.id === groupId)?.name ?? 'Unknown Team Set';
}

export interface MatchGroup {
  id: string;
  label: string;
  matches: Match[];
  firstDate: string;
  lastDate: string;
}

/** Buckets non-solo matches by their team-set group, sorted by when each group was first used. */
export function groupMatchesBySet(matches: Match[], unit: Unit): MatchGroup[] {
  const buckets = new Map<string, Match[]>();
  matches.filter((m) => m.match_type !== 'solo').forEach((m) => {
    const groupId = resolveMatchGroupId(m);
    if (!buckets.has(groupId)) buckets.set(groupId, []);
    buckets.get(groupId)!.push(m);
  });

  return Array.from(buckets.entries())
    .map(([id, groupMatches]) => {
      const dates = groupMatches.map((m) => m.date_str).sort();
      return { id, label: getGroupLabel(id, unit), matches: groupMatches, firstDate: dates[0], lastDate: dates[dates.length - 1] };
    })
    .sort((a, b) => a.firstDate.localeCompare(b.firstDate));
}

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

// A match's credited team names for one side - merged matches resolve through their id arrays
// (so a fun custom display label like "Baltroit Ryans" never leaks into the standings table),
// everything else falls back to parsing the display string as before.
const creditNames = (m: Match, unit: Unit, side: 'home' | 'away'): string[] =>
  m.match_type === 'merged'
    ? resolveMergedSideTeams(m, unit, side).map((t) => t.name)
    : splitTeams(side === 'home' ? m.home_team : m.away_team);

export function computeStandings(matches: Match[], unit: Unit): Standings {
  const standings: Standings = {};

  // Initialize every team that appears in any match
  matches.forEach((m) => {
    [...creditNames(m, unit, 'home'), ...creditNames(m, unit, 'away')].forEach((t) => {
      if (!standings[t]) standings[t] = emptyRow();
    });
  });

  // Credit completed matches
  matches.filter((m) => m.completed).forEach((m) => {
    const homeTeams = creditNames(m, unit, 'home');
    const awayTeams = creditNames(m, unit, 'away');
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
 * manually adjusted. A match's recorded result (a score, a mini-game's awardedTeamCounts, or a
 * solo event's winner_player_id) is the only source of truth; who gets credited for it is
 * always the assigned roster - the current team-set/base-team composition a match was
 * programmed against, ignoring any same-day Game Day Snapshot substitution - solo events skip
 * team resolution entirely since they credit a student directly. Move a player off a team
 * that's on record as having won, and their credit disappears the next time this runs - no
 * separate recalculation step.
 */
export function computeWinsFromSchedule(matches: Match[], unit: Unit): Record<string, number> {
  const wins: Record<string, number> = {};

  matches.forEach((m) => {
    if (m.match_type === 'solo') {
      (m.winner_player_ids || []).forEach((id) => { wins[id] = (wins[id] ?? 0) + 1; });
      return;
    }

    const teams = resolveMatchTeams(m, unit);
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

    if (m.match_type === 'merged') {
      const winningSide = m.home_score > m.away_score ? 'home' : m.away_score > m.home_score ? 'away' : null;
      if (!winningSide) return;
      resolveMergedSideTeams(m, unit, winningSide).forEach((team) => {
        team.players.forEach((p) => { wins[p.id] = (wins[p.id] ?? 0) + 1; });
      });
      return;
    }

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

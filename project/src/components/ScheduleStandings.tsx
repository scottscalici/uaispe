import { useMemo } from 'react';
import { CalendarDays, Clock, MapPin, BarChart3, History, Users, Plus, Trophy } from 'lucide-react';
import type { ScheduleData, Match, Unit } from '../types';
import { computeStandings, rankStandings } from '../standings';

interface Props {
  unit: Unit;
  schedule: ScheduleData;
  isAdmin: boolean;
  onUpdateScore: (matchId: number, side: 'home' | 'away', value: number | null) => void;
  onAwardTeamWin: (teamId: number, teamSetId: string) => void;
  onToggleMatchComplete: (matchId: number) => void;
}

export default function ScheduleStandings({ unit, schedule, isAdmin, onUpdateScore, onAwardTeamWin, onToggleMatchComplete }: Props) {
  // NEW: Guarantee all matches are sorted perfectly by Date and Time
  const sortedAllMatches = useMemo(() => {
    return [...schedule.matches].sort((a, b) => {
      if (a.date_str !== b.date_str) return a.date_str.localeCompare(b.date_str);
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [schedule.matches]);

  const standardMatches = useMemo(() => sortedAllMatches.filter(m => m.match_type === 'standard' || !m.match_type), [sortedAllMatches]);
  const bracketMatches = useMemo(() => sortedAllMatches.filter(m => m.match_type === 'bracket'), [sortedAllMatches]);
  
  const standings = useMemo(() => computeStandings(standardMatches), [standardMatches]);
  const ranked = useMemo(() => rankStandings(standings), [standings]);

  const { activeMatches, archivedMatches } = useMemo(() => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const allDates = Array.from(new Set(sortedAllMatches.map(m => m.date_str)));
    const pastDates = allDates.filter(date => date < todayStr);
    const mostRecentPastDate = pastDates.length > 0 ? pastDates[pastDates.length - 1] : null;

    const active: Match[] = [];
    const archived: Match[] = [];

    sortedAllMatches.forEach(m => {
      if (m.date_str >= todayStr || m.date_str === mostRecentPastDate) active.push(m);
      else archived.push(m);
    });

    return { activeMatches: active, archivedMatches: archived };
  }, [sortedAllMatches]);

  const getLogoUrl = (teamName: string) => {
    if (!teamName || teamName === 'TBD') return '';
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const safeUnit = normalize(unit.unit_name || 'unknown');
    const safeTeam = normalize(teamName);
    return `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${safeUnit}/${safeTeam}.png`;
  };

  return (
    <div className="space-y-8">
      
      {bracketMatches.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-amber-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <Trophy className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-bold">Championship Bracket</h3>
          </div>
          <div className="p-6 overflow-x-auto">
            <TournamentBracket matches={bracketMatches} getLogoUrl={getLogoUrl} />
          </div>
        </div>
      )}

      <StandingsTable ranked={ranked} getLogoUrl={getLogoUrl} />

      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-800">Active Matches & Events</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeMatches.map((m) => (
            <MatchCard 
              key={m.id} 
              match={m} 
              unit={unit} 
              isAdmin={isAdmin} 
              onUpdateScore={onUpdateScore} 
              onAwardTeamWin={onAwardTeamWin}
              onToggleMatchComplete={onToggleMatchComplete}
            />
          ))}
          {activeMatches.length === 0 && (
            <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              No active events scheduled.
            </div>
          )}
        </div>
      </div>

      {archivedMatches.length > 0 && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <History className="h-4 w-4" />
            Archived Past Events
          </div>
          <div className="grid grid-cols-1 gap-4 opacity-75 transition-opacity hover:opacity-100 lg:grid-cols-2">
            {archivedMatches.map((m) => (
              <MatchCard 
                key={m.id} 
                match={m} 
                unit={unit} 
                isAdmin={isAdmin} 
                onUpdateScore={onUpdateScore} 
                onAwardTeamWin={onAwardTeamWin}
                onToggleMatchComplete={onToggleMatchComplete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TournamentBracket({ matches, getLogoUrl }: { matches: Match[], getLogoUrl: (t: string) => string }) {
  const rounds = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    matches.forEach(m => {
      const rName = m.round_name || 'Round';
      if (!grouped[rName]) grouped[rName] = [];
      grouped[rName].push(m);
    });
    return grouped;
  }, [matches]);

  return (
    <div className="flex gap-8 min-w-max">
      {Object.entries(rounds).map(([roundName, roundMatches]) => (
        <div key={roundName} className="flex flex-col justify-around gap-6 min-w-[220px]">
          <h4 className="text-center font-black text-amber-600 uppercase tracking-wider text-sm mb-2">{roundName}</h4>
          {roundMatches.map(m => {
            const hWin = m.completed && m.home_score !== null && m.away_score !== null && m.home_score > m.away_score;
            const aWin = m.completed && m.home_score !== null && m.away_score !== null && m.away_score > m.home_score;
            return (
              <div key={m.id} className="flex flex-col rounded-lg border border-slate-200 bg-slate-50 shadow-sm overflow-hidden">
                <div className={`flex items-center justify-between p-2.5 border-b border-slate-100 ${hWin ? 'bg-emerald-50' : 'bg-white'}`}>
                  <div className="flex items-center gap-2">
                    {m.home_team !== 'TBD' && <img src={getLogoUrl(m.home_team)} onError={e => e.currentTarget.style.display='none'} className="w-5 h-5 object-contain" alt="" />}
                    <span className={`font-bold text-sm ${hWin ? 'text-emerald-700' : 'text-slate-700'} ${m.home_team === 'TBD' ? 'text-slate-400 italic' : ''}`}>{m.home_team}</span>
                  </div>
                  <span className={`font-black ${hWin ? 'text-emerald-600' : 'text-slate-600'}`}>{m.home_score !== null ? m.home_score : '-'}</span>
                </div>
                <div className={`flex items-center justify-between p-2.5 ${aWin ? 'bg-emerald-50' : 'bg-white'}`}>
                  <div className="flex items-center gap-2">
                    {m.away_team !== 'TBD' && <img src={getLogoUrl(m.away_team)} onError={e => e.currentTarget.style.display='none'} className="w-5 h-5 object-contain" alt="" />}
                    <span className={`font-bold text-sm ${aWin ? 'text-emerald-700' : 'text-slate-700'} ${m.away_team === 'TBD' ? 'text-slate-400 italic' : ''}`}>{m.away_team}</span>
                  </div>
                  <span className={`font-black ${aWin ? 'text-emerald-600' : 'text-slate-600'}`}>{m.away_score !== null ? m.away_score : '-'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function StandingsTable({ ranked, getLogoUrl }: { ranked: ReturnType<typeof rankStandings>, getLogoUrl: (t: string) => string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-700 px-4 py-3 text-white">
        <BarChart3 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Tournament Standings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-left">Team</th>
              <th className="px-3 py-2">W</th>
              <th className="px-3 py-2">L</th>
              <th className="px-3 py-2">T</th>
              <th className="px-3 py-2">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranked.map((r) => (
              <tr key={r.name} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-bold text-slate-500">{r.rank}</td>
                <td className="px-3 py-2 text-left font-semibold text-slate-800 flex items-center gap-2">
                  <img src={getLogoUrl(r.name)} onError={e => e.currentTarget.style.display='none'} className="w-6 h-6 object-contain bg-white rounded-full p-0.5 border border-slate-200" alt="" />
                  {r.name}
                </td>
                <td className="px-3 py-2 text-emerald-600">{r.w}</td>
                <td className="px-3 py-2 text-red-600">{r.l}</td>
                <td className="px-3 py-2 text-slate-500">{r.t}</td>
                <td className="px-3 py-2 font-black text-blue-600">{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchCard({ match, unit, isAdmin, onUpdateScore, onAwardTeamWin, onToggleMatchComplete }: any) {
  const homeVal = match.home_score ?? '';
  const awayVal = match.away_score ?? '';

  if (match.match_type === 'minigame') {
    const teamSet = unit.teamSets?.find((ts: any) => ts.id === match.team_set_id);
    return (
      <div className={`rounded-xl border bg-white p-4 shadow-sm transition-all ${match.completed ? 'border-emerald-300 bg-emerald-50/20' : 'border-indigo-300 ring-2 ring-indigo-50'}`}>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-black text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
            <Users className="h-4 w-4" /> Mini-Games & Relays
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-600"><CalendarDays className="h-3.5 w-3.5" /> {match.date_str}</span>
          <span className="flex items-center gap-1 font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> {match.time}</span>
          <span className="flex items-center gap-1 font-semibold text-slate-600"><MapPin className="h-3.5 w-3.5" /> {match.location}</span>
          {match.completed && <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Finished</span>}
        </div>
        <div className="space-y-2 mt-3">
          {teamSet?.teams.map((team: any) => (
            <div key={team.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-lg shadow-sm">
              <span className="font-bold text-slate-800 text-sm">{team.name}</span>
              {isAdmin && !match.completed && (
                <button 
                  onClick={() => onAwardTeamWin(team.id, teamSet.id)}
                  className="flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 hover:scale-105 transition-all px-3 py-1.5 rounded-md text-xs font-black shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> 1 Win
                </button>
              )}
            </div>
          ))}
          {!teamSet && <div className="text-slate-400 text-sm italic text-center py-2">Team Set no longer exists.</div>}
        </div>
        {isAdmin && (
          <div className="mt-5 pt-3 border-t border-slate-100 text-center">
            <button 
              onClick={() => onToggleMatchComplete(match.id)}
              className={`text-xs font-bold px-5 py-2 rounded-lg transition-all ${match.completed ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'}`}
            >
              {match.completed ? 'Reopen Event' : 'Mark Event as Finished'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${match.completed ? 'border-emerald-300 bg-emerald-50/20' : match.match_type === 'bracket' ? 'border-amber-300 ring-2 ring-amber-50' : 'border-slate-200'}`}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
        {match.match_type === 'bracket' && (
          <span className="flex items-center gap-1.5 font-black text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-1 rounded">
            <Trophy className="h-4 w-4" /> {match.round_name}
          </span>
        )}
        <span className="flex items-center gap-1 font-semibold text-slate-600"><CalendarDays className="h-3.5 w-3.5" /> {match.date_str}</span>
        <span className="flex items-center gap-1 font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> {match.time}</span>
        <span className="flex items-center gap-1 font-semibold text-slate-600"><MapPin className="h-3.5 w-3.5" /> {match.location}</span>
        {match.completed && <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Final</span>}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
        <div className={`text-right font-black text-sm md:text-base ${match.home_team === 'TBD' ? 'text-slate-400 italic' : 'text-slate-800'}`}>{match.home_team}</div>
        <div className="flex items-center gap-2">
          <ScoreInput value={homeVal} disabled={!isAdmin} onChange={(v: any) => onUpdateScore(match.id, 'home', v)} />
          <span className="text-xs font-bold text-slate-400">vs</span>
          <ScoreInput value={awayVal} disabled={!isAdmin} onChange={(v: any) => onUpdateScore(match.id, 'away', v)} />
        </div>
        <div className={`text-left font-black text-sm md:text-base ${match.away_team === 'TBD' ? 'text-slate-400 italic' : 'text-slate-800'}`}>{match.away_team}</div>
      </div>
      {!isAdmin && !match.completed && <p className="mt-3 text-center text-xs font-semibold text-slate-400">Scores pending</p>}
    </div>
  );
}

function ScoreInput({ value, disabled, onChange }: any) {
  return (
    <input
      type="number"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
      className="w-14 rounded-lg border-2 border-slate-200 px-2 py-1.5 text-center text-lg font-black text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-transparent disabled:border-none disabled:text-blue-700"
    />
  );
}
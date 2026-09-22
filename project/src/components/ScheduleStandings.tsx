import { useMemo, useState } from 'react';
import { CalendarDays, Clock, MapPin, BarChart3, Users, Plus, Minus, Trophy, Lock, Unlock, Printer, User } from 'lucide-react';
import type { ScheduleData, Match, Unit, DailyTeamSnapshot, Player } from '../types';
import { computeStandings, rankStandings, groupMatchesBySet } from '../standings';

const SOLO_GROUP_ID = '__solo__';

interface Props {
  unit: Unit;
  schedule: ScheduleData;
  roster: Player[];
  dailyTeams: Record<string, DailyTeamSnapshot>;
  isAdmin: boolean;
  onUpdateScore: (matchId: number, side: 'home' | 'away', value: number | null) => void;
  onAwardTeamWin: (matchId: number, teamId: number) => void;
  onUnawardTeamWin: (matchId: number, teamId: number) => void;
  onToggleMatchComplete: (matchId: number) => void;
  onArchiveGroup: (groupId: string) => void;
  onUnarchiveGroup: (groupId: string) => void;
}

export default function ScheduleStandings({
  unit, schedule, roster, dailyTeams, isAdmin,
  onUpdateScore, onAwardTeamWin, onUnawardTeamWin, onToggleMatchComplete,
  onArchiveGroup, onUnarchiveGroup,
}: Props) {
  // NEW: Guarantee all matches are sorted perfectly by Date and Time
  const sortedAllMatches = useMemo(() => {
    return [...schedule.matches].sort((a, b) => {
      if (a.date_str !== b.date_str) return a.date_str.localeCompare(b.date_str);
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [schedule.matches]);

  const soloMatches = useMemo(() => sortedAllMatches.filter(m => m.match_type === 'solo'), [sortedAllMatches]);

  // Each team-set (whichever roster arrangement was actually used) gets its own standings
  // page, reused across every date it appears on - never split by day.
  const groups = useMemo(() => groupMatchesBySet(sortedAllMatches, dailyTeams, unit), [sortedAllMatches, dailyTeams, unit]);

  const tabs = useMemo(() => {
    const list = groups.map(g => ({ id: g.id, label: g.label, count: g.matches.length }));
    if (soloMatches.length > 0) list.push({ id: SOLO_GROUP_ID, label: 'Individual Events', count: soloMatches.length });
    return list;
  }, [groups, soloMatches]);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const activeGroupId = selectedGroupId && tabs.some(t => t.id === selectedGroupId) ? selectedGroupId : (tabs[0]?.id ?? null);

  const activeGroup = groups.find(g => g.id === activeGroupId);
  const isSoloView = activeGroupId === SOLO_GROUP_ID;
  const isArchived = !!(activeGroupId && activeGroupId !== SOLO_GROUP_ID && unit.archivedTeamSetIds?.includes(activeGroupId));

  const groupMatches = isSoloView ? soloMatches : (activeGroup?.matches ?? []);
  const standardMatches = useMemo(() => groupMatches.filter(m => m.match_type === 'standard' || !m.match_type), [groupMatches]);
  const bracketMatches = useMemo(() => groupMatches.filter(m => m.match_type === 'bracket'), [groupMatches]);

  const standings = useMemo(() => computeStandings(standardMatches), [standardMatches]);
  const ranked = useMemo(() => rankStandings(standings), [standings]);

  const soloRanked = useMemo(() => {
    if (!isSoloView) return [];
    const counts: Record<string, number> = {};
    soloMatches.forEach(m => { if (m.winner_player_id) counts[m.winner_player_id] = (counts[m.winner_player_id] ?? 0) + 1; });
    return Object.entries(counts)
      .map(([playerId, wins]) => ({ playerId, name: roster.find(p => p.id === playerId)?.name ?? 'Unknown', wins }))
      .sort((a, b) => b.wins - a.wins);
  }, [isSoloView, soloMatches, roster]);

  const getLogoUrl = (teamName: string) => {
    if (!teamName || teamName === 'TBD') return '';
    const normalize = (str: string) => str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const safeUnit = normalize(unit.unit_name || 'unknown');
    const safeTeam = normalize(teamName);
    return `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${safeUnit}/${safeTeam}.png`;
  };

  const matchesByDate = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    sortedAllMatches.forEach(m => {
      if (!grouped[m.date_str]) grouped[m.date_str] = [];
      grouped[m.date_str].push(m);
    });
    return grouped;
  }, [sortedAllMatches]);

  const handlePrintSchedule = () => window.print();

  const handleArchiveClick = () => {
    if (!activeGroup) return;
    if (confirm(`Archive standings for "${activeGroup.label}"? This locks all its matches read-only until you unarchive it.`)) {
      onArchiveGroup(activeGroup.id);
    }
  };

  return (
    <div className="space-y-8">
      <style>{`
        @media print {
          @page { size: portrait; margin: 12mm; }
          body * { visibility: hidden; }
          #printable-schedule, #printable-schedule * { visibility: visible; }
          #printable-schedule { position: absolute; left: 0; top: 0; width: 100%; background: white !important; }
          .sched-no-print { display: none !important; }
          .sched-day { break-inside: avoid; page-break-inside: avoid; margin-bottom: 14px; }
          .sched-date-header { background: #1e293b !important; color: #fff !important; font-weight: 900; padding: 6px 10px; border-radius: 6px; font-size: 11pt; margin-bottom: 6px; }
          .sched-row { break-inside: avoid; page-break-inside: avoid; display: flex !important; align-items: center; justify-content: space-between; border: 1px solid #cbd5e1 !important; border-radius: 6px; padding: 8px 12px; margin-bottom: 6px; }
          .sched-team { display: flex !important; align-items: center; gap: 8px; font-weight: 700; font-size: 11pt; color: #000 !important; flex: 1; }
          .sched-team.away { justify-content: flex-end; text-align: right; }
          .sched-logo { width: 22px !important; height: 22px !important; object-fit: contain; }
          .sched-meta { font-size: 9pt; color: #334155 !important; white-space: nowrap; padding: 0 10px; text-align: center; }
          .sched-vs { font-weight: 900; font-size: 10pt; color: #64748b !important; padding: 0 10px; }
        }
      `}</style>

      <div className="flex justify-end sched-no-print">
        <button onClick={handlePrintSchedule} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition">
          <Printer className="h-4 w-4" /> Print Schedule
        </button>
      </div>

      {/* Print-only clean schedule list, covers the full season chronologically */}
      <div id="printable-schedule" className="hidden print:block">
        <h1 className="text-2xl font-black text-center mb-6">{unit.unit_name} — Season Schedule</h1>
        {Object.keys(matchesByDate).sort().map(date => (
          <div key={date} className="sched-day">
            <div className="sched-date-header">{new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            {matchesByDate[date].map(m => {
              if (m.match_type === 'minigame') {
                const isBase = !m.team_set_id || m.team_set_id === 'base';
                const displayTeams = isBase ? unit.baseTeams : unit.teamSets?.find(ts => ts.id === m.team_set_id)?.teams;
                return (
                  <div key={m.id} className="sched-row">
                    <div className="sched-meta" style={{ textAlign: 'left', flex: '0 0 auto' }}>{m.time} • {m.location}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1, justifyContent: 'center' }}>
                      {displayTeams?.map(t => (
                        <span key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: '10pt' }}>
                          <img src={getLogoUrl(t.name)} onError={e => e.currentTarget.style.display = 'none'} className="sched-logo" alt="" /> {t.name}
                        </span>
                      ))}
                      {!displayTeams && <span>Mini-Games</span>}
                    </div>
                  </div>
                );
              }
              if (m.match_type === 'solo') {
                const winnerName = roster.find(p => p.id === m.winner_player_id)?.name ?? m.away_team;
                return (
                  <div key={m.id} className="sched-row">
                    <div className="sched-meta" style={{ textAlign: 'left', flex: '0 0 auto' }}>{m.time} • {m.location}</div>
                    <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: '10pt' }}>
                      🏆 Individual Event Winner: {winnerName}
                    </div>
                  </div>
                );
              }
              return (
                <div key={m.id} className="sched-row">
                  <div className="sched-team">
                    {m.home_team !== 'TBD' && <img src={getLogoUrl(m.home_team)} onError={e => e.currentTarget.style.display = 'none'} className="sched-logo" alt="" />}
                    {m.home_team}
                  </div>
                  <div className="sched-meta">
                    {m.match_type === 'bracket' && <div style={{ fontWeight: 800 }}>{m.round_name}</div>}
                    {m.time} • {m.location}
                    {m.completed && m.home_score !== null && m.away_score !== null && (
                      <div style={{ fontWeight: 900 }}>{m.home_score} - {m.away_score}</div>
                    )}
                  </div>
                  <div className="sched-team away">
                    {m.away_team}
                    {m.away_team !== 'TBD' && <img src={getLogoUrl(m.away_team)} onError={e => e.currentTarget.style.display = 'none'} className="sched-logo" alt="" />}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {Object.keys(matchesByDate).length === 0 && (
          <p className="text-center text-slate-400">No events scheduled yet.</p>
        )}
      </div>

      {tabs.length > 0 && (
        <div className="flex flex-wrap gap-2 sched-no-print">
          {tabs.map(t => {
            const tabArchived = t.id !== SOLO_GROUP_ID && unit.archivedTeamSetIds?.includes(t.id);
            const active = activeGroupId === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedGroupId(t.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold transition ${active ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {t.id === SOLO_GROUP_ID ? <User className="h-4 w-4" /> : tabArchived ? <Lock className="h-3.5 w-3.5" /> : null}
                {t.label}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-black ${active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>{t.count}</span>
              </button>
            );
          })}
        </div>
      )}

      {tabs.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 sched-no-print">
          No events scheduled yet.
        </div>
      )}

      {activeGroup && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sched-no-print">
          <div>
            <h3 className="font-bold text-slate-800">{activeGroup.label}</h3>
            <p className="text-xs text-slate-500">
              {activeGroup.firstDate === activeGroup.lastDate ? activeGroup.firstDate : `${activeGroup.firstDate} – ${activeGroup.lastDate}`}
              {isArchived && <span className="ml-2 font-bold text-amber-600">Archived — read only</span>}
            </p>
          </div>
          {isAdmin && (
            isArchived ? (
              <button onClick={() => onUnarchiveGroup(activeGroup.id)} className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-2 text-sm font-bold text-amber-800 hover:bg-amber-200">
                <Unlock className="h-4 w-4" /> Unarchive
              </button>
            ) : (
              <button onClick={handleArchiveClick} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">
                <Lock className="h-4 w-4" /> Archive These Standings
              </button>
            )
          )}
        </div>
      )}

      {isSoloView ? (
        <>
          <SoloStandingsTable ranked={soloRanked} />
          <div>
            <h3 className="mb-3 text-lg font-semibold text-slate-800">Individual Events</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {soloMatches.map(m => (
                <SoloMatchCard key={m.id} match={m} roster={roster} />
              ))}
              {soloMatches.length === 0 && (
                <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No individual events yet.
                </div>
              )}
            </div>
          </div>
        </>
      ) : activeGroup ? (
        <>
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
            <h3 className="mb-3 text-lg font-semibold text-slate-800">Events</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {groupMatches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  unit={unit}
                  isAdmin={isAdmin}
                  onUpdateScore={onUpdateScore}
                  onAwardTeamWin={onAwardTeamWin}
                  onUnawardTeamWin={onUnawardTeamWin}
                  onToggleMatchComplete={onToggleMatchComplete}
                  locked={isArchived || m.completed}
                />
              ))}
              {groupMatches.length === 0 && (
                <div className="col-span-full rounded-lg border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  No events in this group yet.
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
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
        <h3 className="text-lg font-semibold">Standings</h3>
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
            {ranked.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-slate-400">No standard matches recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SoloStandingsTable({ ranked }: { ranked: { playerId: string; name: string; wins: number }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-700 px-4 py-3 text-white">
        <Trophy className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Individual Event Standings</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-center text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-3 py-2 text-left">Rank</th>
              <th className="px-3 py-2 text-left">Student</th>
              <th className="px-3 py-2">Wins</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranked.map((r, i) => (
              <tr key={r.playerId} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-bold text-slate-500">{i + 1}</td>
                <td className="px-3 py-2 text-left font-semibold text-slate-800">{r.name}</td>
                <td className="px-3 py-2 font-black text-blue-600">{r.wins}</td>
              </tr>
            ))}
            {ranked.length === 0 && (
              <tr><td colSpan={3} className="px-3 py-6 text-slate-400">No individual events recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SoloMatchCard({ match, roster }: { match: Match; roster: Player[] }) {
  const winnerName = roster.find(p => p.id === match.winner_player_id)?.name ?? match.away_team;
  return (
    <div className="rounded-xl border border-purple-300 bg-purple-50/20 p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
        <span className="flex items-center gap-1.5 font-black text-purple-700 uppercase tracking-wider bg-purple-50 px-2 py-1 rounded">
          <User className="h-4 w-4" /> Individual Event
        </span>
        <span className="flex items-center gap-1 font-semibold text-slate-600"><CalendarDays className="h-3.5 w-3.5" /> {match.date_str}</span>
        <span className="flex items-center gap-1 font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> {match.time}</span>
        <span className="flex items-center gap-1 font-semibold text-slate-600"><MapPin className="h-3.5 w-3.5" /> {match.location}</span>
      </div>
      <div className="flex items-center justify-center gap-2 py-2">
        <Trophy className="h-5 w-5 text-amber-500" />
        <span className="font-black text-lg text-slate-800">{winnerName}</span>
      </div>
    </div>
  );
}

function MatchCard({ match, unit, isAdmin, onUpdateScore, onAwardTeamWin, onUnawardTeamWin, onToggleMatchComplete, locked }: any) {
  const homeVal = match.home_score ?? '';
  const awayVal = match.away_score ?? '';
  const editable = isAdmin && !locked;

  if (match.match_type === 'minigame') {
    const isBase = !match.team_set_id || match.team_set_id === 'base';
    const displayTeams = isBase ? unit.baseTeams : unit.teamSets?.find((ts: any) => ts.id === match.team_set_id)?.teams;

    return (
      <div className={`rounded-xl border bg-white p-4 shadow-sm transition-all ${match.completed ? 'border-emerald-300 bg-emerald-50/20' : 'border-indigo-300 ring-2 ring-indigo-50'}`}>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-100 pb-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-black text-indigo-700 uppercase tracking-wider bg-indigo-50 px-2 py-1 rounded">
            <Users className="h-4 w-4" /> Mini-Games & Relays
          </span>
          <span className="flex items-center gap-1 font-semibold text-slate-600"><CalendarDays className="h-3.5 w-3.5" /> {match.date_str}</span>
          <span className="flex items-center gap-1 font-semibold text-slate-600"><Clock className="h-3.5 w-3.5" /> {match.time}</span>
          <span className="flex items-center gap-1 font-semibold text-slate-600"><MapPin className="h-3.5 w-3.5" /> {match.location}</span>
          {locked ? (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500"><Lock className="h-3 w-3" /> Locked</span>
          ) : match.completed && (
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Finished</span>
          )}
        </div>
        <div className="space-y-2 mt-3">
          {displayTeams?.map((team: any) => {
            const count = match.awardedTeamCounts?.[team.id] || 0;
            return (
              <div key={team.id} className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-lg shadow-sm">
                <span className="font-bold text-slate-800 text-sm">{team.name}</span>
                <div className="flex items-center gap-2">
                  {count > 0 && (
                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md text-xs font-black" title="Wins awarded for this event">
                      <Trophy className="w-3 h-3" /> {count}
                    </span>
                  )}
                  {editable && !match.completed && (
                    <div className="flex items-center gap-1">
                      {count > 0 && (
                        <button
                          onClick={() => onUnawardTeamWin(match.id, team.id)}
                          title="Undo one award"
                          className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 shadow-sm transition-all hover:bg-red-100 hover:text-red-600"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onAwardTeamWin(match.id, team.id)}
                        className="flex items-center gap-1 bg-amber-100 text-amber-700 hover:bg-amber-200 hover:scale-105 transition-all px-3 py-1.5 rounded-md text-xs font-black shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> 1 Win
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {!displayTeams && <div className="text-slate-400 text-sm italic text-center py-2">Teams not found.</div>}
        </div>
        {editable && (
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
        {locked ? (
          <span className="ml-auto flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500"><Lock className="h-3 w-3" /> Locked</span>
        ) : match.completed && (
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">Final</span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
        <div className={`text-right font-black text-sm md:text-base ${match.home_team === 'TBD' ? 'text-slate-400 italic' : 'text-slate-800'}`}>{match.home_team}</div>
        <div className="flex items-center gap-2">
          <ScoreInput value={homeVal} disabled={!editable} onChange={(v: any) => onUpdateScore(match.id, 'home', v)} />
          <span className="text-xs font-bold text-slate-400">vs</span>
          <ScoreInput value={awayVal} disabled={!editable} onChange={(v: any) => onUpdateScore(match.id, 'away', v)} />
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

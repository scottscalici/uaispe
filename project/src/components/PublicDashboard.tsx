import { useMemo, useState } from 'react';
import { Search, Calendar, MapPin, Trophy, Users, ShieldAlert, History } from 'lucide-react';
import type { Unit, ScheduleData, Match } from '../types';

interface Props {
  unit: Unit;
  schedule: ScheduleData;
}

export default function PublicDashboard({ unit, schedule }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRosterId, setActiveRosterId] = useState<string>('base');

  // Ensure all schedule arrays are perfectly sorted chronologically
  const sortedAllMatches = useMemo(() => {
    return [...schedule.matches].sort((a, b) => {
      if (a.date_str !== b.date_str) return a.date_str.localeCompare(b.date_str);
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [schedule.matches]);

  const getLogoUrl = (teamName: string) => {
    if (!teamName || teamName === 'TBD') return '';
    const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const safeUnit = normalize(unit?.unit_name || 'unknown');
    const safeTeam = normalize(teamName);
    return `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${safeUnit}/${safeTeam}.png`;
  };

  const sortedTeams = useMemo(() => {
    const standardMatches = sortedAllMatches.filter(m => m.match_type === 'standard' || !m.match_type);
    return [...unit.baseTeams].map(t => {
      let w = 0, l = 0, t_ties = 0, pts = 0;
      standardMatches.forEach(m => {
        if (m.completed && m.home_score !== null && m.away_score !== null) {
          if (m.home_team === t.name) {
            if (m.home_score > m.away_score) { w++; pts += 3; }
            else if (m.home_score < m.away_score) { l++; }
            else { t_ties++; pts += 1; }
          }
          if (m.away_team === t.name) {
            if (m.away_score > m.home_score) { w++; pts += 3; }
            else if (m.away_score < m.home_score) { l++; }
            else { t_ties++; pts += 1; }
          }
        }
      });
      return { ...t, stats: { w, l, t: t_ties, pts } };
    }).sort((a, b) => b.stats.pts - a.stats.pts);
  }, [unit, sortedAllMatches]);

  const searchedStudentResult = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    
    let foundPlayer = null;
    let baseTeam = null;

    for (const team of unit.baseTeams) {
      const p = team.players.find(p => p.name.toLowerCase().includes(query));
      if (p) {
        foundPlayer = p;
        baseTeam = team;
        break;
      }
    }

    if (!foundPlayer || !baseTeam) return 'NOT_FOUND';

    const playerTimeline: { match: Match, playingAs: string }[] = [];

    sortedAllMatches.forEach(m => {
      if (m.match_type === 'minigame') {
        const teamSet = unit.teamSets?.find(ts => ts.id === m.team_set_id);
        if (teamSet) {
          const specificTeam = teamSet.teams.find(t => t.players.some(p => p.id === foundPlayer!.id));
          if (specificTeam) {
            playerTimeline.push({ match: m, playingAs: specificTeam.name });
          }
        }
      } else {
        let playingAs = baseTeam!.name;
        if (m.team_set_id && m.team_set_id !== 'base') {
           const teamSet = unit.teamSets?.find(ts => ts.id === m.team_set_id);
           const specificTeam = teamSet?.teams.find(t => t.players.some(p => p.id === foundPlayer!.id));
           if (specificTeam && (specificTeam.name === m.home_team || specificTeam.name === m.away_team)) {
             playingAs = specificTeam.name;
           }
        }
        
        if (m.home_team === playingAs || m.away_team === playingAs) {
          playerTimeline.push({ match: m, playingAs });
        }
      }
    });

    return { player: foundPlayer, team: baseTeam, timeline: playerTimeline };
  }, [searchQuery, unit, sortedAllMatches]);

  const { activeSchedule, archivedSchedule } = useMemo(() => {
    const active: Record<string, typeof schedule.matches> = {};
    const archived: Record<string, typeof schedule.matches> = {};

    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const allDates = Array.from(new Set(sortedAllMatches.map(m => m.date_str)));
    const pastDates = allDates.filter(date => date < todayStr);
    const mostRecentPastDate = pastDates.length > 0 ? pastDates[pastDates.length - 1] : null;

    sortedAllMatches.forEach(m => {
      if (m.date_str >= todayStr || m.date_str === mostRecentPastDate) {
        if (!active[m.date_str]) active[m.date_str] = [];
        active[m.date_str].push(m);
      } else {
        if (!archived[m.date_str]) archived[m.date_str] = [];
        archived[m.date_str].push(m);
      }
    });

    return { activeSchedule: active, archivedSchedule: archived };
  }, [sortedAllMatches]);

  const activeRosterTeams = activeRosterId === 'base' 
    ? unit.baseTeams 
    : unit.teamSets?.find(ts => ts.id === activeRosterId)?.teams || [];

  const bracketMatches = useMemo(() => sortedAllMatches.filter(m => m.match_type === 'bracket'), [sortedAllMatches]);

  const bracketRounds = useMemo(() => {
    const grouped: Record<string, Match[]> = {};
    bracketMatches.forEach(m => {
      const rName = m.round_name || 'Round';
      if (!grouped[rName]) grouped[rName] = [];
      grouped[rName].push(m);
    });
    return grouped;
  }, [bracketMatches]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      
      <div className="rounded-xl border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 shadow-md">
        <h3 className="flex items-center gap-2 text-lg font-black text-blue-900 mb-2">
          <Search className="h-5 w-5 text-blue-600" /> Student Schedule & Team Lookup
        </h3>
        <p className="text-xs text-blue-700 mb-4">Type your name below to see your assigned team, game times, and court locations.</p>
        
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type your name (e.g., John)..."
            className="w-full rounded-lg border border-blue-300 bg-white px-4 py-3 pl-10 text-sm font-semibold text-slate-800 shadow-inner outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded"
            >
              Clear
            </button>
          )}
        </div>

        {searchedStudentResult === 'NOT_FOUND' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-100 border border-amber-300 p-3 text-xs font-bold text-amber-800">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" /> No student found matching "{searchQuery}". Check your spelling or look for your name in the Rosters section below.
          </div>
        )}

        {searchedStudentResult && searchedStudentResult !== 'NOT_FOUND' && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img src={getLogoUrl(searchedStudentResult.team.name)} onError={e => e.currentTarget.style.display='none'} className="w-10 h-10 rounded-full border border-slate-200 p-0.5 object-contain bg-white" alt="" />
                <div>
                  <h4 className="font-black text-slate-900 text-base">{searchedStudentResult.player.name}</h4>
                  <p className="text-xs font-bold text-blue-600">Base Unit Team: {searchedStudentResult.team.name}</p>
                </div>
              </div>
              <div className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                {searchedStudentResult.timeline.length} Events Scheduled
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Match & Event Timeline:</p>
              {searchedStudentResult.timeline.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No matches scheduled for you yet.</p>
              ) : (
                searchedStudentResult.timeline.map(({ match: m, playingAs }) => (
                  <div key={m.id} className={`flex flex-wrap items-center justify-between rounded-lg border p-2.5 text-xs ${m.match_type === 'minigame' ? 'bg-indigo-50 border-indigo-100' : m.match_type === 'bracket' ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <Calendar className={`h-3.5 w-3.5 ${m.match_type === 'minigame' ? 'text-indigo-500' : m.match_type === 'bracket' ? 'text-amber-500' : 'text-blue-500'}`} /> {m.date_str} @ {m.time}
                    </div>
                    <div className="font-extrabold text-slate-900 flex flex-col items-center">
                      {m.match_type === 'minigame' ? (
                         <span className="text-indigo-600 flex items-center gap-1.5"><Users className="w-3.5 h-3.5"/> Mini-Games / Relays</span>
                      ) : m.match_type === 'bracket' ? (
                         <div className="flex flex-col items-center">
                            <span className="text-amber-600 text-[10px] uppercase tracking-wider">{m.round_name}</span>
                            <span>{m.home_team} <span className="text-amber-600 font-normal">vs</span> {m.away_team}</span>
                         </div>
                      ) : (
                        <span>{m.home_team} <span className="text-blue-600 font-normal">vs</span> {m.away_team}</span>
                      )}
                      <span className="text-[11px] text-slate-500 font-normal mt-0.5">Playing as: <span className="font-black text-slate-700">{playingAs}</span></span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-200">
                      <MapPin className="h-3.5 w-3.5 text-red-500" /> {m.location || 'Main Gym'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {bracketMatches.length > 0 && (
        <details className="group rounded-xl border border-amber-200 bg-white shadow-sm" open>
          <summary className="flex cursor-pointer items-center justify-between bg-amber-50 p-4 font-bold text-amber-900 list-none rounded-xl group-open:rounded-b-none">
            <span className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-600"/> Championship Bracket</span>
            <span className="text-amber-500 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="border-t border-amber-100 p-6 overflow-x-auto">
             <div className="flex gap-8 min-w-max">
                {Object.entries(bracketRounds).map(([roundName, roundMatches]) => (
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
          </div>
        </details>
      )}

      <details className="group rounded-xl border border-slate-200 bg-white shadow-sm" open={bracketMatches.length === 0}>
        <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
          <span>🏆 Tournament Standings</span>
          <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="border-t border-slate-100 p-0 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="p-3 pl-4">Rk</th>
                <th className="p-3">Team</th>
                <th className="p-3">W-L-T</th>
                <th className="p-3 font-black">PTS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedTeams.map((t, i) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="p-3 pl-4 font-bold text-slate-500">{i + 1}</td>
                  <td className="p-3 flex items-center gap-3 font-bold text-slate-800">
                    <img src={getLogoUrl(t.name)} onError={e => e.currentTarget.style.display = 'none'} className="w-8 h-8 rounded-full border border-slate-200 p-0.5 object-contain bg-white" alt="" />
                    {t.name}
                  </td>
                  <td className="p-3 font-medium text-slate-600">{t.stats.w}-{t.stats.l}-{t.stats.t}</td>
                  <td className="p-3 font-black text-blue-600">{t.stats.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <details className="group rounded-xl border border-slate-200 bg-white shadow-sm" open>
        <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
          <span>🗓️ Schedule & Locations</span>
          <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="border-t border-slate-100 p-4 space-y-4">
          
          {Object.keys(activeSchedule).sort().map((date) => (
            <div key={date}>
              <div className="bg-slate-100 p-2 font-bold text-slate-700 rounded-md mb-2 text-sm">{date}</div>
              <div className="space-y-2">
                {activeSchedule[date].map(m => {
                  if (m.match_type === 'minigame') {
                    const teamSet = unit.teamSets?.find(ts => ts.id === m.team_set_id);
                    return (
                      <div key={m.id} className="flex flex-col bg-indigo-50/30 border border-indigo-200 p-3 rounded-lg gap-3 shadow-sm">
                        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                          <div className="flex items-center gap-2">
                            <span>🕒 {m.time}</span>
                            <span>•</span>
                            <span className="text-indigo-600 font-bold flex items-center gap-1"><MapPin className="w-3 h-3"/> {m.location || 'Main Gym'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                            <Users className="w-3 h-3" /> Mini-Games
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center py-2">
                          {teamSet ? teamSet.teams.map(t => (
                            <div key={t.id} className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm text-sm font-bold text-slate-700">
                              <img src={getLogoUrl(t.name)} onError={e => e.currentTarget.style.display='none'} className="w-5 h-5 object-contain" alt=""/>
                              {t.name}
                            </div>
                          )) : (
                            <span className="text-slate-400 italic text-sm">Teams not found.</span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={m.id} className={`flex flex-wrap items-center justify-between bg-white border ${m.match_type === 'bracket' ? 'border-amber-200' : 'border-slate-200'} p-3 rounded-lg gap-2 shadow-sm`}>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-500 w-full sm:w-auto">
                        {m.match_type === 'bracket' && <span className="text-amber-600 font-black uppercase tracking-wider">{m.round_name}</span>}
                        <div className="flex items-center gap-2">
                          <span>🕒 {m.time}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className={`${m.match_type === 'bracket' ? 'text-amber-600' : 'text-blue-600'} font-bold flex items-center gap-1`}><MapPin className="w-3 h-3"/> {m.location || 'Main Gym'}</span>
                        </div>
                      </div>
                      <div className="flex w-full items-center justify-between mt-1 sm:mt-0">
                        <div className={`flex flex-1 items-center gap-2 font-bold ${m.home_team === 'TBD' ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                          {m.home_team !== 'TBD' && <img src={getLogoUrl(m.home_team)} onError={e => e.currentTarget.style.display='none'} className="w-6 h-6 object-contain bg-white rounded-full" alt=""/>} 
                          {m.home_team}
                        </div>
                        <div className={`px-4 font-black whitespace-nowrap ${m.match_type === 'bracket' ? 'text-amber-600' : 'text-blue-600'}`}>
                          {m.completed ? `${m.home_score} - ${m.away_score}` : 'vs'}
                        </div>
                        <div className={`flex flex-1 items-center justify-end gap-2 font-bold text-right ${m.away_team === 'TBD' ? 'text-slate-400 italic' : 'text-slate-800'}`}>
                          {m.away_team} 
                          {m.away_team !== 'TBD' && <img src={getLogoUrl(m.away_team)} onError={e => e.currentTarget.style.display='none'} className="w-6 h-6 object-contain bg-white rounded-full" alt=""/>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {Object.keys(activeSchedule).length === 0 && Object.keys(archivedSchedule).length === 0 && (
            <div className="text-slate-400 text-center py-4">No events scheduled yet.</div>
          )}

          {Object.keys(archivedSchedule).length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs mb-4">
                <History className="h-4 w-4" />
                Archived Past Events
              </div>
              {/* Note: Archived sorted so newest is first in history list */}
              {Object.keys(archivedSchedule).sort((a, b) => b.localeCompare(a)).map((date) => (
                <div key={date} className="opacity-75 hover:opacity-100 transition-opacity">
                  <div className="bg-slate-50 p-2 font-bold text-slate-500 rounded-md mb-2 text-sm border border-slate-100">{date}</div>
                  <div className="space-y-2 mb-4">
                    {archivedSchedule[date].map(m => {
                      if (m.match_type === 'minigame') {
                        return (
                          <div key={m.id} className="flex flex-wrap items-center justify-between bg-slate-50 border border-slate-200 p-3 rounded-lg gap-2 shadow-sm">
                             <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                                <span>🕒 {m.time}</span>
                                <span>•</span>
                                <span className="text-slate-500 font-bold flex items-center gap-1"><MapPin className="w-3 h-3"/> {m.location || 'Main Gym'}</span>
                              </div>
                              <div className="font-bold text-slate-600 flex items-center gap-1.5"><Users className="w-4 h-4"/> Mini-Games / Relays</div>
                          </div>
                        );
                      }

                      return (
                        <div key={m.id} className="flex flex-wrap items-center justify-between bg-white border border-slate-200 p-3 rounded-lg gap-2 shadow-sm">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs font-semibold text-slate-500 w-full sm:w-auto">
                            {m.match_type === 'bracket' && <span className="text-slate-400 font-black uppercase tracking-wider">{m.round_name}</span>}
                            <div className="flex items-center gap-2">
                              <span>🕒 {m.time}</span>
                              <span className="hidden sm:inline">•</span>
                              <span className="text-slate-500 font-bold flex items-center gap-1"><MapPin className="w-3 h-3"/> {m.location || 'Main Gym'}</span>
                            </div>
                          </div>
                          <div className="flex w-full items-center justify-between mt-1 sm:mt-0">
                            <div className={`flex flex-1 items-center gap-2 font-bold ${m.home_team === 'TBD' ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                              {m.home_team !== 'TBD' && <img src={getLogoUrl(m.home_team)} onError={e => e.currentTarget.style.display='none'} className="w-6 h-6 grayscale object-contain" alt=""/>} 
                              {m.home_team}
                            </div>
                            <div className="px-4 font-black text-slate-500 whitespace-nowrap">
                              {m.completed ? `${m.home_score} - ${m.away_score}` : 'vs'}
                            </div>
                            <div className={`flex flex-1 items-center justify-end gap-2 font-bold text-right ${m.away_team === 'TBD' ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                              {m.away_team} 
                              {m.away_team !== 'TBD' && <img src={getLogoUrl(m.away_team)} onError={e => e.currentTarget.style.display='none'} className="w-6 h-6 grayscale object-contain" alt=""/>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>

      <details className="group rounded-xl border border-slate-200 bg-white shadow-sm" open>
        <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
          <span>📋 Rosters & Teams</span>
          <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="border-t border-slate-100 p-5">
          {unit.teamSets && unit.teamSets.length > 0 && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Roster List:</label>
              <select 
                value={activeRosterId} 
                onChange={e => setActiveRosterId(e.target.value)}
                className="w-full sm:w-64 rounded-md border border-slate-300 p-2 text-sm font-bold text-blue-700 outline-none focus:border-blue-500 bg-white shadow-sm"
              >
                <option value="base">🏆 Default Unit Teams</option>
                {unit.teamSets.map(ts => <option key={ts.id} value={ts.id}>🔄 {ts.name}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {activeRosterTeams.map(t => (
              <div key={`${activeRosterId}-${t.id}`} className="border border-slate-200 bg-white rounded-xl p-4 text-center shadow-sm">
                <img 
                  key={getLogoUrl(t.name)}
                  src={getLogoUrl(t.name)} 
                  onError={e => e.currentTarget.style.display='none'} 
                  className="w-16 h-16 mx-auto mb-2 drop-shadow-sm object-contain bg-white rounded-lg p-0.5" 
                  alt="" 
                />
                <h3 className="font-bold text-blue-700 text-lg mb-2">{t.name}</h3>
                <ul className="text-sm text-slate-600 text-left space-y-1">
                  {t.players.map(p => <li key={p.id}>• {p.name}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </details>
    </div>
  );
}
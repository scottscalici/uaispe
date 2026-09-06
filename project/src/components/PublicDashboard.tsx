import { useMemo, useState } from 'react';
import { Search, Calendar, MapPin, Trophy, Users, ShieldAlert } from 'lucide-react';
import type { Unit, ScheduleData } from '../types';

interface Props {
  unit: Unit;
  schedule: ScheduleData;
}

export default function PublicDashboard({ unit, schedule }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const getLogoUrl = (teamName: string) => {
    const safeUnit = unit?.unit_name?.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'unknown';
    const safeTeam = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${safeUnit}/${safeTeam}.png`;
  };

  const sortedTeams = useMemo(() => {
    return [...unit.baseTeams].map(t => {
      let w = 0, l = 0, t_ties = 0, pts = 0;
      schedule.matches.forEach(m => {
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
  }, [unit, schedule]);

  // Find student and their team if a search query is entered
  const searchedStudentResult = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    
    for (const team of unit.baseTeams) {
      const foundPlayer = team.players.find(p => p.name.toLowerCase().includes(query));
      if (foundPlayer) {
        // Find all matches for this team
        const teamMatches = schedule.matches.filter(m => m.home_team === team.name || m.away_team === team.name);
        return { player: foundPlayer, team, matches: teamMatches };
      }
    }
    return 'NOT_FOUND';
  }, [searchQuery, unit, schedule]);

  // Group schedule by date
  const scheduleByDate = useMemo(() => {
    const map: Record<string, typeof schedule.matches> = {};
    schedule.matches.forEach(m => {
      if (!map[m.date_str]) map[m.date_str] = [];
      map[m.date_str].push(m);
    });
    return map;
  }, [schedule]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      
      {/* Student Personal Schedule Lookup Card */}
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

        {/* Search Results Display */}
        {searchedStudentResult === 'NOT_FOUND' && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-100 border border-amber-300 p-3 text-xs font-bold text-amber-800">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" /> No student found matching "{searchQuery}". Check your spelling or look for your name in the Rosters section below.
          </div>
        )}

        {searchedStudentResult && searchedStudentResult !== 'NOT_FOUND' && (
          <div className="mt-4 rounded-xl border border-blue-200 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img src={getLogoUrl(searchedStudentResult.team.name)} onError={e => e.currentTarget.style.display='none'} className="w-10 h-10 rounded-full border border-slate-200 p-0.5" alt="" />
                <div>
                  <h4 className="font-black text-slate-900 text-base">{searchedStudentResult.player.name}</h4>
                  <p className="text-xs font-bold text-blue-600">Assigned Team: {searchedStudentResult.team.name}</p>
                </div>
              </div>
              <div className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100">
                {searchedStudentResult.matches.length} Games Scheduled
              </div>
            </div>

            <div className="mt-3 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Your Game Timeline:</p>
              {searchedStudentResult.matches.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No matches scheduled for your team yet.</p>
              ) : (
                searchedStudentResult.matches.map(m => (
                  <div key={m.id} className="flex flex-wrap items-center justify-between rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" /> {m.date_str} @ {m.time}
                    </div>
                    <div className="font-extrabold text-slate-900">
                      {m.home_team} <span className="text-blue-600 font-normal">vs</span> {m.away_team}
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

      {/* Standings */}
      <details className="group rounded-xl border border-slate-200 bg-white shadow-sm" open>
        <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
          <span>🏆 Standings</span>
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
                    <img src={getLogoUrl(t.name)} onError={e => e.currentTarget.style.display = 'none'} className="w-8 h-8 rounded-full border border-slate-200 p-0.5" alt="" />
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

      {/* Schedule */}
      <details className="group rounded-xl border border-slate-200 bg-white shadow-sm" open>
        <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
          <span>🗓️ Schedule & Locations</span>
          <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="border-t border-slate-100 p-4 space-y-4">
          {Object.entries(scheduleByDate).map(([date, matches]) => (
            <div key={date}>
              <div className="bg-slate-100 p-2 font-bold text-slate-700 rounded-md mb-2 text-sm">{date}</div>
              <div className="space-y-2">
                {matches.matches?.map ? null : matches.map(m => (
                  <div key={m.id} className="flex flex-wrap items-center justify-between bg-white border border-slate-200 p-3 rounded-lg gap-2 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                      <span>🕒 {m.time}</span>
                      <span>•</span>
                      <span className="text-blue-600 font-bold flex items-center gap-1"><MapPin className="w-3 h-3"/> {m.location || 'Main Gym'}</span>
                    </div>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex flex-1 items-center gap-2 font-bold text-slate-800">
                        <img src={getLogoUrl(m.home_team)} onError={e => e.currentTarget.style.display='none'} className="w-6 h-6" alt=""/> {m.home_team}
                      </div>
                      <div className="px-4 font-black text-blue-600 whitespace-nowrap">
                        {m.completed ? `${m.home_score} - ${m.away_score}` : 'vs'}
                      </div>
                      <div className="flex flex-1 items-center justify-end gap-2 font-bold text-slate-800 text-right">
                        {m.away_team} <img src={getLogoUrl(m.away_team)} onError={e => e.currentTarget.style.display='none'} className="w-6 h-6" alt=""/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(scheduleByDate).length === 0 && <div className="text-slate-400 text-center py-4">No matches scheduled yet.</div>}
        </div>
      </details>

      {/* Rosters */}
      <details className="group rounded-xl border border-slate-200 bg-white shadow-sm">
        <summary className="flex cursor-pointer items-center justify-between bg-slate-50 p-4 font-bold text-slate-800 list-none rounded-xl group-open:rounded-b-none">
          <span>📋 Rosters</span>
          <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="border-t border-slate-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {unit.baseTeams.map(t => (
              <div key={t.id} className="border border-slate-200 rounded-xl p-4 text-center shadow-sm">
                <img src={getLogoUrl(t.name)} onError={e => e.currentTarget.style.display='none'} className="w-16 h-16 mx-auto mb-2 drop-shadow-sm" alt="" />
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
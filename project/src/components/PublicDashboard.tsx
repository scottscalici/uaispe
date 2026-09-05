import { useMemo } from 'react';
import type { Unit, ScheduleData } from '../types';

interface Props {
  unit: Unit;
  schedule: ScheduleData;
}

export default function PublicDashboard({ unit, schedule }: Props) {
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
          <span>🗓️ Schedule</span>
          <span className="text-blue-500 group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <div className="border-t border-slate-100 p-4 space-y-4">
          {Object.entries(scheduleByDate).map(([date, matches]) => (
            <div key={date}>
              <div className="bg-slate-100 p-2 font-bold text-slate-700 rounded-md mb-2 text-sm">{date}</div>
              <div className="space-y-2">
                {matches.map(m => (
                  <div key={m.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-lg shadow-sm">
                    <div className="flex flex-1 items-center gap-2 font-bold text-slate-800">
                      <img src={getLogoUrl(m.home_team)} onError={e => e.currentTarget.style.display='none'} className="w-6 h-6" alt=""/> {m.home_team}
                    </div>
                    <div className="px-4 font-black text-blue-600 whitespace-nowrap">
                      {m.completed ? `${m.home_score} - ${m.away_score}` : 'vs'}
                    </div>
                    <div className="flex flex-1 items-center justify-end gap-2 font-bold text-slate-800">
                      {m.away_team} <img src={getLogoUrl(m.away_team)} onError={e => e.currentTarget.style.display='none'} className="w-6 h-6" alt=""/>
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
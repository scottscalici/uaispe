import { useMemo } from 'react';
import { CalendarDays, Clock, MapPin, BarChart3 } from 'lucide-react';
import type { ScheduleData, Match } from '../types';
import { computeStandings, rankStandings } from '../standings';

interface Props {
  schedule: ScheduleData;
  isAdmin: boolean;
  onUpdateScore: (matchId: number, side: 'home' | 'away', value: number | null) => void;
}

export default function ScheduleStandings({ schedule, isAdmin, onUpdateScore }: Props) {
  const standings = useMemo(() => computeStandings(schedule.matches), [schedule.matches]);
  const ranked = useMemo(() => rankStandings(standings), [standings]);

  return (
    <div className="space-y-8">
      <StandingsTable ranked={ranked} />

      <div>
        <h3 className="mb-3 text-lg font-semibold text-slate-800">Matches</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {schedule.matches.map((m) => (
            <MatchCard key={m.id} match={m} isAdmin={isAdmin} onUpdateScore={onUpdateScore} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StandingsTable({ ranked }: { ranked: ReturnType<typeof rankStandings> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-700 px-4 py-3 text-white">
        <BarChart3 className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Standings</h3>
        <span className="ml-auto text-xs text-slate-300">Live recalculation</span>
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
              <th className="px-3 py-2">PF</th>
              <th className="px-3 py-2">PA</th>
              <th className="px-3 py-2">PD</th>
              <th className="px-3 py-2">PTS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranked.map((r) => (
              <tr key={r.name} className="hover:bg-slate-50">
                <td className="px-3 py-2 font-bold text-slate-500">{r.rank}</td>
                <td className="px-3 py-2 text-left font-semibold text-slate-800">{r.name}</td>
                <td className="px-3 py-2 text-emerald-600">{r.w}</td>
                <td className="px-3 py-2 text-red-600">{r.l}</td>
                <td className="px-3 py-2 text-slate-500">{r.t}</td>
                <td className="px-3 py-2">{r.pf}</td>
                <td className="px-3 py-2">{r.pa}</td>
                <td className={`px-3 py-2 font-medium ${r.pd > 0 ? 'text-emerald-600' : r.pd < 0 ? 'text-red-600' : 'text-slate-500'}`}>
                  {r.pd > 0 ? `+${r.pd}` : r.pd}
                </td>
                <td className="px-3 py-2 font-bold text-slate-900">{r.pts}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MatchCard({ match, isAdmin, onUpdateScore }: { match: Match; isAdmin: boolean; onUpdateScore: Props['onUpdateScore'] }) {
  const homeVal = match.home_score ?? '';
  const awayVal = match.away_score ?? '';

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm ${match.completed ? 'border-emerald-300' : 'border-slate-200'}`}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-slate-100 pb-2 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" /> {match.date_str}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {match.time}
        </span>
        <span className="flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" /> {match.location}
        </span>
        {match.completed && (
          <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
            Final
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="text-right font-semibold text-slate-800">{match.home_team}</div>
        <div className="flex items-center gap-2">
          <ScoreInput
            value={homeVal}
            disabled={!isAdmin}
            onChange={(v) => onUpdateScore(match.id, 'home', v)}
          />
          <span className="text-xs font-bold text-slate-400">vs</span>
          <ScoreInput
            value={awayVal}
            disabled={!isAdmin}
            onChange={(v) => onUpdateScore(match.id, 'away', v)}
          />
        </div>
        <div className="text-left font-semibold text-slate-800">{match.away_team}</div>
      </div>

      {!isAdmin && !match.completed && (
        <p className="mt-2 text-center text-xs text-slate-400">Scores pending</p>
      )}
    </div>
  );
}

function ScoreInput({
  value,
  disabled,
  onChange,
}: {
  value: number | string;
  disabled: boolean;
  onChange: (v: number | null) => void;
}) {
  return (
    <input
      type="number"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === '' ? null : parseInt(e.target.value, 10))}
      className="w-14 rounded-md border border-slate-300 px-2 py-1 text-center text-lg font-bold text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
    />
  );
}

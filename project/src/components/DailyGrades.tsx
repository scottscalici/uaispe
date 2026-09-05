import { useMemo } from 'react';
import { ClipboardList, Download } from 'lucide-react';
import type { Unit, DailyLogMap, QuarterHistoryMap } from '../types';
import { emptyLog, computeDayScore, computeQuarterTotals } from '../grading';

interface Props {
  roster: Player[];
  unit: Unit;
  logs: DailyLogMap;
  quarterHistory: QuarterHistoryMap;
}

export default function DailyGrades({ roster, unit, logs, quarterHistory }: Props) {
  const rows = useMemo(() => {
    const list: {
      id: string;
      name: string;
      team: string;
      todayEarned: number;
      todayPossible: number;
      label: string;
      totalEarned: number;
      totalPossible: number;
      percentage: number;
    }[] = [];
    
    // Loop through the MASTER ROSTER instead of active teams
    roster.forEach((p) => {
      // Check if they are on an active team
      const team = unit.baseTeams.find(t => t.players.some(tp => tp.id === p.id));
      const teamName = team ? team.name : (p.availability === 'injured' ? 'Injured' : 'Unassigned');

      const log = logs[p.id] ?? emptyLog('present');
      const today = computeDayScore(log);
      const hist = quarterHistory[p.id] ?? { earned: 0, possible: 0 };
      const totals = computeQuarterTotals(hist.earned + today.earned, hist.possible + today.possible);
      
      list.push({
        id: p.id,
        name: p.name,
        team: teamName,
        todayEarned: today.earned,
        todayPossible: today.possible,
        label: today.label,
        totalEarned: totals.earned,
        totalPossible: totals.possible,
        percentage: totals.percentage,
      });
    });
    
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, unit, logs, quarterHistory]);

  const classAvg = useMemo(() => {
    const graded = rows.filter((r) => r.totalPossible > 0);
    if (graded.length === 0) return '—';
    const totalPct = graded.reduce((s, r) => s + r.percentage, 0) / graded.length;
    return `${totalPct.toFixed(0)}%`;
  }, [rows]);

  const exportCSV = () => {
    const header = 'Student Name,Team,Total Earned,Total Possible,Percentage\n';
    const body = rows
      .map((r) => `"${r.name}","${r.team}",${r.totalEarned},${r.totalPossible},${r.totalPossible > 0 ? r.percentage : 0}`)
      .join('\n');
    const csv = header + body;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'powerschool_grades_export.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Daily Grades & Quarterly Summary</h2>
          <p className="text-sm text-slate-500">
            Class average: <span className="font-semibold text-slate-700">{classAvg}</span> · Admin only
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" /> Export to CSV (PowerSchool)
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-700 px-4 py-3 text-white">
          <ClipboardList className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Participation Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-3 py-2 text-left">Student</th>
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-3 py-2">Today</th>
                <th className="px-3 py-2">Total Earned</th>
                <th className="px-3 py-2">Total Possible</th>
                <th className="px-3 py-2">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 text-left font-semibold text-slate-800">{r.name}</td>
                  <td className="px-3 py-2.5 text-left text-slate-500">{r.team}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      r.todayPossible === 0
                        ? 'bg-slate-100 text-slate-500'
                        : r.todayEarned >= 10
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.todayEarned >= 7
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                      {r.label}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-700">{r.totalEarned}</td>
                  <td className="px-3 py-2.5 text-slate-500">{r.totalPossible}</td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      r.totalPossible === 0
                        ? 'bg-slate-100 text-slate-500'
                        : r.percentage >= 90
                          ? 'bg-emerald-100 text-emerald-700'
                          : r.percentage >= 75
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                    }`}>
                      {r.totalPossible > 0 ? `${r.percentage}%` : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

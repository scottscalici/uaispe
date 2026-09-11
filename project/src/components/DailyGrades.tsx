import { useMemo, useState } from 'react';
import { AlertCircle, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import type { Player, DailyLogMap, Unit } from '../types';

interface Props {
  roster: Player[];
  gradebook: Record<string, DailyLogMap>;
}

export default function DailyGrades({ roster, gradebook }: Props) {
  const allDates = useMemo(() => Object.keys(gradebook).sort().reverse(), [gradebook]);
  const [reportDate, setReportDate] = useState<string>(allDates[0] || '');

  const report = useMemo(() => {
    if (!reportDate || !gradebook[reportDate]) return [];
    
    const logs = gradebook[reportDate];
    const exceptions: any[] = [];

    roster.forEach(p => {
      const log = logs[p.id];
      if (!log) return;

      let earned = 10;
      let possible = 10;
      let isOutlier = false;
      const notes: string[] = [];

      if (log.scoreType === 'absent') { possible = 0; earned = 0; isOutlier = true; notes.push('Absent (Exempt 0/0)'); }
      else if (log.scoreType === 'tardy') { earned = 9; isOutlier = true; notes.push('Tardy (-1 pt)'); }
      else if (log.scoreType === 'zero') { earned = 5; isOutlier = true; notes.push('Zero Day / Free Pass Used (5/10)'); }
      else if (log.scoreType === 'excused') { possible = 0; earned = 0; isOutlier = true; notes.push('Excused (Exempt)'); }

      if (log.bonusPoints && log.bonusPoints > 0) {
        earned += log.bonusPoints;
        isOutlier = true;
        notes.push(`+${log.bonusPoints} Bonus`);
      }

      if (isOutlier) {
        exceptions.push({ player: p.name, earned, possible, notes: notes.join(', ') });
      }
    });

    return exceptions;
  }, [roster, gradebook, reportDate]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-blue-600" />
            Exceptions Report (Gradebook)
          </h2>
          <p className="text-sm text-slate-500 mt-1">Mass fill "10s" in your grading software, then only edit these students.</p>
        </div>
        <select 
          value={reportDate} 
          onChange={e => setReportDate(e.target.value)}
          className="bg-slate-50 border border-slate-300 text-slate-800 font-bold rounded-lg px-4 py-2 outline-none focus:border-blue-500"
        >
          {allDates.length === 0 && <option value="">No grades logged yet</option>}
          {allDates.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {report.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No Exceptions!</h3>
            <p className="text-slate-500">Every student present earned a 10/10 today.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Day Score</th>
                <th className="px-6 py-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{row.player}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded font-black text-xs ${row.earned < 10 && row.possible > 0 ? 'bg-red-100 text-red-700' : row.earned > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {row.earned} / {row.possible}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500" /> {row.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
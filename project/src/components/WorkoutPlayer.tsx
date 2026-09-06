import { useState, useMemo, useEffect } from 'react';
import { Lock, ArrowRight, History, CalendarDays } from 'lucide-react';
import type { CalendarDay, UnitData } from '../types';

interface Props {
  calendar: CalendarDay[];
  units: UnitData[]; 
  classId: string;
  onNavigateToUnit: (unitId: string) => void;
}

type CycleFilter = 'A' | 'B' | 'All';

export default function WorkoutPlayer({ calendar = [], units = [], classId, onNavigateToUnit }: Props) {
  // Intelligently default to 'A' or 'B' based on the class name
  const [cycle, setCycle] = useState<CycleFilter>(
    classId.includes('A') ? 'A' : classId.includes('B') ? 'B' : 'All'
  );

  // If the user switches classes in the top nav, update the filter instantly
  useEffect(() => {
    setCycle(classId.includes('A') ? 'A' : classId.includes('B') ? 'B' : 'All');
  }, [classId]);

  const { activeData, archivedData } = useMemo(() => {
    const validDays = calendar.filter(d => 
      (cycle === 'All' || d.ciclo === cycle) && 
      (d.status === 'school' || d.status === 'half-day')
    );
    
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const todayDateObj = new Date(todayStr + 'T00:00:00');

    const processedDays = validDays.map(calEntry => {
      const isPast = calEntry.fecha < todayStr;
      
      const eventDate = new Date(calEntry.fecha + 'T00:00:00'); 
      const diffTime = eventDate.getTime() - todayDateObj.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const isLocked = diffDays > 7;

      const unitName = calEntry.unitName || "No Unit Scheduled";
      const workoutName = calEntry.activity || calEntry.note || "Regular Class Routine";

      const linkedUnit = units.find(u => u.unit.unit_name.toLowerCase() === unitName.toLowerCase());

      return {
        ...calEntry,
        isPast,
        isLocked,
        unitName,
        workoutName,
        linkedUnitId: linkedUnit?.id || null
      };
    }).sort((a, b) => a.fecha.localeCompare(b.fecha));

    const pastDays = processedDays.filter(d => d.fecha < todayStr);
    const futureDays = processedDays.filter(d => d.fecha >= todayStr);

    let mostRecentPast = null;
    let archived = [];

    if (pastDays.length > 0) {
      mostRecentPast = pastDays[pastDays.length - 1];
      archived = pastDays.slice(0, pastDays.length - 1);
    }

    const active = mostRecentPast ? [mostRecentPast, ...futureDays] : [...futureDays];

    return { activeData: active, archivedData: archived };
  }, [cycle, calendar, units]);

  if (calendar.length === 0) {
    return (
      <div className="p-10 text-center text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold mb-2">No Calendar Data</h2>
        <p>The Master Calendar has not been configured in the Admin portal yet.</p>
      </div>
    );
  }

  const renderRow = (row: typeof activeData[0], i: number) => (
    <tr key={i} className={`transition hover:bg-slate-50 ${row.isPast ? 'opacity-60 bg-slate-50/50' : ''}`}>
      <td className="p-4 font-bold text-blue-700 w-[20%] align-top">
        Day {row.dia} ({row.ciclo})
        <div className="text-xs font-normal text-slate-400 mt-0.5">{row.fecha}</div>
        {row.note && !row.activity && <div className="text-xs font-bold text-amber-600 mt-1">{row.note}</div>}
      </td>
      <td className="p-4 w-[40%] font-bold text-slate-800 align-top">
        {row.isLocked ? (
          <span className="text-slate-400 italic flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> {row.unitName}</span>
        ) : row.linkedUnitId ? (
          <button 
            onClick={() => onNavigateToUnit(row.linkedUnitId!)}
            className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 transition"
            title={`Go to ${row.unitName} Dashboard`}
          >
            {row.unitName} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-slate-700">{row.unitName}</span>
        )}
      </td>
      <td className="p-4 w-[40%] text-slate-700 align-top">
        {row.isLocked ? (
          <span className="text-slate-400 italic">{row.workoutName}</span>
        ) : (
          <span className="text-slate-800 font-medium">{row.workoutName}</span>
        )}
      </td>
    </tr>
  );

  return (
    <div className="mx-auto max-w-4xl bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h1 className="text-center text-3xl font-black text-blue-700 mb-6 flex items-center justify-center gap-3">
        <CalendarDays className="h-8 w-8 text-blue-600" /> Daily Class Log
      </h1>
      
      <div className="flex justify-center mb-6">
        <div className="flex bg-slate-100 p-1.5 rounded-lg border border-slate-200">
          {(['All', 'A', 'B'] as CycleFilter[]).map((c) => (
            <button 
              key={c}
              onClick={() => setCycle(c)} 
              className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${
                cycle === c 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {c === 'All' ? 'All Days' : `${c} Day`}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="p-4 border-b">Day / Date</th>
              <th className="p-4 border-b">Unit Topic</th>
              <th className="p-4 border-b">Workout / Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeData.map((row, i) => renderRow(row, i))}
            {activeData.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400 italic">
                  No upcoming classes scheduled.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {archivedData.length > 0 && (
        <details className="group mt-8 border-t border-slate-200 pt-6">
          <summary className="flex cursor-pointer items-center justify-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs hover:text-slate-800 transition-colors list-none bg-slate-50 py-3 rounded-lg border border-slate-200">
            <History className="h-4 w-4" />
            View Archived Past Classes
          </summary>
          <div className="mt-4 overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-100 bg-slate-50/50">
                {archivedData.map((row, i) => renderRow(row, i))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
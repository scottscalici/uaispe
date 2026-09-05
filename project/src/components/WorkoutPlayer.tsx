import { useState, useMemo } from 'react';
import { Lock } from 'lucide-react';
import type { CalendarDay } from '../types';

// Hardcoded calendar structure matching your previous setups
const myCalendar: CalendarDay[] = [
  { fecha: "2026-09-04", ciclo: null, dia: null, status: "no-school", note: "", manualOverride: false },
  { fecha: "2026-09-07", ciclo: null, dia: null, status: "no-school", note: "", manualOverride: false },
  { fecha: "2026-09-08", ciclo: null, dia: null, status: "no-class", note: "Full AMES Day", manualOverride: true },
  { fecha: "2026-09-09", ciclo: "A", dia: 3, status: "school", note: "", manualOverride: true },
  { fecha: "2026-09-10", ciclo: "B", dia: 3, status: "school", note: "", manualOverride: true },
  { fecha: "2026-09-11", ciclo: "A", dia: 4, status: "school", note: "", manualOverride: false },
  { fecha: "2026-09-14", ciclo: "B", dia: 4, status: "school", note: "", manualOverride: false },
  { fecha: "2026-09-15", ciclo: "A", dia: 5, status: "school", note: "", manualOverride: false },
  { fecha: "2026-09-16", ciclo: null, dia: null, status: "in-person-pd", note: "", manualOverride: false },
  { fecha: "2026-09-17", ciclo: "B", dia: 5, status: "school", note: "", manualOverride: false },
  { fecha: "2026-09-18", ciclo: "A", dia: 6, status: "school", note: "", manualOverride: false },
  { fecha: "2026-09-21", ciclo: "B", dia: 6, status: "school", note: "", manualOverride: false },
  { fecha: "2026-09-22", ciclo: "A", dia: 7, status: "school", note: "", manualOverride: false },
  { fecha: "2026-09-23", ciclo: "B", dia: 7, status: "school", note: "", manualOverride: false }
];

export default function WorkoutPlayer() {
  const [cycle, setCycle] = useState<'A' | 'B'>('A');

  const tableData = useMemo(() => {
    const cycleDays = myCalendar.filter(d => d.ciclo === cycle && d.dia !== null);
    
    // Simulate "today" to September 9th for testing the 7-day lock
    const simulatedTodayStr = "2026-09-09";
    const todayDateObj = new Date(simulatedTodayStr + 'T00:00:00');

    let upcoming = cycleDays.filter(d => d.fecha >= simulatedTodayStr);
    let past = cycleDays.filter(d => d.fecha < simulatedTodayStr);

    upcoming.sort((a, b) => a.fecha.localeCompare(b.fecha));
    past.sort((a, b) => a.fecha.localeCompare(b.fecha));

    return [...upcoming, ...past].map(calEntry => {
      const isPast = calEntry.fecha < simulatedTodayStr;
      
      const eventDate = new Date(calEntry.fecha + 'T00:00:00'); 
      const diffTime = eventDate.getTime() - todayDateObj.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isLocked = diffDays > 7;

      // Placeholder data mapping (Since we don't have your external JSON loaded here, we provide fallbacks)
      let unitName = "Current Class Unit";
      let workoutName = "Class Warmup & Gameplay";

      return {
        ...calEntry,
        isPast,
        isLocked,
        unitName,
        workoutName
      };
    });
  }, [cycle]);

  return (
    <div className="mx-auto max-w-4xl bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h1 className="text-center text-3xl font-black text-blue-700 mb-6">Daily Class Log</h1>
      
      <div className="flex justify-center gap-3 mb-6">
        <button 
          onClick={() => setCycle('A')} 
          className={`px-6 py-2 rounded-lg font-bold transition ${cycle === 'A' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          A Day Schedule
        </button>
        <button 
          onClick={() => setCycle('B')} 
          className={`px-6 py-2 rounded-lg font-bold transition ${cycle === 'B' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          B Day Schedule
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="p-4 border-b">Day</th>
              <th className="p-4 border-b">Unit</th>
              <th className="p-4 border-b">Workout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tableData.map((row, i) => (
              <tr key={i} className={`transition hover:bg-slate-50 ${row.isPast ? 'opacity-60' : ''}`}>
                <td className="p-4 font-bold text-blue-700 w-[15%]">
                  Day {row.dia}
                  <div className="text-xs font-normal text-slate-400">{row.fecha}</div>
                </td>
                <td className="p-4 w-[42.5%] font-bold text-slate-800">
                  {row.isLocked ? (
                    <span className="text-slate-400 italic flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> {row.unitName}</span>
                  ) : (
                    <span className="text-blue-600">{row.unitName}</span>
                  )}
                </td>
                <td className="p-4 w-[42.5%] text-slate-700">
                  {row.isLocked ? (
                    <span className="text-slate-400 italic">{row.workoutName}</span>
                  ) : (
                    <span className="text-slate-800 font-medium">{row.workoutName}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
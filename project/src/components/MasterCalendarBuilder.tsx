import { useState, useEffect } from 'react';
import { Save, CalendarDays, Loader2, History } from 'lucide-react';
import type { CalendarDay } from '../types';
import { fetchCentralCalendar } from '../firestore'; // Adjust path if needed

interface Props {
  calendar: CalendarDay[];
  classId: string;
  onSave: (calendar: CalendarDay[]) => void;
}

type CycleFilter = 'A' | 'B' | 'All';

export default function MasterCalendarBuilder({ calendar, classId, onSave }: Props) {
  const [localData, setLocalData] = useState<CalendarDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize filter based on classId, but allow manual changes
  const [cycleFilter, setCycleFilter] = useState<CycleFilter>(
    classId.includes('A') ? 'A' : classId.includes('B') ? 'B' : 'All'
  );

  useEffect(() => {
    // Reset the toggle if they navigate to a completely different class
    setCycleFilter(classId.includes('A') ? 'A' : classId.includes('B') ? 'B' : 'All');
  }, [classId]);

  useEffect(() => {
    async function loadMasterCalendar() {
      setIsLoading(true);
      const centralCalendar = await fetchCentralCalendar();
      
      if (centralCalendar.length > 0) {
        const mergedCalendar = centralCalendar.map(centralDay => {
          const existingLocalDay = calendar.find(d => d.fecha === centralDay.fecha);
          return {
            ...centralDay,
            unitName: existingLocalDay?.unitName || "",
            activity: existingLocalDay?.activity || ""
          };
        });
        setLocalData(mergedCalendar);
      } else {
        setLocalData(calendar);
      }
      setIsLoading(false);
    }
    loadMasterCalendar();
  }, [calendar]);

  const handleChange = (index: number, field: keyof CalendarDay, value: string) => {
    const updated = [...localData];
    updated[index] = { ...updated[index], [field]: value };
    setLocalData(updated);
  };

  // 1. Filter out non-class days and apply the A/B/All toggle
  const filteredRows = localData
    .map((day, index) => ({ day, index }))
    .filter(({ day }) => {
      const isClassDay = day.status === 'school' || day.status === 'half-day';
      const matchesCycle = cycleFilter === 'All' || day.ciclo === cycleFilter;
      return isClassDay && matchesCycle;
    });

  // 2. Sort into Active vs. Archived
  const d = new Date();
  const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const pastDays = filteredRows.filter(r => r.day.fecha < todayStr);
  const futureDays = filteredRows.filter(r => r.day.fecha >= todayStr);

  let previousClass = null;
  let archivedDays: typeof filteredRows = [];

  if (pastDays.length > 0) {
    // The last item in the chronological pastDays array is the most recent past class
    previousClass = pastDays[pastDays.length - 1];
    // Everything before the most recent class goes to the archive (maintaining chronological order)
    archivedDays = pastDays.slice(0, pastDays.length - 1);
  }

  // Active list keeps the single previous class + today and the future
  const activeDays = previousClass ? [previousClass, ...futureDays] : [...futureDays];

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center p-16 bg-white rounded-xl shadow-sm border border-slate-200">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
        <span className="text-slate-500 font-medium text-lg">Syncing Master School Calendar...</span>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-blue-600" />
          Master Semester Calendar
        </h2>
        
        <div className="flex items-center gap-4">
          {/* A / B / All Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            {(['All', 'A', 'B'] as CycleFilter[]).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setCycleFilter(cycle)}
                className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${
                  cycleFilter === cycle 
                    ? 'bg-white text-blue-700 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {cycle === 'All' ? 'All Days' : `${cycle} Days`}
              </button>
            ))}
          </div>

          <button 
            onClick={() => onSave(localData)} 
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-emerald-700 transition shadow-sm"
          >
            <Save className="h-5 w-5" /> Save Plan
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
            <tr>
              <th className="p-4 border-b w-40">Date</th>
              <th className="p-4 border-b w-40">Cycle / Day</th>
              <th className="p-4 border-b">Topic / Unit Name</th>
              <th className="p-4 border-b">Daily Plan / Activity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            
            {/* ACTIVE CLASSES (Previous Class + Future) */}
            {activeDays.map(({ day, index }) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-700 align-top">
                  <div>{day.fecha}</div>
                  {day.note && (
                    <div className="text-xs font-bold text-amber-600 mt-1.5 leading-tight">
                      {day.note}
                    </div>
                  )}
                </td>
                <td className="p-4 align-top">
                  <span className="font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                    Day {day.dia} ({day.ciclo})
                  </span>
                </td>
                <td className="p-4 align-top">
                  <input 
                    type="text" 
                    value={day.unitName || ''} 
                    onChange={(e) => handleChange(index, 'unitName', e.target.value)}
                    placeholder="e.g., Soccer, Open Gym" 
                    className="w-full border border-slate-300 rounded-md p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  />
                </td>
                <td className="p-4 align-top">
                  <input 
                    type="text" 
                    value={day.activity || ''} 
                    onChange={(e) => handleChange(index, 'activity', e.target.value)}
                    placeholder="e.g., Tournament Pool Play" 
                    className="w-full border border-slate-300 rounded-md p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                  />
                </td>
              </tr>
            ))}

            {/* ARCHIVED CLASSES SECTION */}
            {archivedDays.length > 0 && (
              <>
                <tr>
                  <td colSpan={4} className="bg-slate-100 p-4 border-y border-slate-200">
                    <div className="flex items-center justify-center gap-2 text-slate-500 font-bold uppercase tracking-wider text-xs">
                      <History className="h-4 w-4" />
                      Archived Past Classes
                    </div>
                  </td>
                </tr>
                {archivedDays.map(({ day, index }) => (
                  <tr key={index} className="bg-slate-50 opacity-75 hover:opacity-100 transition-opacity">
                    <td className="p-4 font-medium text-slate-500 align-top">
                      <div>{day.fecha}</div>
                    </td>
                    <td className="p-4 align-top">
                      <span className="font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded border border-slate-300">
                        Day {day.dia} ({day.ciclo})
                      </span>
                    </td>
                    <td className="p-4 align-top">
                      <input 
                        type="text" 
                        value={day.unitName || ''} 
                        onChange={(e) => handleChange(index, 'unitName', e.target.value)}
                        className="w-full border border-slate-200 bg-transparent rounded-md p-2.5 outline-none focus:border-slate-400 focus:bg-white transition-all text-slate-600"
                      />
                    </td>
                    <td className="p-4 align-top">
                      <input 
                        type="text" 
                        value={day.activity || ''} 
                        onChange={(e) => handleChange(index, 'activity', e.target.value)}
                        className="w-full border border-slate-200 bg-transparent rounded-md p-2.5 outline-none focus:border-slate-400 focus:bg-white transition-all text-slate-600"
                      />
                    </td>
                  </tr>
                ))}
              </>
            )}

          </tbody>
        </table>
      </div>
    </div>
  );
}
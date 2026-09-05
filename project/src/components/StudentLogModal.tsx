import { useState, useMemo } from 'react';
import { X, CalendarDays, AlertCircle, MessageSquareWarning, MinusCircle, PlusCircle, RotateCcw } from 'lucide-react';
import type { Player, CalendarDay, DailyLog } from '../types';

interface Props {
  player: Player;
  log?: DailyLog;
  onClose: () => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onUpdateLog: (playerId: string, log: DailyLog) => void;
}

// Temporary hardcoded calendar based on your Firestore A/B structure
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
  { fecha: "2026-09-22", flex: "A", dia: 7, status: "school", note: "", manualOverride: false }
];

export default function StudentLogModal({ player, log, onClose, onUpdatePlayer, onUpdateLog }: Props) {
  // --- Future Absences State ---
  const [selectedDate, setSelectedDate] = useState('');
  const [reason, setReason] = useState('');

  // --- Daily Behavior State ---
  const currentLog = log || { scoreType: 'present' as const };
  const [dailyNotes, setDailyNotes] = useState(currentLog.notes || '');
  const [deductions, setDeductions] = useState(currentLog.deductions || 0);

  const upcomingSchoolDays = useMemo(() => {
    return myCalendar.filter(d => d.status === 'school');
  }, []);

  // --- Behavior Actions ---
  const handleApplyPoints = (pointValue: number, reasonText: string) => {
    // pointValue is positive for deductions, negative for bonus points (to reduce deductions)
    const newDeductions = deductions + pointValue;
    const prefix = pointValue > 0 ? '-' : '+';
    const noteAppend = `${prefix}${Math.abs(pointValue)} (${reasonText})`;
    const newNote = dailyNotes ? `${dailyNotes} | ${noteAppend}` : noteAppend;
    
    setDeductions(newDeductions);
    setDailyNotes(newNote);
    onUpdateLog(player.id, { ...currentLog, deductions: newDeductions, notes: newNote });
  };

  const handleClearBehavior = () => {
    setDeductions(0);
    setDailyNotes('');
    onUpdateLog(player.id, { ...currentLog, deductions: 0, notes: '' });
  };

  const handleNotesChange = (text: string) => {
    setDailyNotes(text);
    onUpdateLog(player.id, { ...currentLog, notes: text });
  };

  // --- Future Absence Actions ---
  const handleSaveAbsence = () => {
    if (selectedDate && reason) {
      const newAbsence = { id: Date.now().toString(), date: selectedDate, reason };
      const existing = player.scheduledAbsences || [];
      onUpdatePlayer(player.id, { scheduledAbsences: [...existing, newAbsence] });
      setSelectedDate('');
      setReason('');
    }
  };

  const handleDeleteAbsence = (absenceId: string) => {
    const existing = player.scheduledAbsences || [];
    onUpdatePlayer(player.id, { scheduledAbsences: existing.filter(a => a.id !== absenceId) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl my-8">
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{player.name}</h3>
            <span className="text-xs font-semibold text-slate-500">Student Log & Notes</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          
          {/* --- SECTION 1: TODAY'S BEHAVIOR & GRADES --- */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="flex items-center gap-2 font-bold text-slate-800">
                <MessageSquareWarning className="h-4 w-4" /> Today's Behavior
              </h4>
              <div className="flex items-center gap-2">
                {deductions !== 0 && (
                  <span className={`text-xs font-bold px-2 py-1 rounded-full border ${deductions > 0 ? 'bg-red-100 text-red-700 border-red-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                    {deductions > 0 ? `-${deductions}` : `+${Math.abs(deductions)}`} Pts Today
                  </span>
                )}
                {(deductions !== 0 || dailyNotes) && (
                  <button onClick={handleClearBehavior} className="text-slate-400 hover:text-slate-700" title="Clear Points & Notes">
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => handleApplyPoints(1, 'Disrespect: Self')}
                  className="flex items-center justify-center gap-1.5 rounded border border-red-200 bg-white py-1.5 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-50"
                >
                  <MinusCircle className="h-3.5 w-3.5" /> 1 pt (Self)
                </button>
                <button 
                  onClick={() => handleApplyPoints(1, 'Disrespect: Others')}
                  className="flex items-center justify-center gap-1.5 rounded border border-red-200 bg-white py-1.5 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-50"
                >
                  <MinusCircle className="h-3.5 w-3.5" /> 1 pt (Others)
                </button>
                <button 
                  onClick={() => handleApplyPoints(1, 'Disrespect: Env')}
                  className="flex items-center justify-center gap-1.5 rounded border border-red-200 bg-white py-1.5 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-50"
                >
                  <MinusCircle className="h-3.5 w-3.5" /> 1 pt (Env.)
                </button>
                <button 
                  onClick={() => handleApplyPoints(1, 'Off Task')}
                  className="flex items-center justify-center gap-1.5 rounded border border-red-200 bg-white py-1.5 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-50"
                >
                  <MinusCircle className="h-3.5 w-3.5" /> 1 pt (Off Task)
                </button>
                
                {/* Positive Points Span Two Columns */}
                <button 
                  onClick={() => handleApplyPoints(-1, 'Positive Contribution')}
                  className="col-span-2 flex items-center justify-center gap-1.5 rounded border border-emerald-200 bg-white py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add Bonus Point
                </button>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Daily Notes</label>
                <input
                  type="text"
                  value={dailyNotes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Notes for today's class..."
                  className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
          </div>

          {/* --- SECTION 2: FUTURE ABSENCES --- */}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h4 className="mb-3 flex items-center gap-2 font-bold text-blue-900">
              <CalendarDays className="h-4 w-4" /> Schedule Future Absence
            </h4>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Select Date</label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="" disabled>Choose a school day...</option>
                  {upcomingSchoolDays.map(day => (
                    <option key={day.fecha} value={day.fecha}>
                      {day.fecha} ({day.ciclo} Day - {day.dia})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-600">Reason / Note</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Doctor, Meeting with Admin"
                  className="w-full rounded-md border border-slate-300 p-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSaveAbsence}
                disabled={!selectedDate || !reason}
                className="w-full rounded-md bg-blue-600 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Absence
              </button>
            </div>
          </div>

          {player.scheduledAbsences && player.scheduledAbsences.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-amber-900">
                <AlertCircle className="h-4 w-4" /> Scheduled Out
              </h4>
              <ul className="space-y-2 text-sm">
                {player.scheduledAbsences.map((abs) => (
                  <li key={abs.id} className="flex items-center justify-between rounded bg-white px-3 py-2 border border-amber-100 shadow-sm text-amber-900">
                    <div>
                      <span className="font-bold block">{abs.date}</span>
                      <span className="text-xs">{abs.reason}</span>
                    </div>
                    <button onClick={() => handleDeleteAbsence(abs.id)} className="text-amber-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
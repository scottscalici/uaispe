import { useState } from 'react';
import { Check, X, Clock, Ghost, UserX, BadgeCheck, HeartPulse, MinusCircle, RotateCcw, List, LayoutGrid, Eraser } from 'lucide-react';
import type { Player, Unit, DailyLogMap, QuarterHistoryMap, FloorGrid, ScoreType } from '../types';
import { emptyLog } from '../grading';

interface Props {
  roster: Player[];
  unit: Unit;
  logs: DailyLogMap;
  quarterHistory: QuarterHistoryMap;
  floorGrid: FloorGrid;
  classMeetsToday: boolean;
  onUpdateLog: (playerId: string, log: any) => void;
  onQuickSet: (playerId: string, type: ScoreType) => void;
  onMarkAll: (type: ScoreType) => void;
  onClearAll: () => void;
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
  onUpdateFloorGrid: (grid: FloorGrid) => void;
}

const bgColorFor = (type: ScoreType | undefined) =>
  type === 'absent' ? 'bg-red-50 border-red-200'
  : type === 'tardy' ? 'bg-amber-50 border-amber-200'
  : type === 'zero' ? 'bg-slate-100 border-slate-300'
  : type === 'excused' ? 'bg-indigo-50 border-indigo-200'
  : type === 'present' ? 'bg-emerald-50 border-emerald-200'
  : 'bg-white border-slate-200 hover:border-blue-300';

export default function AttendanceTracker({ roster, logs, floorGrid, classMeetsToday, onQuickSet, onMarkAll, onClearAll, onUpdatePlayer, onUpdateLog }: Props) {
  const [view, setView] = useState<'list' | 'grid'>('list');

  if (!classMeetsToday) {
    return (
      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-8 text-center mt-4">
        <h2 className="text-2xl font-black text-amber-800 mb-2">⚠️ Not a Scheduled Meeting Day</h2>
        <p className="text-amber-700">According to the Master Calendar, this class does not meet today (A/B Day mismatch or No School). Attendance tracking is disabled to prevent accidental data entry.</p>
      </div>
    );
  }

  const ROWS = 6;
  const COLS = 7;

  const assignedIds = Object.values(floorGrid).map(s => s.playerId).filter(Boolean);
  const unassignedPlayers = roster.filter(p => !assignedIds.includes(p.id));

  const handleDeduct = (playerId: string) => {
    const current = logs[playerId] || emptyLog('present');
    onUpdateLog(playerId, { ...current, bonusPoints: (current.bonusPoints || 0) - 1 });
  };

  const handleResetDeduction = (playerId: string) => {
    const current = logs[playerId];
    if (!current) return;
    onUpdateLog(playerId, { ...current, bonusPoints: 0 });
  };

  const handleToggleInjured = (player: Player) => {
    onUpdatePlayer(player.id, { availability: player.availability === 'injured' ? 'active' : 'injured' });
  };

  const renderStudentCard = (player: Player) => {
    const log = logs[player.id];
    const type = log?.scoreType;
    const bgColor = bgColorFor(type);

    return (
      <div className={`flex flex-col items-center justify-between h-full w-full rounded-xl border p-2 shadow-sm transition-all ${bgColor}`}>
        <div className="font-bold text-[11px] sm:text-xs text-slate-800 text-center w-full truncate mb-1" title={player.name}>
          {player.name}
        </div>
        <div className="flex items-center justify-center gap-0.5 sm:gap-1 w-full">
          <button onClick={() => onQuickSet(player.id, 'present')} className={`p-1 sm:p-1.5 rounded transition-colors ${type === 'present' ? 'bg-emerald-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'}`} title="Present (10/10)">
            <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          <button onClick={() => onQuickSet(player.id, 'tardy')} className={`p-1 sm:p-1.5 rounded transition-colors ${type === 'tardy' ? 'bg-amber-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600'}`} title="Tardy (9/10)">
            <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          <button onClick={() => onQuickSet(player.id, 'zero')} className={`p-1 sm:p-1.5 rounded transition-colors ${type === 'zero' ? 'bg-slate-700 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`} title="Zero Day / Free Pass (5/10)">
            <Ghost className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
          <button onClick={() => onQuickSet(player.id, 'absent')} className={`p-1 sm:p-1.5 rounded transition-colors ${type === 'absent' ? 'bg-red-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600'}`} title="Absent (0/0 - Exempt)">
            <UserX className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>
    );
  };

  const renderListRow = (player: Player) => {
    const log = logs[player.id];
    const type = log?.scoreType;
    const bonus = log?.bonusPoints || 0;
    const isInjured = player.availability === 'injured';
    const canDeduct = !type || type === 'present' || type === 'tardy';
    const bgColor = bgColorFor(type);

    return (
      <div key={player.id} className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border p-2.5 shadow-sm transition-all ${bgColor}`}>
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-bold text-sm text-slate-800" title={player.name}>{player.name}</span>
          {isInjured && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Injured</span>
          )}
          {bonus < 0 && (
            <button onClick={() => handleResetDeduction(player.id)} title="Tap to clear deduction" className="flex shrink-0 items-center gap-0.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700 hover:bg-red-200">
              {bonus} pts <RotateCcw className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => onQuickSet(player.id, 'present')} className={`p-1.5 rounded transition-colors ${type === 'present' ? 'bg-emerald-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-emerald-100 hover:text-emerald-600'}`} title="Present (10/10)">
            <Check className="h-4 w-4" />
          </button>
          <button onClick={() => onQuickSet(player.id, 'tardy')} className={`p-1.5 rounded transition-colors ${type === 'tardy' ? 'bg-amber-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600'}`} title="Tardy (9/10)">
            <Clock className="h-4 w-4" />
          </button>
          <button onClick={() => onQuickSet(player.id, 'zero')} className={`p-1.5 rounded transition-colors ${type === 'zero' ? 'bg-slate-700 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`} title="Zero Day / Free Pass (5/10)">
            <Ghost className="h-4 w-4" />
          </button>
          <button onClick={() => onQuickSet(player.id, 'excused')} className={`p-1.5 rounded transition-colors ${type === 'excused' ? 'bg-indigo-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-indigo-100 hover:text-indigo-600'}`} title="Excused (0/0 - Exempt)">
            <BadgeCheck className="h-4 w-4" />
          </button>
          <button onClick={() => onQuickSet(player.id, 'absent')} className={`p-1.5 rounded transition-colors ${type === 'absent' ? 'bg-red-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600'}`} title="Absent (0/0 - Exempt)">
            <UserX className="h-4 w-4" />
          </button>
          <span className="mx-0.5 h-5 w-px bg-slate-200" />
          <button onClick={() => handleToggleInjured(player)} className={`p-1.5 rounded transition-colors ${isInjured ? 'bg-amber-500 text-white shadow-inner' : 'bg-slate-100 text-slate-400 hover:bg-amber-100 hover:text-amber-600'}`} title="Toggle Injured / Out">
            <HeartPulse className="h-4 w-4" />
          </button>
          {canDeduct && (
            <button onClick={() => handleDeduct(player.id)} className="rounded p-1.5 bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors" title="Deduct 1 point (still participating)">
              <MinusCircle className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">{view === 'list' ? 'Attendance List' : 'Floor Layout Attendance'}</h2>
          <p className="text-xs text-slate-500">{view === 'list' ? 'Tap to mark students as they walk in' : 'Apply standard marks to all unmarked students'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-1">
            <button
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition-all ${view === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <List className="h-4 w-4" /> List
            </button>
            <button
              onClick={() => setView('grid')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-bold transition-all ${view === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid className="h-4 w-4" /> Floor Grid
            </button>
          </div>
          <button onClick={() => onMarkAll('present')} className="flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700 hover:bg-emerald-200">
            <Check className="h-4 w-4" /> All Present
          </button>
          <button onClick={() => { if (confirm('Clear all attendance marks for this day?')) onClearAll(); }} className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200">
            <Eraser className="h-4 w-4" /> Clear All
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[...roster].sort((a, b) => a.name.localeCompare(b.name)).map(renderListRow)}
          {roster.length === 0 && (
            <div className="col-span-full rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">No students on this roster yet.</div>
          )}
        </div>
      ) : (
        <>
          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 shadow-inner overflow-x-auto">
            <div className="min-w-[700px] grid gap-2" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {Array.from({ length: ROWS }).map((_, r) => (
                Array.from({ length: COLS }).map((_, c) => {
                  const key = `${r}-${c}`;
                  const spot = floorGrid[key] || { row: r, col: c };
                  const player = roster.find(p => p.id === spot.playerId);

                  if (spot.blocked) {
                    return (
                      <div key={key} className="flex items-center justify-center h-20 sm:h-24 rounded-xl border-2 border-dashed border-red-200 bg-red-50/50 opacity-60">
                        <X className="w-6 h-6 text-red-300" />
                      </div>
                    );
                  }

                  if (!player) {
                    return (
                      <div key={key} className="flex items-center justify-center h-20 sm:h-24 rounded-xl border-2 border-dashed border-slate-300 bg-white/50">
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Empty</span>
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="h-20 sm:h-24">
                      {renderStudentCard(player)}
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {unassignedPlayers.length > 0 && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                <UserX className="w-4 h-4 text-amber-500" /> Students Missing from Floor Grid
              </h3>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7">
                {unassignedPlayers.map(p => (
                  <div key={p.id} className="h-24">
                    {renderStudentCard(p)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

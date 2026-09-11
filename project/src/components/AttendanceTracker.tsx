import { useState } from 'react';
import { Check, X, Clock, Ghost, UserX } from 'lucide-react';
import type { Player, Unit, DailyLogMap, QuarterHistoryMap, FloorGrid, ScoreType } from '../types';

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
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => void;
  onUpdateFloorGrid: (grid: FloorGrid) => void;
}

export default function AttendanceTracker({ roster, logs, floorGrid, classMeetsToday, onQuickSet, onMarkAll }: Props) {
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

  const renderStudentCard = (player: Player) => {
    const log = logs[player.id];
    const type = log?.scoreType;
    
    const bgColor = type === 'absent' ? 'bg-red-50 border-red-200'
                  : type === 'tardy' ? 'bg-amber-50 border-amber-200'
                  : type === 'zero' ? 'bg-slate-100 border-slate-300'
                  : type === 'present' ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-white border-slate-200 hover:border-blue-300';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Floor Layout Attendance</h2>
          <p className="text-xs text-slate-500">Apply standard marks to all unmarked students</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onMarkAll('present')} className="flex items-center gap-1.5 rounded-md bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-700 hover:bg-emerald-200">
            <Check className="h-4 w-4" /> All Present
          </button>
        </div>
      </div>

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
    </div>
  );
}
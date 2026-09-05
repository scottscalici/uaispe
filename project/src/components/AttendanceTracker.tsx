import { useMemo, useState } from 'react';
import { UserCheck, Clock, UserMinus, CheckSquare, XSquare, AlertCircle, LayoutGrid, List, GripVertical, FileText } from 'lucide-react';
import type { Unit, DailyLogMap, ScoreType, QuarterHistoryMap, Player, DailyLog, FloorGrid } from '../types';
import StudentLogModal from './StudentLogModal';

interface Props {
  roster: Player[];
  unit: Unit;
  logs: DailyLogMap;
  quarterHistory: QuarterHistoryMap;
  floorGrid: FloorGrid;
  onUpdateLog: (playerId: string, log: DailyLog) => void;
  onQuickSet: (playerId: string, type: ScoreType) => void;
  onMarkAll: (type: ScoreType) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onUpdateFloorGrid: (grid: FloorGrid) => void;
}

const GRID_COLS = 7;
const GRID_ROWS = 6;

export default function AttendanceTracker({ roster, unit, logs, quarterHistory, floorGrid, onUpdateLog, onQuickSet, onMarkAll, onUpdatePlayer, onUpdateFloorGrid }: Props) {
  const [view, setView] = useState<'list' | 'map'>('list');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const selectedPlayer = useMemo(() => roster.find(p => p.id === selectedPlayerId), [roster, selectedPlayerId]);
  
  // For testing purposes, lets manually set "today" so we can trigger the alerts
  const [simulatedToday, setSimulatedToday] = useState("2026-09-04");

  const allPlayers = useMemo(() => {
    return roster.map((p) => {
      const team = unit.baseTeams.find(t => t.players.some(tp => tp.id === p.id));
      return { 
        id: p.id, 
        name: p.name, 
        team: team ? team.name : (p.availability === 'injured' ? 'Injured' : 'Unassigned'), 
        gender: p.gender,
        absences: p.scheduledAbsences || []
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [roster, unit]);

  const stats = useMemo(() => {
    let p = 0, l = 0, a = 0;
    allPlayers.forEach(r => {
      const type = logs[r.id]?.scoreType;
      if (type === 'present') p++;
      else if (type === 'tardy') l++;
      else if (type === 'absent') a++;
    });
    return { present: p, tardy: l, absent: a, total: allPlayers.length };
  }, [allPlayers, logs]);

  const unassignedGridPlayers = useMemo(() => {
    return allPlayers.filter(p => !Object.values(floorGrid || {}).includes(p.id));
  }, [allPlayers, floorGrid]);

  // --- Drag & Drop Logic ---
  const handleDropOnGrid = (e: React.DragEvent, spotId: string) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('text/plain');
    if (!playerId) return;

    const newGrid = { ...(floorGrid || {}) };
    const existingPlayerAtSpot = newGrid[spotId];
    const previousSpot = Object.keys(newGrid).find(k => newGrid[k] === playerId);

    if (previousSpot) {
      if (existingPlayerAtSpot) newGrid[previousSpot] = existingPlayerAtSpot; 
      else delete newGrid[previousSpot]; 
    }
    
    newGrid[spotId] = playerId;
    onUpdateFloorGrid(newGrid);
  };

  const handleDropRemove = (e: React.DragEvent) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('text/plain');
    if (!playerId) return;

    const newGrid = { ...(floorGrid || {}) };
    const previousSpot = Object.keys(newGrid).find(k => newGrid[k] === playerId);
    if (previousSpot) {
      delete newGrid[previousSpot];
      onUpdateFloorGrid(newGrid);
    }
  };

  const cycleAttendance = (playerId: string) => {
    const current = logs[playerId]?.scoreType || 'present';
    if (current === 'present') onQuickSet(playerId, 'tardy');
    else if (current === 'tardy') onQuickSet(playerId, 'absent');
    else onQuickSet(playerId, 'present');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Daily Attendance & Logs</h2>
          <div className="mt-1 flex gap-4 text-sm font-medium text-slate-500">
            <span className="text-emerald-600">{stats.present} Present</span>
            <span className="text-amber-600">{stats.tardy} Tardy</span>
            <span className="text-red-600">{stats.absent} Absent</span>
            <span className="text-slate-400">({stats.total - stats.present - stats.tardy - stats.absent} unmarked)</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200 p-1 rounded-lg">
            <button onClick={() => setView('list')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition ${view === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <List className="w-4 h-4" /> List
            </button>
            <button onClick={() => setView('map')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-bold transition ${view === 'map' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutGrid className="w-4 h-4" /> Floor Spots
            </button>
          </div>

          <div className="flex items-center gap-2 bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-300">
            <span className="text-xs font-bold text-slate-600">Simulate Date:</span>
            <input type="date" value={simulatedToday} onChange={e => setSimulatedToday(e.target.value)} className="bg-transparent text-sm font-semibold outline-none text-slate-800" />
          </div>

          <button onClick={() => onMarkAll('present')} className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 shadow">
            <CheckSquare className="h-4 w-4" /> Mark All Present
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-center text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left w-1/4">Student (Click to Log)</th>
                <th className="px-4 py-3 text-left w-1/4">Team</th>
                <th className="px-4 py-3 text-center w-1/6">Behavior Points</th>
                <th className="px-4 py-3 w-1/3">Attendance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allPlayers.map((r) => {
                const log = logs[r.id];
                const isAbsentToday = r.absences.some(abs => abs.date === simulatedToday);
                const todaysNote = r.absences.find(abs => abs.date === simulatedToday)?.reason;

                return (
                  <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${isAbsentToday && log?.scoreType !== 'absent' ? 'bg-red-50 hover:bg-red-50' : ''}`}>
                    <td 
                      className="px-4 py-3 text-left cursor-pointer group"
                      onClick={() => setSelectedPlayerId(r.id)}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-800 group-hover:text-blue-600 transition flex items-center gap-2">
                          {r.name} 
                          {log?.notes && <FileText className="w-3 h-3 text-blue-400" title={log.notes} />}
                        </span>
                        {isAbsentToday && (
                          <span className="text-xs font-bold text-red-600 mt-0.5 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Scheduled Out: {todaysNote}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left font-medium text-slate-500">{r.team}</td>
                    <td className="px-4 py-3 text-center">
                      {log?.deductions ? (
                        <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold ${log.deductions > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {log.deductions > 0 ? `-${log.deductions}` : `+${Math.abs(log.deductions)}`} pts
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => onQuickSet(r.id, 'present')}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                            log?.scoreType === 'present' ? 'bg-emerald-500 text-white shadow-sm scale-105 ring-2 ring-emerald-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <UserCheck className="h-3.5 w-3.5" /> Present
                        </button>
                        <button
                          onClick={() => onQuickSet(r.id, 'tardy')}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                            log?.scoreType === 'tardy' ? 'bg-amber-500 text-white shadow-sm scale-105 ring-2 ring-amber-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" /> Tardy
                        </button>
                        <button
                          onClick={() => onQuickSet(r.id, 'absent')}
                          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${
                            log?.scoreType === 'absent' ? 'bg-red-500 text-white shadow-sm scale-105 ring-2 ring-red-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <UserMinus className="h-3.5 w-3.5" /> Absent
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Gym Floor Map */}
          <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm p-6 overflow-x-auto">
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-blue-500" /> Gym Floor Layout
              <span className="text-sm font-normal text-slate-500 ml-2">Drag students into spots. Tap tile to cycle attendance.</span>
            </h3>
            
            <div 
              className="grid gap-3 min-w-[600px] bg-slate-50 p-6 rounded-xl border-2 border-dashed border-slate-200"
              style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, idx) => {
                const spotId = `spot_${idx}`;
                const playerId = (floorGrid || {})[spotId];
                const player = allPlayers.find(p => p.id === playerId);
                const log = player ? logs[player.id] : null;
                const isAbsentToday = player?.absences.some(abs => abs.date === simulatedToday);

                return (
                  <div
                    key={spotId}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDropOnGrid(e, spotId)}
                    className="relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white transition-all hover:border-blue-400 hover:shadow-md"
                  >
                    {player ? (
                      <div 
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('text/plain', player.id)}
                        onClick={() => cycleAttendance(player.id)}
                        className={`absolute inset-0 m-1 flex cursor-pointer flex-col items-center justify-center rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-95 ${
                          log?.scoreType === 'present' ? 'bg-emerald-500 text-white' :
                          log?.scoreType === 'tardy' ? 'bg-amber-400 text-white' :
                          log?.scoreType === 'absent' ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="text-center text-xs font-black leading-tight px-1 drop-shadow-sm">
                          {player.name}
                        </span>
                        {isAbsentToday && <AlertCircle className="w-4 h-4 absolute top-1 right-1 opacity-80" />}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-300">{idx + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Unassigned Sidebar */}
          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropRemove}
            className="w-full lg:w-72 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col max-h-[800px]"
          >
            <h3 className="font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100 flex justify-between items-center">
              Unassigned <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-xs">{unassignedGridPlayers.length}</span>
            </h3>
            <div className="overflow-y-auto space-y-2 flex-1 pr-2 pb-4">
              {unassignedGridPlayers.map(p => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:bg-blue-50 hover:border-blue-200 transition"
                >
                  <span className="text-sm font-semibold text-slate-700 truncate">{p.name}</span>
                  <GripVertical className="w-4 h-4 text-slate-400" />
                </div>
              ))}
              {unassignedGridPlayers.length === 0 && (
                <div className="text-center text-sm font-medium text-slate-400 mt-10">
                  All students assigned to floor spots!
                </div>
              )}
            </div>
            <div className="mt-auto pt-4 text-xs font-semibold text-slate-400 text-center border-t border-slate-100">
              Drag from map to here to remove
            </div>
          </div>
        </div>
      )}

      {selectedPlayer && (
        <StudentLogModal
          player={selectedPlayer}
          log={logs[selectedPlayer.id]}
          onUpdateLog={onUpdateLog}
          onClose={() => setSelectedPlayerId(null)}
          onUpdatePlayer={onUpdatePlayer}
        />
      )}
    </div>
  );
}
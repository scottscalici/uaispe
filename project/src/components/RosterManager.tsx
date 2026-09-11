import { useState } from 'react';
import { UserPlus, Upload, Trash2, Edit2, Check, X, Users, Grid, Lock } from 'lucide-react';
import type { Player, Unit, FloorGrid } from '../types';
import LockerManager from './LockerManager';

interface Props {
  roster: Player[];
  unit: Unit;
  floorGrid: FloorGrid;
  classId: string;
  onAddPlayer: (p: Omit<Player, 'id'>) => void;
  onBulkAddPlayers: (players: Omit<Player, 'id'>[]) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onDeletePlayer: (id: string) => void;
  onUpdateFloorGrid: (grid: FloorGrid) => void;
}

export default function RosterManager({ roster, floorGrid, onAddPlayer, onUpdatePlayer, onDeletePlayer, onUpdateFloorGrid }: Props) {
  const [view, setView] = useState<'roster' | 'grid' | 'locks'>('roster');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerGender, setNewPlayerGender] = useState('M');
  const [newPlayerSkill, setNewPlayerSkill] = useState(5);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const ROWS = 6;
  const COLS = 7;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;
    onAddPlayer({
      name: newPlayerName.trim(),
      gender: newPlayerGender,
      skill: newPlayerSkill,
      compete: 5
    });
    setNewPlayerName('');
  };

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdatePlayer(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleGridClick = (r: number, c: number) => {
    const key = `${r}-${c}`;
    const spot = floorGrid[key] || { row: r, col: c };
    if (spot.playerId) return; 
    
    const newGrid = { ...floorGrid, [key]: { ...spot, blocked: !spot.blocked } };
    onUpdateFloorGrid(newGrid);
  };

  const handleAssignSpot = (r: number, c: number, pId: string) => {
    const key = `${r}-${c}`;
    const newGrid = { ...floorGrid };
    
    if (pId) {
      Object.keys(newGrid).forEach(k => {
        if (newGrid[k].playerId === pId) {
          newGrid[k] = { ...newGrid[k], playerId: undefined };
        }
      });
    }
    
    newGrid[key] = { row: r, col: c, playerId: pId || undefined, blocked: false };
    onUpdateFloorGrid(newGrid);
  };

  const activeRoster = roster.filter(p => p.availability !== 'out');
  const assignedIds = Object.values(floorGrid).map(s => s.playerId).filter(Boolean);
  const unassignedPlayers = activeRoster.filter(p => !assignedIds.includes(p.id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Roster & Floor Spot Manager</h2>
          <p className="text-sm text-slate-500">{activeRoster.length} active students</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button 
            onClick={() => setView('roster')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'roster' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Users className="w-4 h-4" /> Roster
          </button>
          <button 
            onClick={() => setView('grid')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'grid' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Grid className="w-4 h-4" /> Floor Grid
          </button>
          <button 
            onClick={() => setView('locks')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${view === 'locks' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            <Lock className="w-4 h-4" /> Locks
          </button>
        </div>
      </div>

      {view === 'roster' ? (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" /> Add Student
              </h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
                  <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500" placeholder="e.g. John S." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Gender</label>
                    <select value={newPlayerGender} onChange={e => setNewPlayerGender(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500 bg-white">
                      <option value="M">M</option>
                      <option value="F">F</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Skill (1-10)</label>
                    <input type="number" min="1" max="10" value={newPlayerSkill} onChange={e => setNewPlayerSkill(Number(e.target.value))} className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-blue-500" />
                  </div>
                </div>
                <button type="submit" disabled={!newPlayerName.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition disabled:opacity-50">
                  Add to Roster
                </button>
              </form>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3 w-20">Gender</th>
                    <th className="px-4 py-3 w-20">Skill</th>
                    <th className="px-4 py-3 w-28">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {roster.sort((a,b) => a.name.localeCompare(b.name)).map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2 font-semibold text-slate-800">
                        {editingId === p.id ? (
                          <div className="flex items-center gap-2">
                            <input autoFocus value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit(p.id)} className="border border-blue-300 rounded px-2 py-1 outline-none text-sm w-full" />
                            <button onClick={() => handleSaveEdit(p.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Check className="w-4 h-4"/></button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded"><X className="w-4 h-4"/></button>
                          </div>
                        ) : p.name}
                      </td>
                      <td className="px-4 py-2 text-slate-600">{p.gender}</td>
                      <td className="px-4 py-2">
                        <select value={p.skill} onChange={e => onUpdatePlayer(p.id, { skill: Number(e.target.value) })} className="bg-transparent border border-transparent hover:border-slate-300 rounded p-1 outline-none">
                          {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <select 
                          value={p.availability || 'active'} 
                          onChange={e => onUpdatePlayer(p.id, { availability: e.target.value as any })}
                          className={`text-xs font-bold rounded p-1 outline-none cursor-pointer ${p.availability === 'out' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}
                        >
                          <option value="active">Active</option>
                          <option value="out">Dropped/Out</option>
                        </select>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => { setEditingId(p.id); setEditName(p.name); }} className="text-blue-500 hover:bg-blue-50 p-1.5 rounded mr-1"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => { if(confirm(`Remove ${p.name}?`)) onDeletePlayer(p.id); }} className="text-red-400 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4"/></button>
                      </td>
                    </tr>
                  ))}
                  {roster.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-slate-400 font-medium">No students in roster.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : view === 'grid' ? (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm text-slate-500 mb-6 font-medium">
            Click the background of an empty cell to mark it as unusable (<span className="text-red-500 font-bold">X</span>). Use the dropdowns to assign a student to a spot.
          </p>
          
          <div className="overflow-x-auto">
            <div className="min-w-[800px] grid gap-2 bg-slate-100 p-4 rounded-xl" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
              {Array.from({ length: ROWS }).map((_, r) => (
                Array.from({ length: COLS }).map((_, c) => {
                  const key = `${r}-${c}`;
                  const spot = floorGrid[key] || { row: r, col: c };
                  const player = activeRoster.find(p => p.id === spot.playerId);

                  return (
                    <div 
                      key={key} 
                      onClick={(e) => {
                        if ((e.target as HTMLElement).tagName !== 'SELECT') handleGridClick(r, c);
                      }}
                      className={`relative flex flex-col items-center justify-center h-24 rounded-lg border-2 p-2 transition-all cursor-pointer ${
                        spot.blocked ? 'bg-red-50 border-red-200' : 
                        player ? 'bg-blue-50 border-blue-300 shadow-sm' : 'bg-white border-dashed border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {spot.blocked ? (
                        <X className="w-8 h-8 text-red-400 opacity-50" />
                      ) : (
                        <select 
                          value={spot.playerId || ''} 
                          onChange={(e) => handleAssignSpot(r, c, e.target.value)}
                          className="w-full text-xs font-bold text-slate-700 bg-transparent border-b border-transparent hover:border-slate-300 outline-none truncate cursor-pointer text-center"
                        >
                          <option value="">-- Empty --</option>
                          {player && <option value={player.id}>{player.name}</option>}
                          {unassignedPlayers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      )}
                      
                      <div className="absolute bottom-1 right-2 text-[9px] font-bold text-slate-300 pointer-events-none">
                        R{r+1} C{c+1}
                      </div>
                    </div>
                  );
                })
              ))}
            </div>
          </div>
        </div>
      ) : view === 'locks' ? (
        <LockerManager /> 
      ) : null}
    </div>
  );
}
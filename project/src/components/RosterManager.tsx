import { useMemo, useState } from 'react';
import { UserPlus, Pencil, Trash2, X, Grid3x3, Check, Upload } from 'lucide-react';
import type { Unit, Player, Gender, Availability, FloorGrid } from '../types';
import BulkImportModal from './BulkImportModal';

interface Props {
  roster: Player[];
  unit: Unit;
  floorGrid: FloorGrid;
  classId: string;
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  onBulkAddPlayers: (players: Omit<Player, 'id'>[]) => void;
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
  onDeletePlayer: (id: string) => void;
  onUpdateFloorGrid: (grid: FloorGrid) => void;
}

const GRID_COLS = 7;

const availabilityConfig: { value: Availability; label: string; color: string }[] = [
  { value: 'active', label: 'Active', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'injured', label: 'Injured', color: 'bg-amber-100 text-amber-700' },
  { value: 'out', label: 'Out', color: 'bg-red-100 text-red-700' },
];

export default function RosterManager({
  roster,
  unit,
  floorGrid,
  classId,
  onAddPlayer,
  onBulkAddPlayers,
  onUpdatePlayer,
  onDeletePlayer,
  onUpdateFloorGrid,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [tab, setTab] = useState<'roster' | 'floor'>('roster');

  const allPlayers = useMemo(() => {
    return roster.map(player => {
      const team = unit.baseTeams.find(t => t.players.some(p => p.id === player.id));
      return { player, teamName: team ? team.name : 'Unassigned' };
    }).sort((a, b) => a.player.name.localeCompare(b.player.name));
  }, [roster, unit]);
  
  const gridRows = useMemo(() => {
    const maxRow = Math.max(
      ...Object.values(floorGrid).map((s) => s.row),
      Math.ceil(allPlayers.length / GRID_COLS),
      3,
    );
    return Array.from({ length: maxRow }, (_, i) => i);
  }, [floorGrid, allPlayers.length]);

  const gridCols = Array.from({ length: GRID_COLS }, (_, i) => i);

  const spotKey = (row: number, col: number) => `${row}-${col}`;

  const handleSpotClick = (row: number, col: number) => {
    const key = spotKey(row, col);
    const spot = floorGrid[key];
    const next = { ...floorGrid };

    if (spot?.blocked) {
      delete next[key];
    } else if (spot?.playerId) {
      delete next[key];
    } else {
      next[key] = { row, col, blocked: true };
    }
    onUpdateFloorGrid(next);
  };

  const handleAssignPlayer = (row: number, col: number, playerId: string) => {
    const key = spotKey(row, col);
    const next = { ...floorGrid };
    Object.keys(next).forEach((k) => {
      if (next[k].playerId === playerId) delete next[k];
    });
    if (playerId) {
      next[key] = { row, col, playerId };
    } else {
      delete next[key];
    }
    onUpdateFloorGrid(next);
  };

  const getPlayerName = (id?: string) =>
    id ? allPlayers.find((p) => p.player.id === id)?.player.name ?? '' : '';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Roster & Floor Spot Manager</h2>
          <p className="text-sm text-slate-500">{allPlayers.length} students enrolled</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('roster')}
            className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === 'roster' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            Roster
          </button>
          <button
            onClick={() => setTab('floor')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === 'floor' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Grid3x3 className="h-4 w-4" /> Floor Grid
          </button>
        </div>
      </div>

      {tab === 'roster' ? (
        <>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowBulk(true)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Upload className="h-4 w-4" /> Bulk Import
            </button>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <UserPlus className="h-4 w-4" /> Add Student
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 text-xs uppercase text-slate-600 whitespace-nowrap">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Team</th>
                    <th className="px-4 py-3 text-center">Grade</th>
                    <th className="px-4 py-3 text-center">Skill (1-10)</th>
                    <th className="px-4 py-3 text-center">Compete (1-5)</th>
                    <th className="px-4 py-3 text-center">Gender</th>
                    <th className="px-4 py-3 text-center">Availability</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allPlayers.map(({ player, teamName }) => (
                    <tr key={player.id} className="hover:bg-slate-50">
                      <td className="px-4 py-2.5 font-medium text-slate-800 whitespace-nowrap">{player.name}</td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{teamName}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-slate-600">{player.grade || '-'}</td>
                      <td className="px-4 py-2.5 text-center">{player.skill}</td>
                      <td className="px-4 py-2.5 text-center">{player.compete}</td>
                      <td className="px-4 py-2.5 text-center">{player.gender}</td>
                      <td className="px-4 py-2.5 text-center">
                        <select
                          value={player.availability ?? 'active'}
                          onChange={(e) => onUpdatePlayer(player.id, { availability: e.target.value as Availability })}
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold border-0 outline-none ${availabilityConfig.find((a) => a.value === (player.availability ?? 'active'))?.color}`}
                        >
                          {availabilityConfig.map((a) => (
                            <option key={a.value} value={a.value}>{a.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => setEditingId(editingId === player.id ? null : player.id)}
                            className="rounded p-1.5 text-slate-500 hover:bg-slate-100"
                            aria-label="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onDeletePlayer(player.id)}
                            className="rounded p-1.5 text-red-500 hover:bg-red-50"
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {editingId && (
            <EditPlayerModal
              player={allPlayers.find((p) => p.player.id === editingId)!.player}
              onClose={() => setEditingId(null)}
              onSave={(updates) => {
                onUpdatePlayer(editingId, updates);
                setEditingId(null);
              }}
            />
          )}
          {showAdd && (
            <EditPlayerModal
              onClose={() => setShowAdd(false)}
              onSave={(p) => {
                onAddPlayer(p as Omit<Player, 'id'>);
                setShowAdd(false);
              }}
            />
          )}
          {showBulk && (
            <BulkImportModal
              classId={classId}
              onClose={() => setShowBulk(false)}
              onImport={onBulkAddPlayers}
            />
          )}
        </>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-sm text-slate-500">
            Click an empty cell to mark it as unusable (X). Click a blocked cell to clear it. Use the dropdown to assign a student.
          </p>
          <div className="overflow-x-auto">
            <div className="inline-block">
              {gridRows.map((row) => (
                <div key={row} className="flex gap-1">
                  {gridCols.map((col) => {
                    const key = spotKey(row, col);
                    const spot = floorGrid[key];
                    return (
                      <div
                        key={key}
                        className={`m-0.5 flex h-20 w-24 flex-col items-center justify-center rounded-lg border-2 text-xs ${
                          spot?.blocked
                            ? 'border-red-300 bg-red-100'
                            : spot?.playerId
                              ? 'border-blue-300 bg-blue-50'
                              : 'border-slate-200 bg-slate-50'
                        }`}
                      >
                        {spot?.blocked ? (
                          <button
                            onClick={() => handleSpotClick(row, col)}
                            className="flex h-full w-full items-center justify-center text-2xl font-bold text-red-500"
                          >
                            X
                          </button>
                        ) : spot?.playerId ? (
                          <div className="flex w-full flex-col items-center gap-0.5 px-1">
                            <span className="truncate text-xs font-semibold text-blue-700">{getPlayerName(spot.playerId)}</span>
                            <button
                              onClick={() => handleSpotClick(row, col)}
                              className="text-[10px] text-slate-400 hover:text-red-500"
                            >
                              remove
                            </button>
                          </div>
                        ) : (
                          <select
                            value=""
                            onChange={(e) => e.target.value && handleAssignPlayer(row, col, e.target.value)}
                            className="h-full w-full cursor-pointer rounded-lg border-0 bg-transparent text-center text-xs text-slate-400 hover:bg-slate-100"
                          >
                            <option value="">+ assign</option>
                            {allPlayers
                              .filter((p) => !p.player.availability || p.player.availability === 'active')
                              .map((p) => (
                                <option key={p.player.id} value={p.player.id}>
                                  {p.player.name}
                                </option>
                              ))}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EditPlayerModal({
  player,
  onClose,
  onSave,
}: {
  player?: Player;
  onClose: () => void;
  onSave: (data: Partial<Player> | Omit<Player, 'id'>) => void;
}) {
  const [name, setName] = useState(player?.name ?? '');
  const [grade, setGrade] = useState(player?.grade ?? '');
  const [skill, setSkill] = useState(player?.skill ?? 5);
  const [compete, setCompete] = useState(player?.compete ?? 3);
  const [gender, setGender] = useState<Gender>(player?.gender ?? 'M');
  const [availability, setAvailability] = useState<Availability>(player?.availability ?? 'active');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">{player ? 'Edit Student' : 'Add Student'}</h3>
          <button onClick={onClose} className="rounded p-1 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </Field>
          
          <Field label="Grade (e.g. Junior, 11th)">
            <input
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={`Skill: ${skill}`}>
              <input type="range" min={1} max={10} value={skill} onChange={(e) => setSkill(parseInt(e.target.value))} className="w-full" />
            </Field>
            <Field label={`Compete: ${compete}`}>
              <input type="range" min={1} max={5} value={compete} onChange={(e) => setCompete(parseInt(e.target.value))} className="w-full" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Gender">
              <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="M">M</option>
                <option value="F">F</option>
              </select>
            </Field>
            <Field label="Availability">
              <select value={availability} onChange={(e) => setAvailability(e.target.value as Availability)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {availabilityConfig.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </button>
          <button
            onClick={() => onSave({ name, grade, skill, compete, gender, availability })}
            disabled={!name.trim()}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}
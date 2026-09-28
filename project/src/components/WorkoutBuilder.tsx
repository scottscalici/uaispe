import { useMemo, useState } from 'react';
import { Dumbbell, ListChecks, Plus, Trash2, Search, Copy, X, Clock, Pencil, LayoutGrid, Repeat } from 'lucide-react';
import type { Exercise, Workout, WorkoutCircuit, WorkoutLibrary, WorkoutStepType, WorkoutMode, WorkoutStation } from '../types';

interface Props {
  library: WorkoutLibrary;
  onSaveExercise: (e: Exercise) => void;
  onDeleteExercise: (id: string) => void;
  onSaveWorkout: (w: Workout) => void;
  onDeleteWorkout: (id: string) => void;
}

const slugify = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `item_${Date.now()}`;

export default function WorkoutBuilder({ library, onSaveExercise, onDeleteExercise, onSaveWorkout, onDeleteWorkout }: Props) {
  const [tab, setTab] = useState<'workouts' | 'exercises'>('workouts');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab('workouts')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === 'workouts' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <Dumbbell className="h-4 w-4" /> Workout Builder
        </button>
        <button
          onClick={() => setTab('exercises')}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === 'exercises' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
        >
          <ListChecks className="h-4 w-4" /> Exercise Library
        </button>
      </div>

      {tab === 'workouts' ? (
        <WorkoutTab library={library} onSaveWorkout={onSaveWorkout} onDeleteWorkout={onDeleteWorkout} />
      ) : (
        <ExerciseTab exercises={library.exercises} onSaveExercise={onSaveExercise} onDeleteExercise={onDeleteExercise} />
      )}
    </div>
  );
}

function WorkoutTab({ library, onSaveWorkout, onDeleteWorkout }: { library: WorkoutLibrary; onSaveWorkout: (w: Workout) => void; onDeleteWorkout: (id: string) => void; }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<WorkoutMode>('circuit');
  const [circuits, setCircuits] = useState<WorkoutCircuit[]>([]);
  const [stations, setStations] = useState<WorkoutStation[]>([]);
  const [stationDuration, setStationDuration] = useState(90);

  const blankStep = () => ({ exerciseId: library.exercises[0]?.id || '', duration: 30, type: 'work' as WorkoutStepType });
  const blankStation = (): WorkoutStation => ({ id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, exerciseId: library.exercises[0]?.id || '' });

  const startNew = () => {
    setEditingId('__new__');
    setName('');
    setMode('circuit');
    setCircuits([{ circuitId: 'Circuit A', rounds: 1, sequence: [blankStep()] }]);
    setStations([blankStation(), blankStation()]);
    setStationDuration(90);
  };

  const startEdit = (w: Workout) => {
    setEditingId(w.id);
    setName(w.workoutName);
    setMode(w.mode || 'circuit');
    setCircuits(w.circuits.map(c => ({ ...c, sequence: c.sequence.map(s => ({ ...s })) })));
    setStations((w.stations || [blankStation(), blankStation()]).map(s => ({ ...s })));
    setStationDuration(w.stationDuration || 90);
  };

  const cancel = () => { setEditingId(null); setName(''); setCircuits([]); setStations([]); };

  const addStation = () => setStations(prev => [...prev, blankStation()]);
  const removeStation = (idx: number) => setStations(prev => prev.filter((_, i) => i !== idx));
  const updateStation = (idx: number, patch: Partial<WorkoutStation>) => setStations(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s));

  const addCircuit = () => setCircuits(prev => [...prev, { circuitId: `Circuit ${String.fromCharCode(65 + prev.length)}`, rounds: 1, sequence: [blankStep()] }]);
  const duplicateCircuit = (idx: number) => setCircuits(prev => {
    const copy = { ...prev[idx], sequence: prev[idx].sequence.map(s => ({ ...s })) };
    const next = [...prev];
    next.splice(idx + 1, 0, copy);
    return next;
  });
  const removeCircuit = (idx: number) => setCircuits(prev => prev.filter((_, i) => i !== idx));
  const updateCircuit = (idx: number, patch: Partial<WorkoutCircuit>) => setCircuits(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c));

  const addStep = (cIdx: number) => setCircuits(prev => prev.map((c, i) => i === cIdx ? { ...c, sequence: [...c.sequence, blankStep()] } : c));
  const removeStep = (cIdx: number, sIdx: number) => setCircuits(prev => prev.map((c, i) => i === cIdx ? { ...c, sequence: c.sequence.filter((_, j) => j !== sIdx) } : c));
  const updateStep = (cIdx: number, sIdx: number, patch: Partial<{ exerciseId: string; duration: number; type: WorkoutStepType }>) =>
    setCircuits(prev => prev.map((c, i) => i === cIdx ? { ...c, sequence: c.sequence.map((s, j) => j === sIdx ? { ...s, ...patch } : s) } : c));

  const isValid = mode === 'stations'
    ? name.trim() && stations.length > 0 && stationDuration > 0
    : name.trim() && circuits.some(c => c.sequence.length > 0);

  const handleSave = () => {
    if (!isValid) return;
    const id = editingId && editingId !== '__new__' ? editingId : slugify(name);
    if (mode === 'stations') {
      onSaveWorkout({ id, workoutName: name.trim(), mode, circuits: [], stations, stationDuration });
    } else {
      onSaveWorkout({ id, workoutName: name.trim(), mode, circuits });
    }
    cancel();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-slate-500">Saved Workouts</h3>
          <button onClick={startNew} className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" /> New Workout
          </button>
        </div>
        <div className="space-y-2">
          {library.workouts.map(w => (
            <div key={w.id} className={`rounded-lg border p-3 shadow-sm transition ${editingId === w.id ? 'border-blue-400 bg-blue-50/40 ring-2 ring-blue-100' : 'border-slate-200 bg-white'}`}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    {w.mode === 'stations' && <LayoutGrid className="h-3.5 w-3.5 text-purple-500" />}
                    {w.workoutName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {w.mode === 'stations'
                      ? `${w.stations?.length || 0} stations - ${w.stationDuration || 0}s each`
                      : `${w.circuits.length} circuit${w.circuits.length !== 1 ? 's' : ''} - ${w.circuits.reduce((n, c) => n + c.sequence.length, 0)} steps`}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => startEdit(w)} title="Edit" className="rounded-md p-1.5 text-blue-500 hover:bg-blue-100"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDeleteWorkout(w.id)} title="Delete" className="rounded-md p-1.5 text-red-400 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
          {library.workouts.length === 0 && (
            <p className="text-sm text-slate-400 italic">No workouts yet - click "New Workout" to build one.</p>
          )}
        </div>
      </div>

      {editingId && (
        <div className="rounded-xl border-2 border-blue-300 bg-white p-4 shadow-sm space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Workout Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Full Body Burner" className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-bold" />
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setMode('circuit')}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'circuit' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Repeat className="w-3.5 h-3.5" /> Circuit (one timer, everyone together)
            </button>
            <button
              onClick={() => setMode('stations')}
              className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${mode === 'stations' ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Stations (small groups rotate)
            </button>
          </div>

          {mode === 'stations' ? (
            <div className="space-y-3">
              <div className="w-40">
                <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Seconds per Rotation</label>
                <input type="number" min={10} value={stationDuration} onChange={e => setStationDuration(parseInt(e.target.value, 10) || 10)} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
              </div>

              <div className="space-y-2">
                {stations.map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-2 rounded-md bg-purple-50/50 border border-purple-200 p-2">
                    <span className="w-16 shrink-0 text-xs font-black text-purple-600">Station {idx + 1}</span>
                    <select value={s.exerciseId} onChange={e => updateStation(idx, { exerciseId: e.target.value })} className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                      {library.exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                    </select>
                    <input
                      value={s.label || ''}
                      onChange={e => updateStation(idx, { label: e.target.value })}
                      placeholder="Optional label override"
                      className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                    />
                    <button onClick={() => removeStation(idx)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <button onClick={addStation} className="w-full rounded-lg bg-purple-100 py-2 text-sm font-bold text-purple-700 hover:bg-purple-200">+ Add Station</button>
            </div>
          ) : (
          <>
          <div className="space-y-3">
            {circuits.map((c, cIdx) => (
              <div key={cIdx} className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3 space-y-2">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Circuit Name</label>
                    <input value={c.circuitId} onChange={e => updateCircuit(cIdx, { circuitId: e.target.value })} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm font-bold" />
                  </div>
                  <div className="w-24">
                    <label className="mb-1 block text-[10px] font-semibold uppercase text-slate-500">Rounds</label>
                    <input type="number" min={1} value={c.rounds} onChange={e => updateCircuit(cIdx, { rounds: parseInt(e.target.value, 10) || 1 })} className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm" />
                  </div>
                  <button onClick={() => duplicateCircuit(cIdx)} title="Duplicate circuit" className="rounded-md bg-emerald-100 p-2 text-emerald-700 hover:bg-emerald-200"><Copy className="h-4 w-4" /></button>
                  <button onClick={() => removeCircuit(cIdx)} title="Delete circuit" className="rounded-md bg-red-100 p-2 text-red-600 hover:bg-red-200"><X className="h-4 w-4" /></button>
                </div>

                <div className="space-y-1.5">
                  {c.sequence.map((s, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2 rounded-md bg-white border border-slate-200 p-2">
                      <select value={s.exerciseId} onChange={e => updateStep(cIdx, sIdx, { exerciseId: e.target.value })} className="flex-[2] rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                        {library.exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                      </select>
                      <input type="number" min={5} value={s.duration} onChange={e => updateStep(cIdx, sIdx, { duration: parseInt(e.target.value, 10) || 5 })} className="w-16 rounded-md border border-slate-300 px-2 py-1.5 text-xs text-center" />
                      <select value={s.type} onChange={e => updateStep(cIdx, sIdx, { type: e.target.value as WorkoutStepType })} className="w-20 rounded-md border border-slate-300 px-2 py-1.5 text-xs">
                        <option value="work">Work</option>
                        <option value="rest">Rest</option>
                      </select>
                      <button onClick={() => removeStep(cIdx, sIdx)} className="text-red-400 hover:text-red-600"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => addStep(cIdx)} className="w-full rounded-md bg-slate-200 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-300">+ Add Exercise</button>
              </div>
            ))}
          </div>

          <button onClick={addCircuit} className="w-full rounded-lg bg-sky-100 py-2 text-sm font-bold text-sky-700 hover:bg-sky-200">+ Add New Circuit</button>
          </>
          )}

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <button onClick={cancel} className="flex-1 rounded-lg bg-slate-200 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-300">Cancel</button>
            <button onClick={handleSave} disabled={!isValid} className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">Save Workout</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExerciseTab({ exercises, onSaveExercise, onDeleteExercise }: { exercises: Exercise[]; onSaveExercise: (e: Exercise) => void; onDeleteExercise: (id: string) => void; }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return exercises;
    return exercises.filter(e => e.name.toLowerCase().includes(q) || e.category.some(c => c.toLowerCase().includes(q)));
  }, [exercises, query]);

  const addBlank = () => onSaveExercise({ id: slugify(`new_exercise_${Date.now()}`), name: 'New Exercise', category: [] });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by name or category..." className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-sm" />
        </div>
        <button onClick={addBlank} className="flex items-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 whitespace-nowrap">
          <Plus className="h-3.5 w-3.5" /> Add Exercise
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(ex => (
          <div key={ex.id} className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <input value={ex.name} onChange={e => onSaveExercise({ ...ex, name: e.target.value })} className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm font-bold" />
              <button onClick={() => onDeleteExercise(ex.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
            <input
              value={ex.category.join(', ')}
              onChange={e => onSaveExercise({ ...ex, category: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
              placeholder="Categories (comma separated)"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            />
            <input
              value={ex.instructions || ''}
              onChange={e => onSaveExercise({ ...ex, instructions: e.target.value })}
              placeholder="Instructions"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            />
            <input
              value={ex.safetyCues || ''}
              onChange={e => onSaveExercise({ ...ex, safetyCues: e.target.value })}
              placeholder="Safety cues / modifications"
              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
            />
            <div className="flex items-center gap-1 text-[10px] text-slate-400"><Clock className="h-3 w-3" /> id: {ex.id}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400 italic col-span-full">No exercises match "{query}".</p>
        )}
      </div>
    </div>
  );
}

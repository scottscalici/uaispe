import { useState, useMemo } from 'react';
import { Plus, Trash2, BookOpen, CalendarPlus, Save } from 'lucide-react';
import type { SyllabusData, ScheduleData, Match, CalendarDay } from '../types';

interface Props {
  unitName: string;
  syllabus: SyllabusData;
  schedule: ScheduleData;
  teamNames: string[];
  onUpdateUnitName: (name: string) => void;
  onUpdateSyllabus: (s: SyllabusData) => void;
  onAddMatch: (m: Omit<Match, 'id'>) => void;
  onDeleteMatch: (id: number) => void;
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
  { fecha: "2026-09-22", ciclo: "A", dia: 7, status: "school", note: "", manualOverride: false }
];

export default function UnitScheduleBuilder({
  unitName,
  syllabus,
  schedule,
  teamNames,
  onUpdateUnitName,
  onUpdateSyllabus,
  onAddMatch,
  onDeleteMatch,
}: Props) {
  const [tab, setTab] = useState<'unit' | 'schedule'>('unit');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Unit & Schedule Builder</h2>
          <p className="text-sm text-slate-500">Edit the unit plan and build the class schedule</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('unit')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === 'unit' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <BookOpen className="h-4 w-4" /> Unit Plan
          </button>
          <button
            onClick={() => setTab('schedule')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === 'schedule' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <CalendarPlus className="h-4 w-4" /> Schedule
          </button>
        </div>
      </div>

      {tab === 'unit' ? (
        <UnitPlanEditor 
          unitName={unitName} 
          onUpdateUnitName={onUpdateUnitName} 
          syllabus={syllabus} 
          onSave={onUpdateSyllabus} 
        />
      ) : (
        <ScheduleEditor schedule={schedule} teamNames={teamNames} onAddMatch={onAddMatch} onDeleteMatch={onDeleteMatch} />
      )}
    </div>
  );
}

function UnitPlanEditor({ 
  unitName, 
  onUpdateUnitName, 
  syllabus, 
  onSave 
}: { 
  unitName: string;
  onUpdateUnitName: (n: string) => void;
  syllabus: SyllabusData; 
  onSave: (s: SyllabusData) => void 
}) {
  const [draft, setDraft] = useState<SyllabusData>(syllabus);

  const update = (patch: Partial<SyllabusData>) => setDraft((d) => ({ ...d, ...patch }));

  const addRule = () => update({ rules: [...(draft.rules ?? []), ''] });
  const updateRule = (i: number, val: string) => {
    const rules = [...(draft.rules ?? [])];
    rules[i] = val;
    update({ rules });
  };
  const removeRule = (i: number) => update({ rules: (draft.rules ?? []).filter((_, idx) => idx !== i) });

  const addEquip = () => update({ equipment: [...(draft.equipment ?? []), { name: '' }] });
  const updateEquip = (i: number, val: string) => {
    const equipment = [...(draft.equipment ?? [])];
    equipment[i] = { ...equipment[i], name: val };
    update({ equipment });
  };
  const removeEquip = (i: number) => update({ equipment: (draft.equipment ?? []).filter((_, idx) => idx !== i) });

  const addVocab = () => update({ key_terms: [...(draft.key_terms ?? []), { term: '', definition: '' }] });
  const updateVocab = (i: number, field: 'term' | 'definition', val: string) => {
    const key_terms = [...(draft.key_terms ?? [])];
    key_terms[i] = { ...key_terms[i], [field]: val };
    update({ key_terms });
  };
  const removeVocab = (i: number) => update({ key_terms: (draft.key_terms ?? []).filter((_, idx) => idx !== i) });

  const addDay = () => update({ unit_plan: [...(draft.unit_plan ?? []), { day: (draft.unit_plan?.length ?? 0) + 1, topic: '', activities: [] }] });
  const updateDay = (i: number, field: 'topic' | 'skills' | 'discussion', val: string) => {
    const unit_plan = [...(draft.unit_plan ?? [])];
    unit_plan[i] = { ...unit_plan[i], [field]: val };
    update({ unit_plan });
  };
  const removeDay = (i: number) => update({ unit_plan: (draft.unit_plan ?? []).filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div className="rounded-xl border-2 border-emerald-500 bg-emerald-50 p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-bold uppercase text-emerald-800">Admin Tracking</h3>
        <LabeledInput 
          label="Unit Dropdown Name (Admin Only)" 
          value={unitName} 
          onChange={(v) => onUpdateUnitName(v)} 
        />
        <p className="mt-1 text-xs text-emerald-600 font-medium">This instantly updates the top navigation dropdown.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Student Syllabus Info</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <LabeledInput label="Public Display Name" value={draft.display_name} onChange={(v) => update({ display_name: v })} />
          <LabeledInput label="Header Image URL" value={draft.header_image ?? ''} onChange={(v) => update({ header_image: v })} />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-slate-500">Rules</h3>
          <button onClick={addRule} className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(draft.rules ?? []).map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={r} onChange={(e) => updateRule(i, e.target.value)} className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              <button onClick={() => removeRule(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-slate-500">Equipment</h3>
          <button onClick={addEquip} className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(draft.equipment ?? []).map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={e.name} onChange={(ev) => updateEquip(i, ev.target.value)} placeholder="Item name" className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              <input value={e.caption ?? ''} onChange={(ev) => { const equipment = [...(draft.equipment ?? [])]; equipment[i] = { ...equipment[i], caption: ev.target.value }; update({ equipment }); }} placeholder="Caption" className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              <button onClick={() => removeEquip(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-slate-500">Vocabulary</h3>
          <button onClick={addVocab} className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
        <div className="space-y-2">
          {(draft.key_terms ?? []).map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={v.term} onChange={(e) => updateVocab(i, 'term', e.target.value)} placeholder="Term" className="w-32 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              <input value={v.definition} onChange={(e) => updateVocab(i, 'definition', e.target.value)} placeholder="Definition" className="flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
              <button onClick={() => removeVocab(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase text-slate-500">Daily Plans</h3>
          <button onClick={addDay} className="flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200">
            <Plus className="h-3 w-3" /> Add Day
          </button>
        </div>
        <div className="space-y-3">
          {(draft.unit_plan ?? []).map((d, i) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Day {d.day}</span>
                <button onClick={() => removeDay(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <LabeledInput label="Topic" value={d.topic ?? ''} onChange={(v) => updateDay(i, 'topic', v)} />
                <LabeledInput label="Skills" value={d.skills ?? ''} onChange={(v) => updateDay(i, 'skills', v)} />
                <LabeledInput label="Discussion" value={d.discussion ?? ''} onChange={(v) => updateDay(i, 'discussion', v)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Global Connections</h3>
        <div className="space-y-3">
          <LabeledInput label="Description" value={draft.global_connections?.description ?? ''} onChange={(v) => update({ global_connections: { ...draft.global_connections, description: v } })} />
          <LabeledInput label="Highlights Video URL" value={draft.global_connections?.highlights_video ?? ''} onChange={(v) => update({ global_connections: { ...draft.global_connections, highlights_video: v } })} />
        </div>
      </div>

      <button
        onClick={() => onSave(draft)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700"
      >
        <Save className="h-4 w-4" /> Save Student Syllabus
      </button>
    </div>
  );
}

function ScheduleEditor({
  schedule,
  teamNames,
  onAddMatch,
  onDeleteMatch,
}: {
  schedule: ScheduleData;
  teamNames: string[];
  onAddMatch: (m: Omit<Match, 'id'>) => void;
  onDeleteMatch: (id: number) => void;
}) {
  const [home, setHome] = useState(teamNames[0] ?? '');
  const [away, setAway] = useState(teamNames[1] ?? '');
  
  // Connected to Calendar and defaulted Time to 11:15
  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:15');
  const [location, setLocation] = useState('Main Gym');

  const upcomingSchoolDays = useMemo(() => {
    return myCalendar.filter(d => d.status === 'school');
  }, []);

  const handleAdd = () => {
    if (!home || !away || !date) return;
    onAddMatch({
      home_team: home,
      away_team: away,
      home_score: null,
      away_score: null,
      date_str: date,
      time,
      location,
      completed: false,
    });
    setDate('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Add Matchup</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Home Team</span>
            <select value={home} onChange={(e) => setHome(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
              <option value="" disabled>Select Team...</option>
              {teamNames.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Away Team</span>
            <select value={away} onChange={(e) => setAway(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
              <option value="" disabled>Select Team...</option>
              {teamNames.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          
          {/* Dropdown connected directly to Calendar JSON */}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Date</span>
            <select value={date} onChange={(e) => setDate(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
              <option value="" disabled>Select a school day...</option>
              {upcomingSchoolDays.map(day => (
                <option key={day.fecha} value={day.fecha}>
                  {day.fecha} ({day.ciclo} Day - {day.dia})
                </option>
              ))}
            </select>
          </label>

          <LabeledInput label="Time" value={time} onChange={setTime} />
          
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Location</span>
            <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
              <option value="Main Gym">Main Gym</option>
              <option value="Aux Gym">Aux Gym</option>
              <option value="Outside">Outside</option>
              <option value="Tennis Court 1">Tennis Court 1</option>
              <option value="Tennis Court 2">Tennis Court 2</option>
              <option value="Tennis Court 3">Tennis Court 3</option>
              <option value="Tennis Court 4">Tennis Court 4</option>
              <option value="Softball Field">Softball Field</option>
              <option value="Baseball Field">Baseball Field</option>
            </select>
          </label>

          <div className="flex items-end">
            <button onClick={handleAdd} disabled={!home || !away || !date} className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
              <Plus className="h-4 w-4" /> Add Match
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Home</th>
              <th className="px-4 py-2 text-left">Away</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {schedule.matches.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2.5">{m.date_str}</td>
                <td className="px-4 py-2.5">{m.time}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{m.home_team}</td>
                <td className="px-4 py-2.5 font-medium text-slate-800">{m.away_team}</td>
                <td className="px-4 py-2.5 text-slate-500">{m.location}</td>
                <td className="px-4 py-2.5 text-center">
                  <button onClick={() => onDeleteMatch(m.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {schedule.matches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400 font-medium">
                  No matches scheduled for this unit yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
    </label>
  );
}
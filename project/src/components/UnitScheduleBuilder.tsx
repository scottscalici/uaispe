import { useState, useMemo } from 'react';
import { Plus, Trash2, BookOpen, CalendarPlus, Save, Swords, Users, Trophy, Pencil, X } from 'lucide-react';
import type { SyllabusData, ScheduleData, Match, CalendarDay, MatchType, TeamSet } from '../types';

interface Props {
  unitName: string;
  syllabus: SyllabusData;
  schedule: ScheduleData;
  teamNames: string[];
  teamSets?: TeamSet[];
  onUpdateUnitName: (name: string) => void;
  onUpdateSyllabus: (s: SyllabusData) => void;
  onAddMatch: (m: Omit<Match, 'id'>) => void;
  onUpdateMatch: (id: number, m: Partial<Match>) => void;
  onDeleteMatch: (id: number) => void;
}

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
  teamSets = [],
  onUpdateUnitName,
  onUpdateSyllabus,
  onAddMatch,
  onUpdateMatch,
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
        <ScheduleEditor schedule={schedule} teamNames={teamNames} teamSets={teamSets} onAddMatch={onAddMatch} onUpdateMatch={onUpdateMatch} onDeleteMatch={onDeleteMatch} />
      )}
    </div>
  );
}

function UnitPlanEditor({ unitName, onUpdateUnitName, syllabus, onSave }: any) {
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
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase text-emerald-700">Unit Dropdown Name (Admin Only)</span>
          <input value={unitName} onChange={(e) => onUpdateUnitName(e.target.value)} className="w-full rounded-md border border-emerald-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none" />
        </label>
        <p className="mt-1 text-xs text-emerald-600 font-medium">This instantly updates the top navigation dropdown.</p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Student Syllabus Info</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Public Display Name</span>
            <input value={draft.display_name} onChange={(e) => update({ display_name: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Header Image URL</span>
            <input value={draft.header_image ?? ''} onChange={(e) => update({ header_image: e.target.value })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </label>
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
          {(draft.rules ?? []).map((r: string, i: number) => (
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
          {(draft.equipment ?? []).map((e: any, i: number) => (
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
          {(draft.key_terms ?? []).map((v: any, i: number) => (
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
          {(draft.unit_plan ?? []).map((d: any, i: number) => (
            <div key={i} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Day {d.day}</span>
                <button onClick={() => removeDay(i)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Topic</span>
                  <input value={d.topic ?? ''} onChange={(e) => updateDay(i, 'topic', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Skills</span>
                  <input value={d.skills ?? ''} onChange={(e) => updateDay(i, 'skills', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Discussion</span>
                  <input value={d.discussion ?? ''} onChange={(e) => updateDay(i, 'discussion', e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm" />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-bold uppercase text-slate-500">Global Connections</h3>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Description</span>
            <input value={draft.global_connections?.description ?? ''} onChange={(e) => update({ global_connections: { ...draft.global_connections, description: e.target.value } })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Highlights Video URL</span>
            <input value={draft.global_connections?.highlights_video ?? ''} onChange={(e) => update({ global_connections: { ...draft.global_connections, highlights_video: e.target.value } })} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </label>
        </div>
      </div>

      <button onClick={() => onSave(draft)} className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">
        <Save className="h-4 w-4" /> Save Student Syllabus
      </button>
    </div>
  );
}

function ScheduleEditor({
  schedule,
  teamNames,
  teamSets,
  onAddMatch,
  onUpdateMatch,
  onDeleteMatch,
}: {
  schedule: ScheduleData;
  teamNames: string[];
  teamSets: TeamSet[];
  onAddMatch: (m: Omit<Match, 'id'>) => void;
  onUpdateMatch: (id: number, m: Partial<Match>) => void;
  onDeleteMatch: (id: number) => void;
}) {
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);

  const [matchType, setMatchType] = useState<MatchType>('standard');
  const [standardTeamSetId, setStandardTeamSetId] = useState<string>('base');
  
  const sortedMatches = useMemo(() => {
    return [...schedule.matches].sort((a, b) => {
      if (a.date_str !== b.date_str) return a.date_str.localeCompare(b.date_str);
      return (a.time || '').localeCompare(b.time || '');
    });
  }, [schedule.matches]);

  const availableTeams = useMemo(() => {
    if (standardTeamSetId === 'base') return teamNames;
    const selectedSet = teamSets.find(ts => ts.id === standardTeamSetId);
    return selectedSet ? selectedSet.teams.map(t => t.name) : [];
  }, [standardTeamSetId, teamNames, teamSets]);

  const availableTeamsWithTBD = ['TBD', ...availableTeams];

  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [teamSetId, setTeamSetId] = useState('base'); 
  const [roundName, setRoundName] = useState('Quarterfinals'); 

  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:15');
  const [location, setLocation] = useState('Main Gym');

  const upcomingSchoolDays = useMemo(() => {
    return myCalendar.filter(d => d.status === 'school');
  }, []);

  const handleEditClick = (m: Match) => {
    setEditingMatchId(m.id);
    setMatchType(m.match_type || 'standard');
    setDate(m.date_str);
    setTime(m.time);
    setLocation(m.location);
    if (m.match_type === 'standard') {
      setStandardTeamSetId(m.team_set_id || 'base');
      setHome(m.home_team);
      setAway(m.away_team);
    } else if (m.match_type === 'minigame') {
      setTeamSetId(m.team_set_id || 'base');
   } else if (m.match_type === 'bracket') {
      setStandardTeamSetId(m.team_set_id || 'base');
      setHome(m.home_team);
      setAway(m.away_team);
      setRoundName(m.round_name || '');
    }
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    setDate('');
    setHome('');
    setAway('');
  };

  const handleSave = () => {
    if (!date) return;
    
    let matchData: any = {
      match_type: matchType,
      date_str: date,
      time,
      location,
    };

    if (matchType === 'standard') {
      if (!home || !away) return;
      matchData = { ...matchData, team_set_id: standardTeamSetId, home_team: home, away_team: away };
    } else if (matchType === 'minigame') {
      if (!teamSetId) return;
      const selectedSet = teamSets.find(ts => ts.id === teamSetId);
      matchData = { 
        ...matchData, 
        team_set_id: teamSetId, 
        home_team: 'Mini-Games', 
        away_team: selectedSet ? selectedSet.name : (teamSetId === 'base' ? 'Default Unit Teams' : 'Multiple Teams') 
      };
     } else if (matchType === 'bracket') {
      if (!home || !away || !roundName) return;
      matchData = { ...matchData, team_set_id: standardTeamSetId, home_team: home, away_team: away, round_name: roundName };
    }

    if (editingMatchId) {
      onUpdateMatch(editingMatchId, matchData);
      setEditingMatchId(null);
    } else {
      onAddMatch({ ...matchData, home_score: null, away_score: null, completed: false });
    }
    setDate('');
  };

  const isFormValid = date && (matchType === 'minigame' ? teamSetId : (home && away));

  return (
    <div className="space-y-4">
      <div className={`rounded-xl border-2 p-4 shadow-sm transition-all ${editingMatchId ? 'border-amber-400 bg-amber-50/30 ring-4 ring-amber-50' : 'border-slate-200 bg-white'}`}>
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className={`text-sm font-bold uppercase ${editingMatchId ? 'text-amber-700 flex items-center gap-2' : 'text-slate-500'}`}>
            {editingMatchId ? <><Pencil className="w-4 h-4"/> Updating Scheduled Event</> : 'Add Schedule Event'}
          </h3>
          
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button 
              onClick={() => setMatchType('standard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${matchType === 'standard' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Swords className="w-3.5 h-3.5" /> Match
            </button>
            <button 
              onClick={() => setMatchType('minigame')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${matchType === 'minigame' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users className="w-3.5 h-3.5" /> Mini-Games
            </button>
            <button 
              onClick={() => setMatchType('bracket')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${matchType === 'bracket' ? 'bg-amber-100 text-amber-800 shadow-sm border border-amber-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Trophy className="w-3.5 h-3.5" /> Bracket
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          
          {matchType === 'standard' || matchType === 'bracket' ? (
            <>
              {teamSets.length > 0 && (
                 <label className="block sm:col-span-2 lg:col-span-3 border-b border-slate-100 pb-3">
                   <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Match Roster Source</span>
                   <select 
                     value={standardTeamSetId} 
                     onChange={(e) => {
                       setStandardTeamSetId(e.target.value);
                       setHome('');
                       setAway('');
                     }} 
                     className="w-full md:w-1/2 rounded-md border border-slate-300 px-3 py-2 text-sm font-bold text-blue-700 bg-white shadow-sm"
                   >
                     <option value="base">🏆 Default Unit Teams</option>
                     {teamSets.map((ts) => <option key={ts.id} value={ts.id}>🔄 {ts.name}</option>)}
                   </select>
                 </label>
              )}

              {matchType === 'bracket' && (
                <label className="block sm:col-span-2 lg:col-span-3">
                  <span className="mb-1 block text-xs font-semibold uppercase text-amber-600">Tournament Round Name</span>
                  <input 
                    type="text" 
                    value={roundName} 
                    onChange={(e) => setRoundName(e.target.value)} 
                    placeholder="e.g. Semifinals, Championship"
                    className="w-full md:w-1/2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500" 
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Home Team</span>
                <select value={home} onChange={(e) => setHome(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                  <option value="" disabled>Select Team...</option>
                  {(matchType === 'bracket' ? availableTeamsWithTBD : availableTeams).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Away Team</span>
                <select value={away} onChange={(e) => setAway(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm bg-white">
                  <option value="" disabled>Select Team...</option>
                  {(matchType === 'bracket' ? availableTeamsWithTBD : availableTeams).map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
            </>
          ) : (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase text-indigo-500">Select Daily Team Set</span>
              <select value={teamSetId} onChange={(e) => setTeamSetId(e.target.value)} className="w-full rounded-md border border-indigo-300 px-3 py-2 text-sm bg-indigo-50 font-semibold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="base">🏆 Default Unit Teams</option>
                {teamSets.map((ts) => <option key={ts.id} value={ts.id}>{ts.name} ({ts.teams.length} teams)</option>)}
              </select>
            </label>
          )}
          
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

          <label className="block">
             <span className="mb-1 block text-xs font-semibold uppercase text-slate-500">Time</span>
             <input value={time} onChange={(e) => setTime(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
          </label>
          
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

          <div className="flex items-end gap-2">
            {editingMatchId && (
              <button onClick={handleCancelEdit} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300 transition">
                <X className="h-4 w-4" /> Cancel
              </button>
            )}
            <button onClick={handleSave} disabled={!isFormValid} className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed ${editingMatchId ? 'bg-amber-600 hover:bg-amber-700 shadow-md' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {editingMatchId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />} 
              {editingMatchId ? 'Update Event' : 'Add to Schedule'}
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
              <th className="px-4 py-2 text-left">Event Details</th>
              <th className="px-4 py-2 text-left">Location</th>
              <th className="px-4 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedMatches.map((m) => (
              <tr key={m.id} className={`transition hover:bg-slate-50 ${m.match_type === 'minigame' ? 'bg-indigo-50/30' : m.match_type === 'bracket' ? 'bg-amber-50/30' : ''}`}>
                <td className="px-4 py-3">{m.date_str}</td>
                <td className="px-4 py-3 font-semibold text-slate-600">{m.time}</td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {m.match_type === 'minigame' ? (
                    <div className="flex items-center gap-1.5 text-indigo-700">
                      <Users className="w-4 h-4" />
                      <span>Mini-Games / Relays <span className="text-slate-500 font-normal">({m.away_team})</span></span>
                    </div>
                  ) : m.match_type === 'bracket' ? (
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">{m.round_name}</span>
                      <span>{m.home_team} <span className="text-slate-400 text-xs mx-1">vs</span> {m.away_team}</span>
                    </div>
                  ) : (
                    <span>{m.home_team} <span className="text-slate-400 text-xs mx-1">vs</span> {m.away_team}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">{m.location}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button onClick={() => handleEditClick(m)} className="text-blue-500 hover:text-blue-700 mr-4 transition" title="Edit Event Details">
                    <Pencil className="h-4 w-4 inline" />
                  </button>
                  <button onClick={() => onDeleteMatch(m.id)} className="text-red-400 hover:text-red-600 transition" title="Delete Event">
                    <Trash2 className="h-4 w-4 inline" />
                  </button>
                </td>
              </tr>
            ))}
            {sortedMatches.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
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
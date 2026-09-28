import { useState, useMemo } from 'react';
import { Plus, Trash2, BookOpen, CalendarPlus, Save, Swords, Users, Trophy, Pencil, X, Wand2, User, Link as LinkIcon, Unlink, CalendarDays, ListTree } from 'lucide-react';
import type { SyllabusData, ScheduleData, Match, CalendarDay, MatchType, TeamSet, Unit, Player, Team, UnitData, DailyTeamSnapshot } from '../types';
import TeamCreator from './TeamCreator';

interface Props {
  unitName: string;
  syllabus: SyllabusData;
  schedule: ScheduleData;
  teamNames: string[];
  teamSets?: TeamSet[];
  calendar: CalendarDay[];
  roster: Player[];
  unit: Unit;
  allUnits: UnitData[];
  dailyTeams: Record<string, DailyTeamSnapshot>;
  onUpdateUnitName: (name: string) => void;
  onUpdateSyllabus: (s: SyllabusData) => void;
  onAddMatch: (m: Omit<Match, 'id'>) => void;
  onUpdateMatch: (id: number, m: Partial<Match>) => void;
  onDeleteMatch: (id: number) => void;
  onGenerateTeams: (teams: Team[], teamSetName?: string) => void;
  onMovePlayer: (playerId: string, fromTeamId: number, toTeamId: number) => void;
  onDeleteTeamSet: (teamSetId: string) => void;
  onSetParentSportType: (parentSportType: string | null) => void;
}

export default function UnitScheduleBuilder({
  unitName,
  syllabus,
  schedule,
  teamNames,
  teamSets = [],
  calendar,
  roster,
  unit,
  allUnits,
  dailyTeams,
  onUpdateUnitName,
  onUpdateSyllabus,
  onAddMatch,
  onUpdateMatch,
  onDeleteMatch,
  onGenerateTeams,
  onMovePlayer,
  onDeleteTeamSet,
  onSetParentSportType,
}: Props) {
  const [tab, setTab] = useState<'unit' | 'generator' | 'schedule'>('unit');

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Unit & Schedule Builder</h2>
          <p className="text-sm text-slate-500">Edit the unit plan, generate teams, and build the class schedule</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('unit')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === 'unit' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <BookOpen className="h-4 w-4" /> Unit Plan
          </button>
          <button
            onClick={() => setTab('generator')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${tab === 'generator' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Wand2 className="h-4 w-4" /> Generator
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
          unit={unit}
          schedule={schedule}
          allUnits={allUnits}
          calendar={calendar}
          dailyTeams={dailyTeams}
          onSetParentSportType={onSetParentSportType}
        />
      ) : tab === 'generator' ? (
        <TeamCreator roster={roster} unit={unit} onGenerate={onGenerateTeams} onMovePlayer={onMovePlayer} onDeleteTeamSet={onDeleteTeamSet} />
      ) : (
        <ScheduleEditor schedule={schedule} teamNames={teamNames} teamSets={teamSets} calendar={calendar} roster={roster} onAddMatch={onAddMatch} onUpdateMatch={onUpdateMatch} onDeleteMatch={onDeleteMatch} />
      )}
    </div>
  );
}

function UnitPlanEditor({ unitName, onUpdateUnitName, syllabus, onSave, unit, schedule, allUnits, calendar, dailyTeams, onSetParentSportType }: any) {
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

      <UnitFamilyCard unit={unit} allUnits={allUnits} onSetParentSportType={onSetParentSportType} />

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

      <ActivityLog unit={unit} schedule={schedule} allUnits={allUnits} calendar={calendar} dailyTeams={dailyTeams} />
    </div>
  );
}

function UnitFamilyCard({ unit, allUnits, onSetParentSportType }: any) {
  const otherUnits: UnitData[] = allUnits.filter((u: UnitData) => u.unit.sport_type !== unit.sport_type);
  const parentUnit = allUnits.find((u: UnitData) => u.unit.sport_type === unit.parentSportType);
  const childUnits = allUnits.filter((u: UnitData) => u.unit.parentSportType === unit.sport_type);

  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase text-indigo-700">
        <LinkIcon className="h-4 w-4" /> Unit Family
      </h3>

      <label className="block mb-3">
        <span className="mb-1 block text-xs font-semibold uppercase text-indigo-600">This unit is a variant of</span>
        <div className="flex items-center gap-2">
          <select
            value={unit.parentSportType || ''}
            onChange={(e) => onSetParentSportType(e.target.value || null)}
            className="w-full sm:w-auto flex-1 rounded-md border border-indigo-300 bg-white px-3 py-2 text-sm font-semibold text-indigo-900 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">-- Standalone (no parent) --</option>
            {otherUnits.map((u: UnitData) => (
              <option key={u.unit.sport_type} value={u.unit.sport_type}>{u.unit.unit_name}</option>
            ))}
          </select>
          {unit.parentSportType && (
            <button
              onClick={() => onSetParentSportType(null)}
              title="Unlink from parent"
              className="flex items-center gap-1 rounded-md bg-indigo-100 px-2 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-200"
            >
              <Unlink className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {parentUnit && (
          <p className="mt-1.5 text-xs text-indigo-600">Variant of <strong>{parentUnit.unit.unit_name}</strong> - its own content and standings stay independent; this link is just for grouping.</p>
        )}
      </label>

      {childUnits.length > 0 && (
        <div>
          <span className="mb-1 block text-xs font-semibold uppercase text-indigo-600">Variants of this unit</span>
          <div className="flex flex-wrap gap-2">
            {childUnits.map((u: UnitData) => (
              <span key={u.id} className="rounded-full bg-white border border-indigo-200 px-3 py-1 text-xs font-bold text-indigo-700">{u.unit.unit_name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityLog({ unit, schedule, allUnits, calendar, dailyTeams }: any) {
  const childUnits: UnitData[] = allUnits.filter((u: UnitData) => u.unit.parentSportType === unit.sport_type);

  const relevantDays = useMemo(() => {
    const selfName = (unit.unit_name || '').toLowerCase().trim();
    const childNameMap = new Map<string, UnitData>();
    childUnits.forEach((u: UnitData) => childNameMap.set((u.unit.unit_name || '').toLowerCase().trim(), u));

    return calendar
      .filter((d: CalendarDay) => (d.status === 'school' || d.status === 'half-day') && d.unitName)
      .map((d: CalendarDay) => {
        const name = (d.unitName || '').toLowerCase().trim();
        if (name === selfName) return { day: d, owner: null as UnitData | null };
        if (childNameMap.has(name)) return { day: d, owner: childNameMap.get(name)! };
        return null;
      })
      .filter((entry: any): entry is { day: CalendarDay, owner: UnitData | null } => entry !== null)
      .sort((a: any, b: any) => b.day.fecha.localeCompare(a.day.fecha));
  }, [calendar, unit, childUnits]);

  const getLogoUrl = (unitName: string, teamName: string) => {
    if (!teamName || teamName === 'TBD') return '';
    const normalize = (str: string) => str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${normalize(unitName)}/${normalize(teamName)}.png`;
  };

  const resolveTeams = (dayUnit: Unit, dateStr: string, teamSetId?: string) => {
    if (dailyTeams[dateStr]) return dailyTeams[dateStr].teams;
    if (teamSetId && teamSetId !== 'base') return dayUnit.teamSets?.find((ts: TeamSet) => ts.id === teamSetId)?.teams;
    return dayUnit.baseTeams;
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase text-slate-500">
        <ListTree className="h-4 w-4" /> Activity Log
      </h3>
      <p className="mb-4 text-xs text-slate-400">Every real class date this unit{childUnits.length > 0 ? ' (and its variants)' : ''} was actually taught, most recent first - teams and results pulled from that day.</p>

      {relevantDays.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 italic">
          No calendar days tagged for this unit yet. Assign this unit to dates in the Master Calendar.
        </div>
      ) : (
        <div className="space-y-3">
          {relevantDays.map(({ day, owner }: { day: CalendarDay; owner: UnitData | null }) => {
            const dayUnit: Unit = owner ? owner.unit : unit;
            const daySchedule: ScheduleData = owner ? owner.schedule : schedule;
            const dayMatches = daySchedule.matches.filter((m: Match) => m.date_str === day.fecha).sort((a: Match, b: Match) => (a.time || '').localeCompare(b.time || ''));

            return (
              <div key={day.fecha} className="rounded-lg border border-slate-200 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-sm font-black text-slate-800"><CalendarDays className="h-3.5 w-3.5 text-slate-400" /> {day.fecha}</span>
                  {owner && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">{owner.unit.unit_name}</span>}
                  {day.activity && <span className="text-xs text-slate-500">{day.activity}</span>}
                </div>

                {day.lessonPlan?.goals && (
                  <p className="mb-2 text-xs text-slate-600 italic">"{day.lessonPlan.goals}"</p>
                )}

                {dayMatches.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No teams/games logged for this date.</p>
                ) : (
                  <div className="space-y-1.5">
                    {dayMatches.map((m: Match) => {
                      if (m.match_type === 'minigame') {
                        const teams = resolveTeams(dayUnit, m.date_str, m.team_set_id);
                        return (
                          <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-md bg-indigo-50/50 border border-indigo-100 px-2.5 py-1.5 text-xs">
                            <span className="flex items-center gap-1 font-bold text-indigo-700"><Users className="h-3 w-3" /> Mini-Games</span>
                            <span className="text-slate-500">{m.time} - {m.location}</span>
                            <span className="flex flex-wrap gap-1.5">
                              {teams?.map((t: Team) => (
                                <span key={t.id} className="flex items-center gap-1 font-semibold text-slate-700">
                                  <img src={getLogoUrl(dayUnit.unit_name, t.name)} onError={e => e.currentTarget.style.display = 'none'} className="h-3.5 w-3.5 object-contain" alt="" /> {t.name}
                                  {m.awardedTeamCounts?.[t.id] ? <span className="text-emerald-600 font-black">×{m.awardedTeamCounts[t.id]}</span> : null}
                                </span>
                              ))}
                            </span>
                          </div>
                        );
                      }
                      if (m.match_type === 'solo') {
                        return (
                          <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-md bg-purple-50/50 border border-purple-100 px-2.5 py-1.5 text-xs">
                            <span className="flex items-center gap-1 font-bold text-purple-700"><User className="h-3 w-3" /> Individual Event</span>
                            <span className="text-slate-500">{m.time} - {m.location}</span>
                            <span className="flex items-center gap-1 font-semibold text-slate-700"><Trophy className="h-3 w-3 text-amber-500" /> {m.away_team}</span>
                          </div>
                        );
                      }
                      return (
                        <div key={m.id} className="flex flex-wrap items-center gap-2 rounded-md bg-slate-50 border border-slate-100 px-2.5 py-1.5 text-xs">
                          {m.match_type === 'bracket' && <span className="font-bold text-amber-600 uppercase text-[10px]">{m.round_name}</span>}
                          <span className="text-slate-500">{m.time} - {m.location}</span>
                          <span className="font-semibold text-slate-700">{m.home_team}</span>
                          <span className="font-black text-slate-400">
                            {m.completed && m.home_score !== null && m.away_score !== null ? `${m.home_score} - ${m.away_score}` : 'vs'}
                          </span>
                          <span className="font-semibold text-slate-700">{m.away_team}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScheduleEditor({
  schedule,
  teamNames,
  teamSets,
  calendar,
  roster,
  onAddMatch,
  onUpdateMatch,
  onDeleteMatch,
}: {
  schedule: ScheduleData;
  teamNames: string[];
  teamSets: TeamSet[];
  calendar: CalendarDay[];
  roster: Player[];
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
  const [soloWinnerId, setSoloWinnerId] = useState('');

  const sortedRoster = useMemo(() => [...roster].sort((a, b) => a.name.localeCompare(b.name)), [roster]);

  const [date, setDate] = useState('');
  const [time, setTime] = useState('11:15');
  const [location, setLocation] = useState('Main Gym');

  const upcomingSchoolDays = useMemo(() => {
    return [...calendar]
      .filter(d => d.status === 'school' || d.status === 'half-day')
      .sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [calendar]);

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
    } else if (m.match_type === 'solo') {
      setSoloWinnerId(m.winner_player_id || '');
    }
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    setDate('');
    setHome('');
    setAway('');
    setSoloWinnerId('');
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
    } else if (matchType === 'solo') {
      if (!soloWinnerId) return;
      const winner = roster.find(p => p.id === soloWinnerId);
      matchData = { ...matchData, home_team: 'Individual Event', away_team: winner?.name || 'Unknown', winner_player_id: soloWinnerId };
    }

    const completed = matchType === 'solo';

    if (editingMatchId) {
      onUpdateMatch(editingMatchId, matchData);
      setEditingMatchId(null);
    } else {
      onAddMatch({ ...matchData, home_score: null, away_score: null, completed });
    }
    setDate('');
    setSoloWinnerId('');
  };

  const isFormValid = date && (matchType === 'minigame' ? teamSetId : matchType === 'solo' ? soloWinnerId : (home && away));

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
            <button
              onClick={() => setMatchType('solo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${matchType === 'solo' ? 'bg-purple-100 text-purple-800 shadow-sm border border-purple-200' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <User className="w-3.5 h-3.5" /> Solo Event
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
          ) : matchType === 'minigame' ? (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase text-indigo-500">Select Daily Team Set</span>
              <select value={teamSetId} onChange={(e) => setTeamSetId(e.target.value)} className="w-full rounded-md border border-indigo-300 px-3 py-2 text-sm bg-indigo-50 font-semibold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                <option value="base">🏆 Default Unit Teams</option>
                {teamSets.map((ts) => <option key={ts.id} value={ts.id}>{ts.name} ({ts.teams.length} teams)</option>)}
              </select>
            </label>
          ) : (
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-semibold uppercase text-purple-500">Winning Student</span>
              <select value={soloWinnerId} onChange={(e) => setSoloWinnerId(e.target.value)} className="w-full rounded-md border border-purple-300 px-3 py-2 text-sm bg-purple-50 font-semibold text-purple-900 focus:outline-none focus:ring-1 focus:ring-purple-500">
                <option value="" disabled>Select a student...</option>
                {sortedRoster.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
              <tr key={m.id} className={`transition hover:bg-slate-50 ${m.match_type === 'minigame' ? 'bg-indigo-50/30' : m.match_type === 'bracket' ? 'bg-amber-50/30' : m.match_type === 'solo' ? 'bg-purple-50/30' : ''}`}>
                <td className="px-4 py-3">{m.date_str}</td>
                <td className="px-4 py-3 font-semibold text-slate-600">{m.time}</td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {m.match_type === 'minigame' ? (
                    <div className="flex items-center gap-1.5 text-indigo-700">
                      <Users className="w-4 h-4" />
                      <span>Mini-Games / Relays <span className="text-slate-500 font-normal">({m.away_team})</span></span>
                    </div>
                  ) : m.match_type === 'solo' ? (
                    <div className="flex items-center gap-1.5 text-purple-700">
                      <User className="w-4 h-4" />
                      <span>Individual Event <span className="text-slate-500 font-normal">— Winner: {m.away_team}</span></span>
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
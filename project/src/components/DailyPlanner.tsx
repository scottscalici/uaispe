import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Clock, ListTodo, Target, Plus, Trash2, Link as LinkIcon, ArrowUp, ArrowDown, Printer, MapPin, Users } from 'lucide-react';
import type { CalendarDay, UnitData, LessonPlanItem, LessonPlan } from '../types';

interface Props {
  calendar: CalendarDay[];
  units: UnitData[];
  onUpdateCalendarDay: (dateStr: string, updates: Partial<CalendarDay>) => void;
}

const DEFAULT_TIMELINE: LessonPlanItem[] = [
  { id: '1', time: '11:08', activity: 'Floor Spots & Attendance', details: 'Default starting positions.' },
  { id: '2', time: '11:09', activity: 'Explain Purpose', details: 'Review goals for today.' },
  { id: '3', time: '11:10', activity: 'Warmup / Start Workout', details: '' },
  { id: '4', time: '11:20', activity: 'Main Activity', details: '' },
  { id: '5', time: '11:50', activity: 'Cool Down & Check Out', details: 'Check posted teams for tomorrow.' }
];

export default function DailyPlanner({ calendar, units, onUpdateCalendarDay }: Props) {
  const schoolDays = useMemo(() => calendar.filter(d => d.status === 'school' || d.status === 'half-day'), [calendar]);
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    if (!selectedDate && schoolDays.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const nextDay = schoolDays.find(d => d.fecha >= todayStr) || schoolDays[0];
      setSelectedDate(nextDay.fecha);
    }
  }, [schoolDays, selectedDate]);

  const activeDay = useMemo(() => schoolDays.find(d => d.fecha === selectedDate), [schoolDays, selectedDate]);
  
  const activeUnit = useMemo(() => {
    if (!activeDay || !activeDay.unitName) return null;
    return units.find(u => u.unit.unit_name.toLowerCase() === activeDay.unitName?.toLowerCase());
  }, [activeDay, units]);

  const lessonPlan: LessonPlan = useMemo(() => {
    return activeDay?.lessonPlan || { linkedSyllabusDay: null, goals: '', timeline: DEFAULT_TIMELINE };
  }, [activeDay]);

  const linkedSyllabusData = useMemo(() => {
    if (!activeUnit || !lessonPlan.linkedSyllabusDay) return null;
    return activeUnit.syllabus.unit_plan?.find(p => p.day === lessonPlan.linkedSyllabusDay);
  }, [activeUnit, lessonPlan.linkedSyllabusDay]);

  const updatePlan = (patch: Partial<LessonPlan>) => {
    if (!activeDay) return;
    onUpdateCalendarDay(activeDay.fecha, { lessonPlan: { ...lessonPlan, ...patch } });
  };

  const updateTimelineItem = (index: number, patch: Partial<LessonPlanItem>) => {
    const newTimeline = [...lessonPlan.timeline];
    newTimeline[index] = { ...newTimeline[index], ...patch };
    updatePlan({ timeline: newTimeline });
  };

  const addTimelineItem = () => {
    const newTimeline = [...lessonPlan.timeline, { id: Date.now().toString(), time: '', activity: '', details: '' }];
    updatePlan({ timeline: newTimeline });
  };

  const removeTimelineItem = (index: number) => {
    const newTimeline = lessonPlan.timeline.filter((_, i) => i !== index);
    updatePlan({ timeline: newTimeline });
  };

  const moveTimelineItem = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= lessonPlan.timeline.length) return;
    const newTimeline = [...lessonPlan.timeline];
    [newTimeline[index], newTimeline[target]] = [newTimeline[target], newTimeline[index]];
    updatePlan({ timeline: newTimeline });
  };

  const todaysMatches = useMemo(() => {
    if (!activeDay || !activeUnit) return [];
    return activeUnit.schedule.matches
      .filter(m => m.date_str === activeDay.fecha)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [activeDay, activeUnit]);

  const getLogoUrl = (teamName: string) => {
    if (!teamName || teamName === 'TBD' || !activeUnit) return '';
    const normalize = (str: string) => str.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const safeUnit = normalize(activeUnit.unit.unit_name || 'unknown');
    const safeTeam = normalize(teamName);
    return `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${safeUnit}/${safeTeam}.png`;
  };

  const handlePrint = () => window.print();

  if (!activeDay) return null;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: portrait; margin: 12mm; }
          body * { visibility: hidden; }
          #printable-plan, #printable-plan * { visibility: visible; }
          #printable-plan { position: absolute; left: 0; top: 0; width: 100%; background: white !important; }
          .plan-no-print { display: none !important; }
          .plan-block { break-inside: avoid; page-break-inside: avoid; display: flex; gap: 12px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 8px; }
          .plan-time { flex: 0 0 64px; font-weight: 900; font-size: 11pt; color: #000 !important; }
          .plan-activity { font-weight: 700; font-size: 11pt; color: #000 !important; }
          .plan-details { font-size: 9.5pt; color: #334155 !important; margin-top: 2px; }
          .plan-match-row { display: flex !important; align-items: center; justify-content: space-between; border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 10px; margin-bottom: 6px; font-size: 10pt; }
          .plan-logo { width: 18px !important; height: 18px !important; object-fit: contain; }
        }
      `}</style>

      <div className="plan-no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-emerald-600" />
            Daily Run-of-Show Planner
          </h2>
          <p className="text-sm text-slate-500 mt-1">Private minute-by-minute execution notes</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-lg shadow-inner">
            <CalendarDays className="h-5 w-5 text-slate-400 ml-2" />
            <select
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none p-1 cursor-pointer"
            >
              {schoolDays.map(d => (
                <option key={d.fecha} value={d.fecha}>{d.fecha} (Day {d.dia})</option>
              ))}
            </select>
          </div>
          <button onClick={handlePrint} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* Print-only view: today's schedule + the run-of-show, no editing controls */}
      <div id="printable-plan" className="hidden print:block">
        <h1 className="text-2xl font-black text-center mb-1">{activeDay.unitName || 'Class'} — {activeDay.fecha}</h1>
        {activeDay.activity && <p className="text-center text-sm text-slate-600 mb-4">{activeDay.activity}</p>}

        {lessonPlan.goals && (
          <div className="mb-4">
            <h2 className="text-sm font-black uppercase tracking-wider mb-1">Teacher Goals</h2>
            <p className="text-sm">{lessonPlan.goals}</p>
          </div>
        )}

        {todaysMatches.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-black uppercase tracking-wider mb-2">Today's Schedule</h2>
            {todaysMatches.map(m => {
              if (m.match_type === 'minigame') {
                const isBase = !m.team_set_id || m.team_set_id === 'base';
                const displayTeams = isBase ? activeUnit?.unit.baseTeams : activeUnit?.unit.teamSets?.find(ts => ts.id === m.team_set_id)?.teams;
                return (
                  <div key={m.id} className="plan-match-row">
                    <span style={{ fontWeight: 700 }}><Clock className="inline h-3 w-3" /> {m.time} <MapPin className="inline h-3 w-3" /> {m.location}</span>
                    <span style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {displayTeams?.map(t => (
                        <span key={t.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700 }}>
                          <img src={getLogoUrl(t.name)} onError={e => e.currentTarget.style.display = 'none'} className="plan-logo" alt="" /> {t.name}
                        </span>
                      )) ?? <Users className="inline h-3 w-3" />}
                    </span>
                  </div>
                );
              }
              return (
                <div key={m.id} className="plan-match-row">
                  <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {m.home_team !== 'TBD' && <img src={getLogoUrl(m.home_team)} onError={e => e.currentTarget.style.display = 'none'} className="plan-logo" alt="" />}
                    {m.home_team}
                  </span>
                  <span style={{ fontSize: '9pt', color: '#334155' }}>{m.time} • {m.location}</span>
                  <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {m.away_team}
                    {m.away_team !== 'TBD' && <img src={getLogoUrl(m.away_team)} onError={e => e.currentTarget.style.display = 'none'} className="plan-logo" alt="" />}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <h2 className="text-sm font-black uppercase tracking-wider mb-2">Run of Show</h2>
        {lessonPlan.timeline.map(item => (
          <div key={item.id} className="plan-block">
            <div className="plan-time">{item.time}</div>
            <div>
              <div className="plan-activity">{item.activity}</div>
              {item.details && <div className="plan-details">{item.details}</div>}
            </div>
          </div>
        ))}
      </div>

      <div className="plan-no-print grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-slate-800 rounded-xl p-5 text-white shadow-md">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-1">Calendar Context</h3>
            <div className="text-xl font-black mb-2">{activeDay.unitName || 'No Unit Scheduled'}</div>
            {activeDay.activity && <div className="text-slate-300 text-sm">🗓️ Activity: {activeDay.activity}</div>}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <LinkIcon className="h-5 w-5 text-blue-500" />
              <h3 className="font-bold text-slate-800">Link to Syllabus</h3>
            </div>
            
            {activeUnit ? (
              <select 
                value={lessonPlan.linkedSyllabusDay || ''} 
                onChange={e => updatePlan({ linkedSyllabusDay: e.target.value ? Number(e.target.value) : null })}
                className="w-full border border-slate-300 rounded-md p-2 text-sm font-semibold text-slate-700 mb-4"
              >
                <option value="">-- Do not link --</option>
                {activeUnit.syllabus.unit_plan?.map(p => (
                  <option key={p.day} value={p.day}>Unit Day {p.day}: {p.topic}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mb-4">
                Assign a valid unit to this date in the Master Calendar to link syllabus days.
              </p>
            )}

            {linkedSyllabusData && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm space-y-3">
                {linkedSyllabusData.topic && <div><strong className="text-blue-800">Topic:</strong> <span className="text-blue-900">{linkedSyllabusData.topic}</span></div>}
                {linkedSyllabusData.skills && <div><strong className="text-blue-800">Skills:</strong> <span className="text-blue-900">{linkedSyllabusData.skills}</span></div>}
                {linkedSyllabusData.activities && linkedSyllabusData.activities.length > 0 && (
                  <div>
                    <strong className="text-blue-800">Planned Activities:</strong>
                    <ul className="list-disc pl-4 mt-1 text-blue-900">
                      {linkedSyllabusData.activities.map((act, i) => <li key={i}>{act.name}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-emerald-500" />
              <h3 className="font-bold text-slate-800">Teacher Goals for Today</h3>
            </div>
            <textarea 
              value={lessonPlan.goals || ''}
              onChange={e => updatePlan({ goals: e.target.value })}
              placeholder="e.g. Focus on keeping transitions under 30 seconds..."
              className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-emerald-500 min-h-[100px] resize-y"
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-6 w-6 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-800">Minute-by-Minute Timeline</h3>
            </div>
            <button 
              onClick={addTimelineItem}
              className="flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-sm font-bold transition"
            >
              <Plus className="w-4 h-4" /> Add Block
            </button>
          </div>

          <div className="space-y-4">
            {lessonPlan.timeline.map((item, index) => (
              <div key={item.id} className="group flex gap-3 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors bg-slate-50">
                <div className="flex shrink-0 flex-col gap-1 pt-1">
                  <button
                    onClick={() => moveTimelineItem(index, -1)}
                    disabled={index === 0}
                    title="Move up"
                    className="rounded p-1 text-slate-400 hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-20 disabled:hover:bg-transparent transition"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveTimelineItem(index, 1)}
                    disabled={index === lessonPlan.timeline.length - 1}
                    title="Move down"
                    className="rounded p-1 text-slate-400 hover:bg-indigo-100 hover:text-indigo-700 disabled:opacity-20 disabled:hover:bg-transparent transition"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="w-20 shrink-0">
                  <input
                    type="text"
                    value={item.time}
                    onChange={e => updateTimelineItem(index, { time: e.target.value })}
                    placeholder="11:00"
                    className="w-full bg-white border border-slate-300 rounded p-2 text-sm font-black text-slate-700 text-center focus:border-indigo-500 outline-none"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input 
                      type="text" 
                      value={item.activity} 
                      onChange={e => updateTimelineItem(index, { activity: e.target.value })}
                      placeholder="Activity Name (e.g. 4 Relay Races)"
                      className="w-full bg-white border border-slate-300 rounded p-2 text-sm font-bold text-slate-900 focus:border-indigo-500 outline-none"
                    />
                    <button onClick={() => removeTimelineItem(index)} className="text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea 
                    value={item.details} 
                    onChange={e => updateTimelineItem(index, { details: e.target.value })}
                    placeholder="Specific variations, rules, or teacher notes (e.g. 1st race run, 2nd dribble...)"
                    className="w-full bg-white border border-slate-300 rounded p-2 text-sm text-slate-600 focus:border-indigo-500 outline-none min-h-[60px] resize-y"
                  />
                </div>
              </div>
            ))}
            
            {lessonPlan.timeline.length === 0 && (
              <div className="text-center p-8 text-slate-400 italic border-2 border-dashed border-slate-200 rounded-xl">
                No timeline items yet. Click "Add Block" to start planning!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
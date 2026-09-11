import { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Clock, ListTodo, Target, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
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

  if (!activeDay) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ListTodo className="h-6 w-6 text-emerald-600" />
            Daily Run-of-Show Planner
          </h2>
          <p className="text-sm text-slate-500 mt-1">Private minute-by-minute execution notes</p>
        </div>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
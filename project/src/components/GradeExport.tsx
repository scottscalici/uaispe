import { useMemo, useState } from 'react';
import { CalendarRange, Plus, Trash2, AlertTriangle, GraduationCap, Download, Wand2 } from 'lucide-react';
import type { Player, Quarter, DailyLogMap, CalendarDay } from '../types';
import { computeCumulativeScore, buildGradeComment, findGradebookGaps } from '../grading';
import { downloadCsv } from '../csvExport';

interface Props {
  quarters: Quarter[];
  onSaveQuarters: (quarters: Quarter[]) => void;
  roster: Player[];
  gradebook: Record<string, DailyLogMap>;
  classId: string;
  masterCalendar: CalendarDay[];
  onFillGaps: (fills: { date: string; playerId: string }[]) => void;
}

const emptyQuarter = (): Quarter => ({
  id: `q_${Date.now()}`,
  label: '',
  startDate: '',
  endDate: '',
});

export default function GradeExport({ quarters, onSaveQuarters, roster, gradebook, classId, masterCalendar, onFillGaps }: Props) {
  const [expanded, setExpanded] = useState(true);
  const [selectedQuarterId, setSelectedQuarterId] = useState<string>('');

  // A quarter with no start date yet (freshly added) sorts to the end, not the top - otherwise
  // it would jump above already-dated rows the moment it's added, moving inputs out from under
  // whatever the admin is mid-typing.
  const sortedQuarters = [...quarters].sort((a, b) => (a.startDate || '9999-99-99').localeCompare(b.startDate || '9999-99-99'));

  const todayStr = new Date().toISOString().slice(0, 10);
  // Defaults to the quarter containing today; falls back to the most recent one configured
  // so there's still something useful to look at after a quarter has ended but grades aren't
  // due yet.
  const defaultQuarterId = useMemo(() => {
    const current = sortedQuarters.find((q) => q.startDate && q.endDate && todayStr >= q.startDate && todayStr <= q.endDate);
    if (current) return current.id;
    return sortedQuarters[sortedQuarters.length - 1]?.id || '';
  }, [sortedQuarters, todayStr]);

  const activeQuarterId = selectedQuarterId || defaultQuarterId;
  const activeQuarter = quarters.find((q) => q.id === activeQuarterId) || null;

  const activeRoster = useMemo(() => roster.filter((p) => p.availability !== 'out'), [roster]);

  const studentScores = useMemo(() => {
    if (!activeQuarter || !activeQuarter.startDate || !activeQuarter.endDate) return [];
    return [...activeRoster]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({ player: p, totals: computeCumulativeScore(gradebook, p.id, activeQuarter) }));
  }, [activeRoster, gradebook, activeQuarter]);

  const missingSchoologyId = activeRoster.filter((p) => !p.schoologyId);

  // Each class only ever meets on one cycle (e.g. "3A" is the A-Day section) - same lock
  // used everywhere else this matters.
  const cycle = classId.includes('A') ? 'A' : classId.includes('B') ? 'B' : null;

  const gaps = useMemo(() => {
    if (!activeQuarter || !activeQuarter.startDate || !activeQuarter.endDate) return [];
    const classMeetingDates = masterCalendar
      .filter((d) => (d.status === 'school' || d.status === 'half-day') && (!cycle || d.ciclo === cycle))
      .filter((d) => d.fecha >= activeQuarter.startDate && d.fecha <= activeQuarter.endDate)
      .map((d) => d.fecha);
    return findGradebookGaps(classMeetingDates, gradebook, activeRoster.map((p) => p.id));
  }, [masterCalendar, cycle, activeQuarter, gradebook, activeRoster]);

  const playerNameById = useMemo(() => new Map(roster.map((p) => [p.id, p.name])), [roster]);

  const handleQuickFill = () => {
    const fills = gaps.flatMap((gap) => gap.missingPlayerIds.map((playerId) => ({ date: gap.date, playerId })));
    if (fills.length === 0) return;
    if (!confirm(`Give full credit (Present) for ${fills.length} missing log entr${fills.length === 1 ? 'y' : 'ies'} across ${gaps.length} day${gaps.length === 1 ? '' : 's'}? This only fills in gaps - it never overwrites a day you already logged.`)) return;
    onFillGaps(fills);
  };

  const handleExport = () => {
    if (!activeQuarter) return;
    const header = ['Unique User ID', `${activeQuarter.label || 'Quarter'} Score`, 'Comment'];
    const rows = studentScores.map(({ player, totals }) => [
      player.schoologyId || '',
      String(totals.percentage),
      buildGradeComment(gradebook, player.id, activeQuarter),
    ]);
    const safeLabel = (activeQuarter.label || 'quarter').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    downloadCsv(`grades_${safeLabel}_${todayStr}.csv`, [header, ...rows]);
  };

  const updateQuarter = (id: string, patch: Partial<Quarter>) => {
    onSaveQuarters(quarters.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const addQuarter = () => onSaveQuarters([...quarters, emptyQuarter()]);

  const removeQuarter = (id: string) => {
    if (!confirm('Delete this quarter? This cannot be undone.')) return;
    onSaveQuarters(quarters.filter((q) => q.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full flex items-center justify-between gap-3 text-left"
        >
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <CalendarRange className="w-5 h-5 text-blue-600" /> Quarter Dates
          </h3>
        </button>
        <p className="text-sm text-slate-500 mt-1 mb-4">
          Shared by both A Day and B Day classes - set once per year. Each class's cumulative
          score is earned ÷ possible across the logged days that fall inside a quarter's dates,
          so the two classes meeting a different number of times doesn't matter.
        </p>

        {expanded && (
          <div className="space-y-3">
            {sortedQuarters.map((q) => {
              const datesInvalid = !!q.startDate && !!q.endDate && q.endDate < q.startDate;
              return (
                <div key={q.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 items-start">
                    <input
                      type="text"
                      value={q.label}
                      onChange={(e) => updateQuarter(q.id, { label: e.target.value })}
                      placeholder="e.g. Quarter 1"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-blue-500 bg-white"
                    />
                    <label className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-slate-500 whitespace-nowrap">Start</span>
                      <input
                        type="date"
                        value={q.startDate}
                        onChange={(e) => updateQuarter(q.id, { startDate: e.target.value })}
                        className="border border-slate-300 rounded-lg px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 bg-white"
                      />
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-slate-500 whitespace-nowrap">End</span>
                      <input
                        type="date"
                        value={q.endDate}
                        onChange={(e) => updateQuarter(q.id, { endDate: e.target.value })}
                        className={`border rounded-lg px-2 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 bg-white ${datesInvalid ? 'border-red-400' : 'border-slate-300'}`}
                      />
                    </label>
                    <button
                      onClick={() => removeQuarter(q.id)}
                      title="Delete quarter"
                      className="p-2 text-slate-400 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {datesInvalid && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-red-600">
                      <AlertTriangle className="h-3.5 w-3.5" /> End date is before the start date.
                    </p>
                  )}
                </div>
              );
            })}

            {sortedQuarters.length === 0 && (
              <div className="p-6 text-center text-slate-400 italic bg-slate-50 rounded-lg border border-slate-200">
                No quarters set up yet.
              </div>
            )}

            <button
              onClick={addQuarter}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
            >
              <Plus className="h-4 w-4" /> Add Quarter
            </button>
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
            <GraduationCap className="w-5 h-5 text-blue-600" /> Cumulative Scores
          </h3>
          <select
            value={activeQuarterId}
            onChange={(e) => setSelectedQuarterId(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 bg-white outline-none focus:border-blue-500"
          >
            {sortedQuarters.length === 0 && <option value="">No quarters set up yet</option>}
            {sortedQuarters.map((q) => (
              <option key={q.id} value={q.id}>{q.label || '(untitled quarter)'}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Earned ÷ possible across this class's logged days inside the quarter's dates - a
          preview to sanity-check before exporting. A day nobody logged for this student just
          isn't counted, same as an absence dropping out automatically.
        </p>

        {activeQuarter && (!activeQuarter.startDate || !activeQuarter.endDate) && (
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-600">
            <AlertTriangle className="h-4 w-4" /> This quarter is missing a start or end date.
          </p>
        )}

        {studentScores.length > 0 && (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Earned</th>
                  <th className="p-3">Possible</th>
                  <th className="p-3">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentScores.map(({ player, totals }) => (
                  <tr key={player.id}>
                    <td className="p-3 font-semibold text-slate-800">{player.name}</td>
                    <td className="p-3 text-slate-700">{totals.earned}</td>
                    <td className="p-3 text-slate-700">{totals.possible}</td>
                    <td className="p-3 font-bold text-slate-800">{totals.possible > 0 ? `${totals.percentage}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeRoster.length === 0 && (
          <div className="p-6 text-center text-slate-400 italic bg-slate-50 rounded-lg border border-slate-200">
            No active students on this class's roster yet.
          </div>
        )}
      </div>

      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg mb-1">
          <Download className="w-5 h-5 text-blue-600" /> Export to Schoology
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          One row per student in this class for the quarter selected above: their Schoology ID,
          their cumulative score as a percentage, and a comment listing only dated deductions
          and statuses (tardy, zero day, excused) - full-credit days and absences are left out.
          Schoology's import matches the Unique User ID column, then you map the score column
          to an assignment you've already created there; test with one row before trusting the
          comment column actually imports.
        </p>

        {gaps.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                {gaps.length} class day{gaps.length === 1 ? '' : 's'} this quarter {gaps.length === 1 ? 'has' : 'have'}{' '}
                at least one student with no log entry at all - those days are simply skipped for
                that student right now rather than counted either way.
              </span>
            </div>
            <ul className="mt-2 ml-6 list-disc space-y-0.5">
              {gaps.map((gap) => (
                <li key={gap.date}>
                  {gap.date}: {gap.missingPlayerIds.map((id) => playerNameById.get(id) || id).join(', ')}
                </li>
              ))}
            </ul>
            <button
              onClick={handleQuickFill}
              className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition"
            >
              <Wand2 className="h-4 w-4" /> Quick Fill: Give Everyone Full Credit
            </button>
          </div>
        )}

        {missingSchoologyId.length > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              {missingSchoologyId.length} student{missingSchoologyId.length === 1 ? '' : 's'} on this
              roster {missingSchoologyId.length === 1 ? "hasn't" : "haven't"} been matched to a
              Schoology ID yet (Roster → Schoology Import): {missingSchoologyId.map((p) => p.name).join(', ')}.
              They'll still export, just with a blank ID.
            </span>
          </div>
        )}

        <button
          onClick={handleExport}
          disabled={!activeQuarter || studentScores.length === 0}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" /> Download CSV
        </button>
      </div>
    </div>
  );
}

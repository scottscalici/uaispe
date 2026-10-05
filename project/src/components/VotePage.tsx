import { useEffect, useMemo, useState } from 'react';
import { Users, CheckCircle2, AlertTriangle, Loader2, ChevronLeft } from 'lucide-react';
import type { ClassData, Player } from '../types';
import { loadAllClasses, submitTeammateVote } from '../firestore';

type Step = 'loading' | 'error' | 'class' | 'unit' | 'voter' | 'vote' | 'submitting' | 'done' | 'already_voted';

const voteKey = (classId: string, unitId: string, voterId: string) => `pe_voted_${classId}_${unitId}_${voterId}`;

/** Reads class/unit out of a link like "#vote?class=3A&unit=U_123" - set by the admin's
 *  per-unit "Copy Link" button so a sent-out link can skip straight to "which one are you?" */
function parseLinkParams(): { classId: string | null; unitId: string | null } {
  const hash = window.location.hash;
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return { classId: null, unitId: null };
  const params = new URLSearchParams(hash.slice(queryStart + 1));
  return { classId: params.get('class'), unitId: params.get('unit') };
}

export default function VotePage() {
  const [step, setStep] = useState<Step>('loading');
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [voterId, setVoterId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllClasses()
      .then((result) => {
        setClasses(result);
        const { classId, unitId } = parseLinkParams();
        const linkedClass = classId ? result.find((c) => c.id === classId) : undefined;
        const linkedUnit = linkedClass && unitId ? linkedClass.units.find((u) => u.id === unitId) : undefined;
        if (linkedClass && linkedUnit) {
          setSelectedClassId(linkedClass.id);
          setSelectedUnitId(linkedUnit.id);
          setStep('voter');
        } else {
          setStep('class');
        }
      })
      .catch(() => { setError('Could not load classes. Please try again later.'); setStep('error'); });
  }, []);

  const selectedClass = classes.find((c) => c.id === selectedClassId) || null;

  const handlePickVoter = (id: string) => {
    if (!selectedClassId || !selectedUnitId) return;
    setVoterId(id);
    let alreadyVoted = false;
    try { alreadyVoted = !!localStorage.getItem(voteKey(selectedClassId, selectedUnitId, id)); } catch { /* ignore */ }
    setStep(alreadyVoted ? 'already_voted' : 'vote');
  };

  const handleSubmitVote = async (votedForId: string) => {
    if (!selectedClassId || !selectedUnitId || !voterId) return;
    setStep('submitting');
    try {
      const result = await submitTeammateVote(selectedClassId, selectedUnitId, voterId, votedForId);
      try { localStorage.setItem(voteKey(selectedClassId, selectedUnitId, voterId), '1'); } catch { /* ignore */ }
      setStep(result === 'ok' ? 'done' : 'already_voted');
    } catch (err) {
      setError('Something went wrong submitting your vote. Please try again.');
      setStep('error');
    }
  };

  const activeRoster = useMemo(
    () => (selectedClass?.roster || []).filter((p) => p.availability !== 'out'),
    [selectedClass],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-indigo-900">
          <Users className="h-7 w-7 text-indigo-500" /> Best Teammate Vote
        </div>

        {step === 'loading' && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-10 text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm">
            <AlertTriangle className="h-6 w-6" />
            {error}
          </div>
        )}

        {step === 'class' && (
          <div className="space-y-2">
            <p className="text-center text-sm font-semibold text-slate-500">Which class are you in?</p>
            {classes.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedClassId(c.id); setStep('unit'); }}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left text-lg font-bold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                Class {c.id}
              </button>
            ))}
          </div>
        )}

        {step === 'unit' && selectedClass && (
          <div className="space-y-2">
            <BackButton onClick={() => setStep('class')} />
            <p className="text-center text-sm font-semibold text-slate-500">Which unit just finished?</p>
            {(selectedClass.units || []).map((u) => (
              <button
                key={u.id}
                onClick={() => { setSelectedUnitId(u.id); setStep('voter'); }}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left text-lg font-bold text-slate-800 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50"
              >
                {u.unit.unit_name}
              </button>
            ))}
          </div>
        )}

        {step === 'voter' && (
          <div className="space-y-2">
            <BackButton onClick={() => setStep('unit')} />
            <p className="text-center text-sm font-semibold text-slate-500">Which one are you?</p>
            <RosterPicker roster={activeRoster} onPick={handlePickVoter} />
          </div>
        )}

        {step === 'vote' && voterId && (
          <div className="space-y-2">
            <BackButton onClick={() => setStep('voter')} />
            <p className="text-center text-sm font-semibold text-slate-500">Who was the best teammate?</p>
            <RosterPicker roster={activeRoster.filter((p) => p.id !== voterId)} onPick={handleSubmitVote} />
          </div>
        )}

        {step === 'submitting' && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-10 text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" /> Submitting...
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center shadow-sm">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            <p className="text-lg font-bold text-emerald-800">Vote submitted!</p>
            <p className="text-sm text-emerald-700">Thanks for voting.</p>
          </div>
        )}

        {step === 'already_voted' && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
            <p className="text-lg font-bold text-amber-800">You've already voted</p>
            <p className="text-sm text-amber-700">Only one vote per person for this unit.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1 text-sm font-semibold text-slate-400 hover:text-slate-600">
      <ChevronLeft className="h-4 w-4" /> Back
    </button>
  );
}

function RosterPicker({ roster, onPick }: { roster: Player[]; onPick: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(
    () => roster.filter((p) => p.name.toLowerCase().includes(query.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name)),
    [roster, query],
  );

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search name..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      <div className="max-h-96 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        {filtered.map((p) => (
          <button
            key={p.id}
            onClick={() => onPick(p.id)}
            className="w-full rounded-lg px-3 py-2.5 text-left font-semibold text-slate-700 transition hover:bg-indigo-50"
          >
            {p.name}
          </button>
        ))}
        {filtered.length === 0 && <p className="p-3 text-center text-sm text-slate-400">No matches</p>}
      </div>
    </div>
  );
}

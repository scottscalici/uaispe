import { useEffect, useMemo, useState } from 'react';
import { Vote, CheckCircle2, AlertTriangle, Loader2, Check } from 'lucide-react';
import type { Poll } from '../types';
import { loadPolls, submitPollVote } from '../firestore';

type Step = 'loading' | 'not_found' | 'error' | 'vote' | 'submitting' | 'done' | 'already_voted';

const VOTER_TOKEN_KEY = 'pe_poll_voter_token';
const votedKey = (pollId: string) => `pe_poll_voted_${pollId}`;

/** Reads the poll id out of a link like "#poll?id=poll_12345" - set by the admin's
 *  "Copy Link" button on a poll in the Polls tab. */
function parsePollId(): string | null {
  const hash = window.location.hash;
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return null;
  const params = new URLSearchParams(hash.slice(queryStart + 1));
  return params.get('id');
}

/** A random id persisted per-browser so a repeat vote from the same device is rejected
 *  server-side (see submitPollVote) - not tied to any student identity, since a poll has
 *  no roster step, just a question. */
function getVoterToken(): string {
  try {
    const existing = localStorage.getItem(VOTER_TOKEN_KEY);
    if (existing) return existing;
    const fresh = `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(VOTER_TOKEN_KEY, fresh);
    return fresh;
  } catch {
    return `v_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

export default function PollVotePage() {
  const [step, setStep] = useState<Step>('loading');
  const [poll, setPoll] = useState<Poll | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    const pollId = parsePollId();
    if (!pollId) { setStep('not_found'); return; }

    let alreadyVoted = false;
    try { alreadyVoted = !!localStorage.getItem(votedKey(pollId)); } catch { /* ignore */ }

    loadPolls()
      .then((polls) => {
        const result = polls.find((p) => p.id === pollId) || null;
        if (!result) { setStep('not_found'); return; }
        setPoll(result);
        setStep(alreadyVoted ? 'already_voted' : 'vote');
      })
      .catch(() => setStep('error'));
  }, []);

  // Every question up to and including the first one whose picked answer ends the poll -
  // later questions never become required, and disappear once that answer is chosen (e.g.
  // picking "Move on" means the team/format questions after it don't apply).
  const activeQuestions = useMemo(() => {
    if (!poll) return [];
    const result = [];
    for (const q of poll.questions) {
      result.push(q);
      const selected = q.options.find((o) => o.id === answers[q.id]);
      if (selected?.endsPoll) break;
    }
    return result;
  }, [poll, answers]);

  const allAnswered = activeQuestions.length > 0 && activeQuestions.every((q) => !!answers[q.id]);

  const handleSubmit = async () => {
    if (!poll || !allAnswered) return;
    setStep('submitting');
    try {
      const answerList = activeQuestions.map((q) => ({ questionId: q.id, optionId: answers[q.id] }));
      const result = await submitPollVote(poll.id, answerList, getVoterToken());
      try { localStorage.setItem(votedKey(poll.id), '1'); } catch { /* ignore */ }
      setStep(result === 'ok' ? 'done' : 'already_voted');
    } catch {
      setStep('error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white flex items-start justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-center gap-2 text-2xl font-bold text-indigo-900">
          <Vote className="h-7 w-7 text-indigo-500" /> Class Poll
        </div>

        {step === 'loading' && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-10 text-slate-500 shadow-sm">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading...
          </div>
        )}

        {step === 'not_found' && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm">
            <AlertTriangle className="h-6 w-6" />
            This poll link isn't valid, or the poll has been removed.
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700 shadow-sm">
            <AlertTriangle className="h-6 w-6" />
            Something went wrong. Please try again.
          </div>
        )}

        {step === 'vote' && poll && (
          <div className="space-y-4">
            {activeQuestions.map((q, qi) => (
              <div key={q.id} className="space-y-2">
                <div className="rounded-xl bg-indigo-600 px-4 py-3 shadow-sm">
                  {poll.questions.length > 1 && (
                    <p className="text-xs font-bold uppercase tracking-wide text-indigo-200 mb-0.5">
                      Question {qi + 1} of {activeQuestions.length}
                    </p>
                  )}
                  <p className="text-lg font-black text-white leading-snug">{q.question}</p>
                </div>
                <div className="space-y-1.5">
                  {q.options.map((o) => {
                    const selected = answers[q.id] === o.id;
                    return (
                      <button
                        key={o.id}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                        className={`w-full flex items-center justify-between gap-2 rounded-xl border p-3.5 text-left font-semibold shadow-sm transition ${
                          selected
                            ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:bg-indigo-50/50'
                        }`}
                      >
                        {o.text}
                        {selected && <Check className="h-5 w-5 flex-shrink-0 text-indigo-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="w-full rounded-xl bg-indigo-600 py-3.5 text-center text-lg font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Vote
            </button>
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
            <p className="text-sm text-amber-700">Only one vote per person for this poll.</p>
          </div>
        )}
      </div>
    </div>
  );
}

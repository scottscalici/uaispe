import { useEffect, useState } from 'react';
import { BarChart3, Plus, Trash2, ChevronDown, ChevronUp, Link2, Check, ListOrdered, BarChart } from 'lucide-react';
import type { Poll, PollQuestion, PollVoteRecord } from '../types';
import { effectiveTotalVotes, subscribeToPollVotes } from '../firestore';

interface Props {
  polls: Poll[];
  onCreatePoll: (poll: Poll) => void;
}

interface DraftOption {
  text: string;
  endsPoll: boolean;
}

interface DraftQuestion {
  question: string;
  options: DraftOption[];
}

const emptyOption = (): DraftOption => ({ text: '', endsPoll: false });
const emptyQuestion = (): DraftQuestion => ({ question: '', options: [emptyOption(), emptyOption()] });

export default function PollsManager({ polls, onCreatePoll }: Props) {
  const [questions, setQuestions] = useState<DraftQuestion[]>([emptyQuestion()]);
  const [expandedId, setExpandedId] = useState<string | null>(polls[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showResponses, setShowResponses] = useState(false);
  const [voteRecords, setVoteRecords] = useState<PollVoteRecord[]>([]);

  // Individual responses are only fetched for whichever poll is both expanded and on the
  // Responses tab - no need to keep a listener open for every poll at once.
  useEffect(() => {
    if (!expandedId || !showResponses) { setVoteRecords([]); return; }
    return subscribeToPollVotes(expandedId, setVoteRecords);
  }, [expandedId, showResponses]);

  const updateQuestionText = (qi: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, question: value } : q)));
  };
  const updateOptionText = (qi: number, oi: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, text: value } : o)) } : q)));
  };
  const toggleOptionEndsPoll = (qi: number, oi: number) => {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: q.options.map((o, j) => (j === oi ? { ...o, endsPoll: !o.endsPoll } : o)) } : q)));
  };
  const addOption = (qi: number) => {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: [...q.options, emptyOption()] } : q)));
  };
  const removeOption = (qi: number, oi: number) => {
    setQuestions((prev) => prev.map((q, i) => (i === qi ? { ...q, options: q.options.filter((_, j) => j !== oi) } : q)));
  };
  const addQuestion = () => setQuestions((prev) => [...prev, emptyQuestion()]);
  const removeQuestion = (qi: number) => setQuestions((prev) => prev.filter((_, i) => i !== qi));

  const cleanedQuestions = questions
    .map((q) => ({
      question: q.question.trim(),
      options: q.options.map((o) => ({ text: o.text.trim(), endsPoll: o.endsPoll })).filter((o) => o.text),
    }))
    .filter((q) => q.question && q.options.length >= 2);
  const canCreate = cleanedQuestions.length > 0 && cleanedQuestions.length === questions.length;

  const handleCreate = () => {
    if (!canCreate) return;
    const poll: Poll = {
      id: `poll_${Date.now()}`,
      questions: cleanedQuestions.map((q, qi): PollQuestion => ({
        id: `q_${qi}`,
        question: q.question,
        options: q.options.map((o, oi) => ({ id: `opt_${oi}`, text: o.text, votes: 0, endsPoll: o.endsPoll || undefined })),
      })),
      createdAt: Date.now(),
      totalVotes: 0,
    };
    onCreatePoll(poll);
    setQuestions([emptyQuestion()]);
    setExpandedId(poll.id);
  };

  const copyPollLink = async (poll: Poll) => {
    const link = `${window.location.origin}${window.location.pathname}#poll?id=${encodeURIComponent(poll.id)}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(poll.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt('Copy this link to send to students:', link);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
          <Plus className="w-5 h-5 text-blue-600" /> Create New Poll
        </h3>

        {questions.map((q, qi) => (
          <div key={qi} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Question {qi + 1}</span>
              {questions.length > 1 && (
                <button onClick={() => removeQuestion(qi)} title="Remove question" className="p-1 text-slate-400 hover:text-red-500 transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <input
              type="text"
              value={q.question}
              onChange={(e) => updateQuestionText(qi, e.target.value)}
              placeholder="e.g. Football was a hit - one more day, or move on?"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-blue-500"
            />
            <div className="space-y-2">
              {q.options.map((o, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={o.text}
                    onChange={(e) => updateOptionText(qi, oi, e.target.value)}
                    placeholder={`Option ${oi + 1}`}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500 bg-white"
                  />
                  {qi < questions.length - 1 && (
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 whitespace-nowrap">
                      <input type="checkbox" checked={o.endsPoll} onChange={() => toggleOptionEndsPoll(qi, oi)} className="accent-blue-600" />
                      Ends poll
                    </label>
                  )}
                  {q.options.length > 2 && (
                    <button onClick={() => removeOption(qi, oi)} title="Remove option" className="p-2 text-slate-400 hover:text-red-500 transition">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => addOption(qi)} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
              <Plus className="h-4 w-4" /> Add Option
            </button>
          </div>
        ))}

        <div className="flex items-center justify-between pt-1">
          <button onClick={addQuestion} className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
            <Plus className="h-4 w-4" /> Add Question
          </button>
          <button
            onClick={handleCreate}
            disabled={!canCreate}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <BarChart3 className="h-4 w-4" /> Create Poll
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {polls.length === 0 && (
          <div className="p-8 text-center text-slate-400 italic bg-white rounded-xl shadow-sm border border-slate-200">
            No polls yet. Create one above, then copy its link to send to students.
          </div>
        )}
        {polls.map((poll) => {
          const totalVotes = effectiveTotalVotes(poll);
          const expanded = expandedId === poll.id;
          return (
            <div key={poll.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => { setExpandedId(expanded ? null : poll.id); setShowResponses(false); }}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-bold text-slate-800">
                    {poll.questions[0]?.question}
                    {poll.questions.length > 1 && (
                      <span className="ml-2 align-middle rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                        +{poll.questions.length - 1} more question{poll.questions.length - 1 === 1 ? '' : 's'}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {totalVotes} vote{totalVotes === 1 ? '' : 's'} · {new Date(poll.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {expanded ? <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />}
              </button>

              {expanded && (
                <div className="border-t border-slate-100 p-4 space-y-5">
                  <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 w-fit">
                    <button
                      onClick={() => setShowResponses(false)}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${!showResponses ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <BarChart className="h-3.5 w-3.5" /> Tally
                    </button>
                    <button
                      onClick={() => setShowResponses(true)}
                      className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-all ${showResponses ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      <ListOrdered className="h-3.5 w-3.5" /> Individual Responses
                    </button>
                  </div>

                  {showResponses ? (
                    <PollResponsesTable poll={poll} votes={voteRecords} />
                  ) : poll.questions.map((q) => {
                    const maxVotes = Math.max(1, ...q.options.map((o) => o.votes));
                    return (
                      <div key={q.id} className="space-y-2">
                        <p className="font-bold text-slate-800">{q.question}</p>
                        {q.options.map((o) => (
                          <div key={o.id}>
                            <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-1">
                              <span>
                                {o.text}
                                {o.endsPoll && (
                                  <span className="ml-1.5 text-xs font-bold text-slate-400">(ends poll)</span>
                                )}
                              </span>
                              <span>{o.votes}</span>
                            </div>
                            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{ width: `${(o.votes / maxVotes) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <button
                    onClick={() => copyPollLink(poll)}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200 transition"
                  >
                    {copiedId === poll.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
                    {copiedId === poll.id ? 'Link Copied!' : 'Copy Poll Link'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** One row per submission, every question's picked answer shown together, earliest first -
 *  so e.g. "Team 1 picked the Pistons" reads as one row instead of two separate tallies, and
 *  when two submissions pick the same option on a question, scanning top-to-bottom shows
 *  which one got there first. A later repeat of an option already seen on that question gets
 *  a small "already picked" flag - respondents are anonymous, so that's as specific as it can
 *  get, but the row order above it already shows who came first. */
function PollResponsesTable({ poll, votes }: { poll: Poll; votes: PollVoteRecord[] }) {
  if (votes.length === 0) {
    return <p className="text-sm text-slate-400 italic">No responses yet.</p>;
  }

  const seenPerQuestion: Record<string, Set<string>> = {};

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs font-bold uppercase text-slate-400">
          <tr>
            <th className="px-2 py-1.5 whitespace-nowrap">#</th>
            {poll.questions.map((q) => (
              <th key={q.id} className="px-2 py-1.5">{q.question}</th>
            ))}
            <th className="px-2 py-1.5 whitespace-nowrap">Submitted</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {votes.map((v, i) => (
            <tr key={v.voterToken}>
              <td className="px-2 py-2 text-slate-400 font-semibold">{i + 1}</td>
              {poll.questions.map((q) => {
                const optionId = v.answers.find((a) => a.questionId === q.id)?.optionId;
                const option = q.options.find((o) => o.id === optionId);
                if (!option) return <td key={q.id} className="px-2 py-2 text-slate-300 italic">—</td>;
                seenPerQuestion[q.id] = seenPerQuestion[q.id] || new Set();
                const isRepeat = seenPerQuestion[q.id].has(option.id);
                seenPerQuestion[q.id].add(option.id);
                return (
                  <td key={q.id} className="px-2 py-2 font-semibold text-slate-700">
                    {option.text}
                    {isRepeat && (
                      <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700" title="Another earlier submission also picked this">
                        already picked
                      </span>
                    )}
                  </td>
                );
              })}
              <td className="px-2 py-2 whitespace-nowrap text-xs text-slate-400">{new Date(v.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { useState } from 'react';
import { BarChart3, Plus, Trash2, ChevronDown, ChevronUp, Link2, Check } from 'lucide-react';
import type { Poll, PollQuestion } from '../types';
import { effectiveTotalVotes } from '../firestore';

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
                onClick={() => setExpandedId(expanded ? null : poll.id)}
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
                  {poll.questions.map((q) => {
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

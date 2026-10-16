import { useState } from 'react';
import { BarChart3, Plus, Trash2, ChevronDown, ChevronUp, Link2, Check } from 'lucide-react';
import type { Poll } from '../types';

interface Props {
  polls: Poll[];
  onCreatePoll: (poll: Poll) => void;
}

export default function PollsManager({ polls, onCreatePoll }: Props) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [expandedId, setExpandedId] = useState<string | null>(polls[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const updateOption = (i: number, value: string) => {
    setOptions((prev) => prev.map((o, idx) => (idx === i ? value : o)));
  };
  const addOption = () => setOptions((prev) => [...prev, '']);
  const removeOption = (i: number) => setOptions((prev) => prev.filter((_, idx) => idx !== i));

  const cleanedOptions = options.map((o) => o.trim()).filter(Boolean);
  const canCreate = question.trim().length > 0 && cleanedOptions.length >= 2;

  const handleCreate = () => {
    if (!canCreate) return;
    const poll: Poll = {
      id: `poll_${Date.now()}`,
      question: question.trim(),
      options: cleanedOptions.map((text, i) => ({ id: `opt_${i}`, text, votes: 0 })),
      createdAt: Date.now(),
    };
    onCreatePoll(poll);
    setQuestion('');
    setOptions(['', '']);
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
      <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 space-y-3">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
          <Plus className="w-5 h-5 text-blue-600" /> Create New Poll
        </h3>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Football was a hit - one more day, or move on?"
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 font-semibold text-slate-800 outline-none focus:border-blue-500"
        />
        <div className="space-y-2">
          {options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={o}
                onChange={(e) => updateOption(i, e.target.value)}
                placeholder={`Option ${i + 1}`}
                className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 outline-none focus:border-blue-500"
              />
              {options.length > 2 && (
                <button
                  onClick={() => removeOption(i)}
                  title="Remove option"
                  className="p-2 text-slate-400 hover:text-red-500 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={addOption}
            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            <Plus className="h-4 w-4" /> Add Option
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
          const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);
          const expanded = expandedId === poll.id;
          const maxVotes = Math.max(1, ...poll.options.map((o) => o.votes));
          return (
            <div key={poll.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedId(expanded ? null : poll.id)}
                className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 transition"
              >
                <div>
                  <p className="font-bold text-slate-800">{poll.question}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {totalVotes} vote{totalVotes === 1 ? '' : 's'} · {new Date(poll.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {expanded ? <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0" /> : <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0" />}
              </button>

              {expanded && (
                <div className="border-t border-slate-100 p-4 space-y-3">
                  <div className="space-y-2">
                    {poll.options.map((o) => (
                      <div key={o.id}>
                        <div className="flex items-center justify-between text-sm font-semibold text-slate-700 mb-1">
                          <span>{o.text}</span>
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

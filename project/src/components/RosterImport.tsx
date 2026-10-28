import { useRef, useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, HelpCircle, Save } from 'lucide-react';
import type { Player } from '../types';
import { parseSchoologyCsv, matchRoster, type SchoologyRosterEntry, type MatchStatus } from '../rosterMatching';

interface Props {
  roster: Player[];
  onUpdatePlayer: (id: string, updates: Partial<Player>) => void;
}

const STATUS_META: Record<MatchStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  auto: { label: 'Auto-matched', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  ambiguous: { label: 'Needs review', className: 'bg-amber-100 text-amber-700', icon: AlertTriangle },
  none: { label: 'No match found', className: 'bg-slate-200 text-slate-600', icon: HelpCircle },
};

export default function RosterImport({ roster, onUpdatePlayer }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [schoologyRoster, setSchoologyRoster] = useState<SchoologyRosterEntry[]>([]);
  const [statuses, setStatuses] = useState<Record<string, MatchStatus>>({});
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const handleFile = (file: File) => {
    setParseError(null);
    setSavedCount(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      const parsed = parseSchoologyCsv(text);
      if (parsed.length === 0) {
        setParseError("Couldn't find a name column and an ID column in that file. Export a roster CSV from Schoology with student names and unique IDs, then try again.");
        setSchoologyRoster([]);
        return;
      }
      setSchoologyRoster(parsed);
      const results = matchRoster(roster.map((p) => ({ id: p.id, name: p.name })), parsed);
      const nextStatuses: Record<string, MatchStatus> = {};
      const nextSelections: Record<string, string> = {};
      results.forEach((r) => {
        nextStatuses[r.playerId] = r.status;
        nextSelections[r.playerId] = roster.find((p) => p.id === r.playerId)?.schoologyId || r.suggestion?.schoologyId || '';
      });
      setStatuses(nextStatuses);
      setSelections(nextSelections);
    };
    reader.readAsText(file);
  };

  const claimedIds = new Set(Object.values(selections).filter(Boolean));

  const handleApply = () => {
    let count = 0;
    roster.forEach((p) => {
      const chosen = selections[p.id] || '';
      if (chosen && chosen !== p.schoologyId) {
        onUpdatePlayer(p.id, { schoologyId: chosen });
        count++;
      } else if (!chosen && p.schoologyId) {
        onUpdatePlayer(p.id, { schoologyId: undefined });
        count++;
      }
    });
    setSavedCount(count);
  };

  const hasResults = schoologyRoster.length > 0;
  const sortedRoster = [...roster].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div>
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
          <Upload className="w-5 h-5 text-blue-600" /> Schoology Roster Import
        </h3>
        <p className="text-sm text-slate-500 mt-1">
          One-time per class. Upload a roster CSV exported from Schoology (names + unique IDs) to
          attach each student's hidden Schoology ID - students never see this, and your shorthand
          display names here never change.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
        >
          <Upload className="h-4 w-4" /> Upload Schoology CSV
        </button>
        {hasResults && (
          <span className="text-sm text-slate-500">{schoologyRoster.length} students found in the file</span>
        )}
      </div>

      {parseError && (
        <p className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
          <AlertTriangle className="h-4 w-4" /> {parseError}
        </p>
      )}

      {hasResults && (
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
              <tr>
                <th className="p-3">Roster Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Matched Schoology Student</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedRoster.map((p) => {
                const status = statuses[p.id] || 'none';
                const meta = STATUS_META[status];
                const Icon = meta.icon;
                const selected = selections[p.id] || '';
                return (
                  <tr key={p.id}>
                    <td className="p-3 font-semibold text-slate-800">{p.name}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold ${meta.className}`}>
                        <Icon className="h-3.5 w-3.5" /> {meta.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <select
                        value={selected}
                        onChange={(e) => setSelections((prev) => ({ ...prev, [p.id]: e.target.value }))}
                        className="w-full max-w-xs border border-slate-300 rounded-md px-2 py-1.5 text-sm bg-white outline-none focus:border-blue-500"
                      >
                        <option value="">-- No match --</option>
                        {schoologyRoster.map((s) => (
                          <option
                            key={s.schoologyId}
                            value={s.schoologyId}
                            disabled={claimedIds.has(s.schoologyId) && selected !== s.schoologyId}
                          >
                            {s.fullName} ({s.schoologyId})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {hasResults && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <Save className="h-4 w-4" /> Save Matches to Roster
          </button>
          {savedCount !== null && (
            <span className="text-sm font-semibold text-emerald-700">Saved {savedCount} change{savedCount === 1 ? '' : 's'}.</span>
          )}
        </div>
      )}
    </div>
  );
}

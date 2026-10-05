import { useMemo, useState } from 'react';
import { Trophy, Star, ChevronDown, ChevronUp, Plus, Minus, History, CalendarDays, Link2, Check } from 'lucide-react';
import type { Player, Unit, UnitData, TeammatePointMap, Match } from '../types';
import { computeWinsFromSchedule, resolveMatchTeams } from '../standings';

interface Props {
  roster: Player[];
  allUnits: UnitData[];
  teammatePoints: TeammatePointMap;
  onUpdateTeammatePoints: (playerId: string, delta: number) => void;
  activeClassId: string;
  activeUnitId: string;
}

export default function Leaderboards({
  roster, allUnits, teammatePoints, onUpdateTeammatePoints, activeClassId, activeUnitId
}: Props) {
  const [activeTab, setActiveTab] = useState<'wins' | 'teammates'>('wins');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<'universal' | 'unit' | null>(null);

  const activeUnitName = allUnits.find((u) => u.id === activeUnitId)?.unit.unit_name;

  const copyLink = async (link: string, which: 'universal' | 'unit') => {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedLink(which);
      setTimeout(() => setCopiedLink(null), 2000);
    } catch {
      window.prompt('Copy this link to send to students:', link);
    }
  };

  const handleCopyVoteLink = () => copyLink(`${window.location.origin}${window.location.pathname}#vote`, 'universal');

  const handleCopyUnitVoteLink = () => copyLink(
    `${window.location.origin}${window.location.pathname}#vote?class=${encodeURIComponent(activeClassId)}&unit=${encodeURIComponent(activeUnitId)}`,
    'unit',
  );

  // Always computed fresh from every unit's schedule + each team-set's assigned roster - never
  // stored, so there's nothing to keep in sync when a roster changes. A student's total for the
  // whole class, across every unit it's ever run, not just whichever one is active right now.
  const wins = useMemo(() => {
    const totals: Record<string, number> = {};
    allUnits.forEach(u => {
      const unitTotals = computeWinsFromSchedule(u.schedule.matches, u.unit);
      Object.entries(unitTotals).forEach(([playerId, count]) => {
        totals[playerId] = (totals[playerId] ?? 0) + count;
      });
    });
    return totals;
  }, [allUnits]);

  // Derive the ranked lists
  const rankedByWins = [...roster]
    .filter(p => p.availability !== 'out')
    .sort((a, b) => (wins[b.id] || 0) - (wins[a.id] || 0));

  const rankedByTeammate = [...roster]
    .filter(p => p.availability !== 'out')
    .sort((a, b) => (teammatePoints[b.id] || 0) - (teammatePoints[a.id] || 0));

  // Dynamic Audit Log: Reconstruct when a player won based on schedule & daily snapshots
  interface WinHistoryEntry { match: Match; label: string; count?: number; unitName: string; }

  const getWinHistoryFor = (matches: Match[], u: Unit, playerId: string): WinHistoryEntry[] => {
    const entries: WinHistoryEntry[] = [];

    matches.forEach(m => {
      if (m.match_type === 'solo') {
        if ((m.winner_player_ids || []).includes(playerId)) {
          entries.push({ match: m, label: m.home_team ? `Solo Event - ${m.home_team}` : 'Solo Event Win', unitName: u.unit_name });
        }
        return;
      }

      const resolvedTeams = resolveMatchTeams(m, u);

      if (m.match_type === 'minigame') {
        Object.entries(m.awardedTeamCounts || {}).forEach(([teamIdStr, count]) => {
          if (!count) return;
          const team = resolvedTeams?.find(t => t.id === Number(teamIdStr));
          if (team?.players.some(p => p.id === playerId)) {
            entries.push({ match: m, label: `Mini-Games (${team.name})`, count, unitName: u.unit_name });
          }
        });
        return;
      }

      if (!(m.completed && m.home_score !== null && m.away_score !== null)) return;
      const winnerName = m.home_score! > m.away_score! ? m.home_team : (m.away_score! > m.home_score! ? m.away_team : null);
      if (!winnerName) return; // It was a tie

      const winnerTeam = resolvedTeams?.find(t => t.name === winnerName);
      if (winnerTeam && winnerTeam.players.some(p => p.id === playerId)) {
        entries.push({ match: m, label: `${m.home_team} (${m.home_score}) vs ${m.away_team} (${m.away_score})`, unitName: u.unit_name });
      }
    });

    return entries;
  };

  const getPlayerWinHistory = (playerId: string): WinHistoryEntry[] =>
    allUnits.flatMap(u => getWinHistoryFor(u.schedule.matches, u.unit, playerId));

  const toggleExpand = (id: string) => {
    setExpandedPlayerId(prev => prev === id ? null : id);
  };

  const displayList = activeTab === 'wins' ? rankedByWins : rankedByTeammate;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" /> All-Time Leaderboards
        </h2>
        <div className="flex items-center gap-2">
          {activeUnitName && (
            <button
              onClick={handleCopyUnitVoteLink}
              title={`Skips straight to picking yourself - locked to "${activeUnitName}"`}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              {copiedLink === 'unit' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {copiedLink === 'unit' ? 'Copied!' : `Copy Link for "${activeUnitName}"`}
            </button>
          )}
          <button
            onClick={handleCopyVoteLink}
            title="Students pick their own class and unit"
            className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
          >
            {copiedLink === 'universal' ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
            {copiedLink === 'universal' ? 'Copied!' : 'Copy Universal Link'}
          </button>
        </div>
      </div>

      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
        <button
          onClick={() => setActiveTab('wins')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'wins' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Trophy className="w-4 h-4" /> All-Time Wins
        </button>
        <button
          onClick={() => setActiveTab('teammates')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'teammates' ? 'bg-indigo-100 text-indigo-800' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Star className="w-4 h-4" /> Best Teammate Votes
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-1 text-center">Rank</div>
          <div className="col-span-7">Player</div>
          <div className="col-span-4 text-right">Score</div>
        </div>

        <div className="divide-y divide-slate-100">
          {displayList.map((player, index) => {
            const isExpanded = expandedPlayerId === player.id;
            const playerWins = wins[player.id] || 0;
            const playerTeammatePts = teammatePoints[player.id] || 0;
            const history = isExpanded ? getPlayerWinHistory(player.id) : [];

            return (
              <div key={player.id} className="transition-colors hover:bg-slate-50">
                {/* Main Row */}
                <div 
                  onClick={() => toggleExpand(player.id)}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center cursor-pointer"
                >
                  <div className="col-span-1 text-center font-black text-slate-400">
                    {index + 1}
                  </div>
                  <div className="col-span-7 flex items-center gap-3">
                    <span className="font-bold text-slate-800">{player.name}</span>
                    {index === 0 && <Trophy className="w-4 h-4 text-amber-400" />}
                  </div>
                  <div className="col-span-4 flex items-center justify-end gap-4">
                    <span className="font-black text-lg text-slate-700">
                      {activeTab === 'wins' ? playerWins : playerTeammatePts}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2">
                    <div className="grid md:grid-cols-2 gap-6">
                      
                      {/* Manual Adjuster - Teammate Votes only. Wins come strictly from the
                          schedule (match scores, mini-game awards) with no direct override. */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Plus className="w-3 h-3"/> Adjust Teammate Votes
                        </h4>

                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Star className="w-4 h-4 text-indigo-500"/> Teammate Votes</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => onUpdateTeammatePoints(player.id, -1)} className="p-1 hover:bg-red-100 text-red-600 rounded transition"><Minus className="w-4 h-4"/></button>
                            <span className="font-bold w-6 text-center">{playerTeammatePts}</span>
                            <button onClick={() => onUpdateTeammatePoints(player.id, 1)} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition"><Plus className="w-4 h-4"/></button>
                          </div>
                        </div>

                        {activeTab === 'wins' && (
                          <p className="text-xs text-slate-400 italic px-1">
                            Wins are calculated automatically from match scores and mini-game awards using each team's current roster - move a player between teams and this updates on its own.
                          </p>
                        )}
                      </div>

                      {/* Win History Audit Log */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <History className="w-3 h-3"/> Win History Log
                        </h4>
                        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden h-[130px] overflow-y-auto">
                          {history.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-sm text-slate-400 font-medium">No recorded wins yet.</div>
                          ) : (
                            <ul className="divide-y divide-slate-100">
                              {history.map((entry, i) => (
                                <li key={`${entry.match.id}-${i}`} className="p-2.5 flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-slate-400"/>
                                    <span className="font-semibold text-slate-700">{new Date(entry.match.date_str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                  <div className="text-slate-600 flex items-center gap-1.5">
                                    {entry.unitName && (
                                      <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide">{entry.unitName}</span>
                                    )}
                                    {entry.label}
                                    {entry.count && entry.count > 1 && (
                                      <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full text-xs font-black">×{entry.count}</span>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
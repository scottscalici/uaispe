import { useState } from 'react';
import { Trophy, Star, ChevronDown, ChevronUp, Plus, Minus, History, CalendarDays, RotateCcw } from 'lucide-react';
import type { Player, Unit, WinMap, TeammatePointMap, ScheduleData, DailyTeamSnapshot, Match } from '../types';

interface Props {
  roster: Player[];
  unit: Unit;
  wins: WinMap;
  teammatePoints: TeammatePointMap;
  schedule: ScheduleData;
  dailyTeams: Record<string, DailyTeamSnapshot>;
  onUpdateWins: (playerId: string, delta: number) => void;
  onUpdateTeammatePoints: (playerId: string, delta: number) => void;
  onRecalculateWins: () => void;
}

export default function Leaderboards({
  roster, unit, wins, teammatePoints, schedule, dailyTeams, onUpdateWins, onUpdateTeammatePoints, onRecalculateWins
}: Props) {
  const [activeTab, setActiveTab] = useState<'wins' | 'teammates'>('wins');
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Derive the ranked lists
  const rankedByWins = [...roster]
    .filter(p => p.availability !== 'out')
    .sort((a, b) => (wins[b.id] || 0) - (wins[a.id] || 0));

  const rankedByTeammate = [...roster]
    .filter(p => p.availability !== 'out')
    .sort((a, b) => (teammatePoints[b.id] || 0) - (teammatePoints[a.id] || 0));

  // Dynamic Audit Log: Reconstruct when a player won based on schedule & daily snapshots
  interface WinHistoryEntry { match: Match; label: string; count?: number; }

  const getPlayerWinHistory = (playerId: string): WinHistoryEntry[] => {
    const entries: WinHistoryEntry[] = [];

    schedule.matches.forEach(m => {
      const resolvedTeams = dailyTeams[m.date_str]
        ? dailyTeams[m.date_str].teams
        : (m.team_set_id && m.team_set_id !== 'base'
            ? unit.teamSets?.find(ts => ts.id === m.team_set_id)?.teams
            : unit.baseTeams);

      if (m.match_type === 'minigame') {
        Object.entries(m.awardedTeamCounts || {}).forEach(([teamIdStr, count]) => {
          if (!count) return;
          const team = resolvedTeams?.find(t => t.id === Number(teamIdStr));
          if (team?.players.some(p => p.id === playerId)) {
            entries.push({ match: m, label: `Mini-Games (${team.name})`, count });
          }
        });
        return;
      }

      if (!(m.completed && m.home_score !== null && m.away_score !== null)) return;
      const winnerName = m.home_score! > m.away_score! ? m.home_team : (m.away_score! > m.home_score! ? m.away_team : null);
      if (!winnerName) return; // It was a tie

      const winnerTeam = resolvedTeams?.find(t => t.name === winnerName);
      if (winnerTeam && winnerTeam.players.some(p => p.id === playerId)) {
        entries.push({ match: m, label: `${m.home_team} (${m.home_score}) vs ${m.away_team} (${m.away_score})` });
      }
    });

    return entries;
  };

  const toggleExpand = (id: string) => {
    setExpandedPlayerId(prev => prev === id ? null : id);
  };

  const displayList = activeTab === 'wins' ? rankedByWins : rankedByTeammate;

  const handleRecalculateClick = () => {
    if (confirm('Reset every student\'s win count to 0 and rebuild it strictly from the schedule: completed match scores plus recorded mini-game awards. This cannot be undone.')) {
      onRecalculateWins();
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-amber-500" /> {unit.unit_name} Leaderboards
        </h2>
        {activeTab === 'wins' && (
          <button
            onClick={handleRecalculateClick}
            title="Reset all wins to 0 and rebuild strictly from completed match scores"
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Recalculate Wins
          </button>
        )}
      </div>

      <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1">
        <button 
          onClick={() => setActiveTab('wins')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'wins' ? 'bg-amber-100 text-amber-800' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <Trophy className="w-4 h-4" /> Lifetime Wins
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
                      
                      {/* Manual Adjusters */}
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Plus className="w-3 h-3"/> Adjust Scores
                        </h4>
                        
                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500"/> Wins</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => onUpdateWins(player.id, -1)} className="p-1 hover:bg-red-100 text-red-600 rounded transition"><Minus className="w-4 h-4"/></button>
                            <span className="font-bold w-6 text-center">{playerWins}</span>
                            <button onClick={() => onUpdateWins(player.id, 1)} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition"><Plus className="w-4 h-4"/></button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2"><Star className="w-4 h-4 text-indigo-500"/> Teammate Votes</span>
                          <div className="flex items-center gap-3">
                            <button onClick={() => onUpdateTeammatePoints(player.id, -1)} className="p-1 hover:bg-red-100 text-red-600 rounded transition"><Minus className="w-4 h-4"/></button>
                            <span className="font-bold w-6 text-center">{playerTeammatePts}</span>
                            <button onClick={() => onUpdateTeammatePoints(player.id, 1)} className="p-1 hover:bg-emerald-100 text-emerald-600 rounded transition"><Plus className="w-4 h-4"/></button>
                          </div>
                        </div>
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
import { useMemo } from 'react';
import { Trophy, Heart, Medal } from 'lucide-react';
import type { Unit, WinMap, TeammatePointMap } from '../types';

interface Props {
  unit: Unit;
  wins: WinMap;
  teammatePoints: TeammatePointMap;
}

export default function Leaderboards({ unit, wins, teammatePoints }: Props) {
  const allPlayers = useMemo(() => {
    const list: { id: string; name: string; team: string }[] = [];
    unit.baseTeams.forEach((t) => {
      t.players.forEach((p) => list.push({ id: p.id, name: p.name, team: t.name }));
    });
    return list;
  }, [unit]);

  const winLeaderboard = useMemo(() => {
    return allPlayers
      .map((p) => ({ ...p, wins: wins[p.id] ?? 0 }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, 5);
  }, [allPlayers, wins]);

  const teammateLeaderboard = useMemo(() => {
    return allPlayers
      .map((p) => ({ ...p, points: teammatePoints[p.id] ?? 0 }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [allPlayers, teammatePoints]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Leaderboards</h2>
        <p className="text-sm text-slate-500">Top performers across the year</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top 5 Wins */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-amber-500 px-4 py-3 text-white">
            <Trophy className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Top 5 Wins</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {winLeaderboard.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <RankBadge rank={i + 1} />
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.team}</div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-amber-600">{p.wins}</span>
                  <span className="ml-1 text-xs text-slate-400">wins</span>
                </div>
              </div>
            ))}
            {winLeaderboard.every((p) => p.wins === 0) && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">No wins recorded yet</div>
            )}
          </div>
        </div>

        {/* Best Teammate */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-slate-200 bg-rose-500 px-4 py-3 text-white">
            <Heart className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Best Teammate</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {teammateLeaderboard.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <RankBadge rank={i + 1} />
                <div className="flex-1">
                  <div className="font-semibold text-slate-800">{p.name}</div>
                  <div className="text-xs text-slate-400">{p.team}</div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-rose-600">{p.points}</span>
                  <span className="ml-1 text-xs text-slate-400">pts</span>
                </div>
              </div>
            ))}
            {teammateLeaderboard.every((p) => p.points === 0) && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">No teammate points awarded yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors = ['bg-amber-400 text-amber-900', 'bg-slate-300 text-slate-700', 'bg-orange-300 text-orange-900', 'bg-slate-100 text-slate-600', 'bg-slate-100 text-slate-600'];
  return (
    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${colors[rank - 1] ?? colors[4]}`}>
      {rank <= 3 ? <Medal className="h-4 w-4" /> : rank}
    </div>
  );
}

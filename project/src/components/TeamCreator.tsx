import { useMemo, useState, useEffect } from 'react';
import { Wand2, Save, ArrowRightLeft } from 'lucide-react';
import type { Unit, Player, Team } from '../types';

interface Props {
  roster: Player[];
  unit: Unit;
  onGenerate: (teams: Team[]) => void;
  onMovePlayer: (playerId: string, fromTeamId: number, toTeamId: number) => void;
}

// Helper: Randomize an array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Helper: Calculate average skill of a team
function avgSkill(players: Player[]): number {
  if (players.length === 0) return 0;
  return players.reduce((s, p) => s + p.skill, 0) / players.length;
}

// Helper: Balance a specific bracket of teams by swapping players of equal gender but different skills
function balanceGroup(teams: Team[]): void {
  for (let iter = 0; iter < 15; iter++) {
    const sorted = [...teams].sort((a, b) => avgSkill(b.players) - avgSkill(a.players));
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];
    
    if (!best || !worst) break;
    
    const diff = avgSkill(best.players) - avgSkill(worst.players);
    if (diff < 0.5) break; 

    let bestSwap: { i: number; j: number } | null = null;
    let bestReduction = 0;

    for (let i = 0; i < best.players.length; i++) {
      for (let j = 0; j < worst.players.length; j++) {
        const p1 = best.players[i];
        const p2 = worst.players[j];
        
        if (p1.gender === p2.gender && p1.skill > p2.skill) {
          const newBest = (best.players.reduce((s, p) => s + p.skill, 0) - p1.skill + p2.skill) / best.players.length;
          const newWorst = (worst.players.reduce((s, p) => s + p.skill, 0) - p2.skill + p1.skill) / worst.players.length;
          const newDiff = Math.abs(newBest - newWorst);
          const reduction = diff - newDiff;
          
          if (reduction > bestReduction) {
            bestReduction = reduction;
            bestSwap = { i, j };
          }
        }
      }
    }
    
    if (bestSwap) {
      const tmp = best.players[bestSwap.i];
      best.players[bestSwap.i] = worst.players[bestSwap.j];
      worst.players[bestSwap.j] = tmp;
    } else {
      break; 
    }
  }
}

export default function TeamCreator({ roster, onGenerate }: Props) {
  const [mode, setMode] = useState<'standard' | 'comprec' | 'gendered' | 'grade'>('standard');
  
  // Settings State
  const [numTeams, setNumTeams] = useState(4);
  const [competeThreshold, setCompeteThreshold] = useState(4);
  const [numCompTeams, setNumCompTeams] = useState(2);
  const [numRecTeams, setNumRecTeams] = useState(2);
  const [numBoysTeams, setNumBoysTeams] = useState(2);
  const [numGirlsTeams, setNumGirlsTeams] = useState(2);
  const [gradeTeamsCount, setGradeTeamsCount] = useState<Record<string, number>>({});
  
  const [preview, setPreview] = useState<Team[] | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; teamId: number } | null>(null);

  const activePlayers = useMemo(() => {
    return roster.filter((p) => !p.availability || p.availability === 'active');
  }, [roster]);

  // Extract unique grades safely from the roster
  const uniqueGrades = useMemo(() => {
    const grades = Array.from(new Set(activePlayers.map(p => p.grade?.trim() || 'Unspecified')));
    return grades.sort();
  }, [activePlayers]);

  const handleGeneratePreview = () => {
    setSelectedPlayer(null); 
    let generated: Team[] = [];
    let teamIdCounter = 1;

    if (mode === 'grade') {
      uniqueGrades.forEach(grade => {
        const playersOfGrade = shuffle(activePlayers.filter(p => (p.grade?.trim() || 'Unspecified') === grade));
        const numTeamsForGrade = gradeTeamsCount[grade] || 1;

        const gradeTeams: Team[] = Array.from({ length: numTeamsForGrade }, (_, i) => ({
          id: teamIdCounter++,
          name: numTeamsForGrade === 1 ? `${grade}s` : `${grade} Team ${i + 1}`,
          league: 'Standard',
          players: []
        }));

        playersOfGrade.forEach((p, idx) => gradeTeams[idx % numTeamsForGrade].players.push(p));
        balanceGroup(gradeTeams);
        generated.push(...gradeTeams);
      });
    }
    else if (mode === 'gendered') {
      const boys = shuffle(activePlayers.filter(p => p.gender !== 'F'));
      const girls = shuffle(activePlayers.filter(p => p.gender === 'F'));
      
      const boysTeams: Team[] = Array.from({ length: numBoysTeams }, (_, i) => ({
        id: teamIdCounter++, name: `Boys Team ${i + 1}`, league: 'Competitive', players: []
      }));
      const girlsTeams: Team[] = Array.from({ length: numGirlsTeams }, (_, i) => ({
        id: teamIdCounter++, name: `Girls Team ${i + 1}`, league: 'Recreational', players: []
      }));

      boys.forEach((p, idx) => boysTeams[idx % numBoysTeams].players.push(p));
      girls.forEach((p, idx) => girlsTeams[idx % numGirlsTeams].players.push(p));

      balanceGroup(boysTeams);
      balanceGroup(girlsTeams);
      generated = [...boysTeams, ...girlsTeams];
    } 
    else if (mode === 'comprec') {
      const comp = shuffle(activePlayers.filter(p => p.compete >= competeThreshold));
      const rec = shuffle(activePlayers.filter(p => p.compete < competeThreshold));

      const compTeams: Team[] = Array.from({ length: numCompTeams }, (_, i) => ({
        id: teamIdCounter++, name: `Comp Team ${i + 1}`, league: 'Competitive', players: []
      }));
      const recTeams: Team[] = Array.from({ length: numRecTeams }, (_, i) => ({
        id: teamIdCounter++, name: `Rec Team ${i + 1}`, league: 'Recreational', players: []
      }));

      comp.forEach((p, idx) => compTeams[idx % numCompTeams].players.push(p));
      rec.forEach((p, idx) => recTeams[idx % numRecTeams].players.push(p));

      balanceGroup(compTeams);
      balanceGroup(recTeams);
      generated = [...compTeams, ...recTeams];
    } 
    else {
      const all = shuffle([...activePlayers]);
      generated = Array.from({ length: numTeams }, (_, i) => ({
        id: teamIdCounter++, name: `Team ${i + 1}`, league: 'Standard', players: []
      }));
      
      const boys = all.filter(p => p.gender !== 'F');
      const girls = all.filter(p => p.gender === 'F');
      let tIdx = 0;
      boys.forEach(p => { generated[tIdx].players.push(p); tIdx = (tIdx + 1) % numTeams; });
      girls.forEach(p => { generated[tIdx].players.push(p); tIdx = (tIdx + 1) % numTeams; });

      balanceGroup(generated);
    }

    setPreview(generated);
  };

  const handlePlayerClick = (playerId: string, teamId: number) => {
    if (!selectedPlayer) {
      setSelectedPlayer({ id: playerId, teamId });
      return;
    }

    if (selectedPlayer.id === playerId) {
      setSelectedPlayer(null);
      return;
    }

    setPreview((prev) => {
      if (!prev) return null;
      const nextPreview = prev.map(t => ({ ...t, players: [...t.players] }));
      
      const team1 = nextPreview.find(t => t.id === selectedPlayer.teamId);
      const team2 = nextPreview.find(t => t.id === teamId);
      
      if (!team1 || !team2) return prev;

      const p1Idx = team1.players.findIndex(p => p.id === selectedPlayer.id);
      const p2Idx = team2.players.findIndex(p => p.id === playerId);

      if (p1Idx > -1 && p2Idx > -1) {
        const temp = team1.players[p1Idx];
        team1.players[p1Idx] = team2.players[p2Idx];
        team2.players[p2Idx] = temp;
      }
      return nextPreview;
    });
    
    setSelectedPlayer(null);
  };

  const handleMoveInPreview = (playerId: string, fromTeamId: number, toTeamId: number) => {
    setPreview((prev) => {
      if (!prev) return null;
      const nextPreview = prev.map(t => ({ ...t, players: [...t.players] }));
      
      const sourceTeam = nextPreview.find(t => t.id === fromTeamId);
      const destTeam = nextPreview.find(t => t.id === toTeamId);
      
      if (!sourceTeam || !destTeam) return prev;

      const pIdx = sourceTeam.players.findIndex(p => p.id === playerId);
      if (pIdx > -1) {
        const [movedPlayer] = sourceTeam.players.splice(pIdx, 1);
        destTeam.players.push(movedPlayer);
      }
      
      return nextPreview;
    });
    setSelectedPlayer(null); 
  };

  const handleApply = () => {
    if (preview) {
      onGenerate(preview);
      setPreview(null);
      setSelectedPlayer(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <Wand2 className="h-6 w-6 text-blue-600" /> Auto-Generate Teams
          </h2>
          <div className="text-sm font-semibold text-slate-500">
            {activePlayers.length} Active Players in Pool
          </div>
        </div>

        {/* Generation Mode Selector */}
        <div className="mb-6 flex flex-wrap gap-2">
          {(['standard', 'comprec', 'gendered', 'grade'] as const).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setPreview(null); setSelectedPlayer(null); }}
              className={`flex-1 min-w-[120px] rounded-lg border-2 py-3 text-sm font-bold uppercase tracking-wider transition ${
                mode === m ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {m === 'standard' ? 'Standard Mix' : m === 'comprec' ? 'Comp / Rec' : m === 'gendered' ? 'Single-Gender' : 'By Grade'}
            </button>
          ))}
        </div>

        {/* Dynamic Settings */}
        <div className="mb-6 rounded-lg bg-slate-50 p-4 border border-slate-200">
          {mode === 'standard' && (
            <div className="flex items-center gap-4">
              <label className="font-bold text-slate-700">Total Teams:</label>
              <input type="number" value={numTeams} onChange={e => setNumTeams(Number(e.target.value))} min={2} max={10} className="w-20 rounded-lg border p-2 text-center font-bold" />
            </div>
          )}

          {mode === 'comprec' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Compete Threshold (1-5)</label>
                <input type="number" value={competeThreshold} onChange={e => setCompeteThreshold(Number(e.target.value))} min={2} max={5} className="w-full rounded-lg border p-2 text-center font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Comp Teams</label>
                <input type="number" value={numCompTeams} onChange={e => setNumCompTeams(Number(e.target.value))} min={1} className="w-full rounded-lg border p-2 text-center font-bold" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Rec Teams</label>
                <input type="number" value={numRecTeams} onChange={e => setNumRecTeams(Number(e.target.value))} min={1} className="w-full rounded-lg border p-2 text-center font-bold" />
              </div>
            </div>
          )}

          {mode === 'gendered' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Number of Boys Teams</label>
                <input type="number" value={numBoysTeams} onChange={e => setNumBoysTeams(Number(e.target.value))} min={1} className="w-full rounded-lg border border-blue-300 bg-blue-50 p-2 text-center font-bold text-blue-900" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Number of Girls Teams</label>
                <input type="number" value={numGirlsTeams} onChange={e => setNumGirlsTeams(Number(e.target.value))} min={1} className="w-full rounded-lg border border-pink-300 bg-pink-50 p-2 text-center font-bold text-pink-900" />
              </div>
            </div>
          )}

          {mode === 'grade' && (
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-4">Set how many teams to generate for each grade level found in your roster:</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {uniqueGrades.map(g => (
                  <div key={g}>
                    <label className="block text-sm font-bold text-slate-700 mb-1 truncate">{g} Teams</label>
                    <input
                      type="number"
                      value={gradeTeamsCount[g] || 1}
                      onChange={e => setGradeTeamsCount(prev => ({ ...prev, [g]: Number(e.target.value) }))}
                      min={1}
                      className="w-full rounded-lg border border-purple-300 bg-purple-50 p-2 text-center font-bold text-purple-900"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button onClick={handleGeneratePreview} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-4 font-bold text-white transition hover:bg-slate-800">
          <Wand2 className="h-5 w-5" /> Generate Preview
        </button>
      </div>

      {preview && (
        <div className="animate-in fade-in slide-in-from-bottom-4 rounded-xl border-2 border-blue-500 bg-white p-6 shadow-xl">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-slate-800">Team Preview</h3>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                <ArrowRightLeft className="w-3 h-3"/> Click any two players to swap, or use the dropdown to move.
              </p>
            </div>
            <button onClick={handleApply} className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 font-bold text-white transition hover:bg-blue-700 shadow-lg shadow-blue-200">
              <Save className="h-4 w-4" /> Apply Teams to Roster
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {preview.map(team => (
              <div key={team.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="font-black text-slate-800">
                    {team.name} <span className="text-sm font-normal text-slate-500">({team.players.length} players)</span>
                  </div>
                  <div className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded border shadow-sm">
                    Avg Skill: {avgSkill(team.players).toFixed(1)}
                  </div>
                </div>
                <div className="space-y-1">
                  {team.players.map(p => {
                    const isSelected = selectedPlayer?.id === p.id;
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => handlePlayerClick(p.id, team.id)}
                        className={`flex items-center justify-between rounded px-3 py-2 text-sm shadow-sm border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-500 ring-opacity-50 transform scale-[1.02] z-10 relative' 
                            : 'bg-white border-slate-100 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className={`font-semibold truncate mr-2 ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                          {p.name}
                        </span>
                        
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="flex gap-2 text-[10px] sm:text-xs font-bold text-slate-400">
                            {p.grade && <span className="text-purple-500 hidden sm:inline">{p.grade}</span>}
                            <span className={p.gender === 'F' ? 'text-pink-500' : 'text-blue-500'}>{p.gender}</span>
                            <span>S:{p.skill}</span>
                            <span className="hidden sm:inline">C:{p.compete}</span>
                          </div>
                          
                          <select
                            value=""
                            onChange={(e) => handleMoveInPreview(p.id, team.id, Number(e.target.value))}
                            onClick={(e) => e.stopPropagation()} 
                            className="text-xs font-semibold border border-slate-200 rounded px-1 py-0.5 bg-slate-50 text-slate-600 outline-none hover:bg-slate-200 hover:text-slate-900 cursor-pointer transition-colors max-w-[80px]"
                          >
                            <option value="" disabled>Move to...</option>
                            {preview.filter(t => t.id !== team.id).map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import { useState } from 'react';
import { Shield, ArrowRightLeft, Pencil, Check } from 'lucide-react';
import type { Unit, AttendanceMap } from '../types';

interface Props {
  unit: Unit;
  isAdmin: boolean;
  attendance: AttendanceMap;
  onSwap: (p1Id: string, t1Id: number, p2Id: string, t2Id: number) => void;
  onMove: (playerId: string, fromTeamId: number, toTeamId: number) => void;
  onRenameTeam: (teamId: number, newName: string) => void;
}

export default function TeamManager({ unit, isAdmin, attendance, onSwap, onMove, onRenameTeam }: Props) {
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; teamId: number } | null>(null);
  
  // State for renaming a team
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handlePlayerClick = (playerId: string, teamId: number) => {
    if (!isAdmin) return;
    if (!selectedPlayer) {
      setSelectedPlayer({ id: playerId, teamId });
    } else if (selectedPlayer.id === playerId) {
      setSelectedPlayer(null);
    } else {
      onSwap(selectedPlayer.id, selectedPlayer.teamId, playerId, teamId);
      setSelectedPlayer(null);
    }
  };

  const handleSaveName = (teamId: number) => {
    if (editName.trim()) {
      onRenameTeam(teamId, editName.trim());
    }
    setEditingTeamId(null);
  };

  // Helper to generate the GitHub URL structure: /teams/unit_name/team_name.png
  // Upgraded to strip out all punctuation so "Detroit Tigers!" becomes "detroit_tigers"
  const getLogoUrl = (teamName: string) => {
    const safeUnit = unit.unit_name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const safeTeam = teamName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    return `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${safeUnit}/${safeTeam}.png`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Shield className="h-6 w-6 text-blue-600" />
          {unit.unit_name} Teams
        </h2>
        {isAdmin && (
          <p className="text-sm font-semibold text-slate-500 flex items-center gap-1.5">
            <ArrowRightLeft className="w-4 h-4" /> Click two players to swap
          </p>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {unit.baseTeams.map((team) => (
          <div key={team.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
            
            {/* Team Header Area */}
            <div className={`flex items-center justify-between border-b px-4 py-3 text-white ${team.league === 'Competitive' ? 'bg-slate-800' : 'bg-blue-600'}`}>
              <div className="flex items-center gap-3 w-full">
                {/* Dynamically loads image from GitHub, hides if it 404s */}
                <img 
                  src={getLogoUrl(team.name)} 
                  onError={(e) => e.currentTarget.style.display = 'none'} 
                  alt=""
                  className="w-8 h-8 object-contain drop-shadow-sm" 
                />
                
                {editingTeamId === team.id ? (
                  <div className="flex items-center gap-2 w-full">
                    <input 
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName(team.id)}
                      className="w-full text-slate-900 text-sm px-2 py-1 rounded outline-none font-bold"
                    />
                    <button onClick={() => handleSaveName(team.id)} className="p-1 bg-emerald-500 rounded text-white hover:bg-emerald-400">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 w-full group cursor-pointer" onClick={() => { setEditingTeamId(team.id); setEditName(team.name); }}>
                    <h3 className="font-bold tracking-wide truncate">{team.name}</h3>
                    {isAdmin && <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />}
                  </div>
                )}
              </div>
            </div>

            {/* Roster Area */}
            <div className="divide-y divide-slate-100 p-2">
              {team.players.map((p) => {
                const isSelected = selectedPlayer?.id === p.id;
                const status = attendance[p.id];
                
                return (
                  <div
                    key={p.id}
                    onClick={() => handlePlayerClick(p.id, team.id)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-all ${
                      isAdmin ? 'cursor-pointer hover:bg-slate-50' : ''
                    } ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${
                          status === 'absent' ? 'bg-red-500' :
                          status === 'late' ? 'bg-amber-400' :
                          status === 'present' ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                        title={status || 'unmarked'}
                      />
                      <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                        {p.name}
                      </span>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400">S:{p.skill}</span>
                        <select
                          value=""
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onMove(p.id, team.id, Number(e.target.value))}
                          className="text-xs border rounded bg-slate-50 outline-none text-slate-600 w-16"
                        >
                          <option value="" disabled>Move</option>
                          {unit.baseTeams.filter(t => t.id !== team.id).map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
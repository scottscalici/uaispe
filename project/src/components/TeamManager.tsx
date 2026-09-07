import { useState } from 'react';
import { Shield, ArrowRightLeft, Pencil, Check, Printer } from 'lucide-react';
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

  // Safely strip accent marks before formatting to URL
  const getLogoUrl = (teamName: string) => {
    const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const safeUnit = normalizeStr(unit.unit_name);
    const safeTeam = normalizeStr(teamName);
    return `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${safeUnit}/${safeTeam}.png`;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Printable styles injected directly so it formats nicely on a sheet of paper */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-team-rosters, #printable-team-rosters * {
            visibility: visible;
          }
          #printable-team-rosters {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
          /* Forces cards to fit compactly onto 1 or 2 pages max */
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
            border: 1px solid #cbd5e1 !important;
            border-radius: 8px !important;
            padding: 10px !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between no-print">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <Shield className="h-6 w-6 text-blue-600" />
          {unit.unit_name} Teams
        </h2>
        
        <div className="flex items-center gap-4">
          {isAdmin && (
            <p className="text-sm font-semibold text-slate-500 hidden sm:flex items-center gap-1.5">
              <ArrowRightLeft className="w-4 h-4" /> Click two players to swap
            </p>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
          >
            <Printer className="h-4 w-4" /> Print Teams
          </button>
        </div>
      </div>

      {/* Main Container marked for screen and print */}
      <div id="printable-team-rosters" className="space-y-4">
        <div className="hidden print:block mb-4 text-center">
          <h1 className="text-2xl font-black text-slate-900">{unit.unit_name} - Team Rosters</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print-grid">
          {unit.baseTeams.map((team) => (
            <div key={team.id} className="print-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
              
              <div className={`flex items-center justify-between border-b px-4 py-3 text-white ${team.league === 'Competitive' ? 'bg-slate-800 print:bg-slate-800 print:text-white' : 'bg-blue-600 print:bg-blue-600 print:text-white'}`}>
                <div className="flex items-center gap-3 w-full">
                  <img 
                    src={getLogoUrl(team.name)} 
                    onError={(e) => e.currentTarget.style.display = 'none'} 
                    alt=""
                    className="w-8 h-8 object-contain drop-shadow-sm bg-white rounded-full p-0.5" 
                  />
                  
                  {editingTeamId === team.id ? (
                    <div className="flex items-center gap-2 w-full no-print">
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
                    <div className="flex items-center gap-2 w-full group cursor-pointer" onClick={() => { if(isAdmin) { setEditingTeamId(team.id); setEditName(team.name); } }}>
                      <h3 className="font-bold tracking-wide truncate">{team.name}</h3>
                      {isAdmin && <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity no-print" />}
                    </div>
                  )}
                </div>
              </div>

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
                        <div className={`no-print h-2.5 w-2.5 rounded-full ${
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
                        <div className="flex items-center gap-3 no-print">
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
    </div>
  );
}
import { useState, useMemo } from 'react';
import { Shield, ArrowRightLeft, Pencil, Check, Printer, Eye, Wand2, CalendarDays, RefreshCw, XCircle } from 'lucide-react';
import type { Unit, AttendanceMap, DailyTeamSnapshot, Player, Team } from '../types';

interface Props {
  unit: Unit;
  isAdmin: boolean;
  dateStr: string;
  dailyTeams: Record<string, DailyTeamSnapshot>;
  attendance: AttendanceMap;
  
  onInitDaily: (teamSetId: string) => void;
  onClearDaily: () => void;
  onSwapDaily: (p1Id: string, t1Id: number, p2Id: string, t2Id: number) => void;
  onMoveDaily: (playerId: string, fromTeamId: number, toTeamId: number) => void;
  onRenameDaily: (teamId: number, newName: string) => void;
  
  onSwapMaster: (p1Id: string, t1Id: number, p2Id: string, t2Id: number) => void;
  onMoveMaster: (playerId: string, fromTeamId: number, toTeamId: number) => void;
  onRenameMaster: (teamId: number, newName: string) => void;
  
  onPreviewStudentView?: () => void;
}

export default function TeamManager({ 
  unit, isAdmin, dateStr, dailyTeams, attendance, 
  onInitDaily, onClearDaily, onSwapDaily, onMoveDaily, onRenameDaily,
  onSwapMaster, onMoveMaster, onRenameMaster, onPreviewStudentView 
}: Props) {
  const [viewMode, setViewMode] = useState<'daily' | 'master'>('daily');
  const [masterSetId, setMasterSetId] = useState<string>('base');
  const [initSourceId, setInitSourceId] = useState<string>('base');
  
  const [selectedPlayer, setSelectedPlayer] = useState<{ id: string; teamId: number } | null>(null);
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  // Figure out which teams we are rendering based on the active tab
  const dailySnapshot = dailyTeams[dateStr];
  let activeTeams: Team[] = [];
  if (viewMode === 'daily') {
    activeTeams = dailySnapshot?.teams || [];
  } else {
    if (masterSetId === 'base') activeTeams = unit.baseTeams;
    else activeTeams = unit.teamSets?.find(ts => ts.id === masterSetId)?.teams || [];
  }

  // --- SMART SUB AI ENGINE (GENDER AWARE + MULTI-TEAM CHECK) ---
  const aiSuggestions = useMemo(() => {
    if (viewMode !== 'daily' || !dailySnapshot) return [];
    const suggestions: { player: Player, fromTeam: Team, toTeam: Team, newDiff: number }[] = [];
    
    // Calculate stats for each team (ignoring absents)
    const teamsInfo = dailySnapshot.teams.map(t => {
       const active = t.players.filter(p => attendance[p.id] !== 'absent');
       const avg = active.length > 0 ? active.reduce((sum, p) => sum + p.skill, 0) / active.length : 0;
       return { team: t, active, avg };
    });

    const counts = teamsInfo.map(t => t.active.length);
    if (counts.length === 0) return [];
    
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    // If teams are perfectly balanced or off by just 1, no subs needed
    if (maxCount - minCount <= 1) return []; 

    const shortTeams = teamsInfo.filter(t => t.active.length === minCount);
    
    // FIX: Look at ANY team that has enough players to spare (not just the single largest team)
    const surplusTeams = teamsInfo.filter(t => t.active.length >= minCount + 2);

    // Run the math for every possible substitution scenario
    for (const short of shortTeams) {
        // GENDER LOCK CHECK: Look at the original full roster of this short team
        const originalGenders = short.team.players.map(p => p.gender);
        const isAllMale = originalGenders.length > 0 && originalGenders.every(g => g !== 'F');
        const isAllFemale = originalGenders.length > 0 && originalGenders.every(g => g === 'F');

        for (const surplus of surplusTeams) {
            for (const candidate of surplus.active) {
                // If the short team is single-gender, ignore candidates of the opposite gender
                if (isAllMale && candidate.gender === 'F') continue;
                if (isAllFemale && candidate.gender !== 'F') continue;

                const newShortAvg = (short.avg * short.active.length + candidate.skill) / (short.active.length + 1);
                const newSurplusAvg = surplus.active.length > 1
                    ? (surplus.avg * surplus.active.length - candidate.skill) / (surplus.active.length - 1)
                    : 0;

                const newDiff = Math.abs(newShortAvg - newSurplusAvg);

                // Add to suggestions
                suggestions.push({
                    player: candidate,
                    fromTeam: surplus.team,
                    toTeam: short.team,
                    newDiff
                });
            }
        }
    }

    // Sort by which move keeps the teams the most balanced
    suggestions.sort((a, b) => a.newDiff - b.newDiff);
    return suggestions.slice(0, 3); // Only show the Top 3 options
  }, [viewMode, dailySnapshot, attendance]);
  // -------------------------

  const handlePlayerClick = (playerId: string, teamId: number) => {
    if (!isAdmin) return;
    if (!selectedPlayer) {
      setSelectedPlayer({ id: playerId, teamId });
    } else if (selectedPlayer.id === playerId) {
      setSelectedPlayer(null);
    } else {
      if (viewMode === 'daily') onSwapDaily(selectedPlayer.id, selectedPlayer.teamId, playerId, teamId);
      else onSwapMaster(selectedPlayer.id, selectedPlayer.teamId, playerId, teamId);
      setSelectedPlayer(null);
    }
  };

  const handleSaveName = (teamId: number) => {
    if (editName.trim()) {
      if (viewMode === 'daily') onRenameDaily(teamId, editName.trim());
      else onRenameMaster(teamId, editName.trim());
    }
    setEditingTeamId(null);
  };

  const getLogoUrl = (teamName: string) => {
    const normalizeStr = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const safeUnit = normalizeStr(unit.unit_name);
    const safeTeam = normalizeStr(teamName);
    return `https://raw.githubusercontent.com/scottscalici/PE/main/teams/${safeUnit}/${safeTeam}.png`;
  };

  const handlePrint = () => window.print();

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page { size: landscape; margin: 10mm; }
          body * { visibility: hidden; }
          #printable-team-rosters, #printable-team-rosters * { visibility: visible; }
          #printable-team-rosters { 
            position: absolute; left: 0; top: 0; width: 100%; background: white !important; 
          }
          .no-print { display: none !important; }
          .print-grid { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 12px !important; }
          .print-card { break-inside: avoid; page-break-inside: avoid; border: 2px solid #cbd5e1 !important; border-radius: 8px !important; background: #ffffff !important; box-shadow: none !important; }
          .print-header { background: #f1f5f9 !important; color: #0f172a !important; border-bottom: 2px solid #cbd5e1 !important; }
          .print-text { font-size: 11pt !important; color: #000 !important; }
        }
      `}</style>

      {/* TOP TOGGLE BAR */}
      <div className="flex border-b border-slate-200 bg-white p-2 rounded-t-xl gap-2 shadow-sm no-print">
        <button 
          onClick={() => setViewMode('daily')} 
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'daily' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <CalendarDays className="w-4 h-4"/> Game Day Snapshot (Today)
        </button>
        <button 
          onClick={() => setViewMode('master')} 
          className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'master' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <Shield className="w-4 h-4"/> Master Templates
        </button>
      </div>

      <div className="flex items-center justify-between no-print">
        {viewMode === 'daily' ? (
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <CalendarDays className="h-6 w-6 text-blue-600" /> Today's Active Teams
            </h2>
            <p className="text-sm font-semibold text-slate-500 mt-1">Live snapshot for {new Date(dateStr).toLocaleDateString()}</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
             <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
               <Shield className="h-6 w-6 text-indigo-600" /> Editing Master: 
             </h2>
             <select 
               value={masterSetId} 
               onChange={e => setMasterSetId(e.target.value)} 
               className="border-2 border-indigo-200 bg-indigo-50 text-indigo-900 font-bold px-3 py-1.5 rounded-lg outline-none"
             >
               <option value="base">Default Base Teams</option>
               {unit.teamSets?.map(ts => <option key={ts.id} value={ts.id}>{ts.name}</option>)}
             </select>
          </div>
        )}
        
        <div className="flex items-center gap-3">
          {isAdmin && viewMode === 'daily' && dailySnapshot && (
            <button onClick={onClearDaily} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-red-600 border border-red-200 hover:bg-red-100 transition">
              <XCircle className="h-4 w-4" /> Reset Today
            </button>
          )}
          {isAdmin && onPreviewStudentView && (
            <button onClick={onPreviewStudentView} className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-200 transition" title="Preview the student-facing view">
              <Eye className="h-4 w-4" /> Display Mode
            </button>
          )}
          <button onClick={handlePrint} className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition">
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>
      </div>

      {/* GAME DAY INITIALIZER */}
      {viewMode === 'daily' && !dailySnapshot && (
        <div className="bg-white border border-blue-200 rounded-xl p-8 text-center shadow-sm max-w-2xl mx-auto mt-8 no-print animate-in fade-in zoom-in-95">
          <CalendarDays className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">No Active Teams for Today</h2>
          <p className="text-slate-500 mb-8">Select a master template below to clone it for today's games. Any substitutions you make today will not affect your master templates.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <select 
              value={initSourceId} 
              onChange={(e) => setInitSourceId(e.target.value)}
              className="border-2 border-slate-300 rounded-lg px-4 py-3 font-bold text-slate-700 outline-none min-w-[200px]"
            >
              <option value="base">Default Base Teams</option>
              {unit.teamSets?.map(ts => <option key={ts.id} value={ts.id}>{ts.name}</option>)}
            </select>
            <button onClick={() => onInitDaily(initSourceId)} className="bg-blue-600 text-white font-bold px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-md w-full sm:w-auto">
              <RefreshCw className="w-5 h-5" /> Load For Today
            </button>
          </div>
        </div>
      )}

      {/* SMART AI RECOMMENDER */}
      {viewMode === 'daily' && aiSuggestions.length > 0 && (
         <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-xl p-5 shadow-sm no-print animate-in slide-in-from-top-4">
           <h3 className="font-bold text-amber-900 flex items-center gap-2 mb-3 text-lg"><Wand2 className="w-5 h-5 text-amber-600"/> Smart Sub Recommendations</h3>
           <p className="text-sm text-amber-700 mb-4">You have missing players today. Click a recommendation below to instantly balance the teams based on skill.</p>
           <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
             {aiSuggestions.map((sub, i) => (
                <button 
                  key={i} 
                  onClick={() => onMoveDaily(sub.player.id, sub.fromTeam.id, sub.toTeam.id)} 
                  className="bg-white border border-amber-200 hover:border-amber-400 hover:bg-amber-50 rounded-lg p-3 text-left transition-colors shadow-sm group"
                >
                  <div className="text-xs font-bold text-amber-600 mb-1 uppercase tracking-wider">Option {i+1}</div>
                  <div className="font-semibold text-slate-800">Move <span className="text-blue-600">{sub.player.name}</span></div>
                  <div className="text-xs text-slate-500 mt-0.5 group-hover:text-amber-700">From {sub.fromTeam.name} ➜ {sub.toTeam.name}</div>
                </button>
             ))}
           </div>
         </div>
      )}

      {/* Main Container marked for screen and print */}
      {activeTeams.length > 0 && (
        <div id="printable-team-rosters" className="space-y-4">
          <div className="hidden print:block mb-6 text-center">
            <h1 className="text-2xl font-black text-slate-900 border-b-2 border-slate-300 inline-block pb-2 px-10">{unit.unit_name} - {viewMode === 'daily' ? 'Today\'s Roster' : 'Master Roster'}</h1>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 print-grid">
            {activeTeams.map((team) => (
              <div key={team.id} className="print-card overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
                
                <div className={`print-header flex items-center justify-between border-b px-4 py-3 text-white ${team.league === 'Competitive' ? 'bg-slate-800' : 'bg-blue-600'}`}>
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
                        <h3 className="font-bold tracking-wide truncate print-text font-black">{team.name}</h3>
                        {isAdmin && <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity no-print" />}
                      </div>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-100 p-2">
                  {team.players.map((p) => {
                    const isSelected = selectedPlayer?.id === p.id;
                    const status = attendance[p.id];
                    // If in daily mode, physically absent kids are grayed out.
                    const isAbsent = viewMode === 'daily' && status === 'absent';
                    
                    return (
                      <div
                        key={p.id}
                        onClick={() => handlePlayerClick(p.id, team.id)}
                        className={`flex items-center justify-between rounded-lg px-3 py-1.5 transition-all ${
                          isAdmin ? 'cursor-pointer hover:bg-slate-50' : ''
                        } ${isSelected ? 'bg-blue-50 ring-2 ring-blue-500 ring-inset no-print' : ''} ${isAbsent ? 'opacity-40 grayscale bg-slate-50' : ''}`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <div className={`no-print h-2 w-2 shrink-0 rounded-full ${
                              status === 'absent' ? 'bg-red-500' :
                              status === 'late' ? 'bg-amber-400' :
                              status === 'present' ? 'bg-emerald-500' : 'bg-slate-200'
                            }`}
                            title={status || 'unmarked'}
                          />
                          <span className={`print-text font-semibold truncate ${isSelected ? 'text-blue-700' : 'text-slate-700'} ${isAbsent ? 'line-through' : ''}`}>
                            {p.name}
                          </span>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-2 no-print shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">S:{p.skill}</span>
                            <select
                              value=""
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                if (viewMode === 'daily') onMoveDaily(p.id, team.id, Number(e.target.value));
                                else onMoveMaster(p.id, team.id, Number(e.target.value));
                              }}
                              className="text-xs border rounded bg-slate-50 outline-none text-slate-600 w-14"
                            >
                              <option value="" disabled>Move</option>
                              {activeTeams.filter(t => t.id !== team.id).map(t => (
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
      )}
    </div>
  );
}
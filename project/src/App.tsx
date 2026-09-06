import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, Eye, Users, CalendarDays, LogIn, LogOut, BookOpen, LayoutDashboard,
  ClipboardCheck, Star, ClipboardList, Wand2, Grid3x3, Trophy, School, Loader2, CloudOff, Cloud, Activity, Plus, Lock
} from 'lucide-react';
import type {
  ClassData, Unit, ScheduleData, SyllabusData, DailyLogMap, DailyLog, ScoreType,
  QuarterHistoryMap, AttendanceMap, Player, Team, Match, UnitData
} from './types';
import { initialClasses } from './data';
import { emptyLog } from './grading';
import { loadAppMeta, ensureInitialData, subscribeToClasses, saveClass } from './firestore';
import TeamManager from './components/TeamManager';
import ScheduleStandings from './components/ScheduleStandings';
import UnitSyllabus from './components/UnitSyllabus';
import PublicDashboard from './components/PublicDashboard';
import AttendanceTracker from './components/AttendanceTracker';
import DailyGrades from './components/DailyGrades';
import RosterManager from './components/RosterManager';
import TeamCreator from './components/TeamCreator';
import UnitScheduleBuilder from './components/UnitScheduleBuilder';
import Leaderboards from './components/Leaderboards';
import WorkoutPlayer from './components/WorkoutPlayer';
import MasterCalendarBuilder from './components/MasterCalendarBuilder';

type AdminView = 'teams' | 'schedule' | 'attendance' | 'grades' | 'roster' | 'teamcreator' | 'calendar'| 'builder';
type PublicView = 'syllabus' | 'dashboard' | 'leaderboards' | 'workout';

const allPlayerIds = (c: ClassData): string[] => c.roster?.map((p) => p.id) || [];
const deriveAttendance = (logs: DailyLogMap): AttendanceMap => {
  const map: AttendanceMap = {};
  Object.entries(logs).forEach(([id, log]) => {
    if (log.scoreType === 'absent') map[id] = 'absent';
    else if (log.scoreType === 'tardy') map[id] = 'late';
    else map[id] = 'present';
  });
  return map;
};

let playerIdCounter = 1000;
const genPlayerId = (classId: string) => `${classId}_IMP_${Date.now()}_${playerIdCounter++}`;
let matchIdCounter = 1000;
const genMatchId = () => matchIdCounter++;

export default function App() {
  const [route, setRoute] = useState<'student' | 'admin_login' | 'admin'>(
    window.location.hash === '#admin' ? 'admin_login' : 'student'
  );
  const [pin, setPin] = useState('');

  const [adminView, setAdminView] = useState<AdminView>('teams');
  const [publicView, setPublicView] = useState<PublicView>('syllabus');
  const [classes, setClasses] = useState<ClassData[]>(initialClasses);
  const [activeClassId, setActiveClassId] = useState<string>(initialClasses[0].id);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firestoreReady, setFirestoreReady] = useState(false);
  const skipNextSave = useRef(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const activeClass = useMemo(() => classes.find((c) => c.id === activeClassId) ?? classes[0], [classes, activeClassId]);
  const activeUnitData = useMemo(() => {
    if (!activeClass || !activeClass.units) return null;
    return activeClass.units.find(u => u.id === activeClass.activeUnitId) || activeClass.units[0];
  }, [activeClass]);

  const { logs = {}, quarterHistory = {}, floorGrid = {}, roster = [] } = activeClass || {};
  const { unit, schedule, syllabus, wins, teammatePoints } = activeUnitData || { unit: {} as Unit, schedule: {} as ScheduleData, syllabus: {} as SyllabusData, wins: {}, teammatePoints: {} };

  const attendance = deriveAttendance(logs);
  const teamNames = useMemo(() => unit?.baseTeams?.map((t) => t.name) || [], [unit]);

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin' && route !== 'admin') setRoute('admin_login');
      else if (window.location.hash !== '#admin') setRoute('student');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [route]);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    (async () => {
      try {
        await ensureInitialData();
        const meta = await loadAppMeta();
        if (meta.classIds.length > 0 && !meta.classIds.includes(activeClassId)) {
          setActiveClassId(meta.classIds[0]);
        }
        unsubscribe = subscribeToClasses(meta.classIds.length > 0 ? meta.classIds : initialClasses.map((c) => c.id), (remoteClasses) => {
          if (remoteClasses.length > 0) {
            skipNextSave.current = true;
            
            const migratedClasses = remoteClasses.map(c => {
              let units = c.units || [];
              if (units.length === 0 && c.unit) {
                units = [{
                  id: c.unit.unit_id || `U_legacy_${Date.now()}`, unit: c.unit, schedule: c.schedule, syllabus: c.syllabus, wins: c.wins || {}, teammatePoints: c.teammatePoints || {}
                }];
              }

              units = units.map(u => {
                if (u.unit.sport_type === 'custom') {
                  return { ...u, unit: { ...u.unit, sport_type: `link_${u.unit.unit_name.toLowerCase().replace(/[^a-z0-9]/g, '')}` } };
                }
                return u;
              });

              return { ...c, units, activeUnitId: c.activeUnitId || units[0]?.id, roster: c.roster || [] };
            });
            
            setClasses(migratedClasses);
          }
          setLoading(false);
          setFirestoreReady(true);
        });
      } catch (err) {
        console.error('Firestore load failed:', err);
        setLoadError(true);
        setLoading(false);
      }
    })();
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  useEffect(() => {
    if (skipNextSave.current) { skipNextSave.current = false; return; }
    if (!firestoreReady) return;
    classes.forEach((c) => {
      const prevTimer = saveTimers.current[c.id];
      if (prevTimer) clearTimeout(prevTimer);
      saveTimers.current[c.id] = setTimeout(async () => {
        setSaving(true);
        try { await saveClass(c); } catch (err) {} finally { setSaving(false); }
      }, 800);
    });
  }, [classes, firestoreReady]);

  const updateClass = (updater: (c: ClassData) => ClassData) => setClasses((prev) => prev.map((c) => (c.id === activeClassId ? updater(c) : c)));
  const updateActiveUnit = (updater: (u: UnitData) => UnitData) => updateClass((c) => {
      const currentUnitId = c.activeUnitId || c.units[0]?.id;
      return { ...c, units: c.units.map(u => u.id === currentUnitId ? updater(u) : u) };
  });

  const handleAddPlayer = (player: Omit<Player, 'id'>) => updateClass((c) => ({ ...c, roster: [...c.roster, { ...player, id: genPlayerId(activeClassId) }] }));
  const handleBulkAddPlayers = (players: Omit<Player, 'id'>[]) => updateClass((c) => ({ ...c, roster: [...c.roster, ...players.map(p => ({ ...p, id: genPlayerId(c.id) }))] }));
  const handleUpdatePlayer = (id: string, updates: Partial<Player>) => updateClass((c) => ({ ...c, roster: c.roster.map(p => p.id === id ? { ...p, ...updates } : p), units: c.units.map(u => ({ ...u, unit: { ...u.unit, baseTeams: u.unit.baseTeams.map(t => ({ ...t, players: t.players.map(p => p.id === id ? { ...p, ...updates } : p) })) } })) }));
  const handleDeletePlayer = (id: string) => updateClass((c) => ({ ...c, roster: c.roster.filter(p => p.id !== id), units: c.units.map(u => ({ ...u, unit: { ...u.unit, baseTeams: u.unit.baseTeams.map(t => ({ ...t, players: t.players.filter(p => p.id !== id) })) } })) }));

  const handleGenerateTeams = (teams: Team[]) => updateActiveUnit((u) => ({ ...u, unit: { ...u.unit, baseTeams: teams } }));
  const handleRenameTeam = (teamId: number, newName: string) => updateActiveUnit((u) => ({ ...u, unit: { ...u.unit, baseTeams: u.unit.baseTeams.map((t) => t.id === teamId ? { ...t, name: newName } : t) } }));
  const handleSwap = (p1Id: string, t1Id: number, p2Id: string, t2Id: number) => updateActiveUnit((u) => {
    const teams = u.unit.baseTeams.map((t) => ({ ...t, players: [...t.players] }));
    const t1 = teams.find((t) => t.id === t1Id); const t2 = teams.find((t) => t.id === t2Id);
    if (!t1 || !t2) return u;
    const i1 = t1.players.findIndex((p) => p.id === p1Id); const i2 = t2.players.findIndex((p) => p.id === p2Id);
    if (i1 === -1 || i2 === -1) return u;
    const tmp = t1.players[i1]; t1.players[i1] = t2.players[i2]; t2.players[i2] = tmp;
    return { ...u, unit: { ...u.unit, baseTeams: teams } };
  });
  const handleMovePlayer = (playerId: string, _fromTeamId: number, toTeamId: number) => updateActiveUnit((u) => {
    let movedPlayer: Player | null = null;
    const teams = u.unit.baseTeams.map((t) => {
      const idx = t.players.findIndex((p) => p.id === playerId);
      if (idx !== -1) { movedPlayer = t.players[idx]; return { ...t, players: t.players.filter((p) => p.id !== playerId) }; }
      return t;
    });
    if (!movedPlayer) return u;
    const target = teams.find((t) => t.id === toTeamId);
    if (target) target.players = [...target.players, movedPlayer];
    return { ...u, unit: { ...u.unit, baseTeams: teams } };
  });

  const handleUpdateScore = (matchId: number, side: 'home' | 'away', value: number | null) => updateActiveUnit((u) => {
    const matches = u.schedule.matches.map((m) => m.id === matchId ? { ...m, [side === 'home' ? 'home_score' : 'away_score']: value, completed: (side === 'home' ? value : m.home_score) !== null && (side === 'away' ? value : m.away_score) !== null } : m);
    const match = matches.find((m) => m.id === matchId);
    if (match && match.completed && match.home_score !== null && match.away_score !== null) {
      if (!u.schedule.matches.find((m) => m.id === matchId)?.completed) {
        const winnerName = match.home_score > match.away_score ? match.home_team : match.away_score > match.home_score ? match.away_team : null;
        if (winnerName) {
          const winnerTeam = u.unit.baseTeams.find((t) => t.name === winnerName);
          if (winnerTeam) {
            const nextWins = { ...u.wins };
            winnerTeam.players.forEach((p) => { nextWins[p.id] = (nextWins[p.id] ?? 0) + 1; });
            return { ...u, schedule: { ...u.schedule, matches }, wins: nextWins };
          }
        }
      }
    }
    return { ...u, schedule: { ...u.schedule, matches } };
  });
  
  const handleAddMatch = (m: Omit<Match, 'id'>) => updateActiveUnit((u) => ({ ...u, schedule: { ...u.schedule, matches: [...u.schedule.matches, { ...m, id: genMatchId() }] } }));
  const handleDeleteMatch = (id: number) => updateActiveUnit((u) => ({ ...u, schedule: { ...u.schedule, matches: u.schedule.matches.filter((m) => m.id !== id) } }));

  const handleUpdateLog = (playerId: string, log: DailyLog) => updateClass((c) => ({ ...c, logs: { ...c.logs, [playerId]: log } }));
  const handleQuickSet = (playerId: string, type: ScoreType) => updateClass((c) => ({ ...c, logs: { ...c.logs, [playerId]: emptyLog(type) } }));
  const handleMarkAll = (type: ScoreType) => updateClass((c) => { const next: DailyLogMap = {}; allPlayerIds(c).forEach((id) => { next[id] = emptyLog(type); }); return { ...c, logs: next }; });

  const handleCreateNewUnit = () => {
    const timestamp = Date.now();
    const sharedLinkID = `link_${timestamp}`; 
    const sharedName = `New Unit`;

    setClasses(prev => prev.map(c => {
      const uId = `U_${timestamp}_${c.id}`;
      const blankUnit: UnitData = {
        id: uId,
        unit: { unit_id: uId, unit_name: sharedName, sport_type: sharedLinkID, class_id: c.id, has_leagues: false, baseTeams: [] },
        schedule: { matches: [], standings: {} },
        syllabus: { display_name: sharedName },
        wins: {},
        teammatePoints: {}
      };
      return { 
        ...c, 
        units: [...(c.units || []), blankUnit],
        activeUnitId: c.id === activeClassId ? uId : c.activeUnitId 
      };
    }));
  };

  const handleUpdateUnitName = (newName: string) => {
    const targetLinkID = activeUnitData?.unit.sport_type;
    if (!targetLinkID) return;
    
    setClasses(prev => prev.map(c => ({
      ...c,
      units: c.units.map(u => 
        u.unit.sport_type === targetLinkID 
          ? { ...u, unit: { ...u.unit, unit_name: newName } } 
          : u
      )
    })));
  };

  const handleUpdateSyllabus = (s: SyllabusData) => {
    const targetLinkID = activeUnitData?.unit.sport_type;
    if (!targetLinkID) return;
    
    setClasses(prev => prev.map(c => ({
      ...c,
      units: c.units.map(u => 
        u.unit.sport_type === targetLinkID 
          ? { ...u, syllabus: s } 
          : u
      )
    })));
  };

  const handleHardReset = async () => {
    if (confirm('⚠️ WARNING: This will WIPE the cloud database and restore the default data.ts. Continue?')) {
      setLoading(true);
      try {
        for (const c of initialClasses) {
          await saveClass(c);
        }
        window.location.reload();
      } catch (e) {
        alert('Error resetting database. See console.');
        setLoading(false);
      }
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '1234') setRoute('admin');
    else alert('Incorrect PIN');
  };

  if (route === 'admin_login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <form onSubmit={handleAdminLogin} className="bg-white p-8 rounded-xl shadow-xl border border-slate-200 w-full max-w-sm text-center">
          <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-6 text-slate-800">Admin Command Center</h2>
          <input type="password" placeholder="Enter PIN" value={pin} onChange={e => setPin(e.target.value)} className="w-full border border-slate-300 rounded-lg p-3 text-center text-xl tracking-widest outline-none focus:border-blue-500 mb-4" autoFocus />
          <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4" /> Unlock
          </button>
        </form>
      </div>
    );
  }

  if (!activeUnitData) return <div className="p-10 text-center">Loading Data...</div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <header className={`sticky top-0 z-10 border-b shadow-md ${route === 'admin' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-blue-700 border-blue-800 text-white'}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2 text-lg font-bold">
            <Users className="h-6 w-6 text-blue-200" />
            {route === 'admin' ? 'PE Command Center' : 'PE Student Portal'}
          </div>

          <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${route === 'admin' ? 'bg-slate-800' : 'bg-blue-800'}`}>
            <School className="h-4 w-4 text-blue-300" />
            <select value={activeClassId} onChange={(e) => setActiveClassId(e.target.value)} className={`cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-white border-0 outline-none ${route === 'admin' ? 'bg-slate-800' : 'bg-blue-800'}`}>
              {classes.map((c) => <option key={c.id} value={c.id}>Class {c.id}</option>)}
            </select>
          </div>

          {activeClass.units && activeClass.units.length > 0 && (
            <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 ${route === 'admin' ? 'bg-slate-800' : 'bg-blue-800'}`}>
              <Trophy className="h-4 w-4 text-amber-300" />
              <select value={activeClass.activeUnitId || activeClass.units[0]?.id} onChange={(e) => updateClass(c => ({ ...c, activeUnitId: e.target.value }))} className={`cursor-pointer rounded-md px-2 py-1 text-sm font-semibold text-white border-0 outline-none max-w-[150px] truncate ${route === 'admin' ? 'bg-slate-800' : 'bg-blue-800'}`}>
                {activeClass.units.map((u) => <option key={u.id} value={u.id}>{u.unit.unit_name}</option>)}
              </select>
              {route === 'admin' && (
                <button onClick={handleCreateNewUnit} title="Create New Unit" className="ml-1 p-1 hover:bg-slate-700 rounded text-emerald-400">
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {route === 'admin' ? (
            <nav className="flex flex-wrap gap-2">
              <NavButton active={adminView === 'teams'} onClick={() => setAdminView('teams')} icon={<Users className="h-4 w-4" />}>Teams</NavButton>
              <NavButton active={adminView === 'schedule'} onClick={() => setAdminView('schedule')} icon={<CalendarDays className="h-4 w-4" />}>Scores</NavButton>
              <NavButton active={adminView === 'attendance'} onClick={() => setAdminView('attendance')} icon={<ClipboardCheck className="h-4 w-4" />}>Logs</NavButton>
              <NavButton active={adminView === 'roster'} onClick={() => setAdminView('roster')} icon={<ClipboardList className="h-4 w-4" />}>Roster</NavButton>
              <NavButton active={adminView === 'teamcreator'} onClick={() => setAdminView('teamcreator')} icon={<Wand2 className="h-4 w-4" />}>Generator</NavButton>
              <NavButton active={adminView === 'builder'} onClick={() => setAdminView('builder')} icon={<Grid3x3 className="h-4 w-4" />}>Builder</NavButton>
              <NavButton active={adminView === 'calendar'} onClick={() => setAdminView('calendar')} icon={<CalendarDays className="h-4 w-4" />}>Calendar</NavButton>
            </nav>
          ) : (
            <nav className="flex gap-2">
              <NavButton active={publicView === 'syllabus'} onClick={() => setPublicView('syllabus')} icon={<BookOpen className="h-4 w-4" />}>Unit Plan</NavButton>
              <NavButton active={publicView === 'dashboard'} onClick={() => setPublicView('dashboard')} icon={<LayoutDashboard className="h-4 w-4" />}>Teams & Schedule</NavButton>
              <NavButton active={publicView === 'workout'} onClick={() => setPublicView('workout')} icon={<CalendarDays className="h-4 w-4" />}>Daily Log</NavButton>
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            {route === 'admin' && <SaveStatusIndicator saving={saving} firestoreReady={firestoreReady} loadError={loadError} />}
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Loading Data…</p>
          </div>
        </div>
      ) : (
        <div className="mx-auto flex-1 w-full max-w-7xl px-4 py-6">
          {route === 'admin' ? (
            <>
              {adminView === 'teams' ? <TeamManager key={`teams-${unit.unit_id}`} unit={unit} isAdmin={true} onSwap={handleSwap} onMove={handleMovePlayer} attendance={attendance} onRenameTeam={handleRenameTeam} />
              : adminView === 'schedule' ? <ScheduleStandings key={`sched-${unit.unit_id}`} schedule={schedule} isAdmin={true} onUpdateScore={handleUpdateScore} />
              : adminView === 'attendance' ? <AttendanceTracker key={`att-${unit.unit_id}`} roster={roster} unit={unit} logs={logs} quarterHistory={quarterHistory} floorGrid={floorGrid} onUpdateLog={handleUpdateLog} onQuickSet={handleQuickSet} onMarkAll={handleMarkAll} onUpdatePlayer={handleUpdatePlayer} onUpdateFloorGrid={(g) => updateClass((c) => ({ ...c, floorGrid: g }))} />
              : adminView === 'grades' ? <DailyGrades key={`grades-${unit.unit_id}`} roster={roster} unit={unit} logs={logs} quarterHistory={quarterHistory} />
              : adminView === 'roster' ? <RosterManager key={`roster-${activeClassId}`} roster={roster} unit={unit} floorGrid={floorGrid} classId={activeClassId} onAddPlayer={handleAddPlayer} onBulkAddPlayers={handleBulkAddPlayers} onUpdatePlayer={handleUpdatePlayer} onDeletePlayer={handleDeletePlayer} onUpdateFloorGrid={(g) => updateClass((c) => ({ ...c, floorGrid: g }))} />
              : adminView === 'teamcreator' ? <TeamCreator key={`tc-${unit.unit_id}`} roster={roster} unit={unit} onGenerate={handleGenerateTeams} onMovePlayer={handleMovePlayer} />
              : adminView === 'calendar' ? <MasterCalendarBuilder key={`cal-${activeClassId}`} calendar={activeClass.masterCalendar || []} classId={activeClassId} onSave={(cal) => updateClass(c => ({ ...c, masterCalendar: cal }))} />
                            : <UnitScheduleBuilder key={`builder-${unit.unit_id}`} unitName={unit.unit_name} onUpdateUnitName={handleUpdateUnitName} syllabus={syllabus} schedule={schedule} teamNames={teamNames} onUpdateSyllabus={handleUpdateSyllabus} onAddMatch={handleAddMatch} onDeleteMatch={handleDeleteMatch} />}

              {/* DANGER ZONE - Only visible inside the Builder tab */}
              {adminView === 'builder' && (
                <div className="mt-16 border-t border-red-200 pt-8 pb-8">
                  <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-center shadow-sm">
                    <h3 className="mb-2 text-lg font-bold text-red-800">Danger Zone</h3>
                    <p className="mb-5 text-sm text-red-600">This will permanently wipe all cloud data and restore the default database state. This action cannot be undone.</p>
                    <button onClick={handleHardReset} className="text-sm font-bold text-white hover:bg-red-700 bg-red-600 px-6 py-2.5 rounded-lg transition shadow-md">
                      ⚠️ Factory Reset Database
                    </button>
                  </div>
                </div>
              )}
            </>
       ) : publicView === 'workout' ? (
              <WorkoutPlayer 
                key={`workout-${activeClassId}`} 
                calendar={activeClass.masterCalendar || []} 
                units={activeClass.units || []} 
                onNavigateToUnit={(unitId) => {
                  updateClass(c => ({ ...c, activeUnitId: unitId }));
                  setPublicView('dashboard');
                }} 
              />
          ) : publicView === 'syllabus' ? <UnitSyllabus key={`syl-${unit.unit_id}`} syllabus={syllabus} unitName={unit.unit_name} />
            : <PublicDashboard key={`pub-${unit.unit_id}`} unit={unit} schedule={schedule} />
          }
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode; }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition ${active ? 'bg-white/20 text-white shadow' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}>
      {icon} {children}
    </button>
  );
}

function SaveStatusIndicator({ saving, firestoreReady, loadError }: { saving: boolean; firestoreReady: boolean; loadError: boolean }) {
  if (loadError) return <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-xs font-semibold text-red-300"><CloudOff className="h-3.5 w-3.5" /> Local</span>;
  if (saving) return <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-xs font-semibold text-amber-300"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…</span>;
  if (firestoreReady) return <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-semibold text-emerald-300"><Cloud className="h-3.5 w-3.5" /> Saved</span>;
  return null;
}
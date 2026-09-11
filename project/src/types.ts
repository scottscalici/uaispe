export type League = 'Competitive' | 'Recreational' | 'Standard';
export type Gender = 'M' | 'F';
export type Availability = 'active' | 'injured' | 'out';

export interface Player {
  id: string;
  name: string;
  gender: string;
  skill: number;
  compete: number;
  grade?: string;
  availability?: 'active' | 'injured' | 'out';
  scheduledAbsences?: { id: string; date: string; reason: string }[];
  lifetimeWins?: number;
  teammateVotes?: number;
}

export interface LessonPlanItem {
  id: string;
  time: string;
  activity: string;
  details: string;
}

export interface LessonPlan {
  linkedSyllabusDay?: number | null; 
  goals?: string;
  timeline: LessonPlanItem[];
}

export interface CalendarDay {
  fecha: string;
  ciclo: 'A' | 'B' | null;
  dia: number | null;
  status: string;
  note: string;
  manualOverride: boolean;
  unitName?: string;
  activity?: string;
  lessonPlan?: LessonPlan;
}

export interface Team {
  id: number;
  name: string;
  league: League;
  players: Player[];
  logo_id?: string;
}

export interface TeamSet {
  id: string;
  name: string; 
  teams: Team[];
}

export interface Unit {
  unit_id: string;
  unit_name: string;
  sport_type: string;
  class_id: string;
  has_leagues: boolean;
  baseTeams: Team[];
  teamSets?: TeamSet[]; 
}

export type MatchType = 'standard' | 'minigame' | 'bracket';

export interface Match {
  id: number;
  match_type?: MatchType; 
  team_set_id?: string; 
  home_team: string; 
  away_team: string; 
  home_score: number | null;
  away_score: number | null;
  date_str: string;
  time: string;
  location: string;
  completed: boolean;
  round_name?: string; 
}

export interface StandingRow {
  w: number;
  l: number;
  t: number;
  pf: number;
  pa: number;
  pd: number;
  pts: number;
}

export type Standings = Record<string, StandingRow>;

export interface ScheduleData {
  matches: Match[];
  standings: Standings;
}

export interface MediaImage {
  file: string;
  caption?: string;
}

export interface EquipmentItem {
  name: string;
  caption?: string;
  image_file?: string;
}

export interface Activity {
  name: string;
  overview?: string;
  rules?: string[];
  image?: MediaImage;
}

export interface KeyTerm {
  term: string;
  definition: string;
  image?: MediaImage;
}

export interface DayPlan {
  day: number;
  topic?: string;
  skills?: string;
  discussion?: string;
  activities?: Activity[];
  key_terms?: KeyTerm[]; 
}

export interface GlobalConnections {
  description?: string;
  highlights_video?: string;
  image?: MediaImage;
}

export interface SyllabusData {
  display_name: string;
  header_image?: string;
  setup_image?: MediaImage;
  equipment?: EquipmentItem[];
  rules?: string[];
  unit_plan?: DayPlan[];
  key_terms?: KeyTerm[]; 
  global_connections?: GlobalConnections;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';
export type AttendanceMap = Record<string, AttendanceStatus>;
export type GradeMap = Record<string, number>;

export type ScoreType =
  | 'present'
  | 'tardy'
  | 'excused'
  | 'zero'
  | 'bonus'
  | 'absent';

export interface InfractionEntry {
  categoryId: string;
  optionLabel: string;
  points: number;
}

export interface DailyLog {
  scoreType: ScoreType;
  bonusPoints: number;
  excusedReasons: string[];
  infractions: InfractionEntry[];
  warnings: string[];
  note?: string;
  notes?: string;
  deductions?: number;
  teammatePoints?: number;
}

export type DailyLogMap = Record<string, DailyLog>;

export interface QuarterHistory {
  earned: number;
  possible: number;
}

export type QuarterHistoryMap = Record<string, QuarterHistory>;

export interface FloorSpot {
  row: number;
  col: number;
  playerId?: string;
  blocked?: boolean;
}

export type FloorGrid = Record<string, FloorSpot>;

export type WinMap = Record<string, number>;
export type TeammatePointMap = Record<string, number>;

export interface DailyTeamSnapshot {
  baseTeamSetId: string; 
  teams: Team[];         
}

export interface UnitData {
  id: string;
  unit: Unit;
  schedule: ScheduleData;
  syllabus: SyllabusData;
  wins: WinMap;
  teammatePoints: TeammatePointMap;
}

export interface ClassData {
  id: string;
  roster: Player[];
  logs: DailyLogMap;
  gradebook?: Record<string, DailyLogMap>;
  dailyTeams?: Record<string, DailyTeamSnapshot>; 
  quarterHistory: QuarterHistoryMap;
  floorGrid: FloorGrid;
  units: UnitData[];
  activeUnitId: string;
  masterCalendar?: CalendarDay[];
}
import type { Unit, ScheduleData, SyllabusData, ClassData, UnitData } from './types';

// THE MAGIC THREAD: This links the two units together safely!
const SHARED_LINK_ID = 'link_backwards_soccer';

export const dummySyllabus: SyllabusData = {
  display_name: 'Backwards Soccer',
  header_image:
    'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=1200',
  setup_image: {
    file: 'https://images.pexels.com/photos/47730/the-ball-stadion-football-the-pitch-47730.jpeg?auto=compress&cs=tinysrgb&w=800',
    caption: 'Field setup: two goals facing outward, players move in reverse.',
  },
  equipment: [
    { name: 'Cones', caption: 'For marking boundaries and zones' },
    { name: 'Soft foam ball', caption: 'Size 4 indoor' },
    { name: 'Pinnies', caption: 'Two colors to distinguish teams' },
  ],
  rules: [
    'Players must move backward or sideways only — forward running is a foul.',
    'Passes must be made with the inside of the foot while backpedaling.',
    'No goalkeepers; any player may defend the goal.',
    'A goal counts only if scored from outside the penalty arc.',
    'Restart with a backward roll-in from the sideline.',
  ],
  unit_plan: [
    {
      day: 1,
      topic: 'Intro & Footwork',
      skills: 'Backpedaling, lateral shuffles, spatial awareness',
      discussion: 'Why is moving backward harder than forward? What muscles feel different?',
      activities: [
        {
          name: 'Mirror Drill',
          overview: 'Pairs face each other; one leads, the other mirrors while moving backward.',
          rules: ['Stay 3 feet apart', 'Keep knees bent', 'Switch leader every 60 seconds'],
        },
        {
          name: 'Backward Relay',
          overview: 'Teams race to a cone and back while backpedaling.',
          rules: ['No forward running', 'Tag the next runner'],
        },
      ],
    },
    {
      day: 2,
      topic: 'Passing in Reverse',
      skills: 'Inside-foot passing, receiving while backpedaling',
      discussion: 'How does your body position change when you pass backward?',
      activities: [
        {
          name: 'Triangle Passing',
          overview: 'Groups of 3 pass around a triangle while moving backward.',
          rules: ['Two-touch maximum', 'Keep the triangle shape'],
        },
      ],
    },
  ],
  key_terms: [
    { term: 'Backpedal', definition: 'Running backward while keeping your eyes on the play ahead.' },
    { term: 'Lateral shuffle', definition: 'Moving side-to-side without crossing your feet.' },
  ],
  global_connections: {
    description: 'Backwards Soccer builds coordination and spatial awareness similar to training drills used in professional futsal programs.',
    highlights_video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
};

const teams3A = [
  {
    id: 1, name: 'Ctrl+Z FC', league: 'Competitive' as const,
    players: [
      { id: '3A_09', name: 'Nicholai Q.', skill: 6, compete: 4, gender: 'M' },
      { id: '3A_23', name: 'Michael O.', skill: 8, compete: 4, gender: 'M' },
      { id: '3A_20', name: 'Daniel B.', skill: 8, compete: 4, gender: 'M' },
      { id: '3A_04', name: 'Adam K.', skill: 9, compete: 5, gender: 'M' },
      { id: '3A_07', name: 'Adrian W.', skill: 8, compete: 5, gender: 'M' },
    ],
  },
  {
    id: 2, name: 'The Moonwalkers', league: 'Competitive' as const,
    players: [
      { id: '3A_28', name: 'Christopher T.', skill: 6, compete: 5, gender: 'M' },
      { id: '3A_15', name: 'Thomas S.', skill: 8, compete: 4, gender: 'M' },
      { id: '3A_17', name: 'Dominic L.', skill: 10, compete: 5, gender: 'M' },
      { id: '3A_08', name: 'Umberto S.', skill: 6, compete: 4, gender: 'M' },
      { id: '3A_24', name: 'Anthony L.', skill: 8, compete: 5, gender: 'M' },
    ],
  },
  {
    id: 3, name: 'Marcha Atrás', league: 'Recreational' as const,
    players: [
      { id: '3A_18', name: 'Sarah H.', skill: 1, compete: 1, gender: 'F' },
      { id: '3A_03', name: 'Surya N.', skill: 4, compete: 1, gender: 'F' },
      { id: '3A_05', name: 'Sophia G.', skill: 7, compete: 3, gender: 'F' },
      { id: '3A_02', name: 'Mira R.', skill: 4, compete: 2, gender: 'F' },
      { id: '3A_19', name: 'Kaylee F.', skill: 3, compete: 1, gender: 'F' },
    ],
  },
  {
    id: 4, name: 'Reverse Cards', league: 'Recreational' as const,
    players: [
      { id: '3A_12', name: 'Eriny G.', skill: 3, compete: 2, gender: 'F' },
      { id: '3A_21', name: 'Brynley T.', skill: 4, compete: 3, gender: 'F' },
      { id: '3A_30', name: 'Dawn N.', skill: 6, compete: 3, gender: 'F' },
      { id: '3A_10', name: 'Chloe M.', skill: 4, compete: 2, gender: 'F' },
      { id: '3A_06', name: 'Dima D.', skill: 5, compete: 3, gender: 'F' },
    ],
  },
];

const schedule3A: ScheduleData = {
  matches: [
    { id: 1, home_team: 'Ctrl+Z FC', away_team: 'The Moonwalkers', home_score: null, away_score: null, date_str: '2026-09-09', time: '11:15', location: 'Main Gym', completed: false },
    { id: 2, home_team: 'Marcha Atrás', away_team: 'Reverse Cards', home_score: null, away_score: null, date_str: '2026-09-09', time: '11:15', location: 'Aux Gym', completed: false },
  ],
  standings: {},
};

const teams3B = [
  {
    id: 1, name: 'Reverse Raptors', league: 'Competitive' as const,
    players: [
      { id: '3B_01', name: 'Marcus J.', skill: 9, compete: 5, gender: 'M' },
      { id: '3B_02', name: 'Trevor P.', skill: 7, compete: 4, gender: 'M' },
      { id: '3B_03', name: 'Liam F.', skill: 8, compete: 5, gender: 'M' },
      { id: '3B_04', name: 'Diego R.', skill: 7, compete: 4, gender: 'M' },
    ],
  },
  {
    id: 2, name: 'Backward Bears', league: 'Competitive' as const,
    players: [
      { id: '3B_07', name: 'Oscar V.', skill: 7, compete: 4, gender: 'M' },
      { id: '3B_08', name: 'Nathan C.', skill: 6, compete: 5, gender: 'M' },
      { id: '3B_09', name: 'Pablo G.', skill: 8, compete: 4, gender: 'M' },
      { id: '3B_10', name: 'Eli T.', skill: 7, compete: 5, gender: 'M' },
    ],
  },
];

const schedule3B: ScheduleData = {
  matches: [
    { id: 101, home_team: 'Reverse Raptors', away_team: 'Backward Bears', home_score: null, away_score: null, date_str: '2026-09-10', time: '11:15', location: 'Main Gym', completed: false },
  ],
  standings: {},
};

export function makeClass(id: string, teams: any[], schedule: ScheduleData): ClassData {
  const roster = teams.flatMap(t => t.players);
  const unitId = `U_${Date.now()}_${id}`;
  
  const unit: Unit = {
    unit_id: unitId,
    unit_name: 'Backwards Soccer',
    sport_type: SHARED_LINK_ID, // <-- Perfectly syncs them!
    class_id: id,
    has_leagues: true,
    baseTeams: teams,
  };

  const starterUnit: UnitData = {
    id: unitId,
    unit,
    schedule,
    syllabus: dummySyllabus,
    wins: {},
    teammatePoints: {},
  };

  return {
    id,
    roster,
    logs: {},
    quarterHistory: {},
    floorGrid: {},
    units: [starterUnit],
    activeUnitId: starterUnit.id,
  };
}

export const initialClasses: ClassData[] = [
  makeClass('3A', teams3A, schedule3A),
  makeClass('3B', teams3B, schedule3B),
];
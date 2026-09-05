import type { DailyLog, ScoreType, InfractionEntry } from './types';

export const DEFAULT_POSSIBLE = 10;
export const TARDY_DEDUCTION = 1;

export const EXCUSED_REASONS = [
  'IB Requirement',
  'Meeting, but returns',
  'Meeting for most of class',
  'Ill',
  'Injured',
  'Other',
] as const;

export const WARNING_TAGS = [
  'Disrespectful to self',
  'Disrespectful to others',
  'Disrespectful to environment',
  'Unsafe',
  'Poor Effort / Attitude',
] as const;

export const IB_LEARNER_TRAITS = [
  'Principled',
  'Open-Minded',
  'Caring',
  'Communicator',
  'Balanced',
  'Reflective',
  'Thinker',
  'Inquirer',
  'Knowledgeable',
] as const;

export interface InfractionCategory {
  id: string;
  label: string;
  options: string[];
  defaultPoints: number;
}

export const INFRACTION_CATEGORIES: InfractionCategory[] = [
  {
    id: 'footwear',
    label: 'Unsafe Footwear',
    defaultPoints: 1,
    options: ['Socks', 'Barefoot', 'Crocs/Slides', 'Marking soles', 'Other'],
  },
  {
    id: 'reckless',
    label: 'Reckless Play / Unsafe Practices',
    defaultPoints: 2,
    options: [
      'Using equipment inappropriately/carelessly',
      'Not aware of bystanders',
      'Illegal contact',
      'Other',
    ],
  },
  {
    id: 'disrespect_self',
    label: 'Disrespect to Self',
    defaultPoints: 1,
    options: [
      'Negative self-talk',
      'Not warming up properly',
      'Putting self at risk',
      'Tardy',
      'Not dressed appropriately',
      'Other',
    ],
  },
  {
    id: 'disrespect_others',
    label: 'Disrespect to Others',
    defaultPoints: 1,
    options: [
      'Not mindful of personal space',
      'Teasing / Mocking',
      'Hogging equipment / Not involving others',
      'Creating an uncomfortable environment',
      'Other',
    ],
  },
  {
    id: 'disrespect_env',
    label: 'Disrespect to Environment',
    defaultPoints: 1,
    options: [
      'Leaving trash / bottles behind',
      'Mishandling equipment',
      'Not storing electronics properly (on floor)',
      'Personal items in way',
      'Abusing lockers / locker room',
    ],
  },
  {
    id: 'dnp',
    label: 'DNP (Did Not Participate)',
    defaultPoints: 5,
    options: ['DNP for most of class', 'DNP for entire class'],
  },
  {
    id: 'lp_reflection',
    label: 'LP Reflection (IB Learner Profile)',
    defaultPoints: 0,
    options: [...IB_LEARNER_TRAITS],
  },
];

export const SCORE_TYPE_LABELS: Record<ScoreType, string> = {
  present: 'Present',
  tardy: 'Tardy',
  excused: 'Excused',
  zero: 'Zero',
  bonus: 'Bonus',
  absent: 'Absent',
};

export function emptyLog(scoreType: ScoreType = 'present'): DailyLog {
  return {
    scoreType,
    bonusPoints: 0,
    excusedReasons: [],
    infractions: [],
    warnings: [],
    note: '',
  };
}

export interface DayScore {
  earned: number;
  possible: number;
  exempt: boolean;
  label: string;
}

export function computeDayScore(log: DailyLog): DayScore {
  const infractionPoints = log.infractions.reduce((sum, i) => sum + i.points, 0);

  switch (log.scoreType) {
    case 'present':
      return {
        earned: Math.max(0, DEFAULT_POSSIBLE + log.bonusPoints - infractionPoints),
        possible: DEFAULT_POSSIBLE,
        exempt: false,
        label: formatLabel(DEFAULT_POSSIBLE + log.bonusPoints - infractionPoints, DEFAULT_POSSIBLE, log),
      };
    case 'tardy':
      return {
        earned: Math.max(0, DEFAULT_POSSIBLE - TARDY_DEDUCTION + log.bonusPoints - infractionPoints),
        possible: DEFAULT_POSSIBLE,
        exempt: false,
        label: formatLabel(
          DEFAULT_POSSIBLE - TARDY_DEDUCTION + log.bonusPoints - infractionPoints,
          DEFAULT_POSSIBLE,
          log,
          'Tardy',
        ),
      };
    case 'bonus':
      return {
        earned: DEFAULT_POSSIBLE + log.bonusPoints - infractionPoints,
        possible: DEFAULT_POSSIBLE,
        exempt: false,
        label: formatLabel(DEFAULT_POSSIBLE + log.bonusPoints - infractionPoints, DEFAULT_POSSIBLE, log, 'Bonus'),
      };
    case 'zero':
      return {
        earned: 0,
        possible: DEFAULT_POSSIBLE,
        exempt: false,
        label: formatLabel(0, DEFAULT_POSSIBLE, log, 'Zero'),
      };
    case 'excused':
      return { earned: 0, possible: 0, exempt: true, label: 'EX (0/0)' };
    case 'absent':
      return { earned: 0, possible: 0, exempt: true, label: 'ABS (0/0)' };
    default:
      return { earned: 0, possible: 0, exempt: true, label: '—' };
  }
}

function formatLabel(earned: number, possible: number, log: DailyLog, suffix?: string): string {
  const tags: string[] = [];
  if (suffix) tags.push(suffix);
  if (log.infractions.length > 0) {
    const cats = log.infractions.map((i) => {
      const cat = INFRACTION_CATEGORIES.find((c) => c.id === i.categoryId);
      return cat?.label.split(' ')[0] ?? i.categoryId;
    });
    tags.push(cats.join('/'));
  }
  if (log.warnings.length > 0) tags.push(log.warnings.join(', '));
  const tag = tags.length > 0 ? ` (${tags.join('; ')})` : '';
  return `${earned}/${possible}${tag}`;
}

export function addInfraction(
  log: DailyLog,
  categoryId: string,
  optionLabel: string,
  points: number,
): DailyLog {
  const entry: InfractionEntry = { categoryId, optionLabel, points };
  return { ...log, infractions: [...log.infractions, entry] };
}

export function removeInfraction(log: DailyLog, index: number): DailyLog {
  return { ...log, infractions: log.infractions.filter((_, i) => i !== index) };
}

export function toggleWarning(log: DailyLog, warning: string): DailyLog {
  const has = log.warnings.includes(warning);
  return {
    ...log,
    warnings: has ? log.warnings.filter((w) => w !== warning) : [...log.warnings, warning],
  };
}

export function toggleExcusedReason(log: DailyLog, reason: string): DailyLog {
  const has = log.excusedReasons.includes(reason);
  return {
    ...log,
    excusedReasons: has ? log.excusedReasons.filter((r) => r !== reason) : [...log.excusedReasons, reason],
  };
}

export interface QuarterTotals {
  earned: number;
  possible: number;
  percentage: number;
}

export function computeQuarterTotals(
  earned: number,
  possible: number,
): QuarterTotals {
  const percentage = possible > 0 ? Math.round((earned / possible) * 100) : 0;
  return { earned, possible, percentage };
}

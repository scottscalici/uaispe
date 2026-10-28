import type { DailyLog, ScoreType, InfractionEntry, DailyLogMap, Quarter } from './types';

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
  'Risk-Taker',
  'Communicator',
  'Balanced',
  'Reflective',
  'Thinker',
  'Inquirer',
  'Knowledgeable',
] as const;

/** Canned, student-facing explanation for each IB Learner Profile trait - picked (optionally,
 *  after a point deduction) to say specifically what a student needs to work on, instead of
 *  just a generic "disrespect" or "poor effort" tag. Surfaces verbatim in the Schoology
 *  export comment. Plain tags with no entry here (e.g. "Poor Effort") get no elaboration. */
export const TRAIT_NOTES: Record<string, string> = {
  'Risk-Taker': 'You need to try new skills or roles even when they might not succeed right away.',
  'Caring': 'You need to look out for teammates so the activity is enjoyable for everyone; your participation helps that.',
  'Principled': 'You need to follow the rules, be honest, and respect others, yourself, and the environment.',
  'Open-Minded': "You need to try new activities and other people's ideas.",
  'Communicator': 'You need to speak up kindly and listen to teammates.',
  'Balanced': 'You need to keep emotions in check during competitive moments.',
  'Reflective': 'You need to think about how your choices affected the team/class.',
  'Thinker': 'You need to make good decisions.',
  'Inquirer': 'You need to stay engaged and ask questions instead of checking out.',
  'Knowledgeable': 'You need to apply what you know about the activity and its rules.',
};

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
    case 'present': {
      const earned = Math.max(0, DEFAULT_POSSIBLE + log.bonusPoints - infractionPoints);
      return { earned, possible: DEFAULT_POSSIBLE, exempt: false, label: formatLabel(earned, DEFAULT_POSSIBLE, log) };
    }
    case 'tardy': {
      const earned = Math.max(0, DEFAULT_POSSIBLE - TARDY_DEDUCTION + log.bonusPoints - infractionPoints);
      return { earned, possible: DEFAULT_POSSIBLE, exempt: false, label: formatLabel(earned, DEFAULT_POSSIBLE, log, 'Tardy') };
    }
    case 'bonus':
      return {
        earned: DEFAULT_POSSIBLE + log.bonusPoints - infractionPoints,
        possible: DEFAULT_POSSIBLE,
        exempt: false,
        label: formatLabel(DEFAULT_POSSIBLE + log.bonusPoints - infractionPoints, DEFAULT_POSSIBLE, log, 'Bonus'),
      };
    case 'zero':
      // A "zero day" is a free pass, not a literal zero - still an F, but never an
      // unrecoverable hole (5/10, not 0/10).
      return {
        earned: 5,
        possible: DEFAULT_POSSIBLE,
        exempt: false,
        label: formatLabel(5, DEFAULT_POSSIBLE, log, 'Zero'),
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

/** One student's cumulative grade for a quarter: earned over possible, summed only across
 *  the days that were actually logged for that student within the quarter's dates - a day
 *  nobody logged anything for (the class didn't meet, or it was simply never recorded)
 *  just isn't counted, rather than being treated as a missed requirement. Absent/excused
 *  days are 0/0 (via computeDayScore), so they drop out of the ratio automatically too. */
export function computeCumulativeScore(
  gradebook: Record<string, DailyLogMap>,
  playerId: string,
  quarter: Quarter,
): QuarterTotals {
  let earned = 0;
  let possible = 0;

  Object.entries(gradebook).forEach(([dateStr, dayLogs]) => {
    if (dateStr < quarter.startDate || dateStr > quarter.endDate) return;
    const log = dayLogs[playerId];
    if (!log) return;

    const dayScore = computeDayScore(log);
    earned += dayScore.earned;
    possible += dayScore.possible;
  });

  return computeQuarterTotals(earned, possible);
}

export const GRADE_COMMENT_STANDING_LINE =
  'Points lost are for disrespect (to yourself, others, the teacher, or equipment) or for lack of effort.';

/** 'YYYY-MM-DD' -> "Sept 26" - built from the date string's own components rather than
 *  parsing it with `new Date(dateStr)`, which JS treats as UTC midnight and can shift a day
 *  backward once converted to a local timezone that's behind UTC. */
function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function signedPoints(points: number): string {
  return points > 0 ? `plus ${points}` : `minus ${Math.abs(points)}`;
}

/** One student's export comment for a quarter: a standing line explaining what deductions
 *  are generally for, then only the dated events worth mentioning - tardy, zero day, excused,
 *  and any day with a nonzero point adjustment (deduction or bonus) - plus a per-day note
 *  wherever one was typed in, even on an otherwise full-credit day. A deduction also carries
 *  whichever IB Learner Profile traits were tagged for it (each with its canned explanation),
 *  or just the plain "Poor Effort" label when no specific trait was picked. Full-credit days
 *  with no note, and absences, are left out entirely so the comment stays short. */
export function buildGradeComment(
  gradebook: Record<string, DailyLogMap>,
  playerId: string,
  quarter: Quarter,
): string {
  const dates = Object.keys(gradebook)
    .filter((d) => d >= quarter.startDate && d <= quarter.endDate)
    .sort();

  const entries: string[] = [];

  dates.forEach((dateStr) => {
    const log = gradebook[dateStr]?.[playerId];
    if (!log) return;
    if (log.scoreType === 'absent') return;

    let status: string | null = null;
    if (log.scoreType === 'tardy') {
      status = log.bonusPoints ? `tardy, ${signedPoints(log.bonusPoints)}` : 'tardy';
    } else if (log.scoreType === 'zero') {
      status = 'zero day';
    } else if (log.scoreType === 'excused') {
      status = 'excused';
    } else if ((log.scoreType === 'present' || log.scoreType === 'bonus') && log.bonusPoints) {
      status = signedPoints(log.bonusPoints);
    }

    const plainTags = log.warnings.filter((w) => !TRAIT_NOTES[w]);
    const traitSentences = log.warnings.map((w) => TRAIT_NOTES[w]).filter((s): s is string => Boolean(s));
    const note = log.note?.trim();
    const extras = [...plainTags, ...traitSentences, note].filter(Boolean) as string[];

    if (!status && extras.length === 0) return;

    const explanation = extras.join(' ');
    let body = status && explanation ? `${status} — ${explanation}` : status || explanation;
    if (!/[.!?]$/.test(body)) body += '.';
    entries.push(`${formatShortDate(dateStr)}: ${body}`);
  });

  return [GRADE_COMMENT_STANDING_LINE, ...entries].join(' ');
}

export interface GradebookGap {
  date: string;
  missingPlayerIds: string[];
}

/** Finds days this class actually met (per the dates passed in) where one or more active
 *  students never got a log entry at all - catches "I forgot to fill this day in" before it
 *  silently drops out of the cumulative average instead of counting against the student. */
export function findGradebookGaps(
  classMeetingDates: string[],
  gradebook: Record<string, DailyLogMap>,
  activePlayerIds: string[],
): GradebookGap[] {
  const gaps: GradebookGap[] = [];
  classMeetingDates.forEach((date) => {
    const dayLogs = gradebook[date] || {};
    const missingPlayerIds = activePlayerIds.filter((id) => !dayLogs[id]);
    if (missingPlayerIds.length > 0) gaps.push({ date, missingPlayerIds });
  });
  return gaps.sort((a, b) => a.date.localeCompare(b.date));
}

/** One row from a Schoology roster CSV export: a real name plus its unique Schoology ID. */
export interface SchoologyRosterEntry {
  schoologyId: string;
  fullName: string;
}

export type MatchStatus = 'auto' | 'ambiguous' | 'none';

export interface RosterMatchResult {
  playerId: string;
  playerName: string;
  status: MatchStatus;
  /** Best guess, shown pre-selected in the review UI either way - confirmed outright for
   *  'auto', just a starting point to override for 'ambiguous'/'none'. */
  suggestion: SchoologyRosterEntry | null;
}

/** First-name nickname equivalence groups - two names in the same group count as a first-name
 *  match (Alex/Alexander), not just an exact string match. Not exhaustive; anything missing
 *  just falls through to "no match" and she picks it manually from the dropdown. */
const NICKNAME_GROUPS: string[][] = [
  ['alex', 'alexander', 'alexandra', 'alejandro', 'sandro'],
  ['abby', 'abigail'],
  ['andy', 'andrew', 'andrea'],
  ['ben', 'benjamin', 'benny'],
  ['bob', 'bobby', 'robert', 'rob', 'robbie'],
  ['cathy', 'catherine', 'katherine', 'kate', 'katie', 'kitty', 'cat'],
  ['chris', 'christopher', 'christian', 'christina', 'christine', 'cristian'],
  ['dan', 'daniel', 'danny', 'danielle'],
  ['dave', 'david', 'davey'],
  ['debbie', 'deborah', 'deb'],
  ['ed', 'edward', 'eddie', 'eduardo'],
  ['gabby', 'gabriella', 'gabriel', 'gabe'],
  ['greg', 'gregory'],
  ['jack', 'john', 'jonathan', 'jon', 'johnny', 'juan'],
  ['jake', 'jacob'],
  ['jen', 'jennifer', 'jenny'],
  ['jim', 'james', 'jimmy'],
  ['joe', 'joseph', 'joey', 'jose'],
  ['josh', 'joshua'],
  ['ken', 'kenneth', 'kenny'],
  ['liz', 'elizabeth', 'beth', 'eliza', 'lizzie', 'betty', 'elle'],
  ['maggie', 'margaret', 'meg', 'megan', 'peggy'],
  ['matt', 'matthew', 'mateo'],
  ['max', 'maximilian', 'maxwell', 'maximiliano'],
  ['mike', 'michael', 'mikey', 'miguel'],
  ['nate', 'nathan', 'nathaniel'],
  ['nick', 'nicholas', 'nicky', 'nicolas'],
  ['pat', 'patrick', 'patricia'],
  ['pete', 'peter'],
  ['rick', 'richard', 'ricky', 'dick'],
  ['sam', 'samuel', 'samantha'],
  ['steve', 'steven', 'stephen'],
  ['sue', 'susan', 'suzy', 'suzanne'],
  ['ted', 'theodore', 'teddy'],
  ['tom', 'thomas', 'tommy'],
  ['tony', 'anthony'],
  ['vicky', 'victoria', 'victor'],
  ['will', 'william', 'billy', 'bill', 'liam', 'guillermo'],
  ['zach', 'zachary', 'zack'],
];

const NICKNAME_GROUP_BY_NAME = new Map<string, number>();
NICKNAME_GROUPS.forEach((group, i) => group.forEach((name) => NICKNAME_GROUP_BY_NAME.set(name, i)));

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str: string): string[] {
  return normalize(str).split(' ').filter(Boolean);
}

function firstNameScore(a: string, b: string): number {
  if (a === b) return 100;
  const groupA = NICKNAME_GROUP_BY_NAME.get(a);
  const groupB = NICKNAME_GROUP_BY_NAME.get(b);
  if (groupA !== undefined && groupA === groupB) return 90;
  return 0;
}

/** Splits a simple CSV line on commas, respecting double-quoted fields (which may themselves
 *  contain commas) - not a full RFC4180 parser, but covers typical school roster exports. */
function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

/** Parses a Schoology roster CSV export into {schoologyId, fullName} rows. Flexible about
 *  column layout: a single name column (handling "Last, First"), or separate first/last
 *  columns; an id column matched by header name, preferring one that says "unique" or
 *  "schoology" over a bare "id" if more than one looks like a candidate. */
export function parseSchoologyCsv(csvText: string): SchoologyRosterEntry[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) => normalize(h));

  const findCol = (patterns: RegExp[]): number => {
    for (const pattern of patterns) {
      const idx = headers.findIndex((h) => pattern.test(h));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  // Order-independent: matches "Schoology ID" as well as the Spanish export header
  // "ID de Schoology" (id comes first there, so a strict "schoology.*id" pattern would miss it).
  const idCol = findCol([/(?=.*\bid\b)(?=.*schoology)/, /unique.*id/, /\bid\b/]);
  const firstCol = findCol([/first.*name/, /^first$/, /^nombre$/, /primer.*nombre/]);
  const lastCol = findCol([/last.*name/, /^last$/, /^apellido/]);
  // "Nombre" alone (no separate last-name column) is Schoology's Spanish export's single
  // full-name column, e.g. "Sama Albaram".
  const fullNameCol = firstCol !== -1 && lastCol === -1 && headers[firstCol] === 'nombre'
    ? firstCol
    : findCol([/^name$/, /student.*name/, /full.*name/, /^nombre$/]);

  if (idCol === -1) return [];

  const entries: SchoologyRosterEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    const schoologyId = (row[idCol] || '').trim();
    if (!schoologyId) continue;

    let fullName = '';
    if (firstCol !== -1 && lastCol !== -1) {
      fullName = `${row[firstCol] || ''} ${row[lastCol] || ''}`.trim();
    } else if (fullNameCol !== -1) {
      const raw = (row[fullNameCol] || '').trim();
      // "Last, First" -> "First Last"
      fullName = raw.includes(',') ? raw.split(',').reverse().join(' ').trim() : raw;
    }
    if (!fullName) continue;

    entries.push({ schoologyId, fullName });
  }
  return entries;
}

/** Matches each roster player against the parsed Schoology roster. Auto-accepts only a
 *  player's unique top-scoring candidate when no other player also claims that same
 *  candidate as their own unique top pick; everything else (ties, no match at all) is left
 *  for manual review - matching is a suggestion, never a silent decision, for anything
 *  ambiguous. */
export function matchRoster(
  players: { id: string; name: string }[],
  schoologyRoster: SchoologyRosterEntry[],
): RosterMatchResult[] {
  const candidatesByPlayer = new Map<string, { entry: SchoologyRosterEntry; score: number }[]>();

  players.forEach((player) => {
    const tokens = tokenize(player.name);
    const playerFirst = tokens[0];
    const initials = tokens.slice(1);
    if (!playerFirst) {
      candidatesByPlayer.set(player.id, []);
      return;
    }

    const scored = schoologyRoster
      .map((entry) => {
        const schTokens = tokenize(entry.fullName);
        const schFirst = schTokens[0];
        const fScore = firstNameScore(playerFirst, schFirst);
        if (fScore === 0) return null;

        // A roster disambiguator can be a single initial ("S") or, when that's not enough
        // to tell two same-first-name students apart, the first couple letters of the last
        // name ("Si" for Sitek vs "Se" for Sesi) - match it as a whole prefix, not just its
        // first character, so those two still resolve to different people instead of tying.
        let bonus = 0;
        const schRest = schTokens.slice(1);
        initials.forEach((initial) => {
          if (schRest.some((t) => t.startsWith(initial))) bonus += 5 * initial.length;
        });

        return { entry, score: fScore + bonus };
      })
      .filter((c): c is { entry: SchoologyRosterEntry; score: number } => c !== null)
      .sort((a, b) => b.score - a.score);

    candidatesByPlayer.set(player.id, scored);
  });

  // A player's "unique top pick" is only safe to auto-accept if no other player's own unique
  // top pick points at the same Schoology id.
  const topPickCounts = new Map<string, number>();
  players.forEach((player) => {
    const scored = candidatesByPlayer.get(player.id) || [];
    const isUniqueTop = scored.length > 0 && (scored.length === 1 || scored[0].score > scored[1].score);
    if (isUniqueTop) {
      const id = scored[0].entry.schoologyId;
      topPickCounts.set(id, (topPickCounts.get(id) || 0) + 1);
    }
  });

  return players.map((player) => {
    const scored = candidatesByPlayer.get(player.id) || [];
    const playerName = player.name;

    if (scored.length === 0) {
      return { playerId: player.id, playerName, status: 'none', suggestion: null };
    }

    const isUniqueTop = scored.length === 1 || scored[0].score > scored[1].score;
    const contendedBySomeoneElse = (topPickCounts.get(scored[0].entry.schoologyId) || 0) > 1;

    if (isUniqueTop && !contendedBySomeoneElse) {
      return { playerId: player.id, playerName, status: 'auto', suggestion: scored[0].entry };
    }

    return { playerId: player.id, playerName, status: 'ambiguous', suggestion: scored[0].entry };
  });
}

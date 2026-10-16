import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ClassData, WorkoutLibrary, SchoolSettings, Poll } from './types';
import { initialClasses } from './data';
import { seedExercises, seedWorkouts } from './workoutSeedData';
import { centralDb } from './firebase';
const CLASSES_COLLECTION = 'pe_classes';
const META_DOC = 'app_meta';
const WORKOUT_LIBRARY_COLLECTION = 'pe_workout_library';
const WORKOUT_LIBRARY_DOC = 'data';
const SETTINGS_COLLECTION = 'pe_settings';
const SCHOOL_SETTINGS_DOC = 'school';
const VOTES_COLLECTION = 'pe_teammate_votes';
const POLLS_COLLECTION = 'pe_poll_data';
const POLLS_DOC = 'data';
const POLL_VOTES_COLLECTION = 'pe_poll_votes';

export interface AppMeta {
  classIds: string[];
}

export async function loadAppMeta(): Promise<AppMeta> {
  const ref = doc(db, CLASSES_COLLECTION, META_DOC);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as AppMeta;
  }
  return { classIds: initialClasses.map((c) => c.id) };
}

export async function ensureInitialData(): Promise<void> {
  const meta = await loadAppMeta();
  if (meta.classIds.length === 0) return;

  for (const classId of meta.classIds) {
    const ref = doc(db, CLASSES_COLLECTION, classId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const seed = initialClasses.find((c) => c.id === classId);
      if (seed) {
        await setDoc(ref, stripUndefined(seed));
      }
    }
  }
}

export function subscribeToClasses(
  classIds: string[],
  onUpdate: (classes: ClassData[]) => void,
): () => void {
  const unsubscribers: (() => void)[] = [];
  const classDataMap = new Map<string, ClassData>();

  classIds.forEach((classId) => {
    const ref = doc(db, CLASSES_COLLECTION, classId);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        classDataMap.set(classId, snap.data() as ClassData);
      } else {
        const seed = initialClasses.find((c) => c.id === classId);
        if (seed) {
          classDataMap.set(classId, seed);
          void setDoc(ref, stripUndefined(seed));
        }
      }
      onUpdate(Array.from(classDataMap.values()));
    });
    unsubscribers.push(unsub);
  });

  return () => unsubscribers.forEach((u) => u());
}

export async function saveClass(classData: ClassData): Promise<void> {
  const ref = doc(db, CLASSES_COLLECTION, classData.id);
  await setDoc(ref, stripUndefined(classData));
}

export async function loadAllClasses(): Promise<ClassData[]> {
  const meta = await loadAppMeta();
  const result: ClassData[] = [];
  for (const classId of meta.classIds) {
    const ref = doc(db, CLASSES_COLLECTION, classId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      result.push(snap.data() as ClassData);
    } else {
      const seed = initialClasses.find((c) => c.id === classId);
      if (seed) {
        await setDoc(ref, stripUndefined(seed));
        result.push(seed);
      }
    }
  }
  return result;
}
export async function fetchCentralCalendar() {
  try {
    const docRef = doc(centralDb, 'config', 'academic_year_2026_2027');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const centralDays = data.map || []; 
      
      // Format the data to perfectly match your PE app's CalendarDay interface
      return centralDays.map((day: any) => ({
        fecha: day.fecha,
        ciclo: day.ciclo,
        dia: day.dia,
        status: day.status,
        note: day.note,
        manualOverride: day.manualOverride,
        unitName: "",
        activity: ""
      }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching central calendar:", error);
    return [];
  }
}
export function subscribeToWorkoutLibrary(
  onUpdate: (library: WorkoutLibrary) => void,
): () => void {
  const ref = doc(db, WORKOUT_LIBRARY_COLLECTION, WORKOUT_LIBRARY_DOC);
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as WorkoutLibrary);
    } else {
      const seed: WorkoutLibrary = { exercises: seedExercises, workouts: seedWorkouts };
      onUpdate(seed);
      void setDoc(ref, stripUndefined(seed));
    }
  });
}

export async function saveWorkoutLibrary(library: WorkoutLibrary): Promise<void> {
  const ref = doc(db, WORKOUT_LIBRARY_COLLECTION, WORKOUT_LIBRARY_DOC);
  await setDoc(ref, stripUndefined(library));
}

export function subscribeToSchoolSettings(
  onUpdate: (settings: SchoolSettings | null) => void,
): () => void {
  const ref = doc(db, SETTINGS_COLLECTION, SCHOOL_SETTINGS_DOC);
  return onSnapshot(ref, (snap) => {
    onUpdate(snap.exists() ? (snap.data() as SchoolSettings) : null);
  });
}

export async function saveSchoolSettings(settings: SchoolSettings): Promise<void> {
  const ref = doc(db, SETTINGS_COLLECTION, SCHOOL_SETTINGS_DOC);
  await setDoc(ref, stripUndefined(settings));
}

export type VoteResult = 'ok' | 'already_voted';

/** One teammate vote, keyed by classId_unitId_voterId so a repeat submission for the same
 *  voter/unit is simply rejected rather than counted twice - the lockout lives here, not in
 *  the browser, so switching devices can't get around it. */
export async function submitTeammateVote(
  classId: string,
  unitId: string,
  voterId: string,
  votedForId: string,
): Promise<VoteResult> {
  const voteRef = doc(db, VOTES_COLLECTION, `${classId}_${unitId}_${voterId}`);
  const classRef = doc(db, CLASSES_COLLECTION, classId);

  return runTransaction(db, async (tx) => {
    const voteSnap = await tx.get(voteRef);
    if (voteSnap.exists()) return 'already_voted';

    const classSnap = await tx.get(classRef);
    if (!classSnap.exists()) throw new Error('Class not found');
    const classData = classSnap.data() as ClassData;
    const units = classData.units.map((u) =>
      u.id === unitId
        ? { ...u, teammatePoints: { ...u.teammatePoints, [votedForId]: (u.teammatePoints[votedForId] || 0) + 1 } }
        : u
    );

    tx.set(voteRef, { classId, unitId, voterId, votedForId, timestamp: Date.now() });
    tx.update(classRef, { units });

    return 'ok';
  });
}

/** Polls created before a poll could hold several questions stored one {question, options}
 *  directly instead of {questions: [...]} - those are dropped on load (not converted; they're
 *  throwaway test data) so poll.questions is never undefined for what's left. */
function dropLegacyPolls(raw: Poll[]): Poll[] {
  return raw.filter((p) => Array.isArray(p?.questions));
}

/** Live feed of every poll for the admin's Polls tab, same single-shared-doc shape as the
 *  workout library - the admin's own edits (creating a poll) go through local state first
 *  and get debounce-saved back here, same pattern as handleSaveWorkout, so creating a poll
 *  feels instant even if the write to Firestore itself is slow or briefly offline. */
export function subscribeToPolls(onUpdate: (polls: Poll[]) => void): () => void {
  const ref = doc(db, POLLS_COLLECTION, POLLS_DOC);
  return onSnapshot(ref, (snap) => {
    const raw = snap.exists() ? (snap.data() as { polls: Poll[] }).polls || [] : [];
    onUpdate(dropLegacyPolls(raw));
  });
}

export async function savePolls(polls: Poll[]): Promise<void> {
  const ref = doc(db, POLLS_COLLECTION, POLLS_DOC);
  await setDoc(ref, stripUndefined({ polls }));
}

/** One-time read for the student-facing link page - it doesn't need live updates, just a
 *  consistent snapshot of every poll's question/options to find the one it links to
 *  (mirrors loadAllClasses). */
export async function loadPolls(): Promise<Poll[]> {
  const ref = doc(db, POLLS_COLLECTION, POLLS_DOC);
  const snap = await getDoc(ref);
  const raw = snap.exists() ? (snap.data() as { polls: Poll[] }).polls || [] : [];
  return dropLegacyPolls(raw);
}

/** One vote, keyed by pollId_voterToken so a repeat submission from the same browser is
 *  rejected rather than counted twice - same lockout shape as submitTeammateVote, just
 *  keyed off a random per-device token instead of a roster id (polls have no roster).
 *  answers covers every question in the poll, submitted together in one visit. */
export async function submitPollVote(
  pollId: string,
  answers: { questionId: string; optionId: string }[],
  voterToken: string,
): Promise<VoteResult> {
  const voteRef = doc(db, POLL_VOTES_COLLECTION, `${pollId}_${voterToken}`);
  const pollsRef = doc(db, POLLS_COLLECTION, POLLS_DOC);

  return runTransaction(db, async (tx) => {
    const voteSnap = await tx.get(voteRef);
    if (voteSnap.exists()) return 'already_voted';

    const pollsSnap = await tx.get(pollsRef);
    if (!pollsSnap.exists()) throw new Error('Polls not found');
    const data = pollsSnap.data() as { polls: Poll[] };
    const polls = dropLegacyPolls(data.polls).map((p) => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        questions: p.questions.map((q) => {
          const answer = answers.find((a) => a.questionId === q.id);
          if (!answer) return q;
          return { ...q, options: q.options.map((o) => (o.id === answer.optionId ? { ...o, votes: o.votes + 1 } : o)) };
        }),
      };
    });

    tx.set(voteRef, { pollId, voterToken, answers, timestamp: Date.now() });
    tx.update(pollsRef, { polls });

    return 'ok';
  });
}

function stripUndefined(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj));
}

import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ClassData } from './types';
import { initialClasses } from './data';
import { centralDb } from './firebase';
const CLASSES_COLLECTION = 'pe_classes';
const META_DOC = 'app_meta';

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
function stripUndefined(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj));
}

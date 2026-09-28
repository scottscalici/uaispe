import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, SkipForward, RotateCcw, X, Dumbbell, LayoutGrid, ArrowRightCircle } from 'lucide-react';
import type { Workout, Exercise } from '../types';

interface Props {
  workout: Workout;
  exercises: Exercise[];
  onExit: () => void;
}

export default function WorkoutSession({ workout, exercises, onExit }: Props) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-black text-slate-800">
          {workout.mode === 'stations' ? <LayoutGrid className="h-6 w-6 text-purple-500" /> : <Dumbbell className="h-6 w-6 text-orange-500" />}
          {workout.workoutName}
        </h2>
        <button onClick={onExit} className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-200">
          <X className="h-4 w-4" /> Exit
        </button>
      </div>

      {workout.mode === 'stations' ? (
        <StationsSession workout={workout} exercises={exercises} onExit={onExit} />
      ) : (
        <CircuitSession workout={workout} exercises={exercises} onExit={onExit} />
      )}
    </div>
  );
}

interface FlatStep {
  exerciseId: string;
  duration: number;
  type: 'work' | 'rest';
  circuitId: string;
  round: number;
  totalRounds: number;
}

function flatten(workout: Workout): FlatStep[] {
  const steps: FlatStep[] = [];
  workout.circuits.forEach((c) => {
    for (let round = 1; round <= c.rounds; round++) {
      c.sequence.forEach((s) => {
        steps.push({ ...s, circuitId: c.circuitId, round, totalRounds: c.rounds });
      });
    }
  });
  return steps;
}

function CircuitSession({ workout, exercises, onExit }: Props) {
  const steps = useMemo(() => flatten(workout), [workout]);
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(steps[0]?.duration ?? 0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = steps[index];
  const done = index >= steps.length;
  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const currentExercise = current ? exerciseMap.get(current.exerciseId) : null;
  const nextExercise = steps[index + 1] ? exerciseMap.get(steps[index + 1].exerciseId) : null;

  useEffect(() => {
    if (!running || done) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setIndex((i) => i + 1);
          const next = steps[index + 1];
          return next ? next.duration : 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, index, done, steps]);

  const handleSkip = () => {
    const next = steps[index + 1];
    setIndex((i) => i + 1);
    setSecondsLeft(next ? next.duration : 0);
  };

  const handleRestart = () => {
    setIndex(0);
    setSecondsLeft(steps[0]?.duration ?? 0);
    setRunning(false);
  };

  const isWork = current?.type === 'work';

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-10 text-center shadow-sm">
        <h3 className="text-2xl font-black text-emerald-700 mb-2">Workout Complete! 🎉</h3>
        <p className="text-emerald-600 mb-6">Nice work finishing {workout.workoutName}.</p>
        <div className="flex justify-center gap-3">
          <button onClick={handleRestart} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            <RotateCcw className="h-4 w-4" /> Do It Again
          </button>
          <button onClick={onExit} className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">
            Back to Log
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-2xl border-2 p-8 text-center shadow-sm transition-colors ${isWork ? 'border-emerald-300 bg-emerald-50' : 'border-sky-300 bg-sky-50'}`}>
        <p className={`mb-1 text-xs font-black uppercase tracking-widest ${isWork ? 'text-emerald-600' : 'text-sky-600'}`}>
          {current.circuitId} - Round {current.round} of {current.totalRounds} - {isWork ? 'Work' : 'Rest'}
        </p>
        <h3 className="mb-3 text-3xl font-black text-slate-800">{currentExercise?.name || current.exerciseId}</h3>
        <div className={`mx-auto mb-4 text-7xl font-black tabular-nums ${isWork ? 'text-emerald-700' : 'text-sky-700'}`}>
          {secondsLeft}
        </div>
        {currentExercise?.instructions && <p className="mb-1 text-sm text-slate-600">{currentExercise.instructions}</p>}
        {currentExercise?.safetyCues && <p className="text-xs italic text-slate-500">{currentExercise.safetyCues}</p>}
        {nextExercise && (
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Up next: {nextExercise.name}</p>
        )}
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full bg-blue-500 transition-all" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
      </div>
      <p className="mt-1 text-center text-xs font-semibold text-slate-400">Step {index + 1} of {steps.length}</p>

      <div className="mt-5 flex justify-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700"
        >
          {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
        </button>
        <button onClick={handleSkip} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">
          <SkipForward className="h-4 w-4" /> Skip
        </button>
        <button onClick={handleRestart} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">
          <RotateCcw className="h-4 w-4" /> Restart
        </button>
      </div>
    </>
  );
}

function StationsSession({ workout, exercises, onExit }: Props) {
  const stations = workout.stations || [];
  const duration = workout.stationDuration || 60;
  const totalRounds = stations.length;

  const [round, setRound] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const exerciseMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const done = round > totalRounds;
  const timeUp = secondsLeft <= 0;

  useEffect(() => {
    if (!running || done || timeUp) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, done, timeUp]);

  useEffect(() => {
    if (timeUp) setRunning(false);
  }, [timeUp]);

  const handleNextRotation = () => {
    setRound((r) => r + 1);
    setSecondsLeft(duration);
    setRunning(true);
  };

  const handleRestart = () => {
    setRound(1);
    setSecondsLeft(duration);
    setRunning(false);
  };

  if (totalRounds === 0) {
    return <p className="text-center text-slate-400 italic">This stations workout has no stations yet.</p>;
  }

  if (done) {
    return (
      <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-10 text-center shadow-sm">
        <h3 className="text-2xl font-black text-emerald-700 mb-2">Stations Complete! 🎉</h3>
        <p className="text-emerald-600 mb-6">Every group made it through all {totalRounds} stations.</p>
        <div className="flex justify-center gap-3">
          <button onClick={handleRestart} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">
            <RotateCcw className="h-4 w-4" /> Do It Again
          </button>
          <button onClick={onExit} className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-300">
            Back to Log
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`rounded-2xl border-2 p-6 text-center shadow-sm transition-colors ${timeUp ? 'border-red-300 bg-red-50 animate-pulse' : 'border-purple-300 bg-purple-50'}`}>
        <p className={`mb-1 text-xs font-black uppercase tracking-widest ${timeUp ? 'text-red-600' : 'text-purple-600'}`}>
          Round {round} of {totalRounds}
        </p>
        <div className={`mx-auto mb-2 text-7xl font-black tabular-nums ${timeUp ? 'text-red-600' : 'text-purple-700'}`}>
          {secondsLeft}
        </div>
        {timeUp ? (
          <p className="text-lg font-black text-red-600">Time's Up - Rotate When Ready!</p>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">Small groups working at their station</p>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stations.map((s, idx) => {
          const ex = exerciseMap.get(s.exerciseId);
          return (
            <div key={s.id} className="rounded-lg border border-purple-200 bg-white p-3 shadow-sm">
              <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-purple-500">Station {idx + 1}</p>
              <p className="font-bold text-slate-800">{s.label || ex?.name || s.exerciseId}</p>
              {ex?.instructions && <p className="mt-1 text-xs text-slate-600">{ex.instructions}</p>}
              {ex?.safetyCues && <p className="mt-0.5 text-xs italic text-slate-500">{ex.safetyCues}</p>}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={timeUp}
          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-purple-700 disabled:opacity-40"
        >
          {running ? <><Pause className="h-4 w-4" /> Pause</> : <><Play className="h-4 w-4" /> Start</>}
        </button>
        <button onClick={handleNextRotation} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700">
          <ArrowRightCircle className="h-4 w-4" /> Next Rotation
        </button>
        <button onClick={handleRestart} className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200">
          <RotateCcw className="h-4 w-4" /> Restart
        </button>
      </div>
    </>
  );
}

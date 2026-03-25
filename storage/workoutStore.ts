import AsyncStorage from '@react-native-async-storage/async-storage';

export type ExerciseKey = 'squat' | 'bench' | 'ohp' | 'row' | 'deadlift';

export type WorkoutState = {
  nextDay: 'A' | 'B';
  weights: Record<ExerciseKey, number>;    // always stored in lbs
  increments: Record<ExerciseKey, number>; // always stored in lbs
};

const STORAGE_KEY = '@fivexfive_workout';

export const DEFAULT_STATE: WorkoutState = {
  nextDay: 'A',
  weights: {
    squat: 45,
    bench: 45,
    ohp: 45,
    row: 45,
    deadlift: 45,
  },
  increments: {
    squat: 5,
    bench: 5,
    ohp: 5,
    row: 5,
    deadlift: 10,
  },
};

// Load from storage, falling back to defaults for any missing fields
export async function loadWorkoutState(): Promise<WorkoutState> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        weights:    { ...DEFAULT_STATE.weights,    ...parsed.weights },
        increments: { ...DEFAULT_STATE.increments, ...parsed.increments },
      };
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

export async function saveWorkoutState(state: WorkoutState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

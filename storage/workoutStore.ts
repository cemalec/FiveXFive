import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ThemeName } from '../theme';

export type ExerciseKey = 'squat' | 'bench' | 'ohp' | 'row' | 'deadlift';

export type Unit = 'lbs' | 'kg';

export type WarmupMode = 'interpolate' | 'percentages';

export type WorkoutState = {
  nextDay: 'A' | 'B';
  unit: Unit;        // display unit (what the user currently sees)
  storageUnit: Unit; // unit the numbers in weights/increments are expressed in
  weights: Record<ExerciseKey, number>;
  increments: Record<ExerciseKey, number>;
  warmupMode: WarmupMode;
  customWarmupPercentages: number[];
  themeName: ThemeName;
};

export type WorkoutExerciseLog = {
  name: string;
  weight: number;
  sets: number[];
};

export type WorkoutLogEntry = {
  id: string;
  completedAt: string;
  day: 'A' | 'B';
  storageUnit: Unit;
  exercises: WorkoutExerciseLog[];
};

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatNumber(value: number): string {
  const rounded = roundToTwoDecimals(value);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

function convertUnitValue(value: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === 'lbs' && toUnit === 'kg') return roundToTwoDecimals(value * 0.453592);
  return roundToTwoDecimals(value * 2.20462);
}

export function convertValue(value: number, fromUnit: Unit, toUnit: Unit): number {
  return convertUnitValue(value, fromUnit, toUnit);
}

function standardIncrement(exercise: ExerciseKey, unit: Unit): number {
  if (unit === 'kg') return exercise === 'deadlift' ? 5 : 2.5;
  return exercise === 'deadlift' ? 10 : 5;
}

export function standardIncrementsForUnit(unit: Unit): Record<ExerciseKey, number> {
  return {
    squat: standardIncrement('squat', unit),
    bench: standardIncrement('bench', unit),
    ohp: standardIncrement('ohp', unit),
    row: standardIncrement('row', unit),
    deadlift: standardIncrement('deadlift', unit),
  };
}

export function defaultWarmupPercentages(): number[] {
  return [45, 65, 85];
}

export function barWeightForUnit(unit: Unit): number {
  return unit === 'kg' ? 20 : 45;
}

function roundToStep(value: number, step: number): number {
  return roundToTwoDecimals(Math.round(value / step) * step);
}

export function calculateWarmupWeights(
  workingWeight: number,
  exercise: ExerciseKey,
  state: WorkoutState,
  displayUnit: Unit
): number[] {
  const displayWeight = convertUnitValue(workingWeight, state.storageUnit, displayUnit);
  const barWeight = barWeightForUnit(displayUnit);
  const step = standardIncrementsForUnit(displayUnit)[exercise];

  if (displayWeight <= barWeight) return [barWeight];

  const rawWarmups =
    state.warmupMode === 'interpolate'
      ? [0.25, 0.5, 0.75].map((fraction) => barWeight + (displayWeight - barWeight) * fraction)
      : state.customWarmupPercentages.map((percent) => (displayWeight * percent) / 100);

  const roundedWarmups = rawWarmups
    .map((value) => roundToStep(value, step))
    .filter((value) => value > barWeight && value < displayWeight);

  return [barWeight, ...Array.from(new Set(roundedWarmups))];
}

// Convert a stored value from storageUnit to displayUnit for rendering
export function formatWeight(value: number, storageUnit: Unit, displayUnit: Unit): string {
  if (storageUnit === displayUnit) {
    return `${formatNumber(value)} ${displayUnit === 'lbs' ? 'lb' : 'kg'}`;
  }
  if (storageUnit === 'lbs' && displayUnit === 'kg') {
    const kg = roundToTwoDecimals(value * 0.453592);
    const rounded = roundToTwoDecimals(Math.round(kg * 2) / 2); // nearest 0.5 kg
    return `${formatNumber(rounded)} kg`;
  }
  // storageUnit === 'kg', displayUnit === 'lbs'
  return `${formatNumber(Math.round(value * 2.20462))} lb`;
}

// Permanently round all stored weights to clean plate increments in targetUnit.
// Resets increments to standard for that unit.
export function convertAllWeights(state: WorkoutState, targetUnit: Unit): WorkoutState {
  if (state.storageUnit === targetUnit) return state;
  const newWeights = {} as Record<ExerciseKey, number>;
  for (const key of Object.keys(state.weights) as ExerciseKey[]) {
    if (targetUnit === 'kg') {
      newWeights[key] = roundToTwoDecimals(Math.round(state.weights[key] * 0.453592 / 2.5) * 2.5);
    } else {
      newWeights[key] = roundToTwoDecimals(Math.round(state.weights[key] * 2.20462 / 5) * 5);
    }
  }
  const newIncrements = standardIncrementsForUnit(targetUnit);
  return { ...state, storageUnit: targetUnit, unit: targetUnit, weights: newWeights, increments: newIncrements };
}

export function roundAllToUnit(state: WorkoutState, targetUnit: Unit): WorkoutState {
  const roundedWeights = {} as Record<ExerciseKey, number>;
  const roundedIncrements = {} as Record<ExerciseKey, number>;

  for (const key of Object.keys(state.weights) as ExerciseKey[]) {
    const targetStep = standardIncrement(key, targetUnit);
    const weightInTarget = convertUnitValue(state.weights[key], state.storageUnit, targetUnit);
    const incrementInTarget = convertUnitValue(state.increments[key], state.storageUnit, targetUnit);

    const roundedWeightInTarget = Math.round(weightInTarget / targetStep) * targetStep;
    const roundedIncrementInTarget = Math.max(targetStep, Math.round(incrementInTarget / targetStep) * targetStep);

    roundedWeights[key] = roundToTwoDecimals(convertUnitValue(roundedWeightInTarget, targetUnit, state.storageUnit));
    roundedIncrements[key] = roundToTwoDecimals(convertUnitValue(roundedIncrementInTarget, targetUnit, state.storageUnit));
  }

  return {
    ...state,
    weights: roundedWeights,
    increments: roundedIncrements,
  };
}

const STORAGE_KEY = '@fivexfive_workout';
const HISTORY_STORAGE_KEY = '@fivexfive_history';

export const DEFAULT_STATE: WorkoutState = {
  nextDay: 'A',
  unit: 'lbs',
  storageUnit: 'lbs',
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
  warmupMode: 'interpolate',
  customWarmupPercentages: defaultWarmupPercentages(),
  themeName: 'midnightCarbon',
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

export async function loadWorkoutHistory(): Promise<WorkoutLogEntry[]> {
  try {
    const saved = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export async function appendWorkoutHistory(entry: WorkoutLogEntry): Promise<void> {
  try {
    const history = await loadWorkoutHistory();
    const nextHistory = [entry, ...history];
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
  } catch {}
}

export async function saveWorkoutHistory(history: WorkoutLogEntry[]): Promise<void> {
  try {
    await AsyncStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch {}
}

// ─── CSV export / import ──────────────────────────────────────────────────────

function csvCell(value: string | number): string {
  const s = String(value);
  return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
}

export function historyToCSV(history: WorkoutLogEntry[]): string {
  const header = 'id,completedAt,day,storageUnit,exerciseName,weight,sets';
  const rows = history.flatMap((entry) =>
    entry.exercises.map((ex) =>
      [
        csvCell(entry.id),
        csvCell(entry.completedAt),
        csvCell(entry.day),
        csvCell(entry.storageUnit),
        csvCell(ex.name),
        csvCell(ex.weight),
        csvCell(ex.sets.join('/')),
      ].join(',')
    )
  );
  return [header, ...rows].join('\n');
}

export function csvToHistory(csv: string): WorkoutLogEntry[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const map = new Map<string, WorkoutLogEntry>();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    // Simple split — safe because our cells never embed newlines
    const cells = line.split(',');
    if (cells.length < 7) continue;
    const [id, completedAt, day, storageUnit, exerciseName, weight, setsStr] = cells;
    if (!id || !completedAt) continue;
    if (!map.has(id)) {
      map.set(id, {
        id,
        completedAt,
        day: day as 'A' | 'B',
        storageUnit: storageUnit as Unit,
        exercises: [],
      });
    }
    map.get(id)!.exercises.push({
      name: exerciseName.replace(/^"|"$/g, ''),
      weight: parseFloat(weight),
      sets: setsStr.replace(/^"|"$/g, '').split('/').map(Number),
    });
  }
  return Array.from(map.values());
}

export async function exportHistoryAsCSV(history: WorkoutLogEntry[]): Promise<void> {
  const csv = historyToCSV(history);
  const file = new File(Paths.cache, 'fivexfive_history.csv');
  file.write(csv);
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', dialogTitle: 'Export Workout History', UTI: 'public.comma-separated-values-text' });
  }
}

export async function importHistoryFromCSV(): Promise<WorkoutLogEntry[] | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (result.canceled || !result.assets?.[0]) return null;
  const file = new File(result.assets[0].uri);
  const content = await file.text();
  const entries = csvToHistory(content);
  return entries.length > 0 ? entries : null;
}

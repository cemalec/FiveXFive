import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { ThemeName } from "../theme";

export type ExerciseKey = "squat" | "bench" | "ohp" | "row" | "deadlift";

export type Unit = "lbs" | "kg";

export type WarmupMode = "interpolate" | "percentages";

export type WorkoutState = {
  nextDay: "A" | "B";
  unit: Unit; // display unit (what the user currently sees)
  storageUnit: Unit; // unit the numbers in weights/increments are expressed in
  weights: Record<ExerciseKey, number>;
  increments: Record<ExerciseKey, number>;
  warmupMode: WarmupMode;
  customWarmupPercentages: number[];
  themeName: ThemeName;
  autoBackup: boolean;
};

export type WorkoutExerciseLog = {
  name: string;
  weight: number;
  sets: number[];
};

export type WorkoutLogEntry = {
  id: string;
  completedAt: string;
  day: "A" | "B";
  storageUnit: Unit;
  exercises: WorkoutExerciseLog[];
};

const EXERCISE_KEYS: ExerciseKey[] = [
  "squat",
  "bench",
  "ohp",
  "row",
  "deadlift",
];
const VALID_UNITS: Unit[] = ["lbs", "kg"];
const VALID_THEME_NAMES: ThemeName[] = [
  "midnightCarbon",
  "forest",
  "ember",
  "foxfire",
];
const VALID_WARMUP_MODES: WarmupMode[] = ["interpolate", "percentages"];
const MAX_STORED_WEIGHT = 5000;
const MAX_INCREMENT = 100;
const MAX_HISTORY_ENTRIES = 1000;
const MAX_IMPORT_BYTES = 1024 * 1024;
const MAX_EXERCISES_PER_ENTRY = 10;
const MAX_SETS_PER_EXERCISE = 10;

export function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatNumber(value: number): string {
  const rounded = roundToTwoDecimals(value);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toFixed(2).replace(/\.?0+$/, "");
}

function convertUnitValue(value: number, fromUnit: Unit, toUnit: Unit): number {
  if (fromUnit === toUnit) return value;
  if (fromUnit === "lbs" && toUnit === "kg")
    return roundToTwoDecimals(value * 0.453592);
  return roundToTwoDecimals(value * 2.20462);
}

export function convertValue(
  value: number,
  fromUnit: Unit,
  toUnit: Unit,
): number {
  return convertUnitValue(value, fromUnit, toUnit);
}

function standardIncrement(exercise: ExerciseKey, unit: Unit): number {
  if (unit === "kg") return exercise === "deadlift" ? 5 : 2.5;
  return exercise === "deadlift" ? 10 : 5;
}

export function standardIncrementsForUnit(
  unit: Unit,
): Record<ExerciseKey, number> {
  return {
    squat: standardIncrement("squat", unit),
    bench: standardIncrement("bench", unit),
    ohp: standardIncrement("ohp", unit),
    row: standardIncrement("row", unit),
    deadlift: standardIncrement("deadlift", unit),
  };
}

export function defaultWarmupPercentages(): number[] {
  return [45, 65, 85];
}

export function barWeightForUnit(unit: Unit): number {
  return unit === "kg" ? 20 : 45;
}

function roundToStep(value: number, step: number): number {
  return roundToTwoDecimals(Math.round(value / step) * step);
}

export function calculateWarmupWeights(
  workingWeight: number,
  exercise: ExerciseKey,
  state: WorkoutState,
  displayUnit: Unit,
): number[] {
  const displayWeight = convertUnitValue(
    workingWeight,
    state.storageUnit,
    displayUnit,
  );
  const barWeight = barWeightForUnit(displayUnit);
  const step = standardIncrementsForUnit(displayUnit)[exercise];

  if (displayWeight <= barWeight) return [barWeight];

  const rawWarmups =
    state.warmupMode === "interpolate"
      ? [0.25, 0.5, 0.75].map(
          (fraction) => barWeight + (displayWeight - barWeight) * fraction,
        )
      : state.customWarmupPercentages.map(
          (percent) => (displayWeight * percent) / 100,
        );

  const roundedWarmups = rawWarmups
    .map((value) => roundToStep(value, step))
    .filter((value) => value > barWeight && value < displayWeight);

  return [barWeight, ...Array.from(new Set(roundedWarmups))];
}

// Convert a stored value from storageUnit to displayUnit for rendering
export function formatWeight(
  value: number,
  storageUnit: Unit,
  displayUnit: Unit,
): string {
  if (storageUnit === displayUnit) {
    return `${formatNumber(value)} ${displayUnit === "lbs" ? "lb" : "kg"}`;
  }
  if (storageUnit === "lbs" && displayUnit === "kg") {
    const kg = roundToTwoDecimals(value * 0.453592);
    const rounded = roundToTwoDecimals(Math.round(kg * 2) / 2); // nearest 0.5 kg
    return `${formatNumber(rounded)} kg`;
  }
  // storageUnit === 'kg', displayUnit === 'lbs'
  return `${formatNumber(Math.round(value * 2.20462))} lb`;
}

// Permanently round all stored weights to clean plate increments in targetUnit.
// Resets increments to standard for that unit.
export function convertAllWeights(
  state: WorkoutState,
  targetUnit: Unit,
): WorkoutState {
  if (state.storageUnit === targetUnit) return state;
  const newWeights = {} as Record<ExerciseKey, number>;
  for (const key of Object.keys(state.weights) as ExerciseKey[]) {
    if (targetUnit === "kg") {
      newWeights[key] = roundToTwoDecimals(
        Math.round((state.weights[key] * 0.453592) / 2.5) * 2.5,
      );
    } else {
      newWeights[key] = roundToTwoDecimals(
        Math.round((state.weights[key] * 2.20462) / 5) * 5,
      );
    }
  }
  const newIncrements = standardIncrementsForUnit(targetUnit);
  return {
    ...state,
    storageUnit: targetUnit,
    unit: targetUnit,
    weights: newWeights,
    increments: newIncrements,
  };
}

export function roundAllToUnit(
  state: WorkoutState,
  targetUnit: Unit,
): WorkoutState {
  const roundedWeights = {} as Record<ExerciseKey, number>;
  const roundedIncrements = {} as Record<ExerciseKey, number>;

  for (const key of Object.keys(state.weights) as ExerciseKey[]) {
    const targetStep = standardIncrement(key, targetUnit);
    const weightInTarget = convertUnitValue(
      state.weights[key],
      state.storageUnit,
      targetUnit,
    );
    const incrementInTarget = convertUnitValue(
      state.increments[key],
      state.storageUnit,
      targetUnit,
    );

    const roundedWeightInTarget =
      Math.round(weightInTarget / targetStep) * targetStep;
    const roundedIncrementInTarget = Math.max(
      targetStep,
      Math.round(incrementInTarget / targetStep) * targetStep,
    );

    roundedWeights[key] = roundToTwoDecimals(
      convertUnitValue(roundedWeightInTarget, targetUnit, state.storageUnit),
    );
    roundedIncrements[key] = roundToTwoDecimals(
      convertUnitValue(roundedIncrementInTarget, targetUnit, state.storageUnit),
    );
  }

  return {
    ...state,
    weights: roundedWeights,
    increments: roundedIncrements,
  };
}

const STORAGE_KEY = "@fivexfive_workout";
const HISTORY_STORAGE_KEY = "@fivexfive_history";

export const DEFAULT_STATE: WorkoutState = {
  nextDay: "A",
  unit: "lbs",
  storageUnit: "lbs",
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
  warmupMode: "interpolate",
  customWarmupPercentages: defaultWarmupPercentages(),
  themeName: "midnightCarbon",
  autoBackup: false,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function sanitizePositiveNumber(
  value: unknown,
  fallback: number,
  max: number,
): number {
  if (!isFiniteNumber(value) || value <= 0 || value > max) return fallback;
  return roundToTwoDecimals(value);
}

function sanitizeUnit(value: unknown, fallback: Unit): Unit {
  return VALID_UNITS.includes(value as Unit) ? (value as Unit) : fallback;
}

function sanitizeThemeName(value: unknown, fallback: ThemeName): ThemeName {
  return VALID_THEME_NAMES.includes(value as ThemeName)
    ? (value as ThemeName)
    : fallback;
}

function sanitizeWarmupMode(value: unknown, fallback: WarmupMode): WarmupMode {
  return VALID_WARMUP_MODES.includes(value as WarmupMode)
    ? (value as WarmupMode)
    : fallback;
}

function sanitizeExerciseRecord(
  candidate: unknown,
  fallback: Record<ExerciseKey, number>,
  max: number,
): Record<ExerciseKey, number> {
  const record = isPlainObject(candidate) ? candidate : {};
  return EXERCISE_KEYS.reduce(
    (next, key) => {
      next[key] = sanitizePositiveNumber(record[key], fallback[key], max);
      return next;
    },
    {} as Record<ExerciseKey, number>,
  );
}

function sanitizeWarmupPercentages(value: unknown): number[] {
  if (!Array.isArray(value)) return defaultWarmupPercentages();
  const sanitized = value
    .filter((entry): entry is number => isFiniteNumber(entry))
    .map((entry) => roundToTwoDecimals(entry))
    .filter((entry) => entry > 0 && entry < 100)
    .slice(0, 5);

  return sanitized.length > 0 ? sanitized : defaultWarmupPercentages();
}

function sanitizeWorkoutStateCandidate(candidate: unknown): WorkoutState {
  if (!isPlainObject(candidate)) return { ...DEFAULT_STATE };

  const unit = sanitizeUnit(candidate.unit, DEFAULT_STATE.unit);
  const storageUnit = sanitizeUnit(
    candidate.storageUnit,
    DEFAULT_STATE.storageUnit,
  );

  return {
    nextDay: candidate.nextDay === "B" ? "B" : "A",
    unit,
    storageUnit,
    weights: sanitizeExerciseRecord(
      candidate.weights,
      DEFAULT_STATE.weights,
      MAX_STORED_WEIGHT,
    ),
    increments: sanitizeExerciseRecord(
      candidate.increments,
      DEFAULT_STATE.increments,
      MAX_INCREMENT,
    ),
    warmupMode: sanitizeWarmupMode(
      candidate.warmupMode,
      DEFAULT_STATE.warmupMode,
    ),
    customWarmupPercentages: sanitizeWarmupPercentages(
      candidate.customWarmupPercentages,
    ),
    themeName: sanitizeThemeName(candidate.themeName, DEFAULT_STATE.themeName),
    autoBackup:
      typeof candidate.autoBackup === "boolean"
        ? candidate.autoBackup
        : DEFAULT_STATE.autoBackup,
  };
}

function sanitizeWorkoutId(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().slice(0, 64);
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeCompletedAt(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function sanitizeExerciseName(value: unknown): string {
  if (typeof value !== "string") return "Exercise";
  const sanitized = value
    .replace(/[\r\n]+/g, " ")
    .trim()
    .slice(0, 80);
  return sanitized || "Exercise";
}

function sanitizeSets(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is number => isFiniteNumber(entry))
    .map((entry) => Math.max(0, Math.min(20, Math.round(entry))))
    .slice(0, MAX_SETS_PER_EXERCISE);
}

function sanitizeWorkoutExercise(
  candidate: unknown,
): WorkoutExerciseLog | null {
  if (!isPlainObject(candidate)) return null;

  const weight = sanitizePositiveNumber(
    candidate.weight,
    NaN,
    MAX_STORED_WEIGHT,
  );
  const sets = sanitizeSets(candidate.sets);
  if (!Number.isFinite(weight) || sets.length === 0) return null;

  return {
    name: sanitizeExerciseName(candidate.name),
    weight,
    sets,
  };
}

function sanitizeWorkoutLogEntry(candidate: unknown): WorkoutLogEntry | null {
  if (!isPlainObject(candidate)) return null;

  const id = sanitizeWorkoutId(candidate.id);
  const completedAt = sanitizeCompletedAt(candidate.completedAt);
  if (!id || !completedAt) return null;

  const exercises = Array.isArray(candidate.exercises)
    ? candidate.exercises
        .map((exercise) => sanitizeWorkoutExercise(exercise))
        .filter((exercise): exercise is WorkoutExerciseLog => exercise !== null)
        .slice(0, MAX_EXERCISES_PER_ENTRY)
    : [];

  if (exercises.length === 0) return null;

  return {
    id,
    completedAt,
    day: candidate.day === "B" ? "B" : "A",
    storageUnit: sanitizeUnit(candidate.storageUnit, DEFAULT_STATE.storageUnit),
    exercises,
  };
}

function sanitizeWorkoutHistoryCandidates(
  candidate: unknown,
): WorkoutLogEntry[] {
  if (!Array.isArray(candidate)) return [];

  const uniqueEntries = new Map<string, WorkoutLogEntry>();
  for (const rawEntry of candidate) {
    const entry = sanitizeWorkoutLogEntry(rawEntry);
    if (!entry || uniqueEntries.has(entry.id)) continue;
    uniqueEntries.set(entry.id, entry);
    if (uniqueEntries.size >= MAX_HISTORY_ENTRIES) break;
  }

  return Array.from(uniqueEntries.values()).sort((left, right) =>
    right.completedAt.localeCompare(left.completedAt),
  );
}

// Load from storage, falling back to defaults for any missing fields
export async function loadWorkoutState(): Promise<WorkoutState> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      return sanitizeWorkoutStateCandidate(parsed);
    }
  } catch {}
  return { ...DEFAULT_STATE };
}

export async function saveWorkoutState(state: WorkoutState): Promise<void> {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(sanitizeWorkoutStateCandidate(state)),
    );
  } catch {}
}

export async function loadWorkoutHistory(): Promise<WorkoutLogEntry[]> {
  try {
    const saved = await AsyncStorage.getItem(HISTORY_STORAGE_KEY);
    if (saved !== null) {
      const parsed = JSON.parse(saved);
      return sanitizeWorkoutHistoryCandidates(parsed);
    }
  } catch {}
  return [];
}

export async function appendWorkoutHistory(
  entry: WorkoutLogEntry,
): Promise<void> {
  try {
    const history = await loadWorkoutHistory();
    const nextHistory = sanitizeWorkoutHistoryCandidates([entry, ...history]);
    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(nextHistory),
    );
  } catch {}
}

export async function saveWorkoutHistory(
  history: WorkoutLogEntry[],
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(sanitizeWorkoutHistoryCandidates(history)),
    );
  } catch {}
}

// Silently writes the full history CSV to the app's Documents folder.
// This only happens when the user explicitly enables auto-backup in Settings.
export async function silentBackupHistory(
  history: WorkoutLogEntry[],
): Promise<void> {
  try {
    const csv = historyToCSV(history);
    const file = new File(Paths.document, "fivexfive_backup.csv");
    file.write(csv);
  } catch {}
}

// ─── CSV export / import ──────────────────────────────────────────────────────

function csvCell(value: string | number): string {
  const raw = String(value).replace(/[\r\n]+/g, " ");
  const neutralized = /^[=+\-@\t]/.test(raw) ? `'${raw}` : raw;
  return /[",\n]/.test(neutralized)
    ? `"${neutralized.replace(/"/g, '""')}"`
    : neutralized;
}

function parseCSVLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      const nextChar = line[index + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (inQuotes) return [];
  cells.push(current);
  return cells;
}

export function historyToCSV(history: WorkoutLogEntry[]): string {
  const sanitizedHistory = sanitizeWorkoutHistoryCandidates(history);
  const header = "id,completedAt,day,storageUnit,exerciseName,weight,sets";
  const rows = sanitizedHistory.flatMap((entry) =>
    entry.exercises.map((ex) =>
      [
        csvCell(entry.id),
        csvCell(entry.completedAt),
        csvCell(entry.day),
        csvCell(entry.storageUnit),
        csvCell(ex.name),
        csvCell(ex.weight),
        csvCell(ex.sets.join("/")),
      ].join(","),
    ),
  );
  return [header, ...rows].join("\n");
}

export function csvToHistory(csv: string): WorkoutLogEntry[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const map = new Map<string, WorkoutLogEntry>();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cells = parseCSVLine(line);
    if (cells.length < 7) continue;
    const [id, completedAt, day, storageUnit, exerciseName, weight, setsStr] =
      cells;
    const parsedWeight = Number.parseFloat(weight);
    const parsedSets = setsStr
      .split("/")
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value));
    const existing = map.get(id) ?? {
      id,
      completedAt,
      day: day === "B" ? "B" : "A",
      storageUnit: storageUnit === "kg" ? "kg" : "lbs",
      exercises: [],
    };

    existing.exercises.push({
      name: exerciseName,
      weight: parsedWeight,
      sets: parsedSets,
    });
    map.set(id, existing);
  }
  return sanitizeWorkoutHistoryCandidates(Array.from(map.values()));
}

export async function exportHistoryAsCSV(
  history: WorkoutLogEntry[],
): Promise<void> {
  const csv = historyToCSV(history);
  const file = new File(Paths.cache, "fivexfive_history.csv");
  file.write(csv);
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Export Workout History",
      UTI: "public.comma-separated-values-text",
    });
  }
}

export async function importHistoryFromCSV(): Promise<
  WorkoutLogEntry[] | null
> {
  const result = await DocumentPicker.getDocumentAsync({
    type: [
      "text/csv",
      "text/comma-separated-values",
      "application/csv",
      "public.comma-separated-values-text",
    ],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  if (typeof asset.size === "number" && asset.size > MAX_IMPORT_BYTES) {
    throw new Error("Selected CSV is too large. Choose a file under 1 MB.");
  }

  const file = new File(asset.uri);
  const content = await file.text();
  if (content.length > MAX_IMPORT_BYTES) {
    throw new Error("Selected CSV is too large. Choose a file under 1 MB.");
  }
  const entries = csvToHistory(content);
  return entries.length > 0 ? entries : null;
}

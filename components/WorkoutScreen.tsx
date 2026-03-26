import { useState, useEffect } from 'react';
import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import HistoryScreen from './HistoryScreen';
import RepPicker from './RepPicker';
import RestTimer from './RestTimer';
import SettingsScreen from './SettingsScreen';
import { appendWorkoutHistory, calculateWarmupWeights, DEFAULT_STATE, formatNumber, formatWeight, loadWorkoutHistory, loadWorkoutState, saveWorkoutState, WorkoutLogEntry, WorkoutState } from '../storage/workoutStore';
import { theme } from '../theme';

// Tracks the state of a single set
type SetRecord = {
  done: boolean;    // completed at target (5) or above
  failed: boolean;  // completed below target
  reps: number;     // actual reps completed
};

// Points back to whichever set triggered the rep picker
type PickerTarget = {
  index: number;
  sets: SetRecord[];
  setSets: React.Dispatch<React.SetStateAction<SetRecord[]>>;
};

function emptySet(): SetRecord {
  return { done: false, failed: false, reps: 0 };
}
function emptySets(n: number): SetRecord[] {
  return Array.from({ length: n }, emptySet);
}

// ─── Reusable exercise card ───────────────────────────────────────────────────
type ExerciseCardProps = {
  name: string;
  weight: string;
  warmups: string[];
  sets: SetRecord[];
  onPress: (i: number) => void;
  onLongPress: (i: number) => void;
};

function ExerciseCard({ name, weight, warmups, sets, onPress, onLongPress }: ExerciseCardProps) {
  const setCount = sets.length;
  const repLabel = `${setCount} set${setCount > 1 ? 's' : ''} × 5 reps`;
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{name}</Text>
        <Text style={styles.weightText}>{weight}</Text>
      </View>
      <Text style={styles.exerciseDetail}>{repLabel}</Text>
      <Text style={styles.warmupText}>Warm-up: {warmups.join(' / ')}</Text>
      <View style={styles.setRow}>
        {sets.map((set, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.checkbox, set.done && styles.checkboxDone, set.failed && styles.checkboxFailed]}
            onPress={() => onPress(i)}
            onLongPress={() => onLongPress(i)}
            accessibilityLabel={`${name} set ${i + 1}`}
            accessibilityRole="checkbox"
          >
            {set.done && <Text style={styles.checkmark}>✓</Text>}
            {set.failed && <Text style={styles.failReps}>{set.reps}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkoutScreen() {
  const [workoutState, setWorkoutState] = useState<WorkoutState>(DEFAULT_STATE);
  const [history, setHistory] = useState<WorkoutLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState<'A' | 'B'>('A');
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Load persisted weights and next scheduled day on first render
  useEffect(() => {
    Promise.all([loadWorkoutState(), loadWorkoutHistory()]).then(([state, workoutHistory]) => {
      setWorkoutState(state);
      setHistory(workoutHistory);
      setDay(state.nextDay);
      setLoading(false);
    });
  }, []);

  // Day A exercises
  const [squatASets, setSquatASets] = useState<SetRecord[]>(emptySets(5));
  const [benchSets,  setBenchSets]  = useState<SetRecord[]>(emptySets(5));
  const [rowSets,    setRowSets]    = useState<SetRecord[]>(emptySets(5));

  // Day B exercises
  const [squatBSets,    setSquatBSets]    = useState<SetRecord[]>(emptySets(5));
  const [ohpSets,       setOhpSets]       = useState<SetRecord[]>(emptySets(5));
  const [deadliftSets,  setDeadliftSets]  = useState<SetRecord[]>(emptySets(1));

  const [startSignal, setStartSignal] = useState(0);
  const [resetTimerSignal, setResetTimerSignal] = useState(0);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

  // Toggle unit and persist
  async function handleUnitToggle() {
    const newUnit = workoutState.unit === 'lbs' ? 'kg' : 'lbs';
    const newState = { ...workoutState, unit: newUnit } as WorkoutState;
    setWorkoutState(newState);
    await saveWorkoutState(newState);
  }

  // Normal tap: mark complete at 5 reps, or clear if already marked
  function handleSetPress(
    index: number,
    sets: SetRecord[],
    setSets: React.Dispatch<React.SetStateAction<SetRecord[]>>
  ) {
    const current = sets[index];
    const alreadyMarked = current.done || current.failed;
    setSets((prev) => {
      const next = [...prev];
      next[index] = alreadyMarked ? emptySet() : { done: true, failed: false, reps: 5 };
      return next;
    });
    if (!alreadyMarked) setStartSignal((prev) => prev + 1);
  }

  // Long press: open the rep picker
  function handleSetLongPress(
    index: number,
    sets: SetRecord[],
    setSets: React.Dispatch<React.SetStateAction<SetRecord[]>>
  ) {
    const current = sets[index];
    if (current.done || current.failed) return;
    setPickerTarget({ index, sets, setSets });
  }

  // Called when the user confirms a rep count from the picker
  function handlePickerConfirm(reps: number) {
    if (!pickerTarget) return;
    const { index, setSets } = pickerTarget;
    setSets((prev) => {
      const next = [...prev];
      next[index] = { done: reps >= 5, failed: reps < 5, reps };
      return next;
    });
    setStartSignal((prev) => prev + 1);
    setPickerTarget(null);
  }

  // True when every set in the array has been marked done or failed
  function allMarked(sets: SetRecord[]): boolean {
    return sets.length > 0 && sets.every((s) => s.done || s.failed);
  }

  const canFinish =
    day === 'A'
      ? allMarked(squatASets) && allMarked(benchSets) && allMarked(rowSets)
      : allMarked(squatBSets) && allMarked(ohpSets)   && allMarked(deadliftSets);

  function warmupLabels(exercise: 'squat' | 'bench' | 'ohp' | 'row' | 'deadlift', workingWeight: number): string[] {
    return calculateWarmupWeights(workingWeight, exercise, workoutState, workoutState.unit).map(
      (weight) => `${formatNumber(weight)} ${workoutState.unit === 'kg' ? 'kg' : 'lb'}`
    );
  }

  function buildWorkoutLogEntry(): WorkoutLogEntry {
    const exercises =
      day === 'A'
        ? [
            { name: 'Squat', weight: workoutState.weights.squat, sets: squatASets.map((set) => set.reps) },
            { name: 'Bench Press', weight: workoutState.weights.bench, sets: benchSets.map((set) => set.reps) },
            { name: 'Barbell Row', weight: workoutState.weights.row, sets: rowSets.map((set) => set.reps) },
          ]
        : [
            { name: 'Squat', weight: workoutState.weights.squat, sets: squatBSets.map((set) => set.reps) },
            { name: 'Overhead Press', weight: workoutState.weights.ohp, sets: ohpSets.map((set) => set.reps) },
            { name: 'Deadlift', weight: workoutState.weights.deadlift, sets: deadliftSets.map((set) => set.reps) },
          ];

    return {
      id: `${Date.now()}`,
      completedAt: new Date().toISOString(),
      day,
      storageUnit: workoutState.storageUnit,
      exercises,
    };
  }

  // Increment weights (squat always; others only on full success), save, reset sets
  async function handleFinishWorkout() {
    const historyEntry = buildWorkoutLogEntry();
    const newWeights = { ...workoutState.weights };
    if (day === 'A') {
      newWeights.squat += workoutState.increments.squat;
      if (benchSets.every((s) => s.done)) newWeights.bench += workoutState.increments.bench;
      if (rowSets.every((s) => s.done))   newWeights.row   += workoutState.increments.row;
    } else {
      newWeights.squat += workoutState.increments.squat;
      if (ohpSets.every((s) => s.done))      newWeights.ohp      += workoutState.increments.ohp;
      if (deadliftSets.every((s) => s.done)) newWeights.deadlift += workoutState.increments.deadlift;
    }

    const nextDay: 'A' | 'B' = day === 'A' ? 'B' : 'A';
    const newState: WorkoutState = { ...workoutState, nextDay, weights: newWeights };
    await Promise.all([saveWorkoutState(newState), appendWorkoutHistory(historyEntry)]);
    setWorkoutState(newState);
    setHistory((prev) => [historyEntry, ...prev]);

    if (day === 'A') {
      setSquatASets(emptySets(5));
      setBenchSets(emptySets(5));
      setRowSets(emptySets(5));
    } else {
      setSquatBSets(emptySets(5));
      setOhpSets(emptySets(5));
      setDeadliftSets(emptySets(1));
    }
    setDay(nextDay);
    setResetTimerSignal((prev) => prev + 1);
    Alert.alert('Workout Complete!', `Day ${day} done. Next up: Day ${nextDay}.`);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator size="large" color="#4A90D9" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (showSettings) {
    return (
      <SettingsScreen
        workoutState={workoutState}
        onSave={(newState) => setWorkoutState(newState)}
        onToggleUnit={handleUnitToggle}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  if (showHistory) {
    return (
      <HistoryScreen
        history={history}
        displayUnit={workoutState.unit}
        onClose={() => setShowHistory(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Top bar: app title + settings gear */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => setShowHistory(true)} style={styles.topBarAction}>
          <Text style={styles.topBarActionText}>History</Text>
          {history.length > 0 && (
            <View style={styles.historyBadge}>
              <Text style={styles.historyBadgeText}>{history.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.appTitle}>FiveXFive</Text>
        <TouchableOpacity onPress={() => setShowSettings(true)} style={styles.topBarAction}>
          <Text style={styles.gearIcon}>⚙</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Day toggle header */}
        <View style={styles.dayHeader}>
          <TouchableOpacity
            style={[styles.dayTab, day === 'A' && styles.dayTabActive]}
            onPress={() => setDay('A')}
          >
            <Text style={[styles.dayTabText, day === 'A' && styles.dayTabTextActive]}>Day A</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dayTab, day === 'B' && styles.dayTabActive]}
            onPress={() => setDay('B')}
          >
            <Text style={[styles.dayTabText, day === 'B' && styles.dayTabTextActive]}>Day B</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.unitToggle} onPress={handleUnitToggle}>
            <Text style={styles.unitToggleText}>{workoutState.unit === 'lbs' ? 'kg' : 'lbs'}</Text>
          </TouchableOpacity>
        </View>

        {day === 'A' && <>
          <ExerciseCard name="Squat"       weight={formatWeight(workoutState.weights.squat, workoutState.storageUnit, workoutState.unit)} warmups={warmupLabels('squat', workoutState.weights.squat)} sets={squatASets} onPress={(i) => handleSetPress(i, squatASets, setSquatASets)} onLongPress={(i) => handleSetLongPress(i, squatASets, setSquatASets)} />
          <ExerciseCard name="Bench Press" weight={formatWeight(workoutState.weights.bench, workoutState.storageUnit, workoutState.unit)} warmups={warmupLabels('bench', workoutState.weights.bench)} sets={benchSets}  onPress={(i) => handleSetPress(i, benchSets,  setBenchSets)}  onLongPress={(i) => handleSetLongPress(i, benchSets,  setBenchSets)} />
          <ExerciseCard name="Barbell Row" weight={formatWeight(workoutState.weights.row,   workoutState.storageUnit, workoutState.unit)} warmups={warmupLabels('row', workoutState.weights.row)} sets={rowSets}    onPress={(i) => handleSetPress(i, rowSets,    setRowSets)}    onLongPress={(i) => handleSetLongPress(i, rowSets,    setRowSets)} />
        </>}

        {day === 'B' && <>
          <ExerciseCard name="Squat"          weight={formatWeight(workoutState.weights.squat,    workoutState.storageUnit, workoutState.unit)} warmups={warmupLabels('squat', workoutState.weights.squat)} sets={squatBSets}   onPress={(i) => handleSetPress(i, squatBSets,   setSquatBSets)}   onLongPress={(i) => handleSetLongPress(i, squatBSets,   setSquatBSets)} />
          <ExerciseCard name="Overhead Press" weight={formatWeight(workoutState.weights.ohp,      workoutState.storageUnit, workoutState.unit)} warmups={warmupLabels('ohp', workoutState.weights.ohp)} sets={ohpSets}      onPress={(i) => handleSetPress(i, ohpSets,      setOhpSets)}      onLongPress={(i) => handleSetLongPress(i, ohpSets,      setOhpSets)} />
          <ExerciseCard name="Deadlift"       weight={formatWeight(workoutState.weights.deadlift, workoutState.storageUnit, workoutState.unit)} warmups={warmupLabels('deadlift', workoutState.weights.deadlift)} sets={deadliftSets} onPress={(i) => handleSetPress(i, deadliftSets, setDeadliftSets)} onLongPress={(i) => handleSetLongPress(i, deadliftSets, setDeadliftSets)} />
        </>}

        {/* Rest timer */}
        <RestTimer startSignal={startSignal} resetSignal={resetTimerSignal} />

        {/* Finish button — only appears once every set is marked */}
        {canFinish && (
          <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout}>
            <Text style={styles.finishButtonText}>Finish Workout</Text>
          </TouchableOpacity>
        )}

      </ScrollView>

      {/* Rep picker modal — appears when user long-presses a set */}
      <RepPicker
        visible={pickerTarget !== null}
        onConfirm={handlePickerConfirm}
        onCancel={() => setPickerTarget(null)}
      />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  dayHeader: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 10,
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.lg,
    padding: 6,
  },
  dayTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  dayTabActive: {
    backgroundColor: theme.colors.header,
    borderColor: theme.colors.header,
  },
  dayTabText: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  dayTabTextActive: {
    color: theme.colors.white,
  },
  exerciseCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  weightText: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.accent,
  },
  exerciseDetail: {
    fontSize: 12,
    color: theme.colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  warmupText: {
    fontSize: 12,
    color: theme.colors.inkSoft,
    marginBottom: 8,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  checkbox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.accent,
    backgroundColor: theme.colors.backgroundSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  checkboxFailed: {
    backgroundColor: theme.colors.danger,
    borderColor: theme.colors.danger,
  },
  checkmark: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  failReps: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  finishButton: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.lg,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  finishButtonText: {
    color: theme.colors.white,
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  unitToggle: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.header,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: 1.2,
  },
  topBarAction: {
    minWidth: 58,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  topBarActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.white,
  },
  historyBadge: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: theme.colors.badge,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.white,
  },
  gearIcon: {
    fontSize: 24,
    color: theme.colors.white,
  },
});

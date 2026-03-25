import { useState } from 'react';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RepPicker from './RepPicker';
import RestTimer from './RestTimer';

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
  sets: SetRecord[];
  onPress: (i: number) => void;
  onLongPress: (i: number) => void;
};

function ExerciseCard({ name, weight, sets, onPress, onLongPress }: ExerciseCardProps) {
  const setCount = sets.length;
  const repLabel = `${setCount} set${setCount > 1 ? 's' : ''} × 5 reps`;
  return (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{name}</Text>
        <Text style={styles.weightText}>{weight}</Text>
      </View>
      <Text style={styles.exerciseDetail}>{repLabel}</Text>
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
  const [day, setDay] = useState<'A' | 'B'>('A');

  // Day A exercises
  const [squatASets, setSquatASets] = useState<SetRecord[]>(emptySets(5));
  const [benchSets,  setBenchSets]  = useState<SetRecord[]>(emptySets(5));
  const [rowSets,    setRowSets]    = useState<SetRecord[]>(emptySets(5));

  // Day B exercises
  const [squatBSets,    setSquatBSets]    = useState<SetRecord[]>(emptySets(5));
  const [ohpSets,       setOhpSets]       = useState<SetRecord[]>(emptySets(5));
  const [deadliftSets,  setDeadliftSets]  = useState<SetRecord[]>(emptySets(1));

  const [startSignal, setStartSignal] = useState(0);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);

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

  return (
    <SafeAreaView style={styles.safeArea}>
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
        </View>

        {day === 'A' && <>
          <ExerciseCard name="Squat"       weight="45 lb" sets={squatASets} onPress={(i) => handleSetPress(i, squatASets, setSquatASets)} onLongPress={(i) => handleSetLongPress(i, squatASets, setSquatASets)} />
          <ExerciseCard name="Bench Press" weight="45 lb" sets={benchSets}  onPress={(i) => handleSetPress(i, benchSets,  setBenchSets)}  onLongPress={(i) => handleSetLongPress(i, benchSets,  setBenchSets)} />
          <ExerciseCard name="Barbell Row" weight="45 lb" sets={rowSets}    onPress={(i) => handleSetPress(i, rowSets,    setRowSets)}    onLongPress={(i) => handleSetLongPress(i, rowSets,    setRowSets)} />
        </>}

        {day === 'B' && <>
          <ExerciseCard name="Squat"          weight="45 lb" sets={squatBSets}   onPress={(i) => handleSetPress(i, squatBSets,   setSquatBSets)}   onLongPress={(i) => handleSetLongPress(i, squatBSets,   setSquatBSets)} />
          <ExerciseCard name="Overhead Press" weight="45 lb" sets={ohpSets}      onPress={(i) => handleSetPress(i, ohpSets,      setOhpSets)}      onLongPress={(i) => handleSetLongPress(i, ohpSets,      setOhpSets)} />
          <ExerciseCard name="Deadlift"       weight="45 lb" sets={deadliftSets} onPress={(i) => handleSetPress(i, deadliftSets, setDeadliftSets)} onLongPress={(i) => handleSetLongPress(i, deadliftSets, setDeadliftSets)} />
        </>}

        {/* Rest timer */}
        <RestTimer startSignal={startSignal} />

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
    backgroundColor: '#F5F5F5',
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
  },
  dayHeader: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  dayTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#1A1A2E',
    alignItems: 'center',
  },
  dayTabActive: {
    backgroundColor: '#1A1A2E',
  },
  dayTabText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  dayTabTextActive: {
    color: '#FFFFFF',
  },
  exerciseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  weightText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#4A90D9',
  },
  exerciseDetail: {
    fontSize: 13,
    color: '#888888',
    marginBottom: 4,
  },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  checkbox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  checkboxFailed: {
    backgroundColor: '#E8734A',
    borderColor: '#E8734A',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  failReps: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

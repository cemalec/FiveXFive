import { useState } from 'react';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RepPicker from './RepPicker';
import RestTimer from './RestTimer';

const SETS = 5;

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

export default function WorkoutScreen() {
  const [squatSets, setSquatSets] = useState<SetRecord[]>(Array.from({ length: SETS }, emptySet));
  const [benchSets, setBenchSets] = useState<SetRecord[]>(Array.from({ length: SETS }, emptySet));
  const [rowSets, setRowSets] = useState<SetRecord[]>(Array.from({ length: SETS }, emptySet));
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

    if (!alreadyMarked) {
      setStartSignal((prev) => prev + 1);
    }
  }

  // Long press: open the rep picker so the user can record exact reps
  function handleSetLongPress(
    index: number,
    sets: SetRecord[],
    setSets: React.Dispatch<React.SetStateAction<SetRecord[]>>
  ) {
    const current = sets[index];
    if (current.done || current.failed) return; // already marked, ignore
    setPickerTarget({ index, sets, setSets });
  }

  // Called when the user confirms a rep count from the picker
  function handlePickerConfirm(reps: number) {
    if (!pickerTarget) return;
    const { index, setSets } = pickerTarget;
    setSets((prev) => {
      const next = [...prev];
      next[index] = {
        done: reps >= 5,
        failed: reps < 5,
        reps,
      };
      return next;
    });
    setStartSignal((prev) => prev + 1);
    setPickerTarget(null);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Day header */}
        <Text style={styles.dayTitle}>Day A</Text>

        {/* Squat exercise */}
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>Squat</Text>
            <Text style={styles.weightText}>45 lb</Text>
          </View>
          <Text style={styles.exerciseDetail}>5 sets × 5 reps</Text>

          <View style={styles.setRow}>
            {squatSets.map((set, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.checkbox, set.done && styles.checkboxDone, set.failed && styles.checkboxFailed]}
                onPress={() => handleSetPress(i, squatSets, setSquatSets)}
                onLongPress={() => handleSetLongPress(i, squatSets, setSquatSets)}
                accessibilityLabel={`Squat set ${i + 1}`}
                accessibilityRole="checkbox"
              >
                {set.done && <Text style={styles.checkmark}>✓</Text>}
                {set.failed && <Text style={styles.failReps}>{set.reps}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bench Press exercise */}
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>Bench Press</Text>
            <Text style={styles.weightText}>45 lb</Text>
          </View>
          <Text style={styles.exerciseDetail}>5 sets × 5 reps</Text>
          <View style={styles.setRow}>
            {benchSets.map((set, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.checkbox, set.done && styles.checkboxDone, set.failed && styles.checkboxFailed]}
                onPress={() => handleSetPress(i, benchSets, setBenchSets)}
                onLongPress={() => handleSetLongPress(i, benchSets, setBenchSets)}
                accessibilityLabel={`Bench Press set ${i + 1}`}
                accessibilityRole="checkbox"
              >
                {set.done && <Text style={styles.checkmark}>✓</Text>}
                {set.failed && <Text style={styles.failReps}>{set.reps}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Barbell Row exercise */}
        <View style={styles.exerciseCard}>
          <View style={styles.exerciseHeader}>
            <Text style={styles.exerciseName}>Barbell Row</Text>
            <Text style={styles.weightText}>45 lb</Text>
          </View>
          <Text style={styles.exerciseDetail}>5 sets × 5 reps</Text>
          <View style={styles.setRow}>
            {rowSets.map((set, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.checkbox, set.done && styles.checkboxDone, set.failed && styles.checkboxFailed]}
                onPress={() => handleSetPress(i, rowSets, setRowSets)}
                onLongPress={() => handleSetLongPress(i, rowSets, setRowSets)}
                accessibilityLabel={`Barbell Row set ${i + 1}`}
                accessibilityRole="checkbox"
              >
                {set.done && <Text style={styles.checkmark}>✓</Text>}
                {set.failed && <Text style={styles.failReps}>{set.reps}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

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
  dayTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 20,
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

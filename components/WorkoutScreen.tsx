import { useState } from 'react';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import RestTimer from './RestTimer';

const SETS = 5;

export default function WorkoutScreen() {
  const [squatSets, setSquatSets] = useState<boolean[]>(Array(SETS).fill(false));
  const [benchSets, setBenchSets] = useState<boolean[]>(Array(SETS).fill(false));
  const [rowSets, setRowSets] = useState<boolean[]>(Array(SETS).fill(false));
  const [startSignal, setStartSignal] = useState(0);

  function handleSetPress(
    index: number,
    sets: boolean[],
    setSets: React.Dispatch<React.SetStateAction<boolean[]>>
  ) {
    const alreadyChecked = sets[index];

    setSets((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });

    if (!alreadyChecked) {
      setStartSignal((prev) => prev + 1);
    }
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
            {squatSets.map((checked, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.checkbox, checked && styles.checkboxChecked]}
                onPress={() => handleSetPress(i, squatSets, setSquatSets)}
                accessibilityLabel={`Squat set ${i + 1}, ${checked ? 'completed' : 'not completed'}`}
                accessibilityRole="checkbox"
              >
                {checked && <Text style={styles.checkmark}>✓</Text>}
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
            {benchSets.map((checked, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.checkbox, checked && styles.checkboxChecked]}
                onPress={() => handleSetPress(i, benchSets, setBenchSets)}
                accessibilityLabel={`Bench Press set ${i + 1}, ${checked ? 'completed' : 'not completed'}`}
                accessibilityRole="checkbox"
              >
                {checked && <Text style={styles.checkmark}>✓</Text>}
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
            {rowSets.map((checked, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.checkbox, checked && styles.checkboxChecked]}
                onPress={() => handleSetPress(i, rowSets, setRowSets)}
                accessibilityLabel={`Barbell Row set ${i + 1}, ${checked ? 'completed' : 'not completed'}`}
                accessibilityRole="checkbox"
              >
                {checked && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rest timer */}
        <RestTimer startSignal={startSignal} />

      </ScrollView>
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
  checkboxChecked: {
    backgroundColor: '#4A90D9',
    borderColor: '#4A90D9',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  setLabel: {
    fontSize: 16,
    color: '#333333',
  },
});

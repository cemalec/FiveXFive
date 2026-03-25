import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatWeight, Unit, WorkoutLogEntry } from '../storage/workoutStore';

type Props = {
  history: WorkoutLogEntry[];
  displayUnit: Unit;
  onClose: () => void;
};

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function HistoryScreen({ history, displayUnit, onClose }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerSide}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {history.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No workouts logged yet</Text>
            <Text style={styles.emptyText}>Finish a workout and it will appear here with each set's reps.</Text>
          </View>
        )}

        {history.map((entry) => (
          <View key={entry.id} style={styles.workoutCard}>
            <View style={styles.workoutHeader}>
              <Text style={styles.workoutTitle}>Day {entry.day}</Text>
              <Text style={styles.workoutDate}>{formatDate(entry.completedAt)}</Text>
            </View>

            {entry.exercises.map((exercise) => (
              <View key={`${entry.id}-${exercise.name}`} style={styles.exerciseRow}>
                <View style={styles.exerciseTopRow}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseWeight}>
                    {formatWeight(exercise.weight, entry.storageUnit, displayUnit)}
                  </Text>
                </View>
                <Text style={styles.setSummary}>Sets: {exercise.sets.join(' / ')}</Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerSide: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 38,
    color: '#FFFFFF',
    lineHeight: 42,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 21,
  },
  workoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  workoutHeader: {
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  workoutDate: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  exerciseRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E5E5',
    paddingTop: 12,
    marginTop: 12,
  },
  exerciseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
  },
  exerciseName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  exerciseWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A90D9',
  },
  setSummary: {
    marginTop: 6,
    fontSize: 15,
    color: '#444444',
  },
});

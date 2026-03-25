import React, { useMemo, useState } from 'react';
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

type GroupMode = 'week' | 'month';

function startOfWeek(date: Date): Date {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = (day + 6) % 7;
  copy.setDate(copy.getDate() - diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatGroupLabel(value: string, mode: GroupMode): string {
  const date = new Date(value);
  if (mode === 'month') {
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }
  const weekStart = startOfWeek(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export default function HistoryScreen({ history, displayUnit, onClose }: Props) {
  const [groupMode, setGroupMode] = useState<GroupMode>('week');

  const groupedHistory = useMemo(() => {
    const groups = new Map<string, WorkoutLogEntry[]>();
    for (const entry of history) {
      const label = formatGroupLabel(entry.completedAt, groupMode);
      const existing = groups.get(label) ?? [];
      existing.push(entry);
      groups.set(label, existing);
    }
    return Array.from(groups.entries());
  }, [groupMode, history]);

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
        <View style={styles.summaryCard}>
          <Text style={styles.summaryCount}>{history.length}</Text>
          <Text style={styles.summaryLabel}>total workouts</Text>
          <View style={styles.groupToggleRow}>
            <TouchableOpacity
              style={[styles.groupToggle, groupMode === 'week' && styles.groupToggleActive]}
              onPress={() => setGroupMode('week')}
            >
              <Text style={[styles.groupToggleText, groupMode === 'week' && styles.groupToggleTextActive]}>Week</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.groupToggle, groupMode === 'month' && styles.groupToggleActive]}
              onPress={() => setGroupMode('month')}
            >
              <Text style={[styles.groupToggleText, groupMode === 'month' && styles.groupToggleTextActive]}>Month</Text>
            </TouchableOpacity>
          </View>
        </View>

        {history.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No workouts logged yet</Text>
            <Text style={styles.emptyText}>Finish a workout and it will appear here with each set's reps.</Text>
          </View>
        )}

        {groupedHistory.map(([label, entries]) => (
          <View key={label} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{label}</Text>
            <Text style={styles.groupCount}>{entries.length} workout{entries.length === 1 ? '' : 's'}</Text>

            {entries.map((entry) => (
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryCount: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  groupToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  groupToggle: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1A1A2E',
    alignItems: 'center',
  },
  groupToggleActive: {
    backgroundColor: '#1A1A2E',
  },
  groupToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
  },
  groupToggleTextActive: {
    color: '#FFFFFF',
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
  groupSection: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1A1A2E',
  },
  groupCount: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
    marginBottom: 10,
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

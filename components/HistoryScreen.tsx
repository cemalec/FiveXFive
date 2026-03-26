import React, { useMemo, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { formatWeight, Unit, WorkoutLogEntry } from '../storage/workoutStore';
import { theme } from '../theme';

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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.header,
    paddingHorizontal: 8,
    paddingVertical: 14,
  },
  headerSide: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 38,
    color: theme.colors.white,
    lineHeight: 42,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.white,
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 48,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  summaryCount: {
    fontSize: 30,
    fontWeight: '800',
    color: theme.colors.ink,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.muted,
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
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSoft,
  },
  groupToggleActive: {
    backgroundColor: theme.colors.header,
    borderColor: theme.colors.header,
  },
  groupToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.ink,
  },
  groupToggleTextActive: {
    color: theme.colors.white,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.ink,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.inkSoft,
    lineHeight: 21,
  },
  groupSection: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.ink,
  },
  groupCount: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
    marginBottom: 10,
  },
  workoutCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  workoutHeader: {
    marginBottom: 12,
  },
  workoutTitle: {
    fontSize: 21,
    fontWeight: '800',
    color: theme.colors.ink,
  },
  workoutDate: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 2,
  },
  exerciseRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
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
    color: theme.colors.ink,
  },
  exerciseWeight: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.accent,
  },
  setSummary: {
    marginTop: 6,
    fontSize: 15,
    color: theme.colors.inkSoft,
  },
});

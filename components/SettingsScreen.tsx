import React, { useState, useEffect } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  WorkoutState,
  ExerciseKey,
  Unit,
  convertAllWeights,
  roundAllToUnit,
  saveWorkoutState,
  standardIncrementsForUnit,
} from '../storage/workoutStore';

type Props = {
  workoutState: WorkoutState;
  onSave: (newState: WorkoutState) => void;
  onToggleUnit: () => void;
  onClose: () => void;
};

const EXERCISES: { key: ExerciseKey; label: string }[] = [
  { key: 'squat',    label: 'Squat' },
  { key: 'bench',    label: 'Bench Press' },
  { key: 'ohp',      label: 'Overhead Press' },
  { key: 'row',      label: 'Barbell Row' },
  { key: 'deadlift', label: 'Deadlift' },
];

export default function SettingsScreen({ workoutState, onSave, onToggleUnit, onClose }: Props) {
  const unitLabel = workoutState.unit === 'lbs' ? 'lb' : 'kg';
  const [showIncrementSettings, setShowIncrementSettings] = useState(false);
  const displayStandardIncrements = standardIncrementsForUnit(workoutState.unit);

  // Convert a stored value into the current display unit for showing in inputs
  function toDisplay(value: number): string {
    if (workoutState.storageUnit === workoutState.unit) return String(value);
    if (workoutState.storageUnit === 'lbs' && workoutState.unit === 'kg') {
      return String(Math.round(value * 0.453592 * 100) / 100);
    }
    return String(Math.round(value * 2.20462 * 100) / 100);
  }

  function toDisplayIncrement(key: ExerciseKey, value: number): string {
    const converted = Number(toDisplay(value));
    const step = displayStandardIncrements[key];
    const rounded = Math.max(step, Math.round(converted / step) * step);
    return String(rounded);
  }

  // Convert a display-unit value back to storageUnit before saving
  function fromDisplay(value: number): number {
    if (workoutState.storageUnit === workoutState.unit) return value;
    if (workoutState.unit === 'kg' && workoutState.storageUnit === 'lbs') return value / 0.453592;
    return value / 2.20462;
  }

  // Editable copies as strings (TextInput requires strings)
  const [weights, setWeights] = useState<Record<ExerciseKey, string>>(
    Object.fromEntries(
      EXERCISES.map(({ key }) => [key, toDisplay(workoutState.weights[key])])
    ) as Record<ExerciseKey, string>
  );
  const [increments, setIncrements] = useState<Record<ExerciseKey, string>>(
    Object.fromEntries(
      EXERCISES.map(({ key }) => [key, toDisplayIncrement(key, workoutState.increments[key])])
    ) as Record<ExerciseKey, string>
  );

  // Re-sync input values whenever the display unit or stored values change
  useEffect(() => {
    setWeights(
      Object.fromEntries(
        EXERCISES.map(({ key }) => [key, toDisplay(workoutState.weights[key])])
      ) as Record<ExerciseKey, string>
    );
    setIncrements(
      Object.fromEntries(
        EXERCISES.map(({ key }) => [key, toDisplayIncrement(key, workoutState.increments[key])])
      ) as Record<ExerciseKey, string>
    );
  }, [workoutState.unit, workoutState.storageUnit, workoutState.weights, workoutState.increments]);

  function handleSave() {
    const draftState = buildDraftState();
    if (!draftState) return;
    saveWorkoutState(draftState);
    onSave(draftState);
    onClose();
  }

  function buildDraftState(): WorkoutState | null {
    const parsedWeights = {} as Record<ExerciseKey, number>;
    const parsedIncrements = {} as Record<ExerciseKey, number>;
    for (const { key } of EXERCISES) {
      const w = parseFloat(weights[key]);
      const inc = parseFloat(increments[key]);
      if (isNaN(w) || w <= 0 || isNaN(inc) || inc <= 0) {
        Alert.alert('Invalid value', 'All weights and increments must be positive numbers.');
        return null;
      }
      parsedWeights[key] = fromDisplay(w);
      parsedIncrements[key] = fromDisplay(inc);
    }
    return { ...workoutState, weights: parsedWeights, increments: parsedIncrements };
  }

  async function handleRound(targetUnit: Unit) {
    const unitName = targetUnit === 'kg' ? 'kg' : 'lb';
    const stepText = targetUnit === 'kg' ? '2.5 kg (5 kg for deadlift)' : '5 lb (10 lb for deadlift)';

    Alert.alert(
      'Round all values?',
      `This will round all current weights and increments to standard ${unitName} jumps: ${stepText}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Round',
          onPress: async () => {
            const draftState = buildDraftState();
            if (!draftState) return;

            const roundedState = roundAllToUnit(draftState, targetUnit);
            await saveWorkoutState(roundedState);
            onSave(roundedState);
          },
        },
      ]
    );
  }

  async function handleResetIncrements() {
    const defaultIncrements = standardIncrementsForUnit(workoutState.storageUnit);
    const newState: WorkoutState = { ...workoutState, increments: defaultIncrements };
    await saveWorkoutState(newState);
    onSave(newState);
  }

  function handleConvert(targetUnit: Unit) {
    const label = targetUnit === 'kg' ? 'kg (nearest 2.5 kg)' : 'lbs (nearest 5 lb)';
    Alert.alert(
      'Convert weights?',
      `This will round all stored weights to the nearest ${label} and update all increments to standard values. This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Convert',
          style: 'destructive',
          onPress: async () => {
            const converted = convertAllWeights(workoutState, targetUnit);
            await saveWorkoutState(converted);
            onSave(converted);
            onClose();
          },
        },
      ]
    );
  }

  if (showIncrementSettings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowIncrementSettings(false)} style={styles.headerSide}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Increments</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionHeader}>Increment Per Workout ({unitLabel})</Text>
          <View style={styles.card}>
            {EXERCISES.map(({ key, label }, idx) => (
              <View key={key} style={[styles.row, idx === EXERCISES.length - 1 && styles.rowLast]}>
                <Text style={styles.rowLabel}>{label}</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={increments[key]}
                    onChangeText={(v) => setIncrements((prev) => ({ ...prev, [key]: v }))}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={styles.inputUnit}>{unitLabel}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleResetIncrements}>
            <Text style={styles.secondaryButtonText}>Reset To Standard Increments</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>

      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerSide}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={onToggleUnit} style={[styles.headerSide, styles.unitToggle]}>
          <Text style={styles.unitToggleText}>{workoutState.unit === 'lbs' ? 'kg' : 'lbs'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Weights */}
        <Text style={styles.sectionHeader}>Current Weights ({unitLabel})</Text>
        <View style={styles.card}>
          {EXERCISES.map(({ key, label }, idx) => (
            <View key={key} style={[styles.row, idx === EXERCISES.length - 1 && styles.rowLast]}>
              <Text style={styles.rowLabel}>{label}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={weights[key]}
                  onChangeText={(v) => setWeights((prev) => ({ ...prev, [key]: v }))}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
                <Text style={styles.inputUnit}>{unitLabel}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Increments */}
        <Text style={styles.sectionHeader}>Increments</Text>
        <View style={styles.card}>
          <Text style={styles.convertNote}>
            Standard progression is {workoutState.unit === 'kg' ? '2.5 kg' : '5 lb'} for most lifts and doubles for deadlift.
          </Text>
          <TouchableOpacity style={styles.roundButton} onPress={() => setShowIncrementSettings(true)}>
            <Text style={styles.roundButtonText}>Advanced Increment Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundButton, styles.roundButtonLast]} onPress={handleResetIncrements}>
            <Text style={styles.roundButtonText}>Use Standard Increments</Text>
          </TouchableOpacity>
        </View>

        {/* Rounding */}
        <Text style={styles.sectionHeader}>Round All Values</Text>
        <View style={styles.card}>
          <Text style={styles.convertNote}>
            Rounds all current weights and increments to standard plate jumps without changing
            the stored unit system.
          </Text>
          <TouchableOpacity style={styles.roundButton} onPress={() => handleRound('kg')}>
            <Text style={styles.roundButtonText}>Round Everything To Kg Increments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.roundButton, styles.roundButtonLast]} onPress={() => handleRound('lbs')}>
            <Text style={styles.roundButtonText}>Round Everything To Lb Increments</Text>
          </TouchableOpacity>
        </View>

        {/* Save */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Permanent unit conversion */}
        <Text style={styles.sectionHeader}>Permanent Unit Conversion</Text>
        <View style={styles.card}>
          <Text style={styles.convertNote}>
            Rounds all stored weights to clean plate increments in the chosen unit and resets
            increments to standard values. This overwrites your current data.
          </Text>
          <TouchableOpacity
            style={[styles.convertRow, workoutState.storageUnit === 'kg' && styles.convertRowDisabled]}
            onPress={() => handleConvert('kg')}
            disabled={workoutState.storageUnit === 'kg'}
          >
            <Text style={[styles.convertText, workoutState.storageUnit === 'kg' && styles.convertTextDisabled]}>
              Round &amp; store as kg  (nearest 2.5 kg)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.convertRow, styles.convertRowLast, workoutState.storageUnit === 'lbs' && styles.convertRowDisabled]}
            onPress={() => handleConvert('lbs')}
            disabled={workoutState.storageUnit === 'lbs'}
          >
            <Text style={[styles.convertText, workoutState.storageUnit === 'lbs' && styles.convertTextDisabled]}>
              Round &amp; store as lbs  (nearest 5 lb)
            </Text>
          </TouchableOpacity>
        </View>

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
  unitToggle: {
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 4,
  },
  unitToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
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
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 28,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 16,
    color: '#1A1A2E',
    flex: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  input: {
    width: 72,
    borderWidth: 1,
    borderColor: '#C8C8C8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 16,
    textAlign: 'right',
    color: '#1A1A2E',
  },
  inputUnit: {
    fontSize: 14,
    color: '#888888',
    width: 24,
  },
  saveButton: {
    backgroundColor: '#4A90D9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4A90D9',
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryButtonText: {
    color: '#4A90D9',
    fontSize: 16,
    fontWeight: '700',
  },
  roundButton: {
    backgroundColor: '#F3F8FE',
    borderWidth: 1,
    borderColor: '#4A90D9',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  roundButtonLast: {
    marginBottom: 14,
  },
  roundButtonText: {
    color: '#4A90D9',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  convertNote: {
    fontSize: 13,
    color: '#888888',
    paddingVertical: 12,
    lineHeight: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  convertRow: {
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
    alignItems: 'center',
  },
  convertRowLast: {
    borderBottomWidth: 0,
  },
  convertRowDisabled: {
    opacity: 0.3,
  },
  convertText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E8734A',
  },
  convertTextDisabled: {
    color: '#888888',
  },
});

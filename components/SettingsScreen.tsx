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
  defaultWarmupPercentages,
  formatNumber,
  roundToTwoDecimals,
  WorkoutState,
  ExerciseKey,
  Unit,
  convertAllWeights,
  roundAllToUnit,
  saveWorkoutState,
  standardIncrementsForUnit,
} from '../storage/workoutStore';
import { theme } from '../theme';

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
  const [showWarmupSettings, setShowWarmupSettings] = useState(false);
  const displayStandardIncrements = standardIncrementsForUnit(workoutState.unit);

  // Convert a stored value into the current display unit for showing in inputs
  function toDisplay(value: number): string {
    if (workoutState.storageUnit === workoutState.unit) return formatNumber(value);
    if (workoutState.storageUnit === 'lbs' && workoutState.unit === 'kg') {
      return formatNumber(value * 0.453592);
    }
    return formatNumber(value * 2.20462);
  }

  function toDisplayIncrement(key: ExerciseKey, value: number): string {
    const converted = Number(toDisplay(value));
    const step = displayStandardIncrements[key];
    const rounded = Math.max(step, Math.round(converted / step) * step);
    return formatNumber(rounded);
  }

  // Convert a display-unit value back to storageUnit before saving
  function fromDisplay(value: number): number {
    if (workoutState.storageUnit === workoutState.unit) return roundToTwoDecimals(value);
    if (workoutState.unit === 'kg' && workoutState.storageUnit === 'lbs') return roundToTwoDecimals(value / 0.453592);
    return roundToTwoDecimals(value / 2.20462);
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
  const [warmupPercentagesText, setWarmupPercentagesText] = useState(
    workoutState.customWarmupPercentages.join(', ')
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
    setWarmupPercentagesText(workoutState.customWarmupPercentages.join(', '));
  }, [workoutState.unit, workoutState.storageUnit, workoutState.weights, workoutState.increments, workoutState.customWarmupPercentages]);

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
    const parsedWarmupPercentages = warmupPercentagesText
      .split(',')
      .map((value) => parseFloat(value.trim()))
      .filter((value) => !isNaN(value));

    if (parsedWarmupPercentages.length === 0 || parsedWarmupPercentages.some((value) => value <= 0 || value >= 100)) {
      Alert.alert('Invalid warmups', 'Warmup percentages must be comma-separated numbers between 0 and 100.');
      return null;
    }

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
    return {
      ...workoutState,
      weights: parsedWeights,
      increments: parsedIncrements,
      customWarmupPercentages: parsedWarmupPercentages,
    };
  }

  async function handleWarmupModeChange(mode: WorkoutState['warmupMode']) {
    const draftState = buildDraftState();
    if (!draftState) return;
    const newState: WorkoutState = { ...draftState, warmupMode: mode };
    await saveWorkoutState(newState);
    onSave(newState);
  }

  async function handleResetWarmupPercentages() {
    const defaults = defaultWarmupPercentages();
    setWarmupPercentagesText(defaults.join(', '));
    const newState: WorkoutState = { ...workoutState, customWarmupPercentages: defaults };
    await saveWorkoutState(newState);
    onSave(newState);
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

  if (showWarmupSettings) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowWarmupSettings(false)} style={styles.headerSide}>
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Warmups</Text>
          <View style={styles.headerSide} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionHeader}>Warmup Percentages</Text>
          <View style={styles.card}>
            <Text style={styles.convertNote}>
              Enter comma-separated percentages for the percentage warmup mode. Example: 45, 65, 85
            </Text>
            <View style={styles.singleInputSection}>
              <TextInput
                style={styles.fullWidthInput}
                value={warmupPercentagesText}
                onChangeText={setWarmupPercentagesText}
                autoCapitalize="none"
                autoCorrect={false}
                selectTextOnFocus
              />
            </View>
          </View>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleResetWarmupPercentages}>
            <Text style={styles.secondaryButtonText}>Reset To 45, 65, 85</Text>
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

        <Text style={styles.sectionHeader}>Warmups</Text>
        <View style={styles.card}>
          <Text style={styles.convertNote}>
            Choose between empty bar plus 3 even steps, or empty bar plus percentage-based warmups.
          </Text>
          <TouchableOpacity
            style={[styles.roundButton, workoutState.warmupMode === 'interpolate' && styles.selectedActionButton]}
            onPress={() => handleWarmupModeChange('interpolate')}
          >
            <Text style={[styles.roundButtonText, workoutState.warmupMode === 'interpolate' && styles.selectedActionButtonText]}>
              Empty Bar + 3 Even Steps
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.roundButton, workoutState.warmupMode === 'percentages' && styles.selectedActionButton, styles.roundButtonLast]}
            onPress={() => handleWarmupModeChange('percentages')}
          >
            <Text style={[styles.roundButtonText, workoutState.warmupMode === 'percentages' && styles.selectedActionButtonText]}>
              Empty Bar + {workoutState.customWarmupPercentages.join(' / ')}%
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => setShowWarmupSettings(true)}>
            <Text style={styles.secondaryButtonText}>Advanced Warmup Settings</Text>
          </TouchableOpacity>
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
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerSide: {
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitToggle: {
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 4,
  },
  unitToggleText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  backArrow: {
    fontSize: 38,
    color: theme.colors.primary,
    lineHeight: 42,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scroll: {
    padding: 24,
    paddingBottom: 48,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 28,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 16,
    ...theme.shadow.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 16,
    color: theme.colors.text,
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
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 16,
    textAlign: 'right',
    color: theme.colors.text,
  },
  inputUnit: {
    fontSize: 14,
    color: theme.colors.textMuted,
    width: 24,
  },
  saveButton: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  secondaryButtonText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  singleInputSection: {
    paddingVertical: 14,
  },
  fullWidthInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: theme.colors.text,
  },
  roundButton: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  roundButtonLast: {
    marginBottom: 14,
  },
  roundButtonText: {
    color: theme.colors.accent,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  selectedActionButton: {
    backgroundColor: theme.colors.accent,
  },
  selectedActionButtonText: {
    color: theme.colors.white,
  },
  convertNote: {
    fontSize: 13,
    color: theme.colors.textMuted,
    paddingVertical: 12,
    lineHeight: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  convertRow: {
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
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
    color: theme.colors.danger,
  },
  convertTextDisabled: {
    color: theme.colors.textMuted,
  },
});

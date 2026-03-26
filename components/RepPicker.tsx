import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../theme';

type Props = {
  visible: boolean;
  onConfirm: (reps: number) => void;
  onCancel: () => void;
};

const MIN_REPS = 0;
const MAX_REPS = 10;
const TARGET_REPS = 5;

export default function RepPicker({ visible, onConfirm, onCancel }: Props) {
  const [reps, setReps] = require('react').useState(TARGET_REPS);

  function handleConfirm() {
    onConfirm(reps);
    setReps(TARGET_REPS); // reset for next time
  }

  function handleCancel() {
    onCancel();
    setReps(TARGET_REPS);
  }

  // Color the number based on how it compares to the target
  const numberColor =
    reps < TARGET_REPS ? theme.colors.danger
    : reps === TARGET_REPS ? theme.colors.accent
    : theme.colors.success;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>How many reps?</Text>

          <View style={styles.pickerRow}>
            <TouchableOpacity
              style={[styles.adjButton, reps <= MIN_REPS && styles.adjButtonDisabled]}
              onPress={() => setReps((r: number) => Math.max(MIN_REPS, r - 1))}
              disabled={reps <= MIN_REPS}
            >
              <Text style={styles.adjButtonText}>–</Text>
            </TouchableOpacity>

            <Text style={[styles.repNumber, { color: numberColor }]}>{reps}</Text>

            <TouchableOpacity
              style={[styles.adjButton, reps >= MAX_REPS && styles.adjButtonDisabled]}
              onPress={() => setReps((r: number) => Math.min(MAX_REPS, r + 1))}
              disabled={reps >= MAX_REPS}
            >
              <Text style={styles.adjButtonText}>+</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.hint}>
            {reps < TARGET_REPS ? 'Set failed — weight stays the same'
              : reps === TARGET_REPS ? 'Set complete!'
              : 'Extra reps — great work!'}
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.confirmButton, { backgroundColor: numberColor }]} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    padding: 28,
    width: 300,
    alignItems: 'center',
    borderTopWidth: 3,
    borderTopColor: theme.colors.primary,
    ...theme.shadow.modal,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 24,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  adjButton: {
    width: 52,
    height: 52,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  adjButtonText: {
    color: theme.colors.white,
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 30,
  },
  repNumber: {
    fontSize: 72,
    fontWeight: '800',
    width: 120,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  hint: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    color: theme.colors.white,
    fontWeight: '700',
  },
});

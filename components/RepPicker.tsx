import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    reps < TARGET_REPS ? '#E8734A'  // orange — didn't finish
    : reps === TARGET_REPS ? '#4A90D9' // blue — hit the target
    : '#4CAF50';                        // green — exceeded target

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
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 28,
    width: 300,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A2E',
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
    borderRadius: 26,
    backgroundColor: '#1A1A2E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adjButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  adjButtonText: {
    color: '#FFFFFF',
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
    color: '#888888',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#555555',
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

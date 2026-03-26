import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { theme } from '../theme';

const DURATION = 180; // 3 minutes in seconds

type Props = {
  startSignal?: number; // increments each time a set is checked — triggers the timer to start
  resetSignal?: number; // increments when the timer should be fully reset and stopped
};

export default function RestTimer({ startSignal = 0, resetSignal = 0 }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [isRunning, setIsRunning] = useState(false);

  // Tick down every second while the timer is running
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // When the countdown reaches zero, alert and reset
  useEffect(() => {
    if (secondsLeft > 0) return;

    setIsRunning(false);
    setSecondsLeft(DURATION);
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 400, 200, 400]);
    }
    Alert.alert('Rest Over', "Time's up — start your next set!");
  }, [secondsLeft]);

  // When a set is checked off externally, restart the timer from the top
  useEffect(() => {
    if (startSignal === 0) return;
    setSecondsLeft(DURATION);
    setIsRunning(true);
  }, [startSignal]);

  // Explicit reset from parent: stop and clear the timer completely
  useEffect(() => {
    if (resetSignal === 0) return;
    setIsRunning(false);
    setSecondsLeft(DURATION);
  }, [resetSignal]);

  function handlePress() {
    if (isRunning) {
      // Reset button: stop the timer and go back to the start
      setIsRunning(false);
      setSecondsLeft(DURATION);
    } else {
      // Start button: begin counting down
      setIsRunning(true);
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rest</Text>
      <Text style={styles.timerText}>{display}</Text>
      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonRunning]}
        onPress={handlePress}
        accessibilityLabel={isRunning ? 'Skip rest' : 'Start rest timer'}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{isRunning ? 'Skip' : 'Start'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.line,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  label: {
    fontSize: 15,
    color: theme.colors.muted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.ink,
    fontVariant: ['tabular-nums'],
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.md,
  },
  buttonRunning: {
    backgroundColor: theme.colors.danger,
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
});

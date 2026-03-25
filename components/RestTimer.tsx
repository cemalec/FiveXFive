import { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

const DURATION = 180; // 3 minutes in seconds

type Props = {
  startSignal?: number; // increments each time a set is checked — triggers the timer to start
};

export default function RestTimer({ startSignal = 0 }: Props) {
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    color: '#555555',
    fontWeight: '600',
  },
  timerText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1A1A2E',
    fontVariant: ['tabular-nums'],
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#4A90D9',
    borderRadius: 8,
  },
  buttonRunning: {
    backgroundColor: '#C0392B', // red when running, to signal "this will cancel"
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
});

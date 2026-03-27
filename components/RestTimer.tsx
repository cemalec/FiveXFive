import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { useTheme } from '../ThemeContext';

const DURATION = 180; // 3 minutes in seconds

type Props = {
  startSignal?: number; // increments each time a set is checked — triggers the timer to start
  resetSignal?: number; // increments when the timer should be fully reset and stopped
};

export default function RestTimer({ startSignal = 0, resetSignal = 0 }: Props) {
  const { theme, themeName } = useTheme();
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

  const styles = useMemo(() => StyleSheet.create({
    container: {
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.xl,
      paddingVertical: 20,
      paddingHorizontal: 16,
      marginBottom: 16,
      ...(themeName === 'foxfire'
        ? { borderWidth: 1.5, borderColor: theme.colors.primary }
        : { borderLeftWidth: 3, borderLeftColor: theme.colors.primary }),
      ...theme.shadow.card,
    },
    label: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      letterSpacing: 1.5,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    timerText: {
      fontSize: 52,
      fontWeight: '200',
      color: theme.colors.primary,
      fontVariant: ['tabular-nums'],
      letterSpacing: 4,
      marginBottom: 16,
    },
    button: {
      paddingVertical: 10,
      paddingHorizontal: 44,
      backgroundColor: theme.colors.accent,
      borderRadius: theme.radius.pill,
    },
    buttonRunning: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme.colors.warning,
    },
    buttonText: {
      color: theme.colors.white,
      fontSize: 16,
      fontWeight: '700',
      letterSpacing: 0.5,
    },
  }), [theme]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rest Timer</Text>
      <Text style={styles.timerText}>{display}</Text>
      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonRunning]}
        onPress={handlePress}
        accessibilityLabel={isRunning ? 'Skip rest' : 'Start rest timer'}
        accessibilityRole="button"
      >
        <Text style={[styles.buttonText, isRunning && { color: theme.colors.warning }]}>
          {isRunning ? 'Skip' : 'Start'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}


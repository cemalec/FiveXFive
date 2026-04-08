import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import * as Notifications from "expo-notifications";
import { useTheme } from "../ThemeContext";

const DURATION = 180; // 3 minutes in seconds

type Props = {
  startSignal?: number; // increments each time a set is checked — triggers the timer to start
  resetSignal?: number; // increments when the timer should be fully reset and stopped
};

export default function RestTimer({ startSignal = 0, resetSignal = 0 }: Props) {
  const { theme, themeName } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const endTimeRef = useRef<number | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const completionNotificationIdRef = useRef<string | null>(null);
  const notificationPermissionGrantedRef = useRef(false);

  const completionTitle = "Rest Over";
  const completionBody = "Time's up - start your next set!";

  function getRemainingSeconds() {
    if (endTimeRef.current === null) return DURATION;
    return Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
  }

  async function ensureNotificationPermission() {
    if (Platform.OS === "web") return false;
    if (notificationPermissionGrantedRef.current) return true;

    const current = await Notifications.getPermissionsAsync();
    let finalStatus = current.status;
    if (finalStatus !== "granted") {
      const requested = await Notifications.requestPermissionsAsync();
      finalStatus = requested.status;
    }

    const granted = finalStatus === "granted";
    notificationPermissionGrantedRef.current = granted;
    return granted;
  }

  async function cancelCompletionNotification() {
    const notificationId = completionNotificationIdRef.current;
    if (!notificationId) return;
    completionNotificationIdRef.current = null;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch {
      // Ignore cancellation failures if the notification has already fired.
    }
  }

  async function scheduleCompletionNotification() {
    const hasPermission = await ensureNotificationPermission();
    if (!hasPermission) return;

    await cancelCompletionNotification();

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: completionTitle,
        body: completionBody,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: DURATION,
      },
    });
    completionNotificationIdRef.current = notificationId;
  }

  async function startTimer() {
    endTimeRef.current = Date.now() + DURATION * 1000;
    setSecondsLeft(DURATION);
    setIsRunning(true);
    await scheduleCompletionNotification();
  }

  async function stopAndResetTimer() {
    setIsRunning(false);
    endTimeRef.current = null;
    setSecondsLeft(DURATION);
    await cancelCompletionNotification();
  }

  // Keep the display in sync while app state changes.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      appStateRef.current = nextState;
      if (nextState === "active" && endTimeRef.current !== null) {
        setSecondsLeft(getRemainingSeconds());
      }
    });

    return () => subscription.remove();
  }, []);

  // Initialize notification permission early so first timer run can alert reliably.
  useEffect(() => {
    void ensureNotificationPermission();
  }, []);

  // Update countdown while running based on wall-clock time.
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft(getRemainingSeconds());
    }, 250);

    setSecondsLeft(getRemainingSeconds());

    return () => clearInterval(interval);
  }, [isRunning]);

  // When the countdown reaches zero, alert and reset
  useEffect(() => {
    if (secondsLeft !== 0 || endTimeRef.current === null) return;

    const complete = async () => {
      setIsRunning(false);
      endTimeRef.current = null;
      setSecondsLeft(DURATION);

      if (appStateRef.current === "active") {
        const hasPermission = await ensureNotificationPermission();
        if (hasPermission) {
          await cancelCompletionNotification();
          await Notifications.scheduleNotificationAsync({
            content: {
              title: completionTitle,
              body: completionBody,
              sound: "default",
            },
            trigger: null,
          });
        }

        if (Platform.OS !== "web") {
          Vibration.vibrate([0, 400, 200, 400]);
        }
        Alert.alert(completionTitle, completionBody);
      } else {
        completionNotificationIdRef.current = null;
      }
    };

    void complete();
  }, [secondsLeft]);

  // When a set is checked off externally, restart the timer from the top
  useEffect(() => {
    if (startSignal === 0) return;
    void startTimer();
  }, [startSignal]);

  // Explicit reset from parent: stop and clear the timer completely
  useEffect(() => {
    if (resetSignal === 0) return;
    void stopAndResetTimer();
  }, [resetSignal]);

  useEffect(() => {
    return () => {
      void cancelCompletionNotification();
    };
  }, []);

  function handlePress() {
    if (isRunning) {
      // Reset button: stop the timer and go back to the start
      void stopAndResetTimer();
    } else {
      // Start button: begin counting down
      void startTimer();
    }
  }

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const display = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          alignItems: "center",
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.xl,
          paddingVertical: 20,
          paddingHorizontal: 16,
          marginBottom: 16,
          ...(themeName === "foxfire"
            ? { borderWidth: 1.5, borderColor: theme.colors.primary }
            : { borderLeftWidth: 3, borderLeftColor: theme.colors.primary }),
          ...theme.shadow.card,
        },
        label: {
          fontSize: 13,
          color: theme.colors.textSecondary,
          fontWeight: "600",
          letterSpacing: 1.5,
          textTransform: "uppercase",
          marginBottom: 4,
        },
        timerText: {
          fontSize: 52,
          fontWeight: "200",
          color: theme.colors.primary,
          fontVariant: ["tabular-nums"],
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
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: theme.colors.warning,
        },
        buttonText: {
          color: theme.colors.white,
          fontSize: 16,
          fontWeight: "700",
          letterSpacing: 0.5,
        },
      }),
    [theme],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Rest Timer</Text>
      <Text style={styles.timerText}>{display}</Text>
      <TouchableOpacity
        style={[styles.button, isRunning && styles.buttonRunning]}
        onPress={handlePress}
        accessibilityLabel={isRunning ? "Skip rest" : "Start rest timer"}
        accessibilityRole="button"
      >
        <Text
          style={[
            styles.buttonText,
            isRunning && { color: theme.colors.warning },
          ]}
        >
          {isRunning ? "Skip" : "Start"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

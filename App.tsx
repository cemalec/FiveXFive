import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import * as Notifications from "expo-notifications";
import WorkoutScreen from "./components/WorkoutScreen";
import { ThemeProvider } from "./ThemeContext";
import { useTheme } from "./ThemeContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function AppInner() {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style="light" />
      <WorkoutScreen />
    </View>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

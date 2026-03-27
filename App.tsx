import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import WorkoutScreen from './components/WorkoutScreen';
import { ThemeProvider } from './ThemeContext';
import { useTheme } from './ThemeContext';

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

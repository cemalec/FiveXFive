import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import WorkoutScreen from './components/WorkoutScreen';
import { theme } from './theme';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <StatusBar style="light" />
      <WorkoutScreen />
    </View>
  );
}

import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import WorkoutScreen from './components/WorkoutScreen';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <WorkoutScreen />
    </View>
  );
}

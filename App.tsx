import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import RestTimer from './components/RestTimer';

export default function App() {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <RestTimer />
    </View>
  );
}

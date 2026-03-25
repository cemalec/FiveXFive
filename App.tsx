import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const GRID_SIZE = 5;
const STORAGE_KEY = '@fivexfive_grid';

type Grid = boolean[][];

function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () =>
    Array(GRID_SIZE).fill(false)
  );
}

export default function App() {
  const [grid, setGrid] = useState<Grid>(createEmptyGrid());
  const [loading, setLoading] = useState(true);

  // Load saved grid from device storage on app start
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved !== null) {
          setGrid(JSON.parse(saved));
        }
      })
      .catch(() => {
        // If loading fails, start with an empty grid
      })
      .finally(() => setLoading(false));
  }, []);

  // Toggle a cell and persist the updated grid to device storage
  const toggleCell = useCallback(
    (row: number, col: number) => {
      setGrid((prev) => {
        const next = prev.map((r, ri) =>
          r.map((cell, ci) => (ri === row && ci === col ? !cell : cell))
        );
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  // Reset the grid and clear device storage
  const resetGrid = useCallback(() => {
    const empty = createEmptyGrid();
    setGrid(empty);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(empty)).catch(() => {});
  }, []);

  const filledCount = grid.flat().filter(Boolean).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4A90D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FiveXFive</Text>
      <Text style={styles.subtitle}>
        {filledCount} / {GRID_SIZE * GRID_SIZE} filled
      </Text>

      <View style={styles.grid}>
        {grid.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((cell, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[styles.cell, cell && styles.cellFilled]}
                onPress={() => toggleCell(rowIndex, colIndex)}
                accessibilityLabel={`Cell ${rowIndex + 1}-${colIndex + 1}, ${cell ? 'filled' : 'empty'}`}
                accessibilityRole="button"
              />
            ))}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.resetButton} onPress={resetGrid}>
        <Text style={styles.resetText}>Reset</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    marginBottom: 24,
  },
  grid: {
    borderWidth: 2,
    borderColor: '#1A1A2E',
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    width: 56,
    height: 56,
    borderWidth: 1,
    borderColor: '#AAAAAA',
    backgroundColor: '#FFFFFF',
  },
  cellFilled: {
    backgroundColor: '#4A90D9',
  },
  resetButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#1A1A2E',
    borderRadius: 8,
  },
  resetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

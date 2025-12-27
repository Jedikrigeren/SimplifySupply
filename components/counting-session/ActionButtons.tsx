import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ActionButtonsProps {
  onScanPress: () => void;
  onManualPress: () => void;
}

export default function ActionButtons({ onScanPress, onManualPress }: ActionButtonsProps) {
  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={onScanPress}>
        <Text style={styles.buttonText}>📷 Scan Barcode</Text>
      </Pressable>
      <Pressable style={[styles.button, styles.manualButton]} onPress={onManualPress}>
        <Text style={styles.buttonText}>✏️ Manual</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  manualButton: {
    backgroundColor: '#8b5cf6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

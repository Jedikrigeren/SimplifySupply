import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface SessionHeaderProps {
  warehouseCode: string;
  status: 'active' | 'paused' | 'completed' | 'submitted';
}

export default function SessionHeader({ warehouseCode, status }: SessionHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>Warehouse {warehouseCode}</Text>
        <View style={[styles.statusBadge, { backgroundColor: status === 'active' ? '#10b981' : '#f59e0b' }]}>
          <Text style={styles.statusText}>
            {status === 'active' ? 'Active' : 'Paused'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
});

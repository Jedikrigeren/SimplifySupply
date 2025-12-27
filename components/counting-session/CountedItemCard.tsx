import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface CountedItemCardProps {
  item: {
    id: string;
    item_code: string;
    counted_quantity: number;
    counted_uom: string;
    warehouse_code: string;
    location?: string;
    batches?: Array<{
      batch_number?: string;
      batchNumber?: string;
      counted_quantity?: number;
      countedQuantity?: number;
    }>;
  };
  onRemove: (itemId: string) => void;
}

export default function CountedItemCard({ item, onRemove }: CountedItemCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.itemCode}>{item.item_code}</Text>
        <Pressable onPress={() => onRemove(item.id)}>
          <Text style={styles.removeButton}>Remove</Text>
        </Pressable>
      </View>
      <View style={styles.details}>
        <Text style={styles.quantity}>
          Qty: {item.counted_quantity} {item.counted_uom}
        </Text>
        <Text style={styles.warehouse}>WH: {item.warehouse_code}</Text>
        {item.location && (
          <Text style={styles.location}>📍 {item.location}</Text>
        )}
      </View>
      {item.batches && item.batches.length > 0 && (
        <View style={styles.batchContainer}>
          {item.batches.map((batch, index) => (
            <Text key={index} style={styles.batchText}>
              Batch {batch.batch_number || batch.batchNumber}: {batch.counted_quantity || batch.countedQuantity}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  removeButton: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
  },
  details: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  warehouse: {
    fontSize: 14,
    color: '#6b7280',
  },
  location: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  batchContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  batchText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
});

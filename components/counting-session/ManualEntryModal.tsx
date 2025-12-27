import React, { useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import LocationPicker from './LocationPicker';


interface ManualEntryModalProps {
  visible: boolean;
  itemCode: string;
  quantity: string;
  uom: string;
  location: string;
  isLoading: boolean;
  onItemCodeChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  onUomChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onQuickAdd: (amount: number) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export default function ManualEntryModal({
  visible,
  itemCode,
  quantity,
  uom,
  location,
  isLoading,
  onItemCodeChange,
  onQuantityChange,
  onUomChange,
  onLocationChange,
  onQuickAdd,
  onSubmit,
  onCancel,
}: ManualEntryModalProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Item Manually</Text>
            <Pressable onPress={onCancel}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Item Code</Text>
            <TextInput
              style={styles.input}
              value={itemCode}
              onChangeText={onItemCodeChange}
              placeholder="Enter code manually"
              autoCapitalize="characters"
              autoFocus
            />
          </View>
          
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 2 }]}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={styles.input}
                value={quantity}
                onChangeText={onQuantityChange}
                placeholder="Quantity"
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>UoM</Text>
              <View style={styles.uomButtons}>
                <Pressable 
                  style={[styles.uomButton, uom === 'PCS' && styles.uomButtonActive]}
                  onPress={() => onUomChange('PCS')}
                >
                  <Text style={[styles.uomButtonText, uom === 'PCS' && styles.uomButtonTextActive]}>Pcs</Text>
                </Pressable>
                <Pressable 
                  style={[styles.uomButton, uom === 'CASE' && styles.uomButtonActive]}
                  onPress={() => onUomChange('CASE')}
                >
                  <Text style={[styles.uomButtonText, uom === 'CASE' && styles.uomButtonTextActive]}>Case</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Location</Text>
            <Pressable 
              style={styles.locationSelector}
              onPress={() => setShowLocationPicker(true)}
            >
              <Text style={location ? styles.locationSelectedText : styles.locationPlaceholderText}>
                {location || 'Select location...'}
              </Text>
              <Text style={styles.locationArrow}>▼</Text>
            </Pressable>
          </View>

          {/* Location Picker Modal */}
          <LocationPicker
            visible={showLocationPicker}
            selectedLocation={location}
            onSelect={onLocationChange}
            onClose={() => setShowLocationPicker(false)}
          />

          <View style={styles.quickButtons}>
            <Pressable style={styles.quickButton} onPress={() => onQuickAdd(1)}>
              <Text style={styles.quickButtonText}>+1</Text>
            </Pressable>
            <Pressable style={styles.quickButton} onPress={() => onQuickAdd(5)}>
              <Text style={styles.quickButtonText}>+5</Text>
            </Pressable>
            <Pressable style={styles.quickButton} onPress={() => onQuickAdd(10)}>
              <Text style={styles.quickButtonText}>+10</Text>
            </Pressable>
          </View>

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.confirmButton]} onPress={onSubmit} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.confirmText}>Add Item</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '300',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  uomButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  uomButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  uomButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  uomButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  uomButtonTextActive: {
    color: '#fff',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#e5e7eb',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickButtonText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#10b981',
  },
  confirmText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  locationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  locationSelectedText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  locationPlaceholderText: {
    fontSize: 16,
    color: '#9ca3af',
  },
  locationArrow: {
    fontSize: 12,
    color: '#6b7280',
  },
});

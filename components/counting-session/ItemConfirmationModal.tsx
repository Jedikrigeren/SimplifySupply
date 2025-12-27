import { MasterItem } from '@/services/item.service';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LocationPicker from './LocationPicker';
interface ItemConfirmationModalProps {
  visible: boolean;
  item: MasterItem | null;
  scannedBarcode: string;
  quantity: string;
  uom: string;
  location: string;
  isLoading: boolean;
  onQuantityChange: (value: string) => void;
  onUomChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ItemConfirmationModal({
  visible,
  item,
  scannedBarcode,
  quantity,
  uom,
  location,
  isLoading,
  onQuantityChange,
  onUomChange,
  onLocationChange,
  onConfirm,
  onCancel,
}: ItemConfirmationModalProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  
  if (!item) return null;

  const quantityNum = parseFloat(quantity) || 0;
  const selectedBarcode = item.barCodeCollection.find(bc => bc.uomType === uom);
  const bc = item.barCodeCollection.find(b => b.barCode === scannedBarcode);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Confirm Item</Text>
          
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.itemInfo}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Item Code:</Text>
                <Text style={styles.infoValue}>{item.itemCode}</Text>
              </View>
              {bc && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Barcode:</Text>
                  <Text style={styles.infoValue}>{bc.barCode}</Text>
                </View>
              )}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{item.itemName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>In Stock:</Text>
                <Text style={styles.infoValue}>
                  {item.amountInStockInInventoryUoM} {item.inventoryUoM}
                </Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.locationRow}>
            <Text style={styles.locationLabel}>Location:</Text>
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

          <View style={styles.quantitySection}>
            <View style={styles.quantityControls}>
              <Pressable style={styles.quantityButton} onPress={() => {
                const current = parseFloat(quantity) || 0;
                onQuantityChange(Math.max(0, current - 10).toString());
              }}>
                <Text style={styles.quantityButtonText}>-10</Text>
              </Pressable>
              <Pressable style={styles.quantityButton} onPress={() => {
                const current = parseFloat(quantity) || 0;
                onQuantityChange(Math.max(0, current - 1).toString());
              }}>
                <Text style={styles.quantityButtonText}>-1</Text>
              </Pressable>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={onQuantityChange}
                keyboardType="numeric"
                autoFocus
              />
              <Pressable style={styles.quantityButton} onPress={() => {
                const current = parseFloat(quantity) || 0;
                onQuantityChange((current + 1).toString());
              }}>
                <Text style={styles.quantityButtonText}>+1</Text>
              </Pressable>
              <Pressable style={styles.quantityButton} onPress={() => {
                const current = parseFloat(quantity) || 0;
                onQuantityChange((current + 10).toString());
              }}>
                <Text style={styles.quantityButtonText}>+10</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.uomRow}>
            <View style={styles.uomSection}>
              <Text style={styles.label}>UoM</Text>
              <View style={styles.uomDisplay}>
                <Text style={styles.uomDisplayText}>{uom}</Text>
              </View>
            </View>
            {selectedBarcode && selectedBarcode.baseQuantity && selectedBarcode.alternateQuantity && (
              <View style={styles.conversionSection}>
                <Text style={styles.label}>&nbsp;</Text>
                <View style={styles.conversionInfo}>
                  <Text style={styles.conversionText}>
                    = {((quantityNum * selectedBarcode.baseQuantity) / (selectedBarcode.alternateQuantity || 1)).toFixed(2)} {item.inventoryUoM}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Location Picker Modal */}
          <LocationPicker
            visible={showLocationPicker}
            selectedLocation={location}
            onSelect={onLocationChange}
            onClose={() => setShowLocationPicker(false)}
          />

          <View style={styles.actions}>
            <Pressable style={[styles.button, styles.cancelButton]} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.button, styles.confirmButton]} onPress={onConfirm} disabled={isLoading}>
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  scrollContainer: {
    maxHeight: 200,
    marginBottom: 16,
  },
  itemInfo: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 80,
  },
  quantitySection: {
    marginBottom: 16,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    backgroundColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  quantityButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  quantityInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#3b82f6',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    backgroundColor: '#fff',
    textAlign: 'center',
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
  uomRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  uomSection: {
    flex: 1,
  },
  uomDisplay: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
    alignItems: 'center',
  },
  uomDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  conversionSection: {
    flex: 1,
  },
  conversionInfo: {
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
  },
  conversionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
    textAlign: 'center',
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
    flex: 1,
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

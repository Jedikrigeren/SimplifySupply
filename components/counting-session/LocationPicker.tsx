import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

const DEFAULT_LOCATIONS = [
  'Pakkeri',
  'Råvare Køl',
  'Outlet',
  'Outlet Lager',
  'FV Lager',
  'FV Køl',
  'HF Køl',
  'Garage',
  'Telt',
  'Kælder',
];

interface LocationPickerProps {
  visible: boolean;
  selectedLocation: string;
  onSelect: (location: string) => void;
  onClose: () => void;
}

export default function LocationPicker({
  visible,
  selectedLocation,
  onSelect,
  onClose,
}: LocationPickerProps) {
  const [customLocation, setCustomLocation] = useState('');

  const handleSelectLocation = (loc: string) => {
    onSelect(loc);
    onClose();
  };

  const handleAddCustomLocation = () => {
    if (customLocation.trim()) {
      onSelect(customLocation.trim());
      setCustomLocation('');
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.content} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>Select Location</Text>
          <ScrollView style={styles.locationList}>
            {DEFAULT_LOCATIONS.map((loc, index) => (
              <Pressable
                key={index}
                style={[
                  styles.locationOption,
                  selectedLocation === loc && styles.locationOptionSelected,
                ]}
                onPress={() => handleSelectLocation(loc)}
              >
                <Text
                  style={[
                    styles.locationOptionText,
                    selectedLocation === loc && styles.locationOptionTextSelected,
                  ]}
                >
                  {loc}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.customLocationSection}>
            <Text style={styles.customLocationLabel}>Or add custom:</Text>
            <View style={styles.customLocationRow}>
              <TextInput
                style={styles.customLocationInput}
                value={customLocation}
                onChangeText={setCustomLocation}
                placeholder="Enter location name"
                autoCapitalize="words"
              />
              <Pressable
                style={styles.customLocationButton}
                onPress={handleAddCustomLocation}
              >
                <Text style={styles.customLocationButtonText}>Add</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  locationList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  locationOption: {
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  locationOptionSelected: {
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
  },
  locationOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  locationOptionTextSelected: {
    color: '#1e40af',
    fontWeight: '600',
  },
  customLocationSection: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  customLocationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
  },
  customLocationRow: {
    flexDirection: 'row',
    gap: 8,
  },
  customLocationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#111827',
  },
  customLocationButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
  },
  customLocationButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

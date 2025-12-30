import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { itemService, MasterItem } from '@/services/item.service';

interface ItemSearchModalProps {
  visible: boolean;
  warehouseCode: string;
  onItemFound: (item: MasterItem) => void;
  onCancel: () => void;
}

export default function ItemSearchModal({
  visible,
  warehouseCode,
  onItemFound,
  onCancel,
}: ItemSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    const trimmedQuery = searchQuery.trim().toUpperCase();
    
    if (!trimmedQuery) {
      Alert.alert('Error', 'Please enter an item code');
      return;
    }

    setIsSearching(true);
    
    try {
      // Search by item code
      const item = await itemService.getItemByCode(trimmedQuery, warehouseCode);
      
      if (!item) {
        Alert.alert('Item Not Found', `No item found with code: ${trimmedQuery}`);
        return;
      }

      // Reset state and pass item to parent
      setSearchQuery('');
      onItemFound(item);
    } catch (error) {
      console.error('Error searching for item:', error);
      Alert.alert('Error', 'Failed to search for item');
    } finally {
      setIsSearching(false);
    }
  };

  const handleCancel = () => {
    setSearchQuery('');
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Search for Item</Text>
            <Pressable onPress={handleCancel}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>
          
          <View style={styles.searchSection}>
            <Text style={styles.label}>Item Code</Text>
            <TextInput
              style={styles.input}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Enter item code..."
              autoCapitalize="characters"
              autoFocus
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              editable={!isSearching}
            />
            <Text style={styles.hint}>
              Enter the exact item code to search
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleCancel}
              disabled={isSearching}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable 
              style={[styles.button, styles.searchButton]} 
              onPress={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.searchText}>Search</Text>
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
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    fontSize: 28,
    color: '#6b7280',
    fontWeight: '300',
  },
  searchSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#3b82f6',
  },
  searchText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

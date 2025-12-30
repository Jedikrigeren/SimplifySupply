import ActionButtons from '@/components/counting-session/ActionButtons';
import CountedItemCard from '@/components/counting-session/CountedItemCard';
import ItemConfirmationModal from '@/components/counting-session/ItemConfirmationModal';
import ItemSearchModal from '@/components/counting-session/ItemSearchModal';
import ScannerModal from '@/components/counting-session/ScannerModal';
import SessionHeader from '@/components/counting-session/SessionHeader';
import SubmitDialog from '@/components/counting-session/SubmitDialog';
import { useCountingSession } from '@/context/CountingSessionContext';
import { itemService, MasterItem } from '@/services/item.service';
import { useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

export default function ActiveSessionScreen() {
  const router = useRouter();
  const {
    currentSession,
    isLoading,
    pauseSession,
    resumeSession,
    submitSession,
    addItem,
    updateItem,
    removeItem,
  } = useCountingSession();

  const [itemCode, setItemCode] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [uom, setUom] = useState('EA');
  const [location, setLocation] = useState('');
  const [countedBy, setCountedBy] = useState('');
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showItemSearch, setShowItemSearch] = useState(false);
  const [showItemConfirmation, setShowItemConfirmation] = useState(false);
  const [scannedItem, setScannedItem] = useState<MasterItem | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string>('');
  const [permission, requestPermission] = useCameraPermissions();

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No active session</Text>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }



  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan barcodes');
        return;
      }
    }
    setShowScanner(true);
  };

  const handleBarcodeScanned = async ({ data }: { type: string; data: string }) => {
    setShowScanner(false);
    
    try {
      const item = await itemService.getItemByBarcode(data, currentSession?.warehouse_code);
      
      if (!item) {
        Alert.alert('Item Not Found', `No item found with barcode: ${data}`);
        return;
      }

      // Find the barcode entry that matches what was scanned
      const barcodeEntry = item.barCodeCollection.find(bc => bc.barCode === data);
      
      setScannedBarcode(data);
      setScannedItem(item);
      setItemCode(item.itemCode);
      // Use the UOM from the barcode, or fall back to inventory UOM
      setUom(barcodeEntry?.uomType || item.inventoryUoM);
      setQuantity('1');
      setShowItemConfirmation(true);
    } catch (error) {
      console.error('Error fetching item:', error);
      Alert.alert('Error', 'Failed to fetch item details');
    }
  };

  const handleItemFound = (item: MasterItem) => {
    // Close search modal
    setShowItemSearch(false);
    
    // Set up item for confirmation - no barcode since it's manual entry
    setScannedBarcode('');
    setScannedItem(item);
    setItemCode(item.itemCode);
    // Default to inventory UOM, user will select from available UOMs
    setUom(item.inventoryUoM);
    setQuantity('1');
    setShowItemConfirmation(true);
  };

  const handleConfirmItem = async () => {
    if (!scannedItem) return;

    try {
      await addItem(scannedItem.itemCode, parseFloat(quantity), uom, location.trim() || undefined);
      setShowItemConfirmation(false);
      setScannedItem(null);
      setItemCode('');
      setQuantity('1');
      setLocation('');
      Alert.alert('Success', 'Item added to session');
    } catch (err) {
      Alert.alert('Error', 'Failed to add item');
    }
  };

  const handleCancelConfirmation = () => {
    setShowItemConfirmation(false);
    setScannedItem(null);
    setItemCode('');
    setQuantity('1');
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeItem(itemId);
          } catch (err) {
            Alert.alert('Error', 'Failed to remove item');
          }
        },
      },
    ]);
  };

  const handlePauseResume = async () => {
    try {
      if (currentSession.status === 'active') {
        await pauseSession();
      } else {
        await resumeSession();
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to update session status');
    }
  };

  const handleSubmit = async () => {
    if (!countedBy.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      await submitSession(countedBy.trim());
      Alert.alert('Success', 'Session submitted to SAP', [
        {
          text: 'OK',
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', 'Failed to submit session');
    }
  };



  return (
    <View style={styles.container}>
      <SessionHeader 
        warehouseCode={currentSession.warehouse_code} 
        status={currentSession.status} 
      />

      {currentSession.status === 'active' && (
        <ActionButtons
          onScanPress={handleOpenScanner}
          onManualPress={() => setShowItemSearch(true)}
        />
      )}

      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>
            Counted Items ({currentSession.items?.length || 0})
          </Text>
          {currentSession.items && currentSession.items.length > 0 ? (
            currentSession.items.map((item) => (
              <CountedItemCard
                key={item.id}
                item={item}
                onRemove={handleRemoveItem}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items counted yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, styles.pauseButton]}
          onPress={handlePauseResume}
          disabled={isLoading}
        >
          <Text style={styles.actionButtonText}>
            {currentSession.status === 'active' ? 'Pause' : 'Resume'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.submitButton]}
          onPress={() => setShowSubmitDialog(true)}
          disabled={isLoading || !currentSession.items || currentSession.items.length === 0}
        >
          <Text style={styles.actionButtonText}>Submit</Text>
        </Pressable>
      </View>

      <ScannerModal
        visible={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <ItemSearchModal
        visible={showItemSearch}
        warehouseCode={currentSession.warehouse_code}
        onItemFound={handleItemFound}
        onCancel={() => setShowItemSearch(false)}
      />

      <ItemConfirmationModal
        visible={showItemConfirmation}
        item={scannedItem}
        scannedBarcode={scannedBarcode}
        quantity={quantity}
        uom={uom}
        location={location}
        isLoading={isLoading}
        onQuantityChange={setQuantity}
        onUomChange={setUom}
        onLocationChange={setLocation}
        onConfirm={handleConfirmItem}
        onCancel={handleCancelConfirmation}
      />

      <SubmitDialog
        visible={showSubmitDialog}
        itemCount={currentSession.items?.length || 0}
        countedBy={countedBy}
        isLoading={isLoading}
        onCountedByChange={setCountedBy}
        onConfirm={handleSubmit}
        onCancel={() => setShowSubmitDialog(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: 20,
  },
  itemsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  submitButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

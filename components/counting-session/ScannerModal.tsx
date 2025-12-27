import { CameraView } from 'expo-camera';
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface ScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onBarcodeScanned: (data: { type: string; data: string }) => void;
}

export default function ScannerModal({ visible, onClose, onBarcodeScanned }: ScannerModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={onBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'],
          }}
        />
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.title}>Scan Barcode</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.frame} />
          <Text style={styles.hint}>Position barcode within the frame</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  frame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  hint: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 50,
  },
});

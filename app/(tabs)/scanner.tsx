import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScannerScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedData, setScannedData] = useState<string>('');

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.message}>
          We need your permission to use the camera to scan barcodes
        </ThemedText>
        <Button onPress={requestPermission} title="Grant Permission" />
      </ThemedView>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  function handleBarcodeScanned({ type, data }: { type: string; data: string }) {
    setScannedData(data);
    Alert.alert(
      'Barcode Scanned!',
      `Type: ${type}\nData: ${data}`,
      [
        {
          text: 'Scan Again',
          onPress: () => setScannedData(''),
        },
        {
          text: 'OK',
          style: 'cancel',
        },
      ]
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.title}>
        Barcode Scanner
      </ThemedText>
      
      {scannedData ? (
        <ThemedView style={styles.resultContainer}>
          <ThemedText type="subtitle">Last Scanned:</ThemedText>
          <ThemedText style={styles.scannedText}>{scannedData}</ThemedText>
          <Button title="Scan Again" onPress={() => setScannedData('')} />
        </ThemedView>
      ) : (
        <>
          <CameraView
            style={styles.camera}
            facing={facing}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'ean13',
                'ean8',
                'code128',
                'code39',
                'code93',
                'upc_a',
                'upc_e',
                'pdf417',
                'aztec',
                'datamatrix',
                'itf14',
              ],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          >
            <View style={styles.overlay}>
              <View style={styles.scanArea} />
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
                <Text style={styles.buttonText}>Flip Camera</Text>
              </TouchableOpacity>
            </View>
          </CameraView>
          <ThemedText style={styles.instruction}>
            Position the barcode within the frame to scan
          </ThemedText>
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginVertical: 16,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  camera: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  button: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  instruction: {
    textAlign: 'center',
    marginVertical: 12,
    paddingHorizontal: 20,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scannedText: {
    fontSize: 18,
    marginVertical: 16,
    textAlign: 'center',
  },
});

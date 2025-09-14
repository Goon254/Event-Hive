// app/screens/scan.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Vibration, Platform } from 'react-native';
import { Camera, CameraView, BarcodeScanningResult } from 'expo-camera';
import { useRouter } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import eventService from '../services/eventServices';
import NetInfo from '@react-native-community/netinfo';
import ScreenWrapper from '../components/common/ScreenWrapper';

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [scanAttempts, setScanAttempts] = useState(0);
  const lastScannedRef = useRef<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    getCameraPermissions();

    // Check network status
    const checkNetworkStatus = async () => {
      const netInfo = await NetInfo.fetch();
      setIsOffline(!netInfo.isConnected);
    };
    
    checkNetworkStatus();

    // Subscribe to network status updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleBarcodeScanned = async (scanResult: BarcodeScanningResult) => {
    const { type, data } = scanResult;
    
    // Prevent duplicate scans of the same code in quick succession
    if (lastScannedRef.current === data && Date.now() - scanAttempts < 2000) {
      return;
    }
    
    lastScannedRef.current = data;
    setScanAttempts(Date.now());
    setScanned(true);
    setProcessing(true);
    
    // Provide haptic feedback on scan
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate(100);
    }
    
    try {
      // Process the QR code using our enhanced service
      const { success, message } = await eventService.processQRCheckIn(data, user?.id || 'unknown');
      
      setProcessing(false);
      
      if (success) {
        Alert.alert(
          "Check-in Successful",
          message,
          [{ text: "OK", onPress: () => setScanned(false) }]
        );
      } else {
        Alert.alert(
          "Check-in Failed",
          message,
          [{ text: "Try Again", onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      setProcessing(false);
      
      Alert.alert(
        "Error",
        "There was a problem processing this check-in.",
        [{ text: "Try Again", onPress: () => setScanned(false) }]
      );
    }
  };

  const toggleTorch = () => {
    setTorchOn(!torchOn);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.text}>No access to camera</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.buttonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Create header right content with torch toggle
  const headerRightContent = (
    <TouchableOpacity style={styles.headerButton} onPress={toggleTorch}>
      <Ionicons name={torchOn ? "flash" : "flash-outline"} size={24} color="#FFF" />
    </TouchableOpacity>
  );

  return (
    <ScreenWrapper
      backgroundColor="#000000"
      statusBarStyle="light-content"
      header={{
        title: "Scan Check-in QR Code",
        subtitle: isOffline ? "Offline Mode" : undefined,
        rightContent: headerRightContent,
        gradientColors: ['#2563EB', '#4F46E5']
      }}
      contentContainerStyle={{ flex: 1, paddingTop: 0 }}
    >
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.scanArea}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              
              {processing && (
                <View style={styles.scanArea}>
                  <ActivityIndicator size="large" color="#FFF" />
                  <Text style={styles.instructions}>Processing...</Text>
                </View>
              )}
            </View>
            
            <View style={styles.footer}>
              <Text style={styles.instructions}>
                Position the QR code within the frame to scan
              </Text>
              {scanned && !processing && (
                <TouchableOpacity
                  style={styles.scanAgainButton}
                  onPress={() => setScanned(false)}
                >
                  <Text style={styles.scanAgainButtonText}>Scan Again</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </CameraView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFF',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFF',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFF',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFF',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  instructions: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  scanAgainButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  scanAgainButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  text: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
// app/screens/QRScannerScreen.tsx
import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Alert, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Camera } from 'expo-camera';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createShadow } from '../utils/platformUtils';
import eventService from '../services/eventServices';

export default function QRScannerScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const { eventId } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    getCameraPermissions();
    
    // Set status bar to light content for better visibility on dark scanner screen
    StatusBar.setBarStyle('light-content');
    
    // Reset status bar on cleanup
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    
    try {
      // Parse the QR code data
      if (data.startsWith('scangoapp://event-checkin/')) {
        const parts = data.split('/');
        const scannedEventId = parts[3];
        const attendeeId = parts[4];
        
        // Verify this is for the current event
        if (scannedEventId !== eventId) {
          Alert.alert("Invalid QR Code", "This QR code is for a different event.");
          return;
        }
        
        // Process the check-in
        const success = await eventService.processQRCheckIn(eventId.toString(), attendeeId);
        
        if (success) {
          Alert.alert(
            "Check-in Successful", 
            "Attendee has been checked in.",
            [{ text: "OK", onPress: () => setScanned(false) }]
          );
        } else {
          Alert.alert(
            "Check-in Failed", 
            "This attendee may already be checked in or is not registered for this event.",
            [{ text: "Try Again", onPress: () => setScanned(false) }]
          );
        }
      } else {
        Alert.alert(
          "Invalid QR Code", 
          "This doesn't appear to be a valid ScanGo QR code.",
          [{ text: "Try Again", onPress: () => setScanned(false) }]
        );
      }
    } catch (error) {
      console.error('Error processing QR code:', error);
      Alert.alert(
        "Error", 
        "There was a problem processing this check-in. Please try again.",
        [{ text: "OK", onPress: () => setScanned(false) }]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>Requesting camera permission...</Text>
      </View>
    );
  }
  
  if (hasPermission === false) {
    return (
      <View style={styles.messageContainer}>
        <Text style={styles.messageText}>No access to camera</Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={() => router.back()}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeScannerSettings={{
          barCodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.unfocusedContainer}></View>
          <View style={styles.middleContainer}>
            <View style={styles.unfocusedContainer}></View>
            <View style={styles.focusedContainer}>
              {/* Scanner frame */}
              <View style={styles.cornerTopLeft} />
              <View style={styles.cornerTopRight} />
              <View style={styles.cornerBottomLeft} />
              <View style={styles.cornerBottomRight} />
            </View>
            <View style={styles.unfocusedContainer}></View>
          </View>
          <View style={styles.unfocusedContainer}>
            {scanned && (
              <TouchableOpacity 
                style={styles.scanAgainButton}
                onPress={() => setScanned(false)}
              >
                <Text style={styles.scanAgainText}>Tap to Scan Again</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Camera>
    </View>
  );
}

// Platform-specific button shadow
const buttonShadow = createShadow(3);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background ensures no white flashing during camera init
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 20,
    // Add safe area padding for iOS notches and Android status bar
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  messageText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    ...buttonShadow,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  unfocusedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  middleContainer: {
    flexDirection: 'row',
    flex: 4,
  },
  focusedContainer: {
    flex: 6,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
    // Add zIndex for iOS to ensure visibility
    ...(Platform.OS === 'ios' ? { zIndex: 1 } : {}),
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
    ...(Platform.OS === 'ios' ? { zIndex: 1 } : {}),
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: 'white',
    ...(Platform.OS === 'ios' ? { zIndex: 1 } : {}),
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: 'white',
    ...(Platform.OS === 'ios' ? { zIndex: 1 } : {}),
  },
  scanAgainButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: 16,
    ...buttonShadow,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: Platform.OS === 'ios' ? 30 : 20, // Extra padding for iOS home indicator
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
  }
});
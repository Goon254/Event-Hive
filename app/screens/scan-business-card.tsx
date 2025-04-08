// app/screens/scan-business-card.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Easing
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const PREVIEW_SIZE = width * 0.8;

export default function BusinessCardScannerScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [recognizedData, setRecognizedData] = useState<any | null>(null);
  const cameraRef = useRef<typeof Camera>(null);
  
  // Animation values
  const scanAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);
  
  useEffect(() => {
    if (scanning && !scanned) {
      // Create scanning animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 1500,
            easing: Easing.linear,
            useNativeDriver: true
          })
        ])
      ).start();
    } else {
      // Stop animation
      scanAnimation.setValue(0);
      scanAnimation.stopAnimation();
    }
    
    return () => {
      Animated.timing(scanAnimation).stop();
    };
  }, [scanning, scanned]);
  
  const handleCaptureImage = async () => {
    if (cameraRef.current && !scanning) {
      try {
        setScanning(true);
        setTimeout(async () => {
          const photo = await cameraRef.current!.takePictureAsync({
            quality: 0.8,
          });
          setCapturedImage(photo.uri);
          setScanning(false);
          setScanned(true);
          await processBusinessCard(photo.uri);
        }, 1000); // Wait 1 second while showing scanning animation
      } catch (err) {
        console.error('Error taking picture:', err);
        setScanning(false);
        Alert.alert('Error', 'Failed to take photo. Please try again.');
      }
    }
  };
  
  const processBusinessCard = async (imageUri: string) => {
    try {
      setProcessing(true);
      
      // In a real app, you would use OCR to extract text from the image
      // and then parse it to find contact information
      
      // Mock processing for demonstration purposes
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data
      const mockData = {
        name: 'Michael Anderson',
        role: 'Senior Marketing Director',
        company: 'Innovate Solutions Inc.',
        phone: '+1 (555) 123-4567',
        email: 'michael.anderson@innovatesolutions.com',
        website: 'www.innovatesolutions.com',
        address: '123 Business Avenue, Suite 400, San Francisco, CA 94107'
      };
      
      setRecognizedData(mockData);
      setProcessing(false);
      
    } catch (error) {
      console.error('Error processing business card:', error);
      setProcessing(false);
      Alert.alert('Error', 'Failed to process business card. Please try again.');
    }
  };
  
  const handleSelectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
        setScanned(true);
        await processBusinessCard(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };
  
  const handleSave = () => {
    if (recognizedData) {
      Alert.alert(
        'Success',
        'Contact information saved successfully!',
        [
          {
            text: 'View Connection',
            onPress: () => router.back(),
          }
        ]
      );
    }
  };
  
  const handleRetry = () => {
    setCapturedImage(null);
    setScanned(false);
    setRecognizedData(null);
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const toggleFlash = () => {
    setFlashOn(!flashOn);
  };
  
  // Render scanning overlay with animation
  const renderScanningOverlay = () => {
    const translateY = scanAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, PREVIEW_SIZE]
    });
    
    return (
      <View style={styles.scanOverlay}>
        <Animated.View
          style={[
            styles.scanLine,
            {
              transform: [{ translateY }]
            }
          ]}
        />
        
        <View style={styles.cornerTL} />
        <View style={styles.cornerTR} />
        <View style={styles.cornerBL} />
        <View style={styles.cornerBR} />
      </View>
    );
  };
  
  // Render camera view
  const renderCamera = () => (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        type={Camera.Constants.Type.back}
        flashMode={flashOn ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
      >
        <View style={styles.preview}>
          {scanning && renderScanningOverlay()}
        </View>
      </CameraView>
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={styles.controlButton} onPress={handleSelectFromGallery}>
          <MaterialIcons name="photo-library" size={28} color="#FFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.captureButton}
          onPress={handleCaptureImage}
          disabled={scanning}
        >
          <View style={styles.captureButtonInner}>
            {scanning ? (
              <ActivityIndicator color="#007AFF" size="small" />
            ) : null}
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
          <MaterialIcons
            name={flashOn ? "flash-on" : "flash-off"}
            size={28}
            color="#FFF"
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>
          Position business card within the frame
        </Text>
      </View>
    </View>
  );
  
  // Render results view
  const renderResults = () => (
    <View style={styles.resultsContainer}>
      {capturedImage && (
        <Image
          source={{ uri: capturedImage }}
          style={styles.capturedImage}
          resizeMode="contain"
        />
      )}
      
      {processing ? (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.processingText}>Processing business card...</Text>
        </View>
      ) : recognizedData ? (
        <View style={styles.contactInfoContainer}>
          <Text style={styles.contactName}>{recognizedData.name}</Text>
          <Text style={styles.contactRole}>{recognizedData.role}</Text>
          <Text style={styles.contactCompany}>{recognizedData.company}</Text>
          
          <View style={styles.contactDetailsDivider} />
          
          <View style={styles.contactDetailsRow}>
            <MaterialIcons name="phone" size={20} color="#6B7280" />
            <Text style={styles.contactDetails}>{recognizedData.phone}</Text>
          </View>
          
          <View style={styles.contactDetailsRow}>
            <MaterialIcons name="email" size={20} color="#6B7280" />
            <Text style={styles.contactDetails}>{recognizedData.email}</Text>
          </View>
          
          <View style={styles.contactDetailsRow}>
            <MaterialIcons name="language" size={20} color="#6B7280" />
            <Text style={styles.contactDetails}>{recognizedData.website}</Text>
          </View>
          
          <View style={styles.contactDetailsRow}>
            <MaterialIcons name="location-on" size={20} color="#6B7280" />
            <Text style={styles.contactDetails}>{recognizedData.address}</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
          >
            <LinearGradient
              colors={['#007AFF', '#4F46E5']}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.saveButtonText}>Save Contact</Text>
              <MaterialIcons name="check" size={20} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Scan Another Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#EF4444" />
          <Text style={styles.errorTitle}>Scan Failed</Text>
          <Text style={styles.errorText}>
            Unable to process the business card. Please try again with a clearer image.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRetry}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
  
  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }
  
  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <MaterialIcons name="no-photography" size={60} color="#EF4444" />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionText}>
          Please grant camera access to scan business cards.
        </Text>
        <TouchableOpacity 
          style={styles.permissionButton}
          onPress={handleBack}
        >
          <Text style={styles.permissionButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Business Card</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {scanned ? renderResults() : renderCamera()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  preview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanOverlay: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  scanLine: {
    height: 2,
    width: PREVIEW_SIZE,
    backgroundColor: '#007AFF',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
  },
  cornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
  },
  cornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
  },
  cornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
  },
  controlsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructions: {
    position: 'absolute',
    bottom: 120,
    width: '100%',
    alignItems: 'center',
  },
  instructionsText: {
    color: '#FFFFFF',
    fontSize: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  capturedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  contactInfoContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contactName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
  contactCompany: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 16,
  },
  contactDetailsDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  contactDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactDetails: {
    fontSize: 16,
    color: '#4B5563',
    marginLeft: 12,
    flex: 1,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: 'transparent',
    paddingVertical: 12,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Platform, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';

import { Event } from '../services/eventServices';
import googleMapsService from '../services/googleMapsService';
import NearbyEventsMap from '../components/maps/NearbyEventsMap';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { createShadow } from '../utils/platformUtils';

export default function NearbyEventsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [searchRadius, setSearchRadius] = useState<number>(10000); // 10km default
  
  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Request location permissions
        const hasPermission = await googleMapsService.requestLocationPermissions(true, 'balanced');
        
        if (!hasPermission) {
          setPermissionDenied(true);
          setIsLoading(false);
          return;
        }
        
        // Fetch nearby events
        await fetchNearbyEvents();
      } catch (error) {
        console.error('Error initializing nearby events screen:', error);
        Alert.alert('Error', 'Failed to initialize. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    
    // Set status bar for better visibility
    setStatusBarStyle('dark');
    
    return () => {
      // Reset status bar when leaving screen
      setStatusBarStyle('auto');
    };
  }, []);
  
  // Fetch nearby events
  const fetchNearbyEvents = async () => {
    try {
      setIsLoading(true);
      
      // Get nearby events from service
      const nearbyEvents = await googleMapsService.getNearbyEvents(searchRadius);
      
      setEvents(nearbyEvents);
    } catch (error) {
      console.error('Error fetching nearby events:', error);
      Alert.alert('Error', 'Failed to fetch nearby events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle event selection
  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
  };
  
  // Handle view event details
  const handleViewEventDetails = () => {
    if (selectedEvent) {
      router.push(`/screens/eventdetails?id=${selectedEvent.id}`);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={styles.loadingText}>Finding events near you...</Text>
      </View>
    );
  }
  
  // Render permission denied state
  if (permissionDenied) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialIcons name="location-off" size={64} color="#FF6B6B" />
        <Text style={styles.permissionTitle}>Location Access Required</Text>
        <Text style={styles.permissionText}>
          We need your location to find events near you. Please enable location services to use this feature.
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => googleMapsService.openLocationSettings()}
        >
          <Text style={styles.permissionButtonText}>Enable Location</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top : 0 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Events Near You</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchNearbyEvents}
        >
          <Ionicons name="refresh" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>
      
      {/* Map */}
      <NearbyEventsMap
        initialEvents={events}
        onEventSelect={handleEventSelect}
        showList={true}
        maxDistance={searchRadius / 1000} // Convert to km
        style={styles.map}
      />
      
      {/* Selected Event Actions */}
      {selectedEvent && (
        <View style={[
          styles.selectedEventActions,
          { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16 }
        ]}>
          <TouchableOpacity
            style={styles.viewDetailsButton}
            onPress={handleViewEventDetails}
          >
            <Text style={styles.viewDetailsButtonText}>View Event Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
const cardShadow = createShadow(4);
const buttonShadow = createShadow(4);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 24,
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    ...buttonShadow,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    ...cardShadow,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  selectedEventActions: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...cardShadow,
  },
  viewDetailsButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    ...buttonShadow,
  },
  viewDetailsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});
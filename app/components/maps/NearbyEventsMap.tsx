import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Event } from '../../services/eventServices';
import googleMapsService, { Region } from '../../services/googleMapsService';
import CustomMapView from './MapView';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { formatDate, formatTime } from '../../utils/dateUtils';

interface NearbyEventsMapProps {
  initialEvents?: Event[];
  onEventSelect?: (event: Event) => void;
  showList?: boolean;
  maxDistance?: number; // in kilometers
  style?: any;
}

const NearbyEventsMap: React.FC<NearbyEventsMapProps> = ({
  initialEvents = [],
  onEventSelect,
  showList = true,
  maxDistance = 10, // 10km default
  style,
}) => {
  const colorScheme = useColorScheme();
  const router = useRouter();
  
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [searchRadius, setSearchRadius] = useState<number>(maxDistance * 1000); // Convert to meters
  
  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Request location permissions
        const hasPermission = await googleMapsService.requestLocationPermissions();
        
        if (!hasPermission) {
          setPermissionDenied(true);
          setIsLoading(false);
          return;
        }
        
        // Get user location
        const location = await googleMapsService.getCurrentLocation();
        
        if (location) {
          const userCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          setUserLocation(userCoords);
          
          // Set initial region
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          });
          
          // If no initial events, fetch nearby events
          if (initialEvents.length === 0) {
            await fetchNearbyEvents(userCoords);
          } else {
            // Filter initial events by distance
            filterEventsByDistance(initialEvents, userCoords);
          }
        } else {
          // Use default region
          const defaultRegion = await googleMapsService.getDefaultRegion();
          setRegion(defaultRegion);
          
          // Just use initial events if no location
          setFilteredEvents(initialEvents);
        }
      } catch (error) {
        console.error('Error initializing nearby events map:', error);
        Alert.alert('Error', 'Failed to initialize map. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
  }, [initialEvents, maxDistance]);
  
  // Fetch nearby events
  const fetchNearbyEvents = async (location: { latitude: number; longitude: number } | null = null) => {
    try {
      setIsLoading(true);
      
      // Use provided location or current user location
      const userCoords = location || userLocation;
      
      if (!userCoords) {
        throw new Error('Location not available');
      }
      
      // Get nearby events from service
      const nearbyEvents = await googleMapsService.getNearbyEvents(searchRadius);
      
      setEvents(nearbyEvents);
      filterEventsByDistance(nearbyEvents, userCoords);
    } catch (error) {
      console.error('Error fetching nearby events:', error);
      Alert.alert('Error', 'Failed to fetch nearby events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter events by distance from user
  const filterEventsByDistance = (eventList: Event[], location: { latitude: number; longitude: number }) => {
    try {
      // Filter events with location data and calculate distance
      const eventsWithDistance = eventList
        .filter((event) => {
          // Check if event has location details with coordinates
          return (
            event.locationDetails &&
            (event.locationDetails as any).latitude !== undefined &&
            (event.locationDetails as any).longitude !== undefined
          );
        })
        .map((event) => {
          // Calculate distance between user and event
          const distance = googleMapsService.calculateDistance(
            location.latitude,
            location.longitude,
            (event.locationDetails as any).latitude!,
            (event.locationDetails as any).longitude!
          );
          
          return {
            ...event,
            distance,
          };
        })
        .filter((event) => event.distance <= searchRadius) // Filter events within radius
        .sort((a, b) => (a.distance as number) - (b.distance as number)); // Sort by distance
      
      setFilteredEvents(eventsWithDistance);
    } catch (error) {
      console.error('Error filtering events by distance:', error);
    }
  };
  
  // Handle user location change
  const handleUserLocationChange = useCallback(
    (location: { latitude: number; longitude: number }) => {
      setUserLocation(location);
      
      // Update filtered events based on new location
      if (events.length > 0) {
        filterEventsByDistance(events, location);
      }
    },
    [events, searchRadius]
  );
  
  // Handle event selection on map
  const handleEventSelect = useCallback(
    (event: Event) => {
      setSelectedEvent(event);
      
      if (onEventSelect) {
        onEventSelect(event);
      }
    },
    [onEventSelect]
  );
  
  // Handle view event details
  const handleViewEventDetails = useCallback(
    (event: Event) => {
      router.push(`/screens/eventdetails?id=${event.id}`);
    },
    [router]
  );
  
  // Handle map press (deselect event)
  const handleMapPress = useCallback(() => {
    setSelectedEvent(null);
  }, []);
  
  // Change search radius
  const changeSearchRadius = useCallback(
    (radius: number) => {
      setSearchRadius(radius);
      
      if (userLocation) {
        filterEventsByDistance(events, userLocation);
      }
    },
    [events, userLocation]
  );
  
  // Refresh events
  const refreshEvents = useCallback(async () => {
    if (userLocation) {
      await fetchNearbyEvents(userLocation);
    }
  }, [userLocation, searchRadius]);
  
  // Render event item in list
  const renderEventItem = useCallback(
    ({ item }: { item: Event & { distance?: number } }) => {
      const isSelected = selectedEvent && selectedEvent.id === item.id;
      
      return (
        <TouchableOpacity
          style={[
            styles.eventItem,
            isSelected && styles.selectedEventItem,
          ]}
          onPress={() => handleEventSelect(item)}
          activeOpacity={0.7}
        >
          <View style={styles.eventItemContent}>
            <Text style={styles.eventTitle} numberOfLines={1}>
              {item.title}
            </Text>
            
            <View style={styles.eventDetails}>
              <View style={styles.eventDetailRow}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.eventDetailText}>
                  {formatDate(item.date)} at {formatTime(item.time)}
                </Text>
              </View>
              
              <View style={styles.eventDetailRow}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.eventDetailText} numberOfLines={1}>
                  {item.location || 'No location provided'}
                </Text>
              </View>
              
              {item.distance !== undefined && (
                <View style={styles.eventDetailRow}>
                  <MaterialIcons name="directions" size={14} color="#6B7280" />
                  <Text style={styles.eventDetailText}>
                    {(item.distance / 1000).toFixed(1)} km away
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewEventDetails(item)}
          >
            <Text style={styles.viewButtonText}>View</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    },
    [selectedEvent, handleEventSelect, handleViewEventDetails]
  );
  
  // Render loading state
  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={styles.loadingText}>Finding events near you...</Text>
      </View>
    );
  }
  
  // Render permission denied state
  if (permissionDenied) {
    return (
      <View style={[styles.container, style]}>
        <MaterialIcons name="location-off" size={48} color="#FF6B6B" />
        <Text style={styles.permissionText}>Location access denied</Text>
        <Text style={styles.permissionSubtext}>
          We need your location to find events near you
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
    <View style={[styles.container, style]}>
      {/* Map View */}
      <View style={styles.mapContainer}>
        {region && (
          <CustomMapView
            initialRegion={region}
            events={filteredEvents}
            selectedEvent={selectedEvent || undefined}
            onEventSelect={handleEventSelect}
            onMapPress={handleMapPress}
            onUserLocationChange={handleUserLocationChange}
            showUserLocation={true}
            showsMyLocationButton={true}
            mapPadding={{ top: 0, right: 0, bottom: showList ? 200 : 0, left: 0 }}
          />
        )}
        
        {/* Radius Controls */}
        <View style={styles.radiusControls}>
          <Text style={styles.radiusText}>
            Search Radius: {(searchRadius / 1000).toFixed(1)} km
          </Text>
          <View style={styles.radiusButtons}>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() => changeSearchRadius(Math.max(1000, searchRadius - 1000))}
              disabled={searchRadius <= 1000}
            >
              <Ionicons
                name="remove"
                size={20}
                color={searchRadius <= 1000 ? '#D1D5DB' : Colors[colorScheme ?? 'light'].text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.radiusButton}
              onPress={() => changeSearchRadius(Math.min(50000, searchRadius + 1000))}
              disabled={searchRadius >= 50000}
            >
              <Ionicons
                name="add"
                size={20}
                color={searchRadius >= 50000 ? '#D1D5DB' : Colors[colorScheme ?? 'light'].text}
              />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Refresh Button */}
        <TouchableOpacity style={styles.refreshButton} onPress={refreshEvents}>
          <Ionicons name="refresh" size={24} color={Colors[colorScheme ?? 'light'].text} />
        </TouchableOpacity>
      </View>
      
      {/* Events List */}
      {showList && (
        <View style={styles.listContainer}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              Nearby Events ({filteredEvents.length})
            </Text>
            {selectedEvent && (
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => handleViewEventDetails(selectedEvent)}
              >
                <Text style={styles.viewDetailsButtonText}>View Details</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {filteredEvents.length > 0 ? (
            <FlatList
              data={filteredEvents}
              renderItem={renderEventItem}
              keyExtractor={(item) => item.id}
              horizontal={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="event-busy" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No events found nearby</Text>
              <Text style={styles.emptySubtext}>
                Try increasing the search radius or check back later
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  mapContainer: {
    flex: 1,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  permissionText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#4B5563',
  },
  permissionSubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginHorizontal: 32,
    marginTop: 8,
    color: '#6B7280',
  },
  permissionButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  radiusControls: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  radiusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  radiusButtons: {
    flexDirection: 'row',
  },
  radiusButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  refreshButton: {
    position: 'absolute',
    top: 76,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  listContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  viewDetailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  eventItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedEventItem: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF5FF',
  },
  eventItemContent: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  eventDetails: {
    gap: 4,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventDetailText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B5563',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
  },
});

export default NearbyEventsMap;
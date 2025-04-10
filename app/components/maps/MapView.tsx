import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region, Polyline } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import googleMapsService, { DirectionsResult } from '../../services/googleMapsService';
import { Event } from '../../services/eventServices';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

interface CustomMapViewProps {
  initialRegion?: Region;
  events?: Event[];
  selectedEvent?: Event;
  showUserLocation?: boolean;
  showDirections?: boolean;
  destination?: { latitude: number; longitude: number } | null;
  onEventSelect?: (event: Event) => void;
  onMapPress?: (e: any) => void;
  onUserLocationChange?: (coords: { latitude: number; longitude: number }) => void;
  style?: any;
  mapStyle?: any;
  zoomEnabled?: boolean;
  scrollEnabled?: boolean;
  rotateEnabled?: boolean;
  showsCompass?: boolean;
  showsMyLocationButton?: boolean;
  loadingIndicator?: boolean;
  mapPadding?: { top: number; right: number; bottom: number; left: number };
}

const CustomMapView: React.FC<CustomMapViewProps> = ({
  initialRegion,
  events = [],
  selectedEvent,
  showUserLocation = true,
  showDirections = false,
  destination = null,
  onEventSelect,
  onMapPress,
  onUserLocationChange,
  style,
  mapStyle,
  zoomEnabled = true,
  scrollEnabled = true,
  rotateEnabled = true,
  showsCompass = true,
  showsMyLocationButton = true,
  loadingIndicator = true,
  mapPadding = { top: 0, right: 0, bottom: 0, left: 0 },
}) => {
  const colorScheme = useColorScheme();
  const mapRef = useRef<MapView | null>(null);
  const [region, setRegion] = useState<Region | undefined>(initialRegion);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [directions, setDirections] = useState<DirectionsResult | null>(null);
  const [directionsMode, setDirectionsMode] = useState<'driving' | 'walking' | 'bicycling' | 'transit'>('driving');

  // Initialize map with default region or user location
  useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        
        // If initialRegion is provided, use it
        if (initialRegion) {
          setRegion(initialRegion);
          setIsLoading(false);
          return;
        }
        
        // Otherwise, try to get user location
        const hasPermission = await googleMapsService.requestLocationPermissions(true, 'balanced');
        
        if (!hasPermission) {
          setPermissionDenied(true);
          // Use default region
          const defaultRegion = await googleMapsService.getDefaultRegion();
          setRegion(defaultRegion);
          setIsLoading(false);
          return;
        }
        
        // Get user location
        const location = await googleMapsService.getCurrentLocation();
        
        if (location) {
          const userRegion = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          };
          
          setRegion(userRegion);
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          
          if (onUserLocationChange) {
            onUserLocationChange({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        } else {
          // Use default region
          const defaultRegion = await googleMapsService.getDefaultRegion();
          setRegion(defaultRegion);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
        // Use default region
        const defaultRegion = await googleMapsService.getDefaultRegion();
        setRegion(defaultRegion);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeMap();
    
    // Start watching location if showUserLocation is true
    if (showUserLocation) {
      startWatchingLocation();
    }
    
    return () => {
      // Clean up location watcher
      googleMapsService.stopLocationUpdates(handleLocationUpdate);
    };
  }, [initialRegion, showUserLocation]);

  // Update directions when destination changes
  useEffect(() => {
    if (showDirections && destination && userLocation) {
      fetchDirections();
    } else {
      setDirections(null);
    }
  }, [destination, userLocation, showDirections, directionsMode]);

  // Fetch directions between user location and destination
  const fetchDirections = async () => {
    if (!userLocation || !destination) return;
    
    try {
      const result = await googleMapsService.getDirections(
        userLocation,
        destination,
        directionsMode
      );
      
      setDirections(result);
    } catch (error) {
      console.error('Error fetching directions:', error);
    }
  };

  // Start watching user location
  const startWatchingLocation = async () => {
    const hasPermission = await googleMapsService.requestLocationPermissions(false);
    
    if (!hasPermission) {
      setPermissionDenied(true);
      return;
    }
    
    googleMapsService.startLocationUpdates(handleLocationUpdate);
  };

  // Handle location updates
  const handleLocationUpdate = (location: Location.LocationObject) => {
    const newUserLocation = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };
    
    setUserLocation(newUserLocation);
    
    if (onUserLocationChange) {
      onUserLocationChange(newUserLocation);
    }
  };

  // Center map on user location
  const centerOnUserLocation = async () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
      });
    } else {
      // Try to get current location
      const location = await googleMapsService.getCurrentLocation(true);
      
      if (location && mapRef.current) {
        const newRegion = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
        
        mapRef.current.animateToRegion(newRegion);
        
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (onUserLocationChange) {
          onUserLocationChange({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      }
    }
  };

  // Center map on selected event
  const centerOnEvent = (event: Event) => {
    if (!event.locationDetails || !mapRef.current) return;
    
    // Check if event has location coordinates
    const latitude = (event.locationDetails as any).latitude;
    const longitude = (event.locationDetails as any).longitude;
    
    if (latitude === undefined || longitude === undefined) return;
    
    mapRef.current.animateToRegion({
      latitude,
      longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  // Handle map region change
  const handleRegionChange = (newRegion: Region) => {
    setRegion(newRegion);
  };

  // Toggle directions mode
  const toggleDirectionsMode = () => {
    const modes: Array<'driving' | 'walking' | 'bicycling' | 'transit'> = [
      'driving',
      'walking',
      'bicycling',
      'transit',
    ];
    
    const currentIndex = modes.indexOf(directionsMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    
    setDirectionsMode(modes[nextIndex]);
  };

  // Render loading indicator
  if (isLoading && loadingIndicator) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  // Render permission denied message
  if (permissionDenied && showUserLocation) {
    return (
      <View style={[styles.container, style]}>
        <MaterialIcons name="location-off" size={48} color="#FF6B6B" />
        <Text style={styles.permissionText}>Location permission denied</Text>
        <Text style={styles.permissionSubtext}>
          Enable location services to see your position on the map
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={() => googleMapsService.openLocationSettings()}
        >
          <Text style={styles.permissionButtonText}>Open Settings</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render map
  return (
    <View style={[styles.container, style]}>
      {region && (
        <MapView
          ref={mapRef}
          style={[styles.map, mapStyle]}
          provider={PROVIDER_GOOGLE}
          initialRegion={region}
          onRegionChangeComplete={handleRegionChange}
          showsUserLocation={showUserLocation}
          showsMyLocationButton={false}
          showsCompass={showsCompass}
          zoomEnabled={zoomEnabled}
          scrollEnabled={scrollEnabled}
          rotateEnabled={rotateEnabled}
          onPress={onMapPress}
          mapPadding={mapPadding}
        >
          {/* Render event markers */}
          {events.map((event) => {
            // Check if event has location coordinates
            const locationDetails = event.locationDetails as any;
            if (!locationDetails || locationDetails.latitude === undefined || locationDetails.longitude === undefined) {
              return null;
            }
            
            const isSelected = selectedEvent && selectedEvent.id === event.id;
            
            return (
              <Marker
                key={event.id}
                coordinate={{
                  latitude: locationDetails.latitude,
                  longitude: locationDetails.longitude,
                }}
                title={event.title}
                description={event.location}
                pinColor={isSelected ? '#FF6B6B' : '#3B82F6'}
                onPress={() => onEventSelect && onEventSelect(event)}
              >
                <Callout tooltip>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{event.title}</Text>
                    <Text style={styles.calloutText}>{event.location}</Text>
                  </View>
                </Callout>
              </Marker>
            );
          })}
          
          {/* Render destination marker */}
          {showDirections && destination && (
            <Marker
              coordinate={destination}
              pinColor="#FF6B6B"
              title="Destination"
            />
          )}
          
          {/* Render directions polyline */}
          {showDirections && directions && (
            <Polyline
              coordinates={decodePolyline(directions.polyline).map((point) => ({
                latitude: point[0],
                longitude: point[1],
              }))}
              strokeWidth={4}
              strokeColor="#3B82F6"
            />
          )}
        </MapView>
      )}
      
      {/* Map controls */}
      <View style={styles.controls}>
        {showsMyLocationButton && (
          <TouchableOpacity style={styles.controlButton} onPress={centerOnUserLocation}>
            <Ionicons
              name="locate"
              size={24}
              color={Colors[colorScheme ?? 'light'].text}
            />
          </TouchableOpacity>
        )}
        
        {showDirections && (
          <TouchableOpacity style={styles.controlButton} onPress={toggleDirectionsMode}>
            <MaterialIcons
              name={
                directionsMode === 'driving'
                  ? 'directions-car'
                  : directionsMode === 'walking'
                  ? 'directions-walk'
                  : directionsMode === 'bicycling'
                  ? 'directions-bike'
                  : 'directions-transit'
              }
              size={24}
              color={Colors[colorScheme ?? 'light'].text}
            />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Directions info */}
      {showDirections && directions && (
        <View style={styles.directionsInfo}>
          <Text style={styles.directionsDistance}>{directions.distance.text}</Text>
          <Text style={styles.directionsTime}>{directions.duration.text}</Text>
        </View>
      )}
    </View>
  );
};

// Helper function to decode Google's polyline format
function decodePolyline(encoded: string): number[][] {
  const poly: number[][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push([lat / 1e5, lng / 1e5]);
  }

  return poly;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
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
  controls: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'column',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
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
  callout: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    width: 200,
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
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1F2937',
  },
  calloutText: {
    fontSize: 14,
    color: '#6B7280',
  },
  directionsInfo: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  directionsDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  directionsTime: {
    fontSize: 16,
    color: '#6B7280',
  },
});

export default CustomMapView;
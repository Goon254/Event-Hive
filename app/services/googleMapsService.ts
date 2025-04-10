import * as Location from 'expo-location';
import { Platform, Linking, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { LocationObject, LocationAccuracy, LocationSubscription } from 'expo-location';
import eventService, { Event } from './eventServices';

// Extended LocationDetails interface with coordinates
interface ExtendedLocationDetails {
  buildingName?: string;
  address?: string;
  city: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

// Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyCmExPy3R_vQkxZnz0asVm5WyJIQp9Jubk';

// Storage keys
const LOCATION_PERMISSION_ASKED = 'location_permission_asked';
const LOCATION_PERMISSION_DENIED = 'location_permission_denied';
const USER_LOCATION_CACHE = 'user_location_cache';

// Location cache expiration time (15 minutes)
const LOCATION_CACHE_EXPIRATION = 15 * 60 * 1000;

// Default location (San Francisco) if user location is not available
const DEFAULT_LOCATION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

// Location accuracy settings
const LOCATION_SETTINGS = {
  high: {
    accuracy: LocationAccuracy.High,
    distanceInterval: 10, // meters
    timeInterval: 5000, // milliseconds
  },
  balanced: {
    accuracy: LocationAccuracy.Balanced,
    distanceInterval: 50, // meters
    timeInterval: 10000, // milliseconds
  },
  low: {
    accuracy: LocationAccuracy.Low,
    distanceInterval: 100, // meters
    timeInterval: 30000, // milliseconds
  },
};

// Types
export interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface LocationWithTimestamp {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

export interface NearbyPlace {
  id: string;
  name: string;
  vicinity: string;
  location: {
    latitude: number;
    longitude: number;
  };
  types: string[];
  rating?: number;
  photos?: string[];
}

export interface DirectionsResult {
  distance: {
    text: string;
    value: number; // meters
  };
  duration: {
    text: string;
    value: number; // seconds
  };
  start_address: string;
  end_address: string;
  steps: Array<{
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    html_instructions: string;
    travel_mode: string;
  }>;
  polyline: string; // Encoded polyline
}

class GoogleMapsService {
  private locationSubscription: LocationSubscription | null = null;
  private lastKnownLocation: LocationWithTimestamp | null = null;
  private locationUpdateCallbacks: ((location: LocationObject) => void)[] = [];
  private isRequestingPermission = false;

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    // Check if we have cached location
    await this.loadCachedLocation();
    
    // Check if we already have permissions
    const { status } = await Location.getForegroundPermissionsAsync();
    if (status === 'granted') {
      // Get current location
      await this.getCurrentLocation();
    }
  }

  /**
   * Request location permissions with proper user flow
   */
  async requestLocationPermissions(
    showRationale = true,
    accuracyLevel: 'high' | 'balanced' | 'low' = 'balanced'
  ): Promise<boolean> {
    try {
      // Prevent multiple simultaneous permission requests
      if (this.isRequestingPermission) {
        return false;
      }
      this.isRequestingPermission = true;

      // Check if permission was previously denied
      const permissionDenied = await AsyncStorage.getItem(LOCATION_PERMISSION_DENIED);
      
      // Check current permission status
      const { status: currentStatus } = await Location.getForegroundPermissionsAsync();
      
      // If already granted, return true
      if (currentStatus === 'granted') {
        this.isRequestingPermission = false;
        return true;
      }
      
      // If previously denied and we shouldn't show rationale, return false
      if (permissionDenied === 'true' && !showRationale) {
        this.isRequestingPermission = false;
        return false;
      }
      
      // If we should show rationale and permission was previously denied or not asked
      if (showRationale && (currentStatus === 'denied' || permissionDenied === 'true')) {
        // Show rationale to the user
        return new Promise((resolve) => {
          Alert.alert(
            'Location Access',
            'ScanGo needs access to your location to show nearby events and provide directions. Your location data is only used within the app and not shared with third parties.',
            [
              {
                text: 'Not Now',
                onPress: async () => {
                  await AsyncStorage.setItem(LOCATION_PERMISSION_DENIED, 'true');
                  this.isRequestingPermission = false;
                  resolve(false);
                },
                style: 'cancel',
              },
              {
                text: 'Allow',
                onPress: async () => {
                  const result = await this.requestPermission(accuracyLevel);
                  this.isRequestingPermission = false;
                  resolve(result);
                },
              },
            ],
            { cancelable: false }
          );
        });
      }
      
      // Otherwise, request permission directly
      const result = await this.requestPermission(accuracyLevel);
      this.isRequestingPermission = false;
      return result;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      this.isRequestingPermission = false;
      return false;
    }
  }

  /**
   * Internal method to request permission
   */
  private async requestPermission(accuracyLevel: 'high' | 'balanced' | 'low'): Promise<boolean> {
    try {
      // Mark that we've asked for permission
      await AsyncStorage.setItem(LOCATION_PERMISSION_ASKED, 'true');
      
      // Request foreground permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      // If granted, also request accuracy based on level
      if (status === 'granted') {
        // Clear denied flag if permission was granted
        await AsyncStorage.removeItem(LOCATION_PERMISSION_DENIED);
        return true;
      } else {
        // Mark permission as denied
        await AsyncStorage.setItem(LOCATION_PERMISSION_DENIED, 'true');
        return false;
      }
    } catch (error) {
      console.error('Error in requestPermission:', error);
      return false;
    }
  }

  /**
   * Open device settings to allow the user to enable location permissions
   */
  openLocationSettings(): void {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  }

  /**
   * Get the current location with caching for performance
   */
  async getCurrentLocation(
    forceRefresh = false,
    accuracyLevel: 'high' | 'balanced' | 'low' = 'balanced'
  ): Promise<LocationObject | null> {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      const isConnected = netInfo.isConnected;
      
      // Check if we have permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return null;
      }
      
      // If we have a recent cached location and don't need to force refresh, use it
      if (
        !forceRefresh &&
        this.lastKnownLocation &&
        Date.now() - this.lastKnownLocation.timestamp < LOCATION_CACHE_EXPIRATION
      ) {
        return this.lastKnownLocation as LocationObject;
      }
      
      // Get current location with appropriate accuracy
      const settings = LOCATION_SETTINGS[accuracyLevel];
      const location = await Location.getCurrentPositionAsync({
        accuracy: settings.accuracy,
      });
      
      // Cache the location
      this.lastKnownLocation = {
        ...location,
        timestamp: Date.now(),
      };
      
      // Save to AsyncStorage for persistence
      await AsyncStorage.setItem(USER_LOCATION_CACHE, JSON.stringify(this.lastKnownLocation));
      
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      
      // If we have a cached location, return it as fallback
      if (this.lastKnownLocation) {
        return this.lastKnownLocation as LocationObject;
      }
      
      return null;
    }
  }

  /**
   * Start watching location updates with battery-efficient settings
   */
  async startLocationUpdates(
    callback: (location: LocationObject) => void,
    accuracyLevel: 'high' | 'balanced' | 'low' = 'balanced'
  ): Promise<boolean> {
    try {
      // Check if we have permission
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        return false;
      }
      
      // Add callback to the list
      this.locationUpdateCallbacks.push(callback);
      
      // If we're already watching location, no need to start again
      if (this.locationSubscription) {
        return true;
      }
      
      // Get settings based on accuracy level
      const settings = LOCATION_SETTINGS[accuracyLevel];
      
      // Start watching location
      this.locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: settings.accuracy,
          distanceInterval: settings.distanceInterval,
          timeInterval: settings.timeInterval,
        },
        (location: LocationObject) => {
          // Update last known location
          this.lastKnownLocation = {
            ...location,
            timestamp: Date.now(),
          };
          
          // Save to AsyncStorage for persistence
          AsyncStorage.setItem(USER_LOCATION_CACHE, JSON.stringify(this.lastKnownLocation));
          
          // Notify all callbacks
          this.locationUpdateCallbacks.forEach((cb) => cb(location));
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error starting location updates:', error);
      return false;
    }
  }

  /**
   * Stop watching location updates
   */
  stopLocationUpdates(callback?: (location: LocationObject) => void): void {
    // If a specific callback is provided, remove only that callback
    if (callback) {
      this.locationUpdateCallbacks = this.locationUpdateCallbacks.filter((cb) => cb !== callback);
    } else {
      // Otherwise, remove all callbacks
      this.locationUpdateCallbacks = [];
    }
    
    // If no more callbacks, stop watching location
    if (this.locationUpdateCallbacks.length === 0 && this.locationSubscription) {
      this.locationSubscription.remove();
      this.locationSubscription = null;
    }
  }

  /**
   * Load cached location from AsyncStorage
   */
  private async loadCachedLocation(): Promise<void> {
    try {
      const cachedLocation = await AsyncStorage.getItem(USER_LOCATION_CACHE);
      if (cachedLocation) {
        this.lastKnownLocation = JSON.parse(cachedLocation);
      }
    } catch (error) {
      console.error('Error loading cached location:', error);
    }
  }

  /**
   * Get nearby events based on user location
   */
  async getNearbyEvents(
    radius: number = 10000, // 10km
    limit: number = 20
  ): Promise<Event[]> {
    try {
      // Get current location
      const location = await this.getCurrentLocation();
      if (!location) {
        throw new Error('Location not available');
      }
      
      // Get all events
      const { events } = await eventService.getEvents();
      
      // Filter events with location data and calculate distance
      const eventsWithDistance = events
        .filter((event) => {
          // Check if event has location details with coordinates
          return (
            event.locationDetails &&
            (event.locationDetails as ExtendedLocationDetails).latitude !== undefined &&
            (event.locationDetails as ExtendedLocationDetails).longitude !== undefined
          );
        })
        .map((event) => {
          // Calculate distance between user and event
          const distance = this.calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            (event.locationDetails as ExtendedLocationDetails).latitude!,
            (event.locationDetails as ExtendedLocationDetails).longitude!
          );
          
          return {
            ...event,
            distance,
          };
        })
        .filter((event) => event.distance <= radius) // Filter events within radius
        .sort((a, b) => a.distance - b.distance) // Sort by distance
        .slice(0, limit); // Limit results
      
      return eventsWithDistance;
    } catch (error) {
      console.error('Error getting nearby events:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two coordinates using Haversine formula
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Get nearby places using Google Places API
   */
  async getNearbyPlaces(
    location: { latitude: number; longitude: number } | null = null,
    radius: number = 1000,
    type: string = 'restaurant',
    keyword: string = ''
  ): Promise<NearbyPlace[]> {
    try {
      // Get current location if not provided
      if (!location) {
        const currentLocation = await this.getCurrentLocation();
        if (!currentLocation) {
          throw new Error('Location not available');
        }
        location = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
      }
      
      // Build URL for Google Places API
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}&key=${GOOGLE_MAPS_API_KEY}`;
      
      // Add type and keyword if provided
      if (type) {
        url += `&type=${type}`;
      }
      if (keyword) {
        url += `&keyword=${encodeURIComponent(keyword)}`;
      }
      
      // Make request
      const response = await fetch(url);
      const data = await response.json();
      
      // Check for errors
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status}`);
      }
      
      // Parse results
      const places: NearbyPlace[] = (data.results || []).map((place: any) => ({
        id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        types: place.types,
        rating: place.rating,
        photos: place.photos
          ? place.photos.map(
              (photo: any) =>
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
            )
          : undefined,
      }));
      
      return places;
    } catch (error) {
      console.error('Error getting nearby places:', error);
      return [];
    }
  }

  /**
   * Get directions between two locations
   */
  async getDirections(
    origin: { latitude: number; longitude: number } | string,
    destination: { latitude: number; longitude: number } | string,
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving'
  ): Promise<DirectionsResult | null> {
    try {
      // Format origin and destination
      const originStr =
        typeof origin === 'string'
          ? encodeURIComponent(origin)
          : `${origin.latitude},${origin.longitude}`;
      const destinationStr =
        typeof destination === 'string'
          ? encodeURIComponent(destination)
          : `${destination.latitude},${destination.longitude}`;
      
      // Build URL for Google Directions API
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`;
      
      // Make request
      const response = await fetch(url);
      const data = await response.json();
      
      // Check for errors
      if (data.status !== 'OK') {
        throw new Error(`Google Directions API error: ${data.status}`);
      }
      
      // Parse results
      const route = data.routes[0];
      const leg = route.legs[0];
      
      const directions: DirectionsResult = {
        distance: leg.distance,
        duration: leg.duration,
        start_address: leg.start_address,
        end_address: leg.end_address,
        steps: leg.steps.map((step: any) => ({
          distance: step.distance,
          duration: step.duration,
          html_instructions: step.html_instructions,
          travel_mode: step.travel_mode,
        })),
        polyline: route.overview_polyline.points,
      };
      
      return directions;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }

  /**
   * Geocode an address to coordinates
   */
  async geocodeAddress(address: string): Promise<{ latitude: number; longitude: number } | null> {
    try {
      // Build URL for Google Geocoding API
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
      
      // Make request
      const response = await fetch(url);
      const data = await response.json();
      
      // Check for errors
      if (data.status !== 'OK') {
        throw new Error(`Google Geocoding API error: ${data.status}`);
      }
      
      // Parse results
      const location = data.results[0].geometry.location;
      
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<{ address: string; city: string; state: string; country: string } | null> {
    try {
      // Build URL for Google Geocoding API
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;
      
      // Make request
      const response = await fetch(url);
      const data = await response.json();
      
      // Check for errors
      if (data.status !== 'OK') {
        throw new Error(`Google Geocoding API error: ${data.status}`);
      }
      
      // Parse results
      const result = data.results[0];
      
      // Extract address components
      let address = result.formatted_address;
      let city = '';
      let state = '';
      let country = '';
      
      result.address_components.forEach((component: any) => {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      });
      
      return {
        address,
        city,
        state,
        country,
      };
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Get the default region for maps
   */
  async getDefaultRegion(): Promise<Region> {
    try {
      // Try to get current location
      const location = await this.getCurrentLocation();
      
      if (location) {
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        };
      }
      
      // Fall back to default location
      return DEFAULT_LOCATION;
    } catch (error) {
      console.error('Error getting default region:', error);
      return DEFAULT_LOCATION;
    }
  }

  /**
   * Generate a static map URL for a location
   */
  getStaticMapUrl(
    latitude: number,
    longitude: number,
    zoom: number = 15,
    width: number = 600,
    height: number = 300,
    markers: Array<{ lat: number; lng: number; color?: string; label?: string }> = []
  ): string {
    // Base URL
    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=${zoom}&size=${width}x${height}&scale=2&key=${GOOGLE_MAPS_API_KEY}`;
    
    // Add markers
    if (markers.length > 0) {
      markers.forEach((marker) => {
        const color = marker.color || 'red';
        const label = marker.label || '';
        url += `&markers=color:${color}|label:${label}|${marker.lat},${marker.lng}`;
      });
    } else {
      // Add default marker at center
      url += `&markers=color:red|${latitude},${longitude}`;
    }
    
    return url;
  }

  /**
   * Check if location services are enabled on the device
   */
  async isLocationServicesEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }

  /**
   * Get the current location permission status
   */
  async getLocationPermissionStatus(): Promise<
    'granted' | 'denied' | 'never_asked' | 'unknown'
  > {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      
      if (status === 'granted') {
        return 'granted';
      }
      
      // Check if we've asked before
      const permissionAsked = await AsyncStorage.getItem(LOCATION_PERMISSION_ASKED);
      
      if (permissionAsked === 'true') {
        return 'denied';
      }
      
      return 'never_asked';
    } catch (error) {
      console.error('Error getting location permission status:', error);
      return 'unknown';
    }
  }
}

const googleMapsService = new GoogleMapsService();
export default googleMapsService;
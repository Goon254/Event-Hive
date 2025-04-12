// app/utils/geolocationUtils.ts
import * as Location from 'expo-location';
import Geocoding from 'react-native-geocoding';
import { Alert, Platform } from 'react-native';

// Initialize Geocoding with your Google Maps API key
// Replace with your actual API key
const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY';
Geocoding.init(GOOGLE_MAPS_API_KEY);

export interface LocationData {
  latitude: number;
  longitude: number;
  city: string | null;
  country: string | null;
  formattedAddress: string | null;
}

/**
 * Request location permissions from the user
 * @returns Boolean indicating if permission was granted
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

/**
 * Get the user's current location
 * @returns Location coordinates or null if unavailable
 */
export const getCurrentLocation = async (): Promise<Location.LocationObject | null> => {
  try {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      Alert.alert(
        'Location Permission Required',
        'Please enable location services to use this feature.',
        [{ text: 'OK' }]
      );
      return null;
    }
    
    // Get current position with high accuracy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });
    
    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    Alert.alert(
      'Location Error',
      'Unable to retrieve your location. Please check your device settings.',
      [{ text: 'OK' }]
    );
    return null;
  }
};

/**
 * Reverse geocode coordinates to get address information
 * @param latitude Latitude coordinate
 * @param longitude Longitude coordinate
 * @returns Location data including city and country
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<LocationData | null> => {
  try {
    // Use Expo Location for reverse geocoding first
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude
    });
    
    if (addresses && addresses.length > 0) {
      const address = addresses[0];
      return {
        latitude,
        longitude,
        city: address.city || null,
        country: address.country || null,
        formattedAddress: [
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ')
      };
    }
    
    // Fallback to react-native-geocoding if Expo doesn't return results
    const response = await Geocoding.from(latitude, longitude);
    
    if (response.results.length > 0) {
      let city = null;
      let country = null;
      
      // Extract city and country from address components
      const addressComponents = response.results[0].address_components;
      for (const component of addressComponents) {
        if (component.types.includes('locality')) {
          city = component.long_name;
        } else if (component.types.includes('country')) {
          country = component.long_name;
        }
      }
      
      return {
        latitude,
        longitude,
        city,
        country,
        formattedAddress: response.results[0].formatted_address
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
};

/**
 * Get the user's location with address information
 * @param showAlert Whether to show alerts for permission/errors
 * @returns Location data with address information
 */
export const getUserLocationWithAddress = async (
  showAlert: boolean = true
): Promise<LocationData | null> => {
  try {
    const location = await getCurrentLocation();
    
    if (!location) {
      return null;
    }
    
    const { latitude, longitude } = location.coords;
    const addressData = await reverseGeocode(latitude, longitude);
    
    return addressData;
  } catch (error) {
    console.error('Error getting user location with address:', error);
    
    if (showAlert) {
      Alert.alert(
        'Location Error',
        'Unable to determine your address. Please enter it manually.',
        [{ text: 'OK' }]
      );
    }
    
    return null;
  }
};

/**
 * Check if location services are enabled on the device
 * @returns Boolean indicating if location services are enabled
 */
export const checkLocationServicesEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await Location.hasServicesEnabledAsync();
    
    if (!enabled && Platform.OS !== 'web') {
      Alert.alert(
        'Location Services Disabled',
        'Please enable location services in your device settings to use this feature.',
        [{ text: 'OK' }]
      );
    }
    
    return enabled;
  } catch (error) {
    console.error('Error checking location services:', error);
    return false;
  }
};

/**
 * Get location data with privacy compliance
 * This function ensures we're compliant with privacy regulations by:
 * 1. Requesting explicit permission
 * 2. Providing clear purpose for location usage
 * 3. Only collecting what's necessary (city/country, not precise coordinates)
 * 4. Not storing precise location in user profile
 * @returns Location data with only city and country for profile
 */
export const getLocationForProfile = async (): Promise<{
  city: string | null;
  country: string | null;
}> => {
  try {
    // First check if location services are enabled
    const servicesEnabled = await checkLocationServicesEnabled();
    if (!servicesEnabled) {
      return { city: null, country: null };
    }
    
    // Request permission with clear purpose
    const permissionResult = await Location.requestForegroundPermissionsAsync();
    
    if (permissionResult.status !== 'granted') {
      return { city: null, country: null };
    }
    
    // Get location with reduced accuracy for privacy
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced // Less precise for privacy
    });
    
    const { latitude, longitude } = location.coords;
    
    // Get only city and country, not precise address
    const addressData = await reverseGeocode(latitude, longitude);
    
    return {
      city: addressData?.city || null,
      country: addressData?.country || null
    };
  } catch (error) {
    console.error('Error getting location for profile:', error);
    return { city: null, country: null };
  }
};
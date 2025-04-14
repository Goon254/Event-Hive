import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import CustomMapView from '../maps/MapView';
import { createShadow } from '../../utils/platformUtils';

interface EventLocationCardProps {
  title?: string;
  location: string;
  buildingName?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  onGetDirections?: () => void;
}

const EventLocationCard: React.FC<EventLocationCardProps> = ({
  title = 'Event Location',
  location,
  buildingName,
  city,
  state,
  zipCode,
  coordinates,
  onGetDirections,
}) => {
  // Default coordinates if none provided (San Francisco)
  const mapCoordinates = coordinates || {
    latitude: 37.7749,
    longitude: -122.4194,
  };

  // Format the address for display
  const formattedAddress = [
    location,
    city && state ? `${city}, ${state} ${zipCode || ''}` : (city || state || zipCode || '')
  ].filter(Boolean).join('\n');

  // Handle opening directions in maps app
  const handleGetDirections = () => {
    if (onGetDirections) {
      onGetDirections();
      return;
    }

    // Encode the address for use in a URL
    const address = encodeURIComponent(location);
    
    // Platform-specific map options
    let url: string;
    
    if (Platform.OS === 'ios') {
      // Try Apple Maps first on iOS
      url = `maps://?q=${address}`;
      Linking.canOpenURL(url).then(supported => {
        if (!supported) {
          // Fall back to Google Maps if Apple Maps isn't available
          url = `https://www.google.com/maps/search/?api=1&query=${address}`;
          return Linking.openURL(url);
        } else {
          return Linking.openURL(url);
        }
      }).catch(err => {
        console.error('Error opening directions:', err);
      });
    } else {
      // Use Google Maps on Android
      url = `https://www.google.com/maps/search/?api=1&query=${address}`;
      Linking.openURL(url).catch(err => {
        console.error('Error opening directions:', err);
      });
    }
  };

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      {/* Map View */}
      <View style={styles.mapContainer}>
        <CustomMapView
          initialRegion={{
            latitude: mapCoordinates.latitude,
            longitude: mapCoordinates.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          style={styles.map}
          events={[]}
          showUserLocation={false}
          showsMyLocationButton={false}
          zoomEnabled={false}
          scrollEnabled={false}
          rotateEnabled={false}
          showsCompass={false}
        />
        
        {/* Google logo attribution */}
        <View style={styles.googleAttribution}>
          <Text style={styles.googleText}>Google</Text>
        </View>
      </View>
      
      {/* Location Details */}
      <View style={styles.locationDetails}>
        {buildingName && (
          <Text style={styles.buildingName}>{buildingName}</Text>
        )}
        <Text style={styles.address}>{formattedAddress}</Text>
        
        {/* Get Directions Button */}
        <TouchableOpacity 
          style={styles.directionsButton}
          onPress={handleGetDirections}
        >
          <FontAwesome name="map-marker" size={16} color="#FFFFFF" />
          <Text style={styles.directionsButtonText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...createShadow(3),
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  mapContainer: {
    height: 180,
    width: '100%',
    position: 'relative',
  },
  map: {
    height: '100%',
    width: '100%',
  },
  googleAttribution: {
    position: 'absolute',
    bottom: 5,
    left: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
  },
  googleText: {
    fontSize: 10,
    color: '#666666',
  },
  locationDetails: {
    padding: 16,
  },
  buildingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  address: {
    fontSize: 15,
    color: '#4B5563',
    marginBottom: 16,
    lineHeight: 22,
  },
  directionsButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    ...createShadow(2),
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export default EventLocationCard;
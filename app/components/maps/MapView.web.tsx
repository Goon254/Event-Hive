import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { Event } from '../../services/eventServices';

// Define the same props interface as the native version
interface CustomMapViewProps {
  initialRegion?: any;
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

/**
 * Web-specific implementation of MapView
 * This is a fallback component for web environments where react-native-maps is not supported
 */
const CustomMapView: React.FC<CustomMapViewProps> = ({
  events = [],
  selectedEvent,
  style,
  onEventSelect,
}) => {
  const colorScheme = useColorScheme();

  return (
    <View style={[styles.container, style]}>
      <View style={styles.fallbackContent}>
        <Ionicons name="map-outline" size={64} color={Colors[colorScheme ?? 'light'].tint} />
        <Text style={styles.fallbackTitle}>Maps not available on web</Text>
        <Text style={styles.fallbackText}>
          This feature is only available in the native mobile app.
        </Text>
        
        {/* Display event list as fallback */}
        {events.length > 0 && (
          <View style={styles.eventsList}>
            <Text style={styles.eventsListTitle}>Events</Text>
            {events.map((event) => (
              <TouchableOpacity
                key={event.id}
                style={[
                  styles.eventItem,
                  selectedEvent?.id === event.id && styles.selectedEventItem
                ]}
                onPress={() => onEventSelect && onEventSelect(event)}
              >
                <Text style={styles.eventTitle}>{event.title}</Text>
                {event.location && (
                  <Text style={styles.eventLocation}>{event.location}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  fallbackContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#4B5563',
  },
  fallbackText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    color: '#6B7280',
    maxWidth: 300,
  },
  eventsList: {
    width: '100%',
    marginTop: 32,
    maxWidth: 500,
  },
  eventsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#4B5563',
  },
  eventItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedEventItem: {
    borderColor: Colors.light.tint,
    borderWidth: 2,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  eventLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
});

export default CustomMapView;
// app/(tabs)/event-details/[id].tsx
import React, { useState, useEffect } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Image,
  Share,
  FlatList,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import MapView, { Marker } from 'react-native-maps';
import { useAuth } from '../AuthContext';
import eventService, { Event, Attendee } from '../services/eventServices';
import { Timestamp } from 'firebase/firestore';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  interface MapRegion {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }
  const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
  const [showAllAttendees, setShowAllAttendees] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        if (!id) return;
        
        setIsLoading(true);
        const eventData = await eventService.getEventById(id.toString());
        
        if (eventData) {
          const [event, setEvent] = useState<any>(null);
          
          // Set map region if location is available
          if (eventData.locationDetails) {
            // You'd need a geocoding service to convert address to coordinates
            // For now, we'll use a placeholder location
            interface MapRegion {
              latitude: number;
              longitude: number;
              latitudeDelta: number;
              longitudeDelta: number;
            }
            
            // Use the interface when initializing the state
            const [mapRegion, setMapRegion] = useState<MapRegion | null>(null);
            setMapRegion({
              latitude: 37.78825,
              longitude: -122.4324,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            });
          }
          
          // Fetch attendees
          const attendeesList = await eventService.getEventAttendees(id.toString());
          const [attendees, setAttendees] = useState<Attendee[]>([]);

          // Check if current user is attending
          if (user) {
            setIsAttending(attendeesList.some(a => a.id === user.id));
          }
        } else {
          Alert.alert('Error', 'Event not found');
          router.back();
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch event details');
        console.error('Error fetching event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [id, user]);

  const formatDate = (date: Date | Timestamp | null) => {
    if (!date) return 'No date';
    // Handle both Date objects and Firestore Timestamps
    const eventDate = date instanceof Date ? date : date.toDate();
    return eventDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time: Date | Timestamp) => {
    if (!time) return 'No time';
    // Handle both Date objects and Firestore Timestamps
    const eventTime = time instanceof Date ? time : time.toDate();
    return eventTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventStatus = () => {
    if (!event || !event.date) return 'unknown';
    
    const now = new Date();
    const eventDate = event.date instanceof Date ? event.date : event.date.toDate();
    const eventTime = event.time instanceof Date ? event.time : event.time.toDate();
    
    // Combine date and time
    const eventDateTime = new Date(
      eventDate.getFullYear(),
      eventDate.getMonth(),
      eventDate.getDate(),
      eventTime.getHours(),
      eventTime.getMinutes()
    );
    
    // Add event duration (assuming 3 hours if not specified)
    const eventDuration = event.duration || 3 * 60 * 60 * 1000; // 3 hours in ms
    const eventEndTime = new Date(eventDateTime.getTime() + eventDuration);
    
    if (now < eventDateTime) {
      return 'upcoming';
    } else if (now >= eventDateTime && now <= eventEndTime) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };

  const handleAttend = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to attend this event', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => router.push('/(auth)/login') }
      ]);
      return;
    }

    try {
      setIsLoading(true);
      
      if (isAttending) {
        // Logic to cancel attendance
        // This would depend on your data structure
        Alert.alert('Feature Coming Soon', 'Cancellation will be available in the next update');
        
      } else {
        // Add the user as an attendee
        await eventService.addEventAttendee(id.toString(), {
          name: user.name || 'Anonymous',
          checkInStatus: 'pending',
          avatar: user.avatar || undefined
        });
        
        setIsAttending(true);
        setAttendees([...attendees, { 
          id: Math.random().toString(), // Temporary ID
          name: user.name || 'Anonymous',
          checkInStatus: 'pending',
          avatar: user.avatar
        }]);
        
        Alert.alert('Success', 'You are now attending this event');
      }
    } catch (error) {
      console.error('Attendance error:', error);
      Alert.alert('Error', 'Failed to update attendance status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    
    try {
      const result = await Share.share({
        title: event.title,
        message: `Join me at ${event.title} on ${formatDate(event.date)} at ${formatTime(event.time)}. Location: ${event.location || 'TBD'}`,
        url: `https://yourapp.com/events/${id}` // Replace with your actual deep link
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share event');
    }
  };

  const openMaps = () => {
    if (!event || !event.location) return;
    
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:0,0?q=' });
    const latLng = `${mapRegion?.latitude},${mapRegion?.longitude}`;
    const label = event.location;
    const url = Platform.select({
      ios: `${scheme}${latLng}?q=${label}`,
      android: `${scheme}${label}`
    });
    
    if (url) {
      Linking.openURL(url);
    } else {
      Alert.alert('Error', 'Failed to open maps');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text>Event not found</Text>
      </View>
    );
  }

  const status = getEventStatus();

  return (
    <ScrollView style={styles.container}>
      {/* Header with back button and share */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity onPress={handleShare}>
          <FontAwesome name="share" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Event Image */}
      <View style={styles.imageContainer}>
        {event.imageUrl ? (
          <Image 
            source={{ uri: event.imageUrl }} 
            style={styles.eventImage} 
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <MaterialIcons name="event" size={60} color="#9CA3AF" />
            <Text style={styles.imagePlaceholderText}>{event.title}</Text>
          </View>
        )}
      </View>

      {/* Event Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.title}>{event.title}</Text>
        
        <View style={styles.statusContainer}>
          <Text style={[
            styles.statusText,
            status === 'upcoming' && styles.upcomingStatus,
            status === 'ongoing' && styles.ongoingStatus,
            status === 'completed' && styles.completedStatus,
          ]}>
            {status.toUpperCase()}
          </Text>
          
          {event.isPaid && (
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>${event.price?.toFixed(2) || '0.00'}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.detailRow}>
          <FontAwesome name="calendar" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {formatDate(event.date)} • {formatTime(event.time)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <FontAwesome name="map-marker" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{event.location}</Text>
          <TouchableOpacity onPress={openMaps} style={styles.mapButton}>
            <Text style={styles.mapButtonText}>View Map</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailRow}>
          <FontAwesome name="user" size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Organized by {event.organizerName || 'Event Host'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <FontAwesome name="users" size={16} color="#6B7280" />
          <Text style={styles.detailText}>{attendees.length} attendees</Text>
        </View>

        {/* Payment Options for Paid Events */}
        {event.isPaid && (
          <View style={styles.paymentSection}>
            <Text style={styles.sectionTitle}>Payment Options</Text>
            <View style={styles.paymentOptions}>
              {event.paymentOptions?.map((option, index) => (
                <View key={index} style={styles.paymentOption}>
                  <Text style={styles.paymentOptionText}>{option}</Text>
                </View>
              ))}
              {(!event.paymentOptions || event.paymentOptions.length === 0) && (
                <Text style={styles.noOptionsText}>No payment options specified</Text>
              )}
            </View>
          </View>
        )}

        {/* Description */}
        <Text style={styles.sectionTitle}>About this event</Text>
        <Text style={styles.description}>{event.description || 'No description available.'}</Text>

        {/* Location Map */}
        {mapRegion && (
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Event Location</Text>
            <View style={styles.mapContainer}>
              <MapView 
                style={styles.map}
                initialRegion={mapRegion}
              >
                <Marker 
                  coordinate={mapRegion}
                  title={event.locationDetails?.buildingName || 'Event Location'}
                  description={event.location || ''}
                />
              </MapView>
              {event.locationDetails && (
                <View style={styles.addressContainer}>
                  {event.locationDetails.buildingName && (
                    <Text style={styles.buildingName}>{event.locationDetails.buildingName}</Text>
                  )}
                  <Text style={styles.address}>{event.locationDetails.address}</Text>
                  <Text style={styles.cityStateZip}>
                    {event.locationDetails.city}{event.locationDetails.state ? ', ' + event.locationDetails.state : ''}
                    {event.locationDetails.zipCode ? ' ' + event.locationDetails.zipCode : ''}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Attendees List */}
        <View style={styles.attendeesSection}>
          <Text style={styles.sectionTitle}>Attendees</Text>
          
          {attendees.length === 0 ? (
            <Text style={styles.noAttendeesText}>Be the first to attend this event!</Text>
          ) : (
            <>
              <View style={styles.attendeesList}>
                {(showAllAttendees ? attendees : attendees.slice(0, 5)).map((attendee, index) => (
                  <View key={index} style={styles.attendeeItem}>
                    {attendee.avatar ? (
                      <Image source={{ uri: attendee.avatar }} style={styles.attendeeAvatar} />
                    ) : (
                      <View style={styles.attendeeAvatarPlaceholder}>
                        <Text style={styles.avatarPlaceholderText}>
                          {attendee.name?.charAt(0).toUpperCase() || 'A'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.attendeeInfo}>
                      <Text style={styles.attendeeName}>{attendee.name}</Text>
                      <View style={[
                        styles.checkInStatus,
                        attendee.checkInStatus === 'checked-in' && styles.checkedInStatus,
                        attendee.checkInStatus === 'absent' && styles.absentStatus
                      ]}>
                        <Text style={styles.checkInStatusText}>
                          {attendee.checkInStatus === 'checked-in' ? 'Checked In' : 
                           attendee.checkInStatus === 'absent' ? 'Absent' : 'Not Checked In'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
              
              {attendees.length > 5 && (
                <TouchableOpacity 
                  style={styles.showMoreButton}
                  onPress={() => setShowAllAttendees(!showAllAttendees)}
                >
                  <Text style={styles.showMoreText}>
                    {showAllAttendees ? 'Show Less' : `Show All (${attendees.length})`}
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* QR Code for Check-in */}
        {!event.requireFaceRecognition && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Check-In QR Code</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={`scangoapp://event-checkin/${id}/${user?.id || 'guest'}`}
                size={200}
                color="#1F2937"
                backgroundColor="#FFFFFF"
              />
              <Text style={styles.qrInstructions}>
                Show this QR code at the event entrance for quick check-in
              </Text>
            </View>
          </View>
        )}

        {/* Attend Button */}
        <TouchableOpacity
          style={[
            styles.attendButton,
            isAttending && styles.attendingButton,
            event.isPaid && !isAttending && styles.paymentButton
          ]}
          onPress={handleAttend}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              {event.isPaid && !isAttending ? (
                <View style={styles.payButtonContent}>
                  <FontAwesome name="credit-card" size={20} color="#FFFFFF" style={styles.paymentIcon} />
                  <Text style={styles.attendButtonText}>
                    PAY & ATTEND (${event.price?.toFixed(2) || '0.00'})
                  </Text>
                </View>
              ) : (
                <Text style={styles.attendButtonText}>
                  {isAttending ? 'CANCEL ATTENDANCE' : 'ATTEND THIS EVENT'}
                </Text>
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholderText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusText: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 14,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
  },
  upcomingStatus: {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
  },
  ongoingStatus: {
    backgroundColor: '#F0FDF4',
    color: '#166534',
  },
  completedStatus: {
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
  },
  priceTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#D97706',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 16,
    flex: 1,
    color: '#374151',
  },
  mapButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
  },
  mapButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2563EB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
    color: '#1F2937',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  paymentSection: {
    marginTop: 16,
  },
  paymentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  paymentOption: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  paymentOptionText: {
    fontSize: 14,
    color: '#4B5563',
  },
  noOptionsText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#9CA3AF',
  },
  mapSection: {
    marginTop: 16,
  },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  map: {
    height: 200,
    width: '100%',
  },
  addressContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  buildingName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  address: {
    fontSize: 14,
    color: '#4B5563',
    marginTop: 4,
  },
  cityStateZip: {
    fontSize: 14,
    color: '#4B5563',
  },
  attendeesSection: {
    marginTop: 16,
  },
  noAttendeesText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#9CA3AF',
    marginBottom: 16,
  },
  attendeesList: {
    marginBottom: 16,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  attendeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1D5DB',
  },
  attendeeAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#60A5FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  attendeeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  attendeeName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  checkInStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  checkedInStatus: {
    backgroundColor: '#D1FAE5',
  },
  absentStatus: {
    backgroundColor: '#FEE2E2',
  },
  checkInStatusText: {
    fontSize: 12,
    color: '#6B7280',
  },
  showMoreButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2563EB',
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    maxWidth: 250,
  },
  attendButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  attendingButton: {
    backgroundColor: '#DC2626',
  },
  paymentButton: {
    backgroundColor: '#047857',
  },
  attendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIcon: {
    marginRight: 8,
  },
});
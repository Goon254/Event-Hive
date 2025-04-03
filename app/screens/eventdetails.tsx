// app/screens/eventdetails.tsx - Updated with improved payment flow
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
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../AuthContext';
import eventService, { Event, Attendee } from '../services/eventServices';
import AttendeeManagement from '../container/AttendeeManagement';
import { Timestamp } from 'firebase/firestore';
import { createShadow, safeTopPadding } from '../utils/platformUtils';
import { formatDate, formatTime } from '../utils/dateUtils';
import { useStripe } from '@stripe/stripe-react-native';
import enhancedPaymentService from '../services/enhancedPaymentService';

export default function EventDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [hasUserPaid, setHasUserPaid] = useState(false);
  const [showAllAttendees, setShowAllAttendees] = useState(false);
  const stripe = useStripe();

  // Set status bar for better visibility with content
  useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    
    // Clean up on unmount
    return () => {
      StatusBar.setBarStyle('default');
    };
  }, []);

  const fetchEventDetails = async () => {
    try {
      if (!id) return;
      
      setIsLoading(true);
      const eventData = await eventService.getEventById(id.toString());
      
      if (eventData) {
        setEvent(eventData);
        
        // Fetch attendees
        const attendeesList = await eventService.getEventAttendees(id.toString());
        setAttendees(attendeesList);

        // Check if current user is attending
        if (user) {
          const userAttendee = attendeesList.find(a => a.id === user.id);
          const userAttending = !!userAttendee;
          setIsAttending(userAttending);
          
          // Check if user has paid (for paid events)
          if (userAttending && eventData.isPaid) {
            setHasUserPaid(checkPaymentStatus(userAttendee));
          }
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

  // Check if user has paid for the event
  const checkPaymentStatus = (attendee?: Attendee): boolean => {
    if (!attendee) return false;
    return attendee.paymentStatus === 'completed';
  };

  useEffect(() => {
    fetchEventDetails();
  }, [id, user]);

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
      if (isAttending) {
        // Logic to cancel attendance
        Alert.alert('Feature Coming Soon', 'Cancellation will be available in the next update');
        return;
      }
      
      // For paid events, start the registration and payment flow
      if (event?.isPaid && event.price && event.price > 0) {
        // Start with registration first, then initiate payment
        await initiateRegistrationAndPayment();
      } else {
        // For free events, proceed with registration
        await registerForEvent(false);
      }
    } catch (error) {
      console.error('Attendance error:', error);
      let errorMessage = 'Failed to update attendance status';
      if (error instanceof Error) {
        errorMessage += ': ' + error.message;
      }
      Alert.alert('Error', errorMessage);
    }
  };

  const initiateRegistrationAndPayment = async () => {
    if (!event || !id) return;
    
    try {
      setIsLoading(true);
      
      // Create a complete attendee object with all required fields
      const attendeeData = {
        name: user?.name || 'Anonymous',
        email: user?.email || '',
        checkInStatus: 'pending' as const,
        paymentStatus: 'pending' as const,
        ...(user?.avatar ? { avatar: user.avatar } : {})
      };
      
      // Add the user as an attendee first
      const newAttendee = await eventService.addEventAttendee(id.toString(), attendeeData);
      
      // Now initiate the payment flow
      await processPayment(newAttendee);
      
    } catch (error) {
      console.error('Error initiating registration and payment:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const processPayment = async (attendee: Attendee) => {
    if (!event || !id) return;
    
    try {
      // Set payment mode
      setIsPaying(true);
      
      // Calculate amount in cents
      const amountInCents = Math.round((event.price || 0) * 100);
      
      // Get payment intent
      const { clientSecret, paymentIntentId } = await enhancedPaymentService.processTicketPayment(
        id.toString(),
        attendee.id,
        amountInCents,
        `Ticket for ${event.title}`,
        { userId: user?.id }
      );
      
      // Initialize payment sheet
      const { error: initError } = await stripe.initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Event-Hive',
        applePay: { merchantCountryCode: 'US' },
        googlePay: { merchantCountryCode: 'US', testEnv: __DEV__ }
      });
      
      if (initError) {
        throw new Error(`Payment initialization failed: ${initError.message}`);
      }
      
      // Present the payment sheet
      const { error: presentError } = await stripe.presentPaymentSheet();
      
      if (presentError) {
        if (presentError.code === 'Canceled') {
          // User canceled the payment - this is not a failure
          console.log('Payment canceled by user');
          setIsPaying(false);
          return;
        }
        
        throw new Error(`Payment failed: ${presentError.message}`);
      }
      
      // Payment successful - update attendee status
      await enhancedPaymentService.confirmAttendeePayment(
        id.toString(),
        attendee.id,
        paymentIntentId
      );
      
      // Update local state
      setIsAttending(true);
      setHasUserPaid(true);
      
      // Add the new attendee to the list with completed payment status
      setAttendees(prev => [...prev, { ...attendee, paymentStatus: 'completed' }]);
      
      // Success message
      Alert.alert('Success', 'Payment successful! You are now registered for this event.');
      
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert(
        'Payment Error', 
        error instanceof Error ? error.message : 'There was an error processing your payment'
      );
    } finally {
      setIsPaying(false);
    }
  };

  const registerForEvent = async (isPaid = false) => {
    try {
      setIsLoading(true);
      
      // Check if event ID is valid
      if (!id || !event) {
        throw new Error('Invalid event ID or event data');
      }
      
      // Create a complete attendee object with all required fields
      const attendeeData = {
        name: user?.name || 'Anonymous',
        email: user?.email || '',
        checkInStatus: 'pending' as const,
        // Only include payment status for paid events
        ...(isPaid ? { paymentStatus: 'pending' as const } : {}),
        // Only include avatar if it exists
        ...(user?.avatar ? { avatar: user.avatar } : {})
      };
      
      // Add the user as an attendee
      const newAttendee = await eventService.addEventAttendee(id.toString(), attendeeData);
      
      // Update UI state
      setIsAttending(true);
      setAttendees([...attendees, newAttendee]);
      
      // Show success message
      Alert.alert('Success', 'You are now attending this event');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    
    try {
      const url = `https://eventhive.com/events/${id}`;
      await Share.share({
        title: event.title,
        message: `Join me at ${event.title} on ${formatDate(event.date)} at ${formatTime(event.time)}. Location: ${event.location || 'TBD'}\n\n${url}`,
        url: url
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share event');
    }
  };

  const openDirections = () => {
    if (!event || !event.location) return;
    
    // Encode the address for use in a URL
    const address = encodeURIComponent(event.location);
    
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
        Alert.alert('Error', 'Failed to open maps application');
      });
    } else {
      // Use Google Maps on Android
      url = `https://www.google.com/maps/search/?api=1&query=${address}`;
      Linking.openURL(url).catch(err => {
        console.error('Error opening directions:', err);
        Alert.alert('Error', 'Failed to open maps application');
      });
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Event",
      "Are you sure you want to delete this event? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              await eventService.deleteEvent(id.toString());
              Alert.alert("Success", "Event deleted successfully");
              router.back();
            } catch (error) {
              console.error("Error deleting event:", error);
              Alert.alert("Error", "Failed to delete event");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handlePaymentHistory = () => {
    router.push('/screens/PaymentHistory');
  };

  const completePayment = async () => {
    if (!event || !id) return;

    try {
      setIsPaying(true);
      
      // Find the user's attendee record
      const userAttendee = attendees.find(a => a.id === user?.id);
      if (!userAttendee) {
        throw new Error('Attendee record not found');
      }
      
      // Process the payment
      await processPayment(userAttendee);
    } catch (error) {
      console.error('Error completing payment:', error);
      Alert.alert('Error', 'Failed to complete payment');
    } finally {
      setIsPaying(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (isPaying) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Processing payment...</Text>
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
  const isOrganizer = event.createdBy === user?.id;
  // Only show QR code if:
  // 1. User is not the organizer
  // 2. User is attending the event
  // 3. If it's a paid event, user has paid
  const shouldShowQRCode = !isOrganizer && isAttending && (!event.isPaid || hasUserPaid);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header with back button and share */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <FontAwesome name="arrow-left" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Event Details</Text>
        <TouchableOpacity 
          onPress={handleShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
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

        {/* Location Section */}
        <View style={styles.locationSection}>
          <Text style={styles.sectionTitle}>Event Location</Text>
          <View style={styles.locationContainer}>
            {event.locationDetails?.buildingName && (
              <Text style={styles.buildingName}>{event.locationDetails.buildingName}</Text>
            )}
            <Text style={styles.address}>{event.location}</Text>
            {event.locationDetails && (
              <Text style={styles.cityStateZip}>
                {event.locationDetails.city}
                {event.locationDetails.state ? ', ' + event.locationDetails.state : ''}
                {event.locationDetails.zipCode ? ' ' + event.locationDetails.zipCode : ''}
              </Text>
            )}
            <TouchableOpacity style={styles.directionsButton} onPress={openDirections}>
              <FontAwesome name="map-signs" size={16} color="#FFFFFF" />
              <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Management Options for Organizer */}
        {isOrganizer && (
          <View style={styles.managementSection}>
            <Text style={styles.sectionTitle}>Event Management</Text>
            
            <View style={styles.managementButtons}>
              <TouchableOpacity 
                style={styles.managementButton}
                onPress={() => router.push({
                  pathname: "/screens/scan",
                  params: { eventId: id }
                })}
              >
                <FontAwesome name="qrcode" size={20} color="#FFFFFF" />
                <Text style={styles.managementButtonText}>Scan Check-ins</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.managementButton, styles.deleteButton]}
                onPress={handleDelete}
              >
                <FontAwesome name="trash" size={20} color="#FFFFFF" />
                <Text style={styles.managementButtonText}>Delete Event</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.attendeeManagementContainer}>
              <AttendeeManagement
                eventId={id.toString()}
                attendees={attendees.map(a => ({
                  id: a.id,
                  name: a.name || 'Anonymous',
                  email: a.email || 'No email provided',
                  status: a.checkInStatus === 'absent' ? 'pending' : a.checkInStatus
                }))}
                onUpdateAttendee={(attendeeId: string, status: string) => {
                  eventService.updateAttendeeStatus(
                    id.toString(), 
                    attendeeId, 
                    status as 'pending' | 'checked-in' | 'absent'
                  );
                  // Refresh attendees
                  fetchEventDetails();
                }}
              />
            </View>
          </View>
        )}

        {/* Attendees List (don't show for organizer, who sees management view) */}
        {!isOrganizer && (
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
                        {attendee.paymentStatus === 'completed' && (
                          <View style={styles.paidStatus}>
                            <Text style={styles.paidStatusText}>Paid</Text>
                          </View>
                        )}
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
        )}

        {/* QR Code for Check-in - Only shown to attendees who have paid if required */}
        {shouldShowQRCode && (
          <View style={styles.qrSection}>
            <Text style={styles.sectionTitle}>Check-In QR Code</Text>
            <View style={styles.qrContainer}>
              <QRCode
                value={`eventhive://event-checkin/${id}/${user?.id || 'guest'}`}
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
        
        {/* Payment reminder for unpaid attendees */}
        {isAttending && event.isPaid && !hasUserPaid && (
          <View style={styles.paymentReminderContainer}>
            <FontAwesome name="exclamation-circle" size={24} color="#DC2626" />
            <Text style={styles.paymentReminderText}>
              Please complete payment to receive your QR code for check-in
            </Text>
            <TouchableOpacity 
              style={styles.completePaymentButton}
              onPress={completePayment}
              disabled={isPaying}
            >
              {isPaying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.completePaymentText}>Complete Payment</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Attend Button (don't show for organizer) */}
        {!isOrganizer && !isAttending && (
          <TouchableOpacity
            style={[
              styles.attendButton,
              event.isPaid && styles.paymentButton
            ]}
            onPress={handleAttend}
            disabled={isLoading || isPaying}
          >
            {isLoading || isPaying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                {event.isPaid ? (
                  <View style={styles.payButtonContent}>
                    <FontAwesome name="credit-card" size={20} color="#FFFFFF" style={styles.paymentIcon} />
                    <Text style={styles.attendButtonText}>
                      PAY & ATTEND (${event.price?.toFixed(2) || '0.00'})
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.attendButtonText}>ATTEND THIS EVENT</Text>
                )}
              </>
            )}
          </TouchableOpacity>
        )}
        
        {/* View payment history button (for paid attendees) */}
        {isAttending && hasUserPaid && (
          <TouchableOpacity
            style={styles.viewHistoryButton}
            onPress={handlePaymentHistory}
          >
            <FontAwesome name="history" size={16} color="#4B5563" />
            <Text style={styles.viewHistoryText}>View Payment History</Text>
          </TouchableOpacity>
        )}
        
        {/* Cancel attendance button (if already attending) */}
        {!isOrganizer && isAttending && (
          <TouchableOpacity
            style={[styles.attendButton, styles.attendingButton]}
            onPress={handleAttend}
            disabled={isLoading || isPaying}
          >
            {isLoading || isPaying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.attendButtonText}>CANCEL ATTENDANCE</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

// Create platform-specific shadows
const cardShadow = createShadow(3);
const buttonShadow = createShadow(2);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    paddingBottom: Platform.OS === 'ios' ? 50 : 30, // Extra padding for iOS
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    ...safeTopPadding(4), // Platform-specific top padding
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
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
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
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
    overflow: 'hidden', // Ensure text doesn't overflow on Android
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '700' : 'bold',
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
    gap: Platform.OS === 'ios' ? 8 : undefined, // gap property works better on iOS
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
  locationSection: {
    marginTop: 24,
  },
  locationContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    ...cardShadow, // Platform-specific shadow
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
    marginBottom: 16,
  },
  directionsButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    marginTop: 8,
    ...buttonShadow,
  },
  directionsButtonText: {
    color: '#FFFFFF',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontSize: 14,
    marginLeft: 8,
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
    marginRight: 4,
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
  paidStatus: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  paidStatusText: {
    fontSize: 12,
    color: '#2563EB',
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
    ...cardShadow, // Platform-specific shadow
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
    borderRadius: Platform.OS === 'ios' ? 12 : 6,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
    ...buttonShadow, // Platform-specific shadow
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
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },
  payButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIcon: {
    marginRight: 8,
  },
  managementSection: {
    marginTop: 24,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    ...cardShadow,
  },
  managementButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: Platform.OS === 'ios' ? 16 : 8,
  },
  managementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    flex: 1,
    justifyContent: 'center',
    ...buttonShadow,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  managementButtonText: {
    color: '#FFFFFF',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  attendeeManagementContainer: {
    marginTop: 8,
  },
  paymentReminderContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    ...cardShadow,
  },
  paymentReminderText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  completePaymentButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Platform.OS === 'ios' ? 8 : 4,
    ...buttonShadow,
  },
  completePaymentText: {
    color: '#FFFFFF',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    fontSize: 14,
  },
  viewHistoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: -16,
    marginBottom: 24,
  },
  viewHistoryText: {
    color: '#4B5563',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  }
});
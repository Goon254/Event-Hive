// app/screens/eventdetails.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons, Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useAuth } from '../AuthContext';
import eventService, { Event, Attendee } from '../services/eventServices';
import AttendeeManagement from '../container/AttendeeManagement';
import { Timestamp } from 'firebase/firestore';
import { createShadow, safeTopPadding } from '../utils/platformUtils';
import { formatDate, formatTime, getRelativeDays } from '../utils/dateUtils';
import { useStripe } from '@stripe/stripe-react-native';
import enhancedPaymentService from '../services/enhancedPaymentService';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const HEADER_MAX_HEIGHT = 300;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

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
  const [spotsLeft, setSpotsLeft] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showSpeakers, setShowSpeakers] = useState(false);
  const stripe = useStripe();
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });
  const imageOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp',
  });
  const titleScale = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [0.8, 0.9, 1],
    extrapolate: 'clamp',
  });

  // Set status bar for better visibility with content
  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    
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
        
        // Calculate spots left if capacity is set
        if (eventData.capacity) {
          const spotsRemaining = Math.max(0, eventData.capacity - attendeesList.length);
          setSpotsLeft(spotsRemaining);
        }
  
        // Check if current user is attending
        if (user) {
          const userAttendee = attendeesList.find(a => a.userId === user.id);
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

  const formatDuration = (durationMs: number | undefined): string => {
    if (!durationMs) return '3 hours (estimated)';
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return hours === 1 ? '1 hour' : `${hours} hours`;
    } else {
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  };

  const cancelAttendance = async () => {
    try {
      if (!id || !user || !event) return;
      
      Alert.alert(
        "Cancel Attendance",
        "Are you sure you want to cancel your attendance to this event?",
        [
          { text: "No", style: "cancel" },
          { 
            text: "Yes, Cancel", 
            style: "destructive",
            onPress: async () => {
              try {
                setIsLoading(true);
                
                // Find the user's attendee record
                const userAttendee = attendees.find(a => a.userId === user.id);
                if (!userAttendee) {
                  throw new Error('Attendee record not found');
                }
                
                // Call API to remove attendee
                await eventService.removeEventAttendee(id.toString(), userAttendee.id);
                
                // Update UI
                setIsAttending(false);
                setHasUserPaid(false);
                
                // Update attendees list first
                const updatedAttendees = attendees.filter(a => a.userId !== user.id);
                setAttendees(updatedAttendees);
                
                // Recalculate spots left based on capacity and updated attendee count
                if (event.capacity) {
                  const newSpotsLeft = Math.max(0, event.capacity - updatedAttendees.length);
                  setSpotsLeft(newSpotsLeft);
                }
                
                Alert.alert('Success', 'Your attendance has been cancelled');
              } catch (error) {
                console.error('Cancellation error:', error);
                Alert.alert(
                  'Error Cancelling Attendance', 
                  error instanceof Error ? error.message : 'An unknown error occurred'
                );
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Cancellation error:', error);
      Alert.alert(
        'Error Cancelling Attendance', 
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
    }
  };

  
  const handleAttend = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to attend this event', [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => router.push('/(auth)/login') }
      ]);
      return;
    }

    try {
      if (isAttending) {
        // Logic to cancel attendance
        await cancelAttendance();
        return;
      }
      
      // Check if event has spots available
      if (spotsLeft !== null && spotsLeft <= 0) {
        Alert.alert('Event Full', 'Sorry, this event has reached its capacity.');
        return;
      }
      
      // Check if user is already attending to prevent duplicates
      if (attendees.some(a => a.userId === user.id)) {
        Alert.alert('Already Registered', 'You are already registered for this event.');
        setIsAttending(true); // Ensure state is consistent
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
        userId: user?.id, // Make sure to include userId for finding the attendee later
        checkInStatus: 'pending' as const,
        paymentStatus: 'pending' as const,
        ...(user?.avatar ? { avatar: user.avatar } : {})
      };
      
      // Add the user as an attendee first
      const newAttendee = await eventService.addEventAttendee(id.toString(), {
        ...attendeeData,
        createdAt: Timestamp.now(),
      });
      
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
      
      // Calculate amount
      const amount = event.price || 0;
      
      // Get payment intent
      const { clientSecret, paymentIntentId } = await enhancedPaymentService.processTicketPayment(
        id.toString(),
        attendee.id,
        amount,
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
          
          // Remove the attendee record since payment was canceled
          await eventService.removeEventAttendee(id.toString(), attendee.id);
          
          // Refresh the attendees list
          const updatedAttendees = attendees.filter(a => a.id !== attendee.id);
          setAttendees(updatedAttendees);
          
          // Update spots left based on capacity and updated attendee count
          if (event.capacity) {
            const newSpotsLeft = Math.max(0, event.capacity - updatedAttendees.length);
            setSpotsLeft(newSpotsLeft);
          }
          
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
      
      // Update the attendee with completed payment status
      const paidAttendee = { ...attendee, paymentStatus: 'completed' };
      
      // Update or add this attendee to the list
      const updatedAttendees = attendees.some(a => a.id === attendee.id)
        ? attendees.map(a => a.id === attendee.id ? paidAttendee : a)
        : [...attendees, paidAttendee];
      
      setAttendees(updatedAttendees);
      
      // Update spots left based on capacity and updated attendee count
      if (event.capacity) {
        const newSpotsLeft = Math.max(0, event.capacity - updatedAttendees.length);
        setSpotsLeft(newSpotsLeft);
      }
      
      // Success message
      Alert.alert('Success', 'Payment successful! You are now registered for this event.');
      
    } catch (error) {
      console.error('Payment error:', error);
      
      // Try to clean up the attendee record if payment failed
      try {
        await eventService.removeEventAttendee(id.toString(), attendee.id);
        
        // Update attendees list
        const updatedAttendees = attendees.filter(a => a.id !== attendee.id);
        setAttendees(updatedAttendees);
        
        // Recalculate spots left
        if (event.capacity) {
          const newSpotsLeft = Math.max(0, event.capacity - updatedAttendees.length);
          setSpotsLeft(newSpotsLeft);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up attendee record:', cleanupError);
      }
      
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
      
      // Check if user is already in attendees list to prevent duplicates
      if (user?.id && attendees.some(a => a.userId === user.id)) {
        Alert.alert('Already Registered', 'You are already registered for this event.');
        setIsAttending(true); // Ensure state is consistent
        return;
      }
      
      // Create a complete attendee object with all required fields
      const attendeeData = {
        name: user?.name || 'Anonymous',
        email: user?.email || '',
        userId: user?.id, // Make sure to include userId
        checkInStatus: 'pending' as const,
        // Only include payment status for paid events
        ...(isPaid ? { paymentStatus: 'pending' as const } : {}),
        // Only include avatar if it exists
        ...(user?.avatar ? { avatar: user.avatar } : {})
      };
      
      // Add the user as an attendee
      const newAttendee = await eventService.addEventAttendee(id.toString(), {
        ...attendeeData,
        createdAt: Timestamp.now(),
      });
      
      // Update UI state
      setIsAttending(true);
      
      // Update attendees list first
      const updatedAttendees = [...attendees, newAttendee];
      setAttendees(updatedAttendees);
      
      // Update spots left based on capacity and updated attendee count
      if (event.capacity) {
        const newSpotsLeft = Math.max(0, event.capacity - updatedAttendees.length);
        setSpotsLeft(newSpotsLeft);
      }
      
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
      const message = `Join me at ${event.title} on ${formatDate(event.date)} at ${formatTime(event.time)}!\n\nLocation: ${event.location || 'TBD'}\n\n${event.description?.substring(0, 100)}${event.description && event.description.length > 100 ? '...' : ''}`;
      
      await Share.share({
        title: `Invitation to ${event.title}`,
        message
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
      const userAttendee = attendees.find(a => a.userId === user?.id);
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
        <Text style={styles.errorText}>Event not found</Text>
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
  
  // Generate the event speakers list if any
  const speakers: { name: string; role: string; bio?: string; imageUri?: string }[] = event.speakers || [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header with Parallax Effect */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.View style={[styles.headerBackground, { opacity: imageOpacity }]}>
          {event.imageUrl ? (
            <Image 
              source={{ uri: event.imageUrl }} 
              style={styles.headerImage} 
              resizeMode="cover"
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
          ) : (
            <LinearGradient 
              colors={['#3B82F6', '#1D4ED8']} 
              style={styles.headerImagePlaceholder}
            >
              <Text style={styles.headerImageText}>{event.title.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.headerGradient}
          />
        </Animated.View>
        
        {/* Header content */}
        <View style={styles.headerContent}>
          <View style={styles.headerControls}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Animated.Text style={[
              styles.headerTitle, 
              { opacity: titleOpacity, transform: [{ scale: titleScale }] }
            ]} numberOfLines={1}>
              {event.title}
            </Animated.Text>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={handleShare}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="share" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Loading indicator for image */}
        {imageLoading && (
          <View style={styles.imageLoadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </Animated.View>
      
      {/* Main Content Scroll */}
      <Animated.ScrollView
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Event Info */}
        <View style={styles.titleSection}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          
          <View style={styles.statusContainer}>
            <View style={[
              styles.statusBadge,
              status === 'upcoming' && styles.upcomingBadge,
              status === 'ongoing' && styles.ongoingBadge,
              status === 'completed' && styles.completedBadge,
            ]}>
              <Text style={[
                styles.statusText,
                status === 'upcoming' && styles.upcomingText,
                status === 'ongoing' && styles.ongoingText,
                status === 'completed' && styles.completedText,
              ]}>
                {status.toUpperCase()}
              </Text>
            </View>
            
            {event.isPaid && (
              <View style={styles.priceBadge}>
                <FontAwesome name="ticket" size={14} color="#D97706" style={{ marginRight: 4 }} />
                <Text style={styles.priceText}>${event.price?.toFixed(2) || '0.00'}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.organizerRow}>
            <FontAwesome name="user" size={14} color="#6B7280" />
            <Text style={styles.organizerText}>
              Organized by {event.organizerName || 'Event Host'}
            </Text>
          </View>
        </View>
        
        {/* Key Details Cards in a Horizontal Scroll */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.detailCardsContainer}
        >
          {/* Date & Time Card */}
          <View style={styles.detailCard}>
            <LinearGradient 
              colors={['#3B82F6', '#1D4ED8']} 
              style={styles.cardIconContainer}
            >
              <FontAwesome name="calendar" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Date & Time</Text>
              <Text style={styles.cardText}>
                {formatDate(event.date)}
              </Text>
              <Text style={styles.cardSubtext}>
                {formatTime(event.time)} - {formatTime(event.endTime || new Date((event.time instanceof Date ? event.time : event.time.toDate()).getTime() + (event.duration || 3 * 60 * 60 * 1000)))}
              </Text>
              {event.timeZone && (
                <Text style={styles.timeZoneText}>{event.timeZone}</Text>
              )}
            </View>
          </View>
          
          {/* Location Card */}
          <View style={styles.detailCard}>
            <LinearGradient 
              colors={['#10B981', '#059669']} 
              style={styles.cardIconContainer}
            >
              <FontAwesome name="map-marker" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Location</Text>
              <Text style={styles.cardText} numberOfLines={2}>
                {event.isVirtual ? 'Virtual Event' : (event.locationDetails?.buildingName || event.location)}
              </Text>
              {!event.isVirtual && event.locationDetails?.city && (
                <Text style={styles.cardSubtext}>
                  {event.locationDetails.city}
                  {event.locationDetails.state ? `, ${event.locationDetails.state}` : ''}
                </Text>
              )}
              {event.isVirtual && event.virtualLink && (
                <Text style={styles.virtualLinkText} numberOfLines={1}>
                  via {new URL(event.virtualLink).hostname}
                </Text>
              )}
            </View>
          </View>
          
          {/* Duration & Capacity Card */}
          <View style={styles.detailCard}>
            <LinearGradient 
              colors={['#F59E0B', '#D97706']} 
              style={styles.cardIconContainer}
            >
              <FontAwesome name="clock-o" size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Duration & Capacity</Text>
              <Text style={styles.cardText}>
                {formatDuration(event.duration)}
              </Text>
              {event.capacity ? (
                <Text style={styles.cardSubtext}>
                  {spotsLeft !== null ? `${spotsLeft} spots left` : `${event.capacity} capacity`}
                </Text>
              ) : (
                <Text style={styles.cardSubtext}>Unlimited capacity</Text>
              )}
            </View>
          </View>
        </ScrollView>
        
        {/* Countdown & Registration Deadline (for upcoming events) */}
        {status === 'upcoming' && (
          <View style={styles.countdownContainer}>
            <View style={styles.countdownContent}>
              <Text style={styles.countdownLabel}>
                {getRelativeDays(event.date)} until the event
              </Text>
              {event.registrationDeadline && (
                <Text style={styles.deadlineText}>
                  Registration closes {formatDate(event.registrationDeadline)}
                </Text>
              )}
            </View>
          </View>
        )}
        
        {/* Description Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Event</Text>
          <Text style={styles.description}>{event.description || 'No description available.'}</Text>
        </View>
        
       {/* Speakers/Performers Section */}
{speakers.length > 0 && (
  <View style={styles.section}>
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>Speakers & Performers</Text>
      <TouchableOpacity onPress={() => setShowSpeakers(!showSpeakers)}>
        <Text style={styles.seeAllText}>
          {showSpeakers ? 'Show Less' : 'See All'}
        </Text>
      </TouchableOpacity>
    </View>
    
    <ScrollView 
      horizontal={!showSpeakers}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.speakersContainer,
        showSpeakers && styles.speakersGridContainer
      ]}
    >
      {(showSpeakers ? speakers : speakers.slice(0, 3)).map((speaker: { name: string; role: string; bio?: string; imageUri?: string }, index) => (
        <View 
          key={`speaker-${index}`} 
          style={[
            styles.speakerCard,
            showSpeakers && styles.speakerCardGrid
          ]}
        >
          {speaker.imageUri ? (
            <Image 
              source={{ uri: speaker.imageUri }} 
              style={styles.speakerImage}
            />
          ) : (
            <View style={styles.speakerImagePlaceholder}>
              <Text style={styles.speakerInitial}>
                {speaker.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.speakerInfo}>
            <Text style={styles.speakerName}>{speaker.name}</Text>
            <Text style={styles.speakerRole}>{speaker.role}</Text>
            {showSpeakers && speaker.bio && (
              <Text style={styles.speakerBio} numberOfLines={3}>{speaker.bio}</Text>
            )}
          </View>
        </View>
      ))}
    </ScrollView>
  </View>
)}

{/* Location Details Section */}
{!event.isVirtual && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Event Location</Text>
    <View style={styles.locationCard}>
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
)}

{/* Virtual Event Link */}
{event.isVirtual && event.virtualLink && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Virtual Event Access</Text>
    <View style={styles.virtualLinkCard}>
      <Text style={styles.virtualLinkLabel}>Access Link:</Text>
      <Text style={styles.virtualLink}>{event.virtualLink}</Text>
      <TouchableOpacity 
        style={styles.openLinkButton}
        onPress={() => Linking.openURL(event.virtualLink || '')}
      >
        <FontAwesome name="external-link" size={16} color="#FFFFFF" />
        <Text style={styles.openLinkButtonText}>Open Link</Text>
      </TouchableOpacity>
    </View>
  </View>
)}

{/* Payment Options for Paid Events */}
{event.isPaid && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Payment Information</Text>
    <View style={styles.paymentCard}>
      <View style={styles.priceRow}>
        <Text style={styles.priceLabel}>Ticket Price:</Text>
        <Text style={styles.priceValue}>${event.price?.toFixed(2) || '0.00'}</Text>
      </View>
      
      <Text style={styles.paymentMethodsLabel}>Accepted Payment Methods:</Text>
      <View style={styles.paymentMethodsContainer}>
        {event.paymentOptions?.map((option, index) => (
          <View key={index} style={styles.paymentMethod}>
            <Text style={styles.paymentMethodText}>{option}</Text>
          </View>
        ))}
        {(!event.paymentOptions || event.paymentOptions.length === 0) && (
          <Text style={styles.noOptionsText}>No specific payment methods specified</Text>
        )}
      </View>
    </View>
  </View>
)}

{/* Cancellation Policy */}
{event.cancellationPolicy && (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>Cancellation Policy</Text>
    <View style={styles.policyCard}>
      <Text style={styles.policyText}>{event.cancellationPolicy}</Text>
    </View>
  </View>
)}

{/* Attendees Section */}
<View style={styles.section}>
  <View style={styles.sectionTitleRow}>
    <Text style={styles.sectionTitle}>Attendees</Text>
    {attendees.length > 5 && (
      <TouchableOpacity onPress={() => setShowAllAttendees(!showAllAttendees)}>
        <Text style={styles.seeAllText}>
          {showAllAttendees ? 'Show Less' : 'See All'}
        </Text>
      </TouchableOpacity>
    )}
  </View>
  
  {attendees.length === 0 ? (
    <View style={styles.emptyAttendeesContainer}>
      <FontAwesome name="users" size={40} color="#D1D5DB" />
      <Text style={styles.emptyAttendeesText}>No attendees yet</Text>
      <Text style={styles.emptyAttendeesSubtext}>Be the first to attend!</Text>
    </View>
  ) : (
    <View style={styles.attendeesContainer}>
      {(showAllAttendees ? attendees : attendees.slice(0, 5)).map((attendee, index) => (
        <View key={`attendee-${index}`} style={styles.attendeeItem}>
          {attendee.avatar ? (
            <Image source={{ uri: attendee.avatar }} style={styles.attendeeAvatar} />
          ) : (
            <View style={styles.attendeeAvatarPlaceholder}>
              <Text style={styles.avatarInitial}>
                {attendee.name?.charAt(0).toUpperCase() || 'A'}
              </Text>
            </View>
          )}
          <View style={styles.attendeeInfo}>
            <Text style={styles.attendeeName}>{attendee.name}</Text>
            <View style={styles.attendeeStatus}>
              <View style={[
                styles.statusDot,
                attendee.checkInStatus === 'checked-in' && styles.checkedInDot,
                attendee.checkInStatus === 'absent' && styles.absentDot
              ]} />
              <Text style={styles.attendeeStatusText}>
                {attendee.checkInStatus === 'checked-in' ? 'Checked In' : 
                 attendee.checkInStatus === 'absent' ? 'Absent' : 'Not Checked In'}
              </Text>
              
              {/* Show payment status badge for paid events */}
              {event.isPaid && (
                <View style={[
                  styles.paymentStatusBadge,
                  attendee.paymentStatus === 'completed' ? styles.paidBadge : styles.pendingBadge
                ]}>
                  <Text style={[
                    styles.paymentStatusText,
                    attendee.paymentStatus === 'completed' ? styles.paidText : styles.pendingText
                  ]}>
                    {attendee.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  )}
</View>

{/* Management Options for Organizer */}
{isOrganizer && (
  <View style={styles.section}>
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
        style={[styles.managementButton, styles.editButton]}
        onPress={() => router.push({
          pathname: "/screens/edit-event",
          params: { id: id }
        })}
      >
        <FontAwesome name="edit" size={20} color="#FFFFFF" />
        <Text style={styles.managementButtonText}>Edit Event</Text>
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

{/* QR Code for Check-in - Only shown to attendees who have paid if required */}
{shouldShowQRCode && (
  <View style={styles.section}>
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

{/* Spacer for bottom buttons */}
<View style={styles.buttonSpacer} />
</Animated.ScrollView>

{/* Bottom Action Button - Fixed at bottom */}
{!isOrganizer && !isAttending && (
  <View style={styles.bottomButtonContainer}>
    <TouchableOpacity
      style={[
        styles.attendButton,
        event.isPaid && styles.paymentButton,
        (spotsLeft !== null && spotsLeft <= 0) && styles.disabledButton
      ]}
      onPress={handleAttend}
      disabled={isLoading || isPaying || (spotsLeft !== null && spotsLeft <= 0)}
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
  </View>
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
  <View style={styles.bottomButtonContainer}>
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
  </View>
)}
</View>
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
header: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1,
  backgroundColor: 'transparent',
  overflow: 'hidden',
},
headerBackground: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
},
headerImage: {
  width: '100%',
  height: '100%',
},
headerImagePlaceholder: {
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},
headerImageText: {
  fontSize: 72,
  fontWeight: 'bold',
  color: 'white',
},
headerGradient: {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 0,
  height: '60%',
},
headerContent: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  justifyContent: 'space-between',
},
headerControls: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingHorizontal: 16,
  paddingTop: Platform.OS === 'ios' ? 50 : 16,
},
headerButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: 'rgba(0,0,0,0.3)',
  justifyContent: 'center',
  alignItems: 'center',
},
headerTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#FFFFFF',
  textShadowColor: 'rgba(0, 0, 0, 0.7)',
  textShadowOffset: { width: 0, height: 1 },
  textShadowRadius: 2,
  maxWidth: 220,
},
imageLoadingOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  justifyContent: 'center',
  alignItems: 'center',
},
scrollContent: {
  paddingTop: HEADER_MAX_HEIGHT,
  paddingBottom: Platform.OS === 'ios' ? 120 : 100,
},
titleSection: {
  padding: 20,
  backgroundColor: '#FFFFFF',
  ...cardShadow,
},
eventTitle: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#1F2937',
  marginBottom: 12,
},
statusContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 12,
},
statusBadge: {
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
},
upcomingBadge: {
  backgroundColor: '#EFF6FF',
},
ongoingBadge: {
  backgroundColor: '#F0FDF4',
},
completedBadge: {
  backgroundColor: '#FEF2F2',
},
statusText: {
  fontSize: 12,
  fontWeight: 'bold',
},
upcomingText: {
  color: '#1D4ED8',
},
ongoingText: {
  color: '#047857',
},
completedText: {
  color: '#B91C1C',
},
priceBadge: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#FEF3C7',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
},
priceText: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#D97706',
},
organizerRow: {
  flexDirection: 'row',
  alignItems: 'center',
},
organizerText: {
  marginLeft: 8,
  fontSize: 14,
  color: '#6B7280',
},
detailCardsContainer: {
  paddingHorizontal: 16,
  paddingVertical: 16,
  gap: 12,
},
detailCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  width: width / 1.5,
  marginRight: 12,
  flexDirection: 'row',
  alignItems: 'center',
  ...cardShadow,
},
cardIconContainer: {
  width: 50,
  height: 50,
  borderRadius: 25,
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
cardContent: {
  flex: 1,
},
cardTitle: {
  fontSize: 14,
  fontWeight: 'bold',
  color: '#4B5563',
  marginBottom: 4,
},
cardText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1F2937',
  marginBottom: 2,
},
cardSubtext: {
  fontSize: 14,
  color: '#6B7280',
},
timeZoneText: {
  fontSize: 12,
  color: '#9CA3AF',
  marginTop: 2,
},
virtualLinkText: {
  fontSize: 14,
  color: '#3B82F6',
  marginTop: 2,
},
countdownContainer: {
  marginHorizontal: 16,
  marginBottom: 16,
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  overflow: 'hidden',
  ...cardShadow,
},
countdownContent: {
  padding: 16,
  alignItems: 'center',
},
countdownLabel: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#1F2937',
  marginBottom: 4,
},
deadlineText: {
  fontSize: 14,
  color: '#EF4444',
},
section: {
  marginHorizontal: 16,
  marginBottom: 20,
},
sectionTitleRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 12,
},
sectionTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#1F2937',
  marginBottom: 12,
},
seeAllText: {
  fontSize: 14,
  color: '#3B82F6',
  fontWeight: '500',
},
description: {
  fontSize: 16,
  lineHeight: 24,
  color: '#4B5563',
},
speakersContainer: {
  paddingVertical: 8,
},
speakersGridContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
},
speakerCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  marginRight: 12,
  flexDirection: 'row',
  alignItems: 'center',
  minWidth: width / 1.5,
  ...cardShadow,
},
speakerCardGrid: {
  width: '48%',
  marginRight: 0,
  marginBottom: 12,
},
speakerImage: {
  width: 60,
  height: 60,
  borderRadius: 30,
  marginRight: 12,
},
speakerImagePlaceholder: {
  width: 60,
  height: 60,
  borderRadius: 30,
  backgroundColor: '#60A5FA',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
speakerInitial: {
  fontSize: 24,
  fontWeight: 'bold',
  color: '#FFFFFF',
},
speakerInfo: {
  flex: 1,
},
speakerName: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#1F2937',
  marginBottom: 2,
},
speakerRole: {
  fontSize: 14,
  color: '#6B7280',
},
speakerBio: {
  fontSize: 14,
  color: '#4B5563',
  marginTop: 8,
  lineHeight: 20,
},
locationCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  ...cardShadow,
},
buildingName: {
  fontSize: 16,
  fontWeight: 'bold',
  color: '#1F2937',
  marginBottom: 4,
},
address: {
  fontSize: 16,
  color: '#4B5563',
},
cityStateZip: {
  fontSize: 14,
  color: '#6B7280',
  marginBottom: 16,
},
directionsButton: {
  backgroundColor: '#3B82F6',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
  ...buttonShadow,
},
directionsButtonText: {
  color: '#FFFFFF',
  fontWeight: '600',
  fontSize: 16,
  marginLeft: 8,
},
virtualLinkCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  ...cardShadow,
},
virtualLinkLabel: {
  fontSize: 14,
  fontWeight: '500',
  color: '#6B7280',
  marginBottom: 4,
},
virtualLink: {
  fontSize: 16,
  color: '#3B82F6',
  fontWeight: '500',
  marginBottom: 16,
},
openLinkButton: {
  backgroundColor: '#3B82F6',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 12,
  paddingHorizontal: 20,
  borderRadius: 8,
  ...buttonShadow,
},
openLinkButtonText: {
  color: '#FFFFFF',
  fontWeight: '600',
  fontSize: 16,
  marginLeft: 8,
},
paymentCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  ...cardShadow,
},
priceRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
},
priceLabel: {
  fontSize: 16,
  color: '#4B5563',
},
priceValue: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#059669',
},
paymentMethodsLabel: {
  fontSize: 14,
  color: '#6B7280',
  marginBottom: 8,
},
paymentMethodsContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
},
paymentMethod: {
  backgroundColor: '#F3F4F6',
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 16,
  marginRight: 8,
  marginBottom: 8,
},
paymentMethodText: {
  fontSize: 14,
  color: '#4B5563',
},
noOptionsText: {
  fontSize: 14,
  fontStyle: 'italic',
  color: '#9CA3AF',
},
policyCard: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  ...cardShadow,
},
policyText: {
  fontSize: 14,
  lineHeight: 22,
  color: '#4B5563',
},
attendeesContainer: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 16,
  ...cardShadow,
},
emptyAttendeesContainer: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 24,
  alignItems: 'center',
  ...cardShadow,
},
emptyAttendeesText: {
  fontSize: 16,
  fontWeight: '600',
  color: '#4B5563',
  marginTop: 12,
},
emptyAttendeesSubtext: {
  fontSize: 14,
  color: '#6B7280',
  marginTop: 4,
},
attendeeItem: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 16,
  paddingBottom: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
attendeeAvatar: {
  width: 50,
  height: 50,
  borderRadius: 25,
  marginRight: 12,
},
attendeeAvatarPlaceholder: {
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: '#60A5FA',
  justifyContent: 'center',
  alignItems: 'center',
  marginRight: 12,
},
avatarInitial: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#FFFFFF',
},
attendeeInfo: {
  flex: 1,
},
attendeeName: {
  fontSize: 16,
  fontWeight: '600',
  color: '#1F2937',
  marginBottom: 4,
},
attendeeStatus: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
},
statusDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#9CA3AF',
  marginRight: 6,
},
checkedInDot: {
  backgroundColor: '#10B981',
},
absentDot: {
  backgroundColor: '#EF4444',
},
attendeeStatusText: {
  fontSize: 14,
  color: '#6B7280',
  marginRight: 8,
},
paymentStatusBadge: {
  paddingHorizontal: 8,
  paddingVertical: 2,
  borderRadius: 12,
  marginTop: 4,
},
paidBadge: {
  backgroundColor: '#DBEAFE',
},
pendingBadge: {
  backgroundColor: '#FEF3C7',
},
paymentStatusText: {
  fontSize: 12,
  fontWeight: '500',
},
paidText: {
  color: '#1D4ED8',
},
pendingText: {
  color: '#D97706',
},
managementButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginBottom: 16,
},
managementButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#3B82F6',
  paddingVertical: 12,
  borderRadius: 8,
  marginHorizontal: 4,
  ...buttonShadow,
},
editButton: {
  backgroundColor: '#10B981',
},
deleteButton: {
  backgroundColor: '#EF4444',
},
managementButtonText: {
  color: '#FFFFFF',
  fontWeight: '600',
  fontSize: 14,
  marginLeft: 8,
},
attendeeManagementContainer: {
  marginTop: 8,
},
qrContainer: {
  backgroundColor: '#FFFFFF',
  borderRadius: 12,
  padding: 20,
  alignItems: 'center',
  ...cardShadow,
},
qrInstructions: {
  fontSize: 14,
  color: '#6B7280',
  textAlign: 'center',
  marginTop: 16,
  maxWidth: 250,
},
paymentReminderContainer: {
  backgroundColor: '#FEF2F2',
  borderRadius: 12,
  padding: 16,
  marginTop: 16,
  marginHorizontal: 16,
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
  paddingVertical: 10,
  borderRadius: 8,
  ...buttonShadow,
},
completePaymentText: {
  color: '#FFFFFF',
  fontWeight: '600',
  fontSize: 14,
},
buttonSpacer: {
  height: 80, // Space for bottom button
},
bottomButtonContainer: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  paddingHorizontal: 16,
  paddingVertical: 16,
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  borderTopWidth: 1,
  borderTopColor: '#E5E7EB',
  paddingBottom: Platform.OS === 'ios' ? 34 : 16, // Account for iOS bottom area
},
attendButton: {
  backgroundColor: '#3B82F6',
  padding: 16,
  borderRadius: 12,
  alignItems: 'center',
  ...buttonShadow,
},
attendingButton: {
  backgroundColor: '#EF4444',
},
paymentButton: {
  backgroundColor: '#059669',
},
disabledButton: {
  backgroundColor: '#9CA3AF',
  opacity: 0.7,
},
attendButtonText: {
  color: '#FFFFFF',
  fontSize: 16,
  fontWeight: '600',
},
payButtonContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
},
paymentIcon: {
  marginRight: 8,
},
viewHistoryButton: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 12,
  marginBottom: 24,
},
viewHistoryText: {
  color: '#4B5563',
  fontSize: 14,
  fontWeight: '500',
  marginLeft: 8,
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
errorText: {
  fontSize: 16,
  color: '#EF4444',
  textAlign: 'center',
  marginTop: 20,
}
});


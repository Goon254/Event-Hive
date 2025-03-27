// app/screens/QRCodeScreen.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator, StatusBar, SafeAreaView } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import eventService, { Event as EventType } from '../services/eventServices';

export default function QRCodeScreen() {
  const { eventId } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const qrValue = `scangoapp://event-checkin/${eventId}/${user?.id || 'guest'}`;

  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId) return;
      try {
        setIsLoading(true);
        const eventData = await eventService.getEventById(eventId.toString());
        if (eventData) {
          setEvent(eventData as EventType);
        } else {
          router.back();
        }
      } catch (error) {
        console.error('Error fetching event:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  const handleShare = async () => {
    if (!event) return;
    try {
      await Share.share({
        title: `Check-in QR code for ${event.title}`,
        message: `Scan this QR code to check in to ${event.title}`,
        url: qrValue
      });
    } catch (error) {
      console.error('Error sharing QR code:', error);
    }
  };

  const formatDate = (date?: Date | { toDate: () => Date }) => {
      if (!date) return 'N/A';
      const eventDate = date instanceof Date ? date : date.toDate();
      return eventDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    };
  
  const formatTime = (time?: Date | { toDate: () => Date }) => {
      if (!time) return 'N/A';
      const eventTime = time instanceof Date ? time : time.toDate();
      return eventTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <FontAwesome name="arrow-left" size={22} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check-in QR Code</Text>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <FontAwesome name="share-alt" size={22} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.eventTitle}>{event?.title}</Text>
            
            <View style={styles.qrWrapper}>
              <View style={styles.qrContainer}>
                <QRCode
                  value={qrValue}
                  size={220}
                  backgroundColor="white"
                  color="#000"
                  logoBackgroundColor="white"
                />
              </View>
              <Text style={styles.instructions}>
                Present this QR code for check-in
              </Text>
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <FontAwesome name="calendar" size={18} color="#6B7280" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Date & Time</Text>
                  <Text style={styles.infoText}>
                    {formatDate(event?.date)} at {formatTime(event?.time)}
                  </Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <FontAwesome name="map-marker" size={18} color="#6B7280" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Location</Text>
                  <Text style={styles.infoText}>{event?.location || 'Not specified'}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.infoRow}>
                <FontAwesome name="user" size={18} color="#6B7280" style={styles.infoIcon} />
                <View>
                  <Text style={styles.infoLabel}>Attendee</Text>
                  <Text style={styles.infoText}>{user?.name || "Anonymous"}</Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.note}>
              This QR code is unique to you and this event. Do not share unless intended for someone else to check in.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
  },
  backButton: {
    padding: 8,
  },
  shareButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  instructions: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  infoIcon: {
    marginRight: 16,
    marginTop: 2,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  note: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
// app/screens/PaymentHistory.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  RefreshControl,
  Alert
} from 'react-native';
import DSButton from '../components/design-system/Button';
import Card from '../components/design-system/Card';
import { useRouter } from 'expo-router';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { createShadow } from '../utils/platformUtils';
import enhancedPaymentService, { PaymentIntent } from '../services/enhancedPaymentService';
import eventService from '../services/eventServices';

interface PaymentHistoryItem extends PaymentIntent {
  eventTitle?: string;
  date: Date;
}

export default function PaymentHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user's payment history
  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true);
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view your payment history.');
        router.back();
        return;
      }
      
      // In a real app, we would query all payments related to this user
      // For demo purposes, we'll generate some sample data
      
      // First get all events the user is attending
      const attendingEvents = await eventService.getUserAttendingEvents(user.id);
      
      // Create mock payment data for these events
      const mockPayments: PaymentHistoryItem[] = [];
      
      for (const event of attendingEvents.items ?? []) {
        if (event.isPaid) {
          // Simulate 1-2 payments per paid event
          const randomDate = new Date();
          randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));
          
          mockPayments.push({
            id: `pi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            clientSecret: 'sample_secret',
            amount: (event.price || 0) * 100, // cents
            status: 'succeeded',
            createdAt: { toDate: () => randomDate } as any,
            date: randomDate,
            eventTitle: event.title
          });
        }
      }
      
      setPayments(mockPayments);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      Alert.alert('Error', 'Failed to load payment history');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPaymentHistory();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPaymentHistory();
  };

  // Format amount from cents to dollars
  const formatAmount = (amount: number): string => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render payment item
  const renderPaymentItem = ({ item }: { item: PaymentHistoryItem }) => (
    <Card style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <Text style={styles.paymentTitle}>{item.eventTitle || 'Event Ticket'}</Text>
        <View style={[
          styles.statusBadge,
          item.status === 'succeeded' && styles.successBadge
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'succeeded' && styles.successText
          ]}>
            {item.status === 'succeeded' ? 'Paid' : item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.paymentInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Amount</Text>
          <Text style={styles.infoValue}>{formatAmount(item.amount)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>
          <Text style={styles.infoValue}>{formatDate(item.date)}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Payment ID</Text>
          <Text style={styles.infoValue} numberOfLines={1}>{item.id}</Text>
        </View>
      </View>
      
      <DSButton
        title="View Receipt"
        onPress={() => Alert.alert('Coming Soon', 'Receipt functionality will be available in a future update.')}
        variant="ghost"
        rightIcon={<FontAwesome name="file" size={14} color="#007AFF" />}
      />
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <FontAwesome name="arrow-left" size={20} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={{ width: 20 }} />
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading payment history...</Text>
        </View>
      ) : payments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FontAwesome name="credit-card" size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Payment History</Text>
          <Text style={styles.emptyText}>
            You haven't made any payments for events yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={payments}
          renderItem={renderPaymentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

// Create platform-specific shadows
const cardShadow = createShadow(2);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...cardShadow,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
  listContainer: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    ...cardShadow,
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  successBadge: {
    backgroundColor: '#D1FAE5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  successText: {
    color: '#047857',
  },
  paymentInfo: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    maxWidth: '60%',
    textAlign: 'right',
  },
  receiptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  receiptButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  }
});
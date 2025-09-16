// app/screens/payment-methods.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShadow, safeTopPadding } from '../utils/platformUtils';
import DSButton from '../components/design-system/Button';
import Card from '../components/design-system/Card';
import Divider from '../components/design-system/Divider';

interface PaymentMethod {
  id: string;
  type: 'credit' | 'paypal' | 'bank';
  isDefault: boolean;
  lastFour?: string;
  expiryDate?: string;
  cardType?: 'visa' | 'mastercard' | 'amex' | 'discover';
  name: string;
  email?: string;
  bankName?: string;
  accountNumber?: string;
}

export default function PaymentMethodsScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardName, setNewCardName] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCVC, setNewCardCVC] = useState('');
  const [isAddingCard, setIsAddingCard] = useState(false);

  // Fetch payment methods
  useEffect(() => {
    if (user) {
      // Simulate API call to fetch payment methods
      setTimeout(() => {
        setPaymentMethods([
          {
            id: '1',
            type: 'credit',
            isDefault: true,
            lastFour: '4242',
            expiryDate: '12/25',
            cardType: 'visa',
            name: 'John Doe',
          },
          {
            id: '2',
            type: 'paypal',
            isDefault: false,
            email: 'john.doe@example.com',
            name: 'PayPal Account',
          },
          {
            id: '3',
            type: 'bank',
            isDefault: false,
            bankName: 'Chase Bank',
            accountNumber: '****6789',
            name: 'Checking Account',
          },
        ]);
        setIsLoading(false);
      }, 1000);
    }
  }, [user]);

  // Handle setting a payment method as default
  const handleSetDefault = (id: string) => {
    setPaymentMethods(
      paymentMethods.map(method => ({
        ...method,
        isDefault: method.id === id,
      }))
    );
    
    // Show success message
    Alert.alert('Success', 'Default payment method updated.');
  };

  // Handle deleting a payment method
  const handleDelete = (id: string) => {
    Alert.alert(
      'Delete Payment Method',
      'Are you sure you want to delete this payment method?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Check if trying to delete default payment method
            const isDefault = paymentMethods.find(method => method.id === id)?.isDefault;
            
            if (isDefault && paymentMethods.length > 1) {
              Alert.alert(
                'Cannot Delete Default',
                'Please set another payment method as default before deleting this one.'
              );
              return;
            }
            
            // Remove the payment method
            setPaymentMethods(paymentMethods.filter(method => method.id !== id));
            Alert.alert('Success', 'Payment method deleted successfully.');
          },
        },
      ]
    );
  };

  // Format card number input with spaces
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    return formatted;
  };

  // Format expiry date with slash
  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 3) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  // Handle adding new card
  const handleAddCard = () => {
    // Validate inputs
    if (newCardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Error', 'Please enter a valid card number');
      return;
    }
    
    if (newCardName.trim() === '') {
      Alert.alert('Error', 'Please enter the name on card');
      return;
    }
    
    if (newCardExpiry.length < 5) {
      Alert.alert('Error', 'Please enter a valid expiration date (MM/YY)');
      return;
    }
    
    if (newCardCVC.length < 3) {
      Alert.alert('Error', 'Please enter a valid CVC');
      return;
    }
    
    setIsAddingCard(true);
    
    // Simulate API call to add card
    setTimeout(() => {
      const lastFour = newCardNumber.replace(/\s/g, '').slice(-4);
      
      // Determine card type based on first digit
      let cardType: 'visa' | 'mastercard' | 'amex' | 'discover' = 'visa';
      const firstDigit = newCardNumber.charAt(0);
      if (firstDigit === '4') cardType = 'visa';
      else if (firstDigit === '5') cardType = 'mastercard';
      else if (firstDigit === '3') cardType = 'amex';
      else if (firstDigit === '6') cardType = 'discover';
      
      // Add new card to list
      const newCard: PaymentMethod = {
        id: Date.now().toString(),
        type: 'credit',
        isDefault: paymentMethods.length === 0, // Make default if it's the only one
        lastFour,
        expiryDate: newCardExpiry,
        cardType,
        name: newCardName,
      };
      
      setPaymentMethods([...paymentMethods, newCard]);
      setModalVisible(false);
      setIsAddingCard(false);
      
      // Reset form
      setNewCardNumber('');
      setNewCardName('');
      setNewCardExpiry('');
      setNewCardCVC('');
      
      Alert.alert('Success', 'Card added successfully');
    }, 1500);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading payment methods...</Text>
      </View>
    );
  }

  // Get card icon based on card type
  const getCardIcon = (cardType?: 'visa' | 'mastercard' | 'amex' | 'discover') => {
    switch (cardType) {
      case 'visa':
        return require('../../assets/images/visa.png');
      case 'mastercard':
        return require('../../assets/images/mastercard.png');
      case 'amex':
        return require('../../assets/images/amex.png');
      case 'discover':
        return require('../../assets/images/discover.png');
      default:
        return require('../../assets/images/credit-card.png');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[
        styles.header,
        { paddingTop: Math.max(insets.top, 20) }
      ]}>
        <TouchableOpacity 
          onPress={() => router.back()}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          style={styles.backButton}
        >
          <FontAwesome name="arrow-left" size={20} color="#1F2937" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Payment Methods</Text>
        
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Payment Methods List */}
        {paymentMethods.length > 0 ? (
          <View style={styles.paymentMethodsContainer}>
            {paymentMethods.map((method) => (
              <Card key={method.id} style={styles.paymentMethodCard}>
                {/* Left side - Card icon/info */}
                <View style={styles.paymentCardLeft}>
                  {method.type === 'credit' && (
                    <Image 
                      source={getCardIcon(method.cardType)}
                      style={styles.cardTypeIcon}
                      resizeMode="contain"
                    />
                  )}
                  
                  {method.type === 'paypal' && (
                    <View style={[styles.methodIconContainer, { backgroundColor: '#0070BA' }]}>
                      <FontAwesome name="paypal" size={20} color="#FFFFFF" />
                    </View>
                  )}
                  
                  {method.type === 'bank' && (
                    <View style={[styles.methodIconContainer, { backgroundColor: '#10B981' }]}>
                      <FontAwesome name="bank" size={20} color="#FFFFFF" />
                    </View>
                  )}
                  
                  <View style={styles.paymentCardInfo}>
                    <Text style={styles.paymentCardTitle}>
                      {method.type === 'credit' 
                        ? `•••• ${method.lastFour}`
                        : method.type === 'paypal' 
                          ? 'PayPal'
                          : method.bankName}
                    </Text>
                    
                    <Text style={styles.paymentCardSubtitle}>
                      {method.type === 'credit' 
                        ? `Expires ${method.expiryDate}`
                        : method.type === 'paypal' 
                          ? method.email
                          : `Account ending in ${method.accountNumber?.slice(-4)}`}
                    </Text>
                    
                    {method.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {/* Right side - Actions */}
                <View style={styles.paymentCardActions}>
                  {!method.isDefault && (
                    <DSButton title="Set Default" onPress={() => handleSetDefault(method.id)} variant="ghost" />
                  )}
                  
                  <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(method.id)}>
                    <FontAwesome name="trash-o" size={18} color="#F43F5E" />
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="credit-card-off-outline" size={60} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>No Payment Methods</Text>
            <Text style={styles.emptyText}>
              You haven't added any payment methods yet. Add one to easily pay for event tickets.
            </Text>
          </View>
        )}
        
        {/* Add Payment Method Button */}
        <DSButton title="Add Payment Method" onPress={() => setModalVisible(true)} />
        
        {/* Payment Methods Info */}
        <View style={styles.infoCard}>
          <MaterialCommunityIcons name="shield-check" size={22} color="#10B981" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Your payment information is securely encrypted and stored. We never store your full card details.
          </Text>
        </View>
      </ScrollView>
      
      {/* Add Card Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Payment Method</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
              >
                <FontAwesome name="times" size={20} color="#1F2937" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView}>
              {/* Card Number */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Card Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="1234 5678 9012 3456"
                  keyboardType="number-pad"
                  value={newCardNumber}
                  onChangeText={(text) => {
                    const formatted = formatCardNumber(text);
                    if (formatted.length <= 19) { // 16 digits plus 3 spaces
                      setNewCardNumber(formatted);
                    }
                  }}
                  maxLength={19}
                />
              </View>
              
              {/* Name on Card */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Name on Card</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={newCardName}
                  onChangeText={setNewCardName}
                  autoCapitalize="words"
                />
              </View>
              
              <View style={styles.rowInputs}>
                {/* Expiry Date */}
                <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Expiry Date</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="MM/YY"
                    keyboardType="number-pad"
                    value={newCardExpiry}
                    onChangeText={(text) => {
                      const formatted = formatExpiryDate(text);
                      if (formatted.length <= 5) {
                        setNewCardExpiry(formatted);
                      }
                    }}
                    maxLength={5}
                  />
                </View>
                
                {/* CVC */}
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>CVC</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    keyboardType="number-pad"
                    value={newCardCVC}
                    onChangeText={(text) => {
                      if (text.length <= 4) {
                        setNewCardCVC(text);
                      }
                    }}
                    maxLength={4}
                    secureTextEntry={true}
                  />
                </View>
              </View>
              
              {/* Add Card Button */}
              <DSButton title="Add Card" onPress={handleAddCard} loading={isAddingCard} />
              
              {/* Security Note */}
              <View style={styles.securityNote}>
                <MaterialCommunityIcons name="lock" size={16} color="#6B7280" />
                <Text style={styles.securityNoteText}>
                  Your card information is secure and encrypted
                </Text>
              </View>
              
              {/* Payment Method Icons */}
              <View style={styles.cardIcons}>
                <Image source={require('../../assets/images/visa.png')} style={styles.acceptedCardIcon} />
                <Image source={require('../../assets/images/mastercard.png')} style={styles.acceptedCardIcon} />
                <Image source={require('../../assets/images/amex.png')} style={styles.acceptedCardIcon} />
                <Image source={require('../../assets/images/discover.png')} style={styles.acceptedCardIcon} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Platform-specific shadows
const cardShadow = createShadow(2);
const buttonShadow = createShadow(1);

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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    ...cardShadow,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
    color: '#1F2937',
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 40,
  },
  paymentMethodsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  paymentMethodCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...cardShadow,
  },
  paymentCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTypeIcon: {
    width: 40,
    height: 30,
  },
  methodIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  paymentCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  paymentCardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  defaultBadgeText: {
    color: '#1D4ED8',
    fontSize: 12,
    fontWeight: '500',
  },
  paymentCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setDefaultButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginRight: 12,
  },
  setDefaultText: {
    color: '#4B5563',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginVertical: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: '80%',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    marginHorizontal: 16,
    borderRadius: 10,
    ...buttonShadow,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    ...cardShadow,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    ...cardShadow,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalScrollView: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  rowInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
    ...buttonShadow,
  },
  addCardButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  securityNoteText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 6,
  },
  cardIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  acceptedCardIcon: {
    width: 50,
    height: 30,
    marginHorizontal: 5,
    resizeMode: 'contain',
  },
});
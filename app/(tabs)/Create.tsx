// app/(tabs)/Create.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../AuthContext';
import eventService from '../services/eventServices';
import ImageUpload from '../container/events/ImageUpload';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface EventForm {
  title: string;
  description: string;
  date: Date;
  time: Date;
  buildingName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  capacity: string;
  isPrivate: boolean;
  isPaid: boolean;
  price: string;
  paymentOptions: string[];
  imageUri: string | null;
}

interface FormErrors {
  title?: string;
  address?: string;
  city?: string;
  date?: string;
  time?: string;
  capacity?: string;
  price?: string;
}

// Payment method options
const PAYMENT_OPTIONS = [
  'Credit Card',
  'PayPal',
  'Bank Transfer',
  'Cash at Door',
  'Venmo'
];

export default function CreateEventScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<EventForm>({
    title: '',
    description: '',
    date: new Date(),
    time: new Date(),
    buildingName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    capacity: '',
    isPrivate: false,
    isPaid: false,
    price: '',
    paymentOptions: ['Credit Card', 'PayPal'],
    imageUri: null,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading, router]);

  const handleImageSelected = (uri: string) => {
    setFormData({ ...formData, imageUri: uri });
  };

  // Function to upload image to Firebase Storage
  const uploadImage = async (uri: string): Promise<string> => {
    try {
      const storage = getStorage();
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const eventImagesRef = ref(storage, `event-images/${Date.now()}_${filename}`);
      
      // Fetch the image as a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Upload blob to Firebase Storage
      await uploadBytes(eventImagesRef, blob);
      
      // Get download URL
      const downloadURL = await getDownloadURL(eventImagesRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required';
      isValid = false;
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
      isValid = false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      errors.date = 'Date cannot be in the past';
      isValid = false;
    }

    if (formData.capacity && isNaN(Number(formData.capacity))) {
      errors.capacity = 'Capacity must be a number';
      isValid = false;
    }

    if (formData.isPaid) {
      if (!formData.price.trim()) {
        errors.price = 'Price is required for paid events';
        isValid = false;
      } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
        errors.price = 'Price must be a positive number';
        isValid = false;
      }
      
      if (formData.paymentOptions.length === 0) {
        Alert.alert('Validation Error', 'Please select at least one payment method');
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const togglePaymentOption = (option: string) => {
    if (formData.paymentOptions.includes(option)) {
      setFormData({
        ...formData,
        paymentOptions: formData.paymentOptions.filter(item => item !== option)
      });
    } else {
      setFormData({
        ...formData,
        paymentOptions: [...formData.paymentOptions, option]
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please check all required fields');
      return;
    }

    if (!user) {
      Alert.alert('Authentication Error', 'You must be logged in to create an event');
      return;
    }

    try {
      setIsSubmitting(true);

      // Upload image if selected
      let imageUrl = null;
      if (formData.imageUri) {
        imageUrl = await uploadImage(formData.imageUri);
      }

      // Format a complete location string
      const locationString = `${formData.buildingName ? formData.buildingName + ', ' : ''}${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`.trim();

      // Convert form data to the structure expected by the service
      const eventData = {
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: locationString,
        locationDetails: {
          buildingName: formData.buildingName.trim(),
          address: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          zipCode: formData.zipCode.trim()
        },
        capacity: Number(formData.capacity) || 0,
        isPrivate: formData.isPrivate,
        isPaid: formData.isPaid,
        price: formData.isPaid ? Number(formData.price) : 0,
        paymentOptions: formData.isPaid ? formData.paymentOptions : [],
        createdBy: user.id,
        organizerName: user.name || 'Event Host',
        createdAt: new Date(),
        imageUrl: imageUrl,
      };

      // Save to Firebase using the event service
      const createdEvent = await eventService.createEvent(eventData);

      Alert.alert(
        'Success', 
        'Event created successfully', 
        [
          { 
            text: 'View Event', 
            onPress: () => router.push({
              pathname: "/screens/eventdetails",
              params: { id: createdEvent.id }
            })
          },
          { 
            text: 'Create Another', 
            onPress: () => {
              // Reset form
              setFormData({
                title: '',
                description: '',
                date: new Date(),
                time: new Date(),
                buildingName: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                capacity: '',
                isPrivate: false,
                isPaid: false,
                price: '',
                paymentOptions: ['Credit Card', 'PayPal'],
                imageUri: null,
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            disabled={isSubmitting}
            accessibilityLabel="Go back"
          >
            <FontAwesome name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Event</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting || authLoading}
            accessibilityLabel="Create event"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.createButton}>Create</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.form}>
          {/* Event Image Upload */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Event Image</Text>
            <ImageUpload
              onImageSelected={handleImageSelected}
              initialImage={formData.imageUri || undefined}
            />
          </View>

          {/* Basic Event Info */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Event Title*</Text>
            <TextInput
              style={[styles.input, formErrors.title && styles.inputError]}
              value={formData.title}
              onChangeText={(text) => {
                setFormData({ ...formData, title: text });
                if (formErrors.title) {
                  setFormErrors({ ...formErrors, title: undefined });
                }
              }}
              placeholder="Enter event title"
              editable={!isSubmitting}
              accessibilityLabel="Event title input"
            />
            {formErrors.title && (
              <Text style={styles.errorText}>{formErrors.title}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Enter event description"
              multiline
              numberOfLines={4}
              editable={!isSubmitting}
              accessibilityLabel="Event description input"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Date*</Text>
              <TouchableOpacity
                style={[styles.dateButton, formErrors.date && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
                disabled={isSubmitting}
                accessibilityLabel="Select date"
              >
                <Text>{formData.date.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {formErrors.date && (
                <Text style={styles.errorText}>{formErrors.date}</Text>
              )}
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Time*</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowTimePicker(true)}
                disabled={isSubmitting}
                accessibilityLabel="Select time"
              >
                <Text>{formData.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Event Location</Text>
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Building/Venue Name</Text>
              <TextInput
                style={styles.input}
                value={formData.buildingName}
                onChangeText={(text) => setFormData({ ...formData, buildingName: text })}
                placeholder="e.g. Convention Center, Stadium"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Address*</Text>
              <TextInput
                style={[styles.input, formErrors.address && styles.inputError]}
                value={formData.address}
                onChangeText={(text) => {
                  setFormData({ ...formData, address: text });
                  if (formErrors.address) {
                    setFormErrors({ ...formErrors, address: undefined });
                  }
                }}
                placeholder="Street address"
                editable={!isSubmitting}
              />
              {formErrors.address && (
                <Text style={styles.errorText}>{formErrors.address}</Text>
              )}
            </View>

            <View style={styles.locationRow}>
              <View style={[styles.formGroup, { flex: 1.5 }]}>
                <Text style={styles.label}>City*</Text>
                <TextInput
                  style={[styles.input, formErrors.city && styles.inputError]}
                  value={formData.city}
                  onChangeText={(text) => {
                    setFormData({ ...formData, city: text });
                    if (formErrors.city) {
                      setFormErrors({ ...formErrors, city: undefined });
                    }
                  }}
                  placeholder="City"
                  editable={!isSubmitting}
                />
                {formErrors.city && (
                  <Text style={styles.errorText}>{formErrors.city}</Text>
                )}
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>State</Text>
                <TextInput
                  style={styles.input}
                  value={formData.state}
                  onChangeText={(text) => setFormData({ ...formData, state: text })}
                  placeholder="State"
                  editable={!isSubmitting}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.label}>Zip Code</Text>
                <TextInput
                  style={styles.input}
                  value={formData.zipCode}
                  onChangeText={(text) => setFormData({ ...formData, zipCode: text })}
                  placeholder="ZIP"
                  keyboardType="numeric"
                  editable={!isSubmitting}
                />
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Capacity</Text>
            <TextInput
              style={[styles.input, formErrors.capacity && styles.inputError]}
              value={formData.capacity}
              onChangeText={(text) => {
                setFormData({ ...formData, capacity: text });
                if (formErrors.capacity) {
                  setFormErrors({ ...formErrors, capacity: undefined });
                }
              }}
              placeholder="Enter maximum attendees"
              keyboardType="numeric"
              editable={!isSubmitting}
              accessibilityLabel="Event capacity input"
            />
            {formErrors.capacity && (
              <Text style={styles.errorText}>{formErrors.capacity}</Text>
            )}
          </View>

          {/* Payment Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Event Pricing</Text>
          </View>

          <View style={styles.settings}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Paid Event</Text>
              <Switch
                value={formData.isPaid}
                onValueChange={(value) => {
                  setFormData({ 
                    ...formData, 
                    isPaid: value,
                    // Reset price if switching to free
                    price: value ? formData.price : ''
                  });
                }}
                disabled={isSubmitting}
              />
            </View>

            {formData.isPaid && (
              <>
                <View style={styles.pricingContainer}>
                  <Text style={styles.label}>Ticket Price*</Text>
                  <View style={styles.priceInputContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <TextInput
                      style={[styles.priceInput, formErrors.price && styles.inputError]}
                      value={formData.price}
                      onChangeText={(text) => {
                        setFormData({ ...formData, price: text });
                        if (formErrors.price) {
                          setFormErrors({ ...formErrors, price: undefined });
                        }
                      }}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      editable={!isSubmitting}
                      accessibilityLabel="Event price input"
                    />
                  </View>
                  {formErrors.price && (
                    <Text style={styles.errorText}>{formErrors.price}</Text>
                  )}

                  <Text style={[styles.label, { marginTop: 16 }]}>Payment Methods*</Text>
                  <Text style={styles.helperText}>Select all payment methods you'll accept:</Text>
                  
                  <View style={styles.paymentOptionsContainer}>
                    {PAYMENT_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.paymentOptionItem,
                          formData.paymentOptions.includes(option) && styles.paymentOptionSelected
                        ]}
                        onPress={() => togglePaymentOption(option)}
                        disabled={isSubmitting}
                      >
                        <Text 
                          style={[
                            styles.paymentOptionText,
                            formData.paymentOptions.includes(option) && styles.paymentOptionTextSelected
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Other Settings */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Event Settings</Text>
          </View>

          <View style={styles.settings}>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Private Event</Text>
              <Switch
                value={formData.isPrivate}
                onValueChange={(value) =>
                  setFormData({ ...formData, isPrivate: value })
                }
                disabled={isSubmitting}
              />
            </View>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={formData.date}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) {
                setFormData({ ...formData, date: selectedDate });
                if (formErrors.date) {
                  setFormErrors({ ...formErrors, date: undefined });
                }
              }
            }}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={formData.time}
            mode="time"
            display="default"
            onChange={(event, selectedDate) => {
              setShowTimePicker(false);
              if (selectedDate) {
                setFormData({ ...formData, time: selectedDate });
              }
            }}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createButton: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  dateButton: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settings: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  settingLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  pricingContainer: {
    padding: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#4B5563',
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 10,
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  paymentOptionItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: 'white',
  },
  paymentOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  paymentOptionText: {
    color: '#4B5563',
    fontSize: 14,
  },
  paymentOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  locationContainer: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
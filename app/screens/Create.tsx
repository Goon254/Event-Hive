// app/(tabs)/Create.tsx
import React, { useState, useEffect, useRef } from 'react';
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
  Image,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../AuthContext';
import eventService from '../services/eventServices';
import ImageUpload from '../container/events/ImageUpload';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BlurView } from 'expo-blur';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Define event categories
const EVENT_CATEGORIES = [
  'Conference',
  'Workshop',
  'Networking',
  'Party',
  'Concert',
  'Exhibition',
  'Seminar',
  'Webinar',
  'Sports',
  'Charity',
  'Festival',
  'Meetup',
  'Other'
];

// Define time zones
const TIME_ZONES = [
  'UTC-12:00',
  'UTC-11:00',
  'UTC-10:00',
  'UTC-09:00',
  'UTC-08:00',
  'UTC-07:00',
  'UTC-06:00',
  'UTC-05:00',
  'UTC-04:00',
  'UTC-03:00',
  'UTC-02:00',
  'UTC-01:00',
  'UTC+00:00',
  'UTC+01:00',
  'UTC+02:00',
  'UTC+03:00',
  'UTC+04:00',
  'UTC+05:00',
  'UTC+06:00',
  'UTC+07:00',
  'UTC+08:00',
  'UTC+09:00',
  'UTC+10:00',
  'UTC+11:00',
  'UTC+12:00',
  'UTC+13:00',
  'UTC+14:00',
];

// Payment method options
const PAYMENT_OPTIONS = [
  'Credit Card',
  'PayPal',
  'Bank Transfer',
  'Cash at Door',
  'Venmo',
  'Apple Pay',
];

// Country list for international address support
const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'China',
  'India',
  'Brazil',
  'Mexico',
  'South Africa',
  'Nigeria',
  'Kenya',
  'Egypt',
  'Saudi Arabia',
  'United Arab Emirates',
  'Singapore',
  'Malaysia',
  'Indonesia',
  'Thailand',
  'Vietnam',
  'Philippines',
  'South Korea',
  'Russia',
  'Italy',
  'Spain',
  'Netherlands',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Switzerland',
  'Austria',
  'Belgium',
  'Portugal',
  'Greece',
  'Turkey',
  'Israel',
  'New Zealand',
  'Argentina',
  'Chile',
  'Colombia',
  'Peru',
  'Venezuela',
  'Other',
];

// Ticket types
interface TicketType {
  id: string;
  name: string;
  price: string;
  quantity: string;
  description: string;
}

// Custom field for registration
interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'checkbox' | 'select';
  required: boolean;
  options?: string[]; // For select fields
}

// Speaker/performer
interface Speaker {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUri: string | null;
}

interface EventForm {
  title: string;
  description: string;
  category: string;
  tags: string[];
  date: Date;
  endDate: Date;
  time: Date;
  endTime: Date;
  timeZone: string;
  isVirtual: boolean;
  buildingName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string; // Added country field for international addresses
  virtualLink: string;
  capacity: string;
  registrationDeadline: Date | null;
  isPrivate: boolean;
  isPaid: boolean;
  price: string;
  paymentOptions: string[];
  imageUri: string | null;
  galleryImages: string[]; // Keeping this for backward compatibility
  ticketTypes: TicketType[];
  customFields: CustomField[];
  speakers: Speaker[];
  cancellationPolicy: string;
  enableComments: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  date?: string;
  time?: string;
  capacity?: string;
  price?: string;
  virtualLink?: string;
  ticketTypes?: string;
  tags?: string;
}

export default function CreateEventScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<EventForm>({
    title: '',
    description: '',
    category: 'Other',
    tags: [],
    date: new Date(),
    endDate: new Date(Date.now() + 3600000), // Default to 1 hour later
    time: new Date(),
    endTime: new Date(Date.now() + 3600000), // Default to 1 hour later
    timeZone: 'UTC-05:00', // Default to EST
    isVirtual: false,
    buildingName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States', // Default country
    virtualLink: '',
    capacity: '',
    registrationDeadline: null,
    isPrivate: false,
    isPaid: false,
    price: '',
    paymentOptions: ['Credit Card', 'PayPal'],
    imageUri: null,
    galleryImages: [],
    ticketTypes: [],
    customFields: [],
    speakers: [],
    cancellationPolicy: '',
    enableComments: true,
  });

  // States for pickers and modals
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
  const [currentPickerMode, setCurrentPickerMode] = useState<'date' | 'time'>('date');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [activeSection, setActiveSection] = useState(1); // Track active section for step-by-step form
  const [showPreview, setShowPreview] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [currentTicket, setCurrentTicket] = useState<TicketType | null>(null);
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [currentCustomField, setCurrentCustomField] = useState<CustomField | null>(null);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const [customFieldOption, setCustomFieldOption] = useState('');

  // References
  const scrollViewRef = useRef<ScrollView>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, authLoading, router]);

  // Handle image selection for main event image
  const handleImageSelected = (uri: string) => {
    setFormData({ ...formData, imageUri: uri });
  };

  // Handle adding gallery images
  const handleGalleryImageSelected = (uri: string) => {
    setFormData({ ...formData, galleryImages: [...formData.galleryImages, uri] });
  };

  // Function to upload image to Firebase Storage
  const uploadImage = async (uri: string): Promise<string> => {
    try {
      console.log("Starting image upload for URI:", uri);
      
      // If no URI is provided, return null
      if (!uri) {
        console.log("No image URI provided, skipping upload");
        return "";
      }
      
      const storage = getStorage();
      const filename = uri.substring(uri.lastIndexOf('/') + 1);
      const eventImagesRef = ref(storage, `event-images/${Date.now()}_${filename}`);
      
      // For React Native, we need to prepare the URI properly
      // Remove the 'file://' prefix if it exists (for iOS)
      const fileUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;
      
      // Fetch the image and convert to blob
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      if (!blob) {
        throw new Error("Failed to create blob from image");
      }
      
      console.log("Blob created successfully, size:", blob.size);
      
      // Upload the blob
      console.log("Starting Firebase upload...");
      const uploadTask = await uploadBytes(eventImagesRef, blob);
      console.log("Upload completed:", uploadTask);
      
      // Get download URL
      const downloadURL = await getDownloadURL(eventImagesRef);
      console.log("Download URL obtained:", downloadURL);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      // Add more detailed error logging
      if ((error as { code?: string }).code) {
        if (error instanceof Error && 'code' in error) {
          console.error(`Firebase error code: ${(error as { code: string }).code}`);
        }
      }
      
      // Return empty string instead of throwing an error,
      // so event creation can continue even if image upload fails
      return "";
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    let isValid = true;

    // Basic validation
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.description.trim()) {
      errors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.length < 30) {
      errors.description = 'Description should be at least 30 characters';
      isValid = false;
    }

    // Location validation based on event type
    if (!formData.isVirtual) {
      if (!formData.address.trim()) {
        errors.address = 'Address is required for in-person events';
        isValid = false;
      }

      if (!formData.city.trim()) {
        errors.city = 'City is required for in-person events';
        isValid = false;
      }
    } else {
      if (!formData.virtualLink.trim()) {
        errors.virtualLink = 'Virtual event link is required';
        isValid = false;
      }
    }

    // Date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(formData.date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      errors.date = 'Event date cannot be in the past';
      isValid = false;
    }

    // End date should be after start date
    if (formData.endDate < formData.date) {
      errors.date = 'End date must be after start date';
      isValid = false;
    }

    // Same day - check times
    if (selectedDate.getTime() === formData.endDate.getTime()) {
      if (formData.endTime <= formData.time) {
        errors.time = 'End time must be after start time';
        isValid = false;
      }
    }

    // Capacity validation
    if (formData.capacity && isNaN(Number(formData.capacity))) {
      errors.capacity = 'Capacity must be a number';
      isValid = false;
    }

    // Pricing validation
    if (formData.isPaid) {
      // Check for ticket types
      if (formData.ticketTypes.length === 0) {
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
      } else {
        // Validate ticket types
        const invalidTickets = formData.ticketTypes.filter(
          ticket => !ticket.name || isNaN(Number(ticket.price)) || Number(ticket.price) < 0
        );
        
        if (invalidTickets.length > 0) {
          errors.ticketTypes = 'All ticket types must have a name and valid price';
          isValid = false;
        }
      }
    }

    setFormErrors(errors);
    
    // If not valid, scroll to first error
    if (!isValid && scrollViewRef.current) {
      // This is a simple scroll to top - in a real app you'd scroll to the specific error
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
    
    return isValid;
  };

  // Handle adding/removing payment options
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

  // Handle adding new tags
  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  // Handle removing tags
  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  // Handle ticket type management
  const addOrUpdateTicket = () => {
    if (!currentTicket) return;
    
    // Validate ticket data
    if (!currentTicket.name.trim() || !currentTicket.price.trim()) {
      Alert.alert('Missing Information', 'Ticket name and price are required');
      return;
    }
    
    const updatedTickets = [...formData.ticketTypes];
    const existingIndex = updatedTickets.findIndex(t => t.id === currentTicket.id);
    
    if (existingIndex >= 0) {
      // Update existing ticket
      updatedTickets[existingIndex] = currentTicket;
    } else {
      // Add new ticket
      updatedTickets.push(currentTicket);
    }
    
    setFormData({
      ...formData,
      ticketTypes: updatedTickets
    });
    
    setCurrentTicket(null);
    setShowTicketModal(false);
  };

  // Handle custom field management
  const addOrUpdateCustomField = () => {
    if (!currentCustomField) return;
    
    // Validate custom field data
    if (!currentCustomField.label.trim()) {
      Alert.alert('Missing Information', 'Field label is required');
      return;
    }
    
    const updatedFields = [...formData.customFields];
    const existingIndex = updatedFields.findIndex(f => f.id === currentCustomField.id);
    
    if (existingIndex >= 0) {
      // Update existing field
      updatedFields[existingIndex] = currentCustomField;
    } else {
      // Add new field
      updatedFields.push(currentCustomField);
    }
    
    setFormData({
      ...formData,
      customFields: updatedFields
    });
    
    setCurrentCustomField(null);
    setShowCustomFieldModal(false);
  };

  // Handle adding options to select fields
  const addOptionToCustomField = () => {
    if (!customFieldOption.trim() || !currentCustomField) return;
    
    const options = currentCustomField.options || [];
    
    if (!options.includes(customFieldOption.trim())) {
      setCurrentCustomField({
        ...currentCustomField,
        options: [...options, customFieldOption.trim()]
      });
      setCustomFieldOption('');
    }
  };

  // Remove option from custom field
  const removeOptionFromCustomField = (option: string) => {
    if (!currentCustomField) return;
    
    setCurrentCustomField({
      ...currentCustomField,
      options: (currentCustomField.options || []).filter(o => o !== option)
    });
  };

  // Handle speaker management
  const addOrUpdateSpeaker = () => {
    if (!currentSpeaker) return;
    
    // Validate speaker data
    if (!currentSpeaker.name.trim() || !currentSpeaker.role.trim()) {
      Alert.alert('Missing Information', 'Speaker name and role are required');
      return;
    }
    
    const updatedSpeakers = [...formData.speakers];
    const existingIndex = updatedSpeakers.findIndex(s => s.id === currentSpeaker.id);
    
    if (existingIndex >= 0) {
      // Update existing speaker
      updatedSpeakers[existingIndex] = currentSpeaker;
    } else {
      // Add new speaker
      updatedSpeakers.push(currentSpeaker);
    }
    
    setFormData({
      ...formData,
      speakers: updatedSpeakers
    });
    
    setCurrentSpeaker(null);
    setShowSpeakerModal(false);
  };

  // Remove speaker
  const removeSpeaker = (id: string) => {
    setFormData({
      ...formData,
      speakers: formData.speakers.filter(s => s.id !== id)
    });
  };

  // Remove ticket type
  const removeTicket = (id: string) => {
    setFormData({
      ...formData,
      ticketTypes: formData.ticketTypes.filter(t => t.id !== id)
    });
  };

  // Remove custom field
  const removeCustomField = (id: string) => {
    setFormData({
      ...formData,
      customFields: formData.customFields.filter(f => f.id !== id)
    });
  };

  // Navigate to next/previous section
  const navigateSection = (direction: 'next' | 'previous') => {
    const nextSection = direction === 'next' ? activeSection + 1 : activeSection - 1;
    
    if (nextSection >= 1 && nextSection <= 6) {
      setActiveSection(nextSection);
      
      // Scroll to top when changing sections
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
      }
    }
  };

  // Final submit handler
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
  
      // Upload main image
      let mainImageUrl = null;
      try {
        if (formData.imageUri) {
          mainImageUrl = await uploadImage(formData.imageUri);
        }
      } catch (imageError) {
        console.warn('Main image upload failed, continuing without image:', imageError);
        // Show warning but continue with event creation
        Alert.alert(
          'Image Upload Warning',
          'We encountered an issue uploading your main image, but will continue creating your event.',
          [{ text: 'Continue' }]
        );
      }
  
      // Upload gallery images - continue even if some fail
      let galleryImageUrls: string[] = [];
      if (formData.galleryImages.length > 0) {
        try {
          // Try to upload all images but filter out any that fail
          const uploadPromises = formData.galleryImages.map(uri => uploadImage(uri));
          const results = await Promise.allSettled(uploadPromises);
          
          // Filter out failed uploads
          galleryImageUrls = results
            .filter(result => result.status === 'fulfilled' && result.value)
            .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
            .map(result => result.value);
          
          // Warn if some uploads failed
          const failedCount = results.filter(result => result.status === 'rejected').length;
          if (failedCount > 0) {
            console.warn(`${failedCount} gallery images failed to upload`);
          }
        } catch (galleryError) {
          console.warn('Gallery images upload failed:', galleryError);
        }
      }
  
      // Format location string based on event type
      let locationString = '';
      if (formData.isVirtual) {
        locationString = 'Virtual Event';
      } else {
        locationString = `${formData.buildingName ? formData.buildingName + ', ' : ''}${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}, ${formData.country}`.trim();
      }
  
      // Combine date and time for start and end
      const startDateTime = new Date(formData.date);
      startDateTime.setHours(
        formData.time.getHours(),
        formData.time.getMinutes(),
        0,
        0
      );
  
      const endDateTime = new Date(formData.endDate);
      endDateTime.setHours(
        formData.endTime.getHours(),
        formData.endTime.getMinutes(),
        0,
        0
      );
  
      // Calculate duration in milliseconds
      const duration = endDateTime.getTime() - startDateTime.getTime();
  
      // Create event data with or without images
      // Update the handleSubmit function in app/screens/Create.tsx

// Inside the handleSubmit function, modify the eventData object creation:

// Create event data with proper handling of undefined values
const eventData = {
  title: formData.title,
  description: formData.description,
  category: formData.category,
  tags: formData.tags,
  date: startDateTime,
  time: startDateTime,
  endDate: endDateTime,
  endTime: endDateTime,
  timeZone: formData.timeZone,
  duration,
  isVirtual: formData.isVirtual,
  location: locationString,
  // Fix for the undefined virtualLink error
  // Only add virtualLink if it's a virtual event AND the link exists
  ...(formData.isVirtual && formData.virtualLink ? { virtualLink: formData.virtualLink } : {}),
  // Only add locationDetails if it's not a virtual event
  ...(formData.isVirtual ? {} : {
    locationDetails: {
      buildingName: formData.buildingName.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),
      country: formData.country.trim()
    }
  }),
  capacity: Number(formData.capacity) || 0,
  // Only add registrationDeadline if it exists
  ...(formData.registrationDeadline ? { registrationDeadline: formData.registrationDeadline } : {}),
  isPrivate: formData.isPrivate,
  isPaid: formData.isPaid,
  price: formData.isPaid && formData.ticketTypes.length === 0 ? Number(formData.price) : 0,
  paymentOptions: formData.isPaid ? formData.paymentOptions : [],
  ticketTypes: formData.isPaid ? formData.ticketTypes : [],
  customFields: formData.customFields,
  createdBy: user.id,
  organizerName: user.name || 'Event Host',
  createdAt: new Date(),
  // Only add imageUrl if it exists
  ...(mainImageUrl ? { imageUrl: mainImageUrl } : {}),
  // Only add galleryImages if it exists and has items
  ...(galleryImageUrls.length > 0 ? { galleryImages: galleryImageUrls } : {}),
  // Other fields
  cancellationPolicy: formData.cancellationPolicy || '',
  enableComments: formData.enableComments,
};

// Now create the event with the properly formatted data
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
               category: 'Other',
               tags: [],
               date: new Date(),
               endDate: new Date(Date.now() + 3600000),
               time: new Date(),
               endTime: new Date(Date.now() + 3600000),
               timeZone: 'UTC-05:00',
               isVirtual: false,
               buildingName: '',
               address: '',
               city: '',
               state: '',
               zipCode: '',
               country: 'United States',
               virtualLink: '',
               capacity: '',
               registrationDeadline: null,
               isPrivate: false,
               isPaid: false,
               price: '',
               paymentOptions: ['Credit Card', 'PayPal'],
               imageUri: null,
               galleryImages: [],
               ticketTypes: [],
               customFields: [],
               speakers: [],
               cancellationPolicy: '',
               enableComments: true,
             });
              setActiveSection(1);
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

  // Render header with progress indicator
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        disabled={isSubmitting}
        accessibilityLabel="Go back"
        style={styles.backButton}
      >
        <FontAwesome name="arrow-left" size={24} color="#1F2937" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Create Event</Text>
      <TouchableOpacity
        onPress={() => setShowPreview(true)}
        disabled={isSubmitting}
        accessibilityLabel="Preview event"
        style={styles.previewButton}
      >
        <Text style={styles.previewButtonText}>Preview</Text>
      </TouchableOpacity>
    </View>
  );

  // Render progress indicator
  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${(activeSection / 6) * 100}%` }
          ]} 
        />
      </View>
      <View style={styles.stepsContainer}>
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <TouchableOpacity 
            key={step}
            style={[
              styles.stepCircle,
              activeSection >= step && styles.activeStep
            ]}
            onPress={() => setActiveSection(step)}
          >
            <Text 
              style={[
                styles.stepNumber,
                activeSection >= step && styles.activeStepNumber
              ]}
            >
              {step}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.stepLabelContainer}>
        <Text style={styles.stepLabel}>
          {activeSection === 1 && 'Basic Details'}
          {activeSection === 2 && 'Date & Time'}
          {activeSection === 3 && 'Location'}
          {activeSection === 4 && 'Tickets & Registration'}
          {activeSection === 5 && 'Speakers & Content'}
          {activeSection === 6 && 'Settings & Policies'}
        </Text>
      </View>
    </View>
  );

  // Render basic info section
  const renderBasicInfoSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Basic Event Information</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Image*</Text>
        <Text style={styles.helperText}>
          This will be the main image displayed for your event
        </Text>
        <ImageUpload
          onImageSelected={handleImageSelected}
          initialImage={formData.imageUri || undefined}
        />
      </View>

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
          placeholder="Enter a clear, descriptive title"
          maxLength={70}
          editable={!isSubmitting}
          accessibilityLabel="Event title input"
        />
        {formErrors.title ? (
          <Text style={styles.errorText}>{formErrors.title}</Text>
        ) : (
          <Text style={styles.charCount}>{formData.title.length}/70</Text>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Description*</Text>
        <Text style={styles.helperText}>
          Describe what attendees can expect at your event
        </Text>
        <TextInput
          style={[styles.textArea, formErrors.description && styles.inputError]}
          value={formData.description}
          onChangeText={(text) => {
            setFormData({ ...formData, description: text });
            if (formErrors.description) {
              setFormErrors({ ...formErrors, description: undefined });
            }
          }}
          placeholder="Enter a detailed description of your event..."
          multiline
          numberOfLines={6}
          editable={!isSubmitting}
          textAlignVertical="top"
          accessibilityLabel="Event description input"
        />
        {formErrors.description ? (
          <Text style={styles.errorText}>{formErrors.description}</Text>
        ) : (
          <Text style={styles.charCount}>{formData.description.length}/2000</Text>
        )}
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Category*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.category}
            onValueChange={(itemValue) => setFormData({ ...formData, category: itemValue })}
            enabled={!isSubmitting}
            style={styles.picker}
          >
            {EVENT_CATEGORIES.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Tags</Text>
        <Text style={styles.helperText}>
          Add relevant keywords to help users find your event
        </Text>
        
        <View style={styles.tagsContainer}>
          {formData.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity onPress={() => removeTag(tag)}>
                <MaterialIcons name="close" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
        
        <View style={styles.tagInputContainer}>
          <TextInput
            style={styles.tagInput}
            value={newTag}
            onChangeText={setNewTag}
            placeholder="Add a tag (press Enter)"
            onSubmitEditing={addTag}
            blurOnSubmit={false}
            editable={!isSubmitting}
          />
          <TouchableOpacity style={styles.tagAddButton} onPress={addTag}>
            <MaterialIcons name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
        {formErrors.tags && <Text style={styles.errorText}>{formErrors.tags}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Additional Images (Gallery)</Text>
        <Text style={styles.helperText}>
          images to showcase your event
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.galleryContainer}
        >
          {formData.galleryImages.map((uri, index) => (
            <View key={index} style={styles.galleryImageContainer}>
              <Image source={{ uri }} style={styles.galleryImage} />
              <TouchableOpacity 
                style={styles.removeGalleryImageButton}
                onPress={() => {
                  const newGallery = [...formData.galleryImages];
                  newGallery.splice(index, 1);
                  setFormData({ ...formData, galleryImages: newGallery });
                }}
              >
                <MaterialIcons name="close" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          ))}
          
          <TouchableOpacity 
            style={styles.addGalleryImageButton}
            onPress={() => {
              // In a real app, you would integrate with ImagePicker
              Alert.alert('Feature Coming Soon', 'Gallery image selection will be available soon.');
            }}
          >
            <MaterialIcons name="add-photo-alternate" size={32} color="#007AFF" />
            <Text style={styles.addGalleryText}>Add Image</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      <View style={styles.sectionNavigation}>
        <View style={{ width: 100 }} />
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigateSection('next')}
        >
          <Text style={styles.nextButtonText}>Next: Date & Time</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render date & time section
  const renderDateTimeSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Date & Time</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Start Date*</Text>
        <TouchableOpacity
          style={[styles.dateButton, formErrors.date && styles.inputError]}
          onPress={() => setShowDatePicker(true)}
          disabled={isSubmitting}
        >
          <View style={styles.dateButtonContent}>
            <MaterialIcons name="calendar-today" size={20} color="#6B7280" />
            <Text style={styles.dateButtonText}>
              {formData.date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
        </TouchableOpacity>
        {formErrors.date && <Text style={styles.errorText}>{formErrors.date}</Text>}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>End Date*</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndDatePicker(true)}
          disabled={isSubmitting}
        >
          <View style={styles.dateButtonContent}>
            <MaterialIcons name="calendar-today" size={20} color="#6B7280" />
            <Text style={styles.dateButtonText}>
              {formData.endDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.row}>
        <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
          <Text style={styles.label}>Start Time*</Text>
          <TouchableOpacity
            style={[styles.dateButton, formErrors.time && styles.inputError]}
            onPress={() => setShowTimePicker(true)}
            disabled={isSubmitting}
          >
            <View style={styles.dateButtonContent}>
              <MaterialIcons name="access-time" size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {formData.time.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
          </TouchableOpacity>
          {formErrors.time && <Text style={styles.errorText}>{formErrors.time}</Text>}
        </View>
        
        <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
          <Text style={styles.label}>End Time*</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndTimePicker(true)}
            disabled={isSubmitting}
          >
            <View style={styles.dateButtonContent}>
              <MaterialIcons name="access-time" size={20} color="#6B7280" />
              <Text style={styles.dateButtonText}>
                {formData.endTime.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </Text>
            </View>
            <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Time Zone*</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={formData.timeZone}
            onValueChange={(itemValue) => setFormData({ ...formData, timeZone: itemValue })}
            enabled={!isSubmitting}
            style={styles.picker}
          >
            {TIME_ZONES.map((timeZone) => (
              <Picker.Item key={timeZone} label={timeZone} value={timeZone} />
            ))}
          </Picker>
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Registration Deadline</Text>
        <Text style={styles.helperText}>
          When should registration close? If not set, registration will remain open until event starts.
        </Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDeadlinePicker(true)}
          disabled={isSubmitting}
        >
          <View style={styles.dateButtonContent}>
            <MaterialIcons name="event-busy" size={20} color="#6B7280" />
            <Text style={styles.dateButtonText}>
              {formData.registrationDeadline
                ? formData.registrationDeadline.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })
                : 'No deadline set'
              }
            </Text>
          </View>
          <MaterialIcons name="arrow-drop-down" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.sectionNavigation}>
        <TouchableOpacity 
          style={styles.prevButton}
          onPress={() => navigateSection('previous')}
        >
          <MaterialIcons name="arrow-back" size={20} color="#6B7280" />
          <Text style={styles.prevButtonText}>Basic Details</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigateSection('next')}
        >
          <Text style={styles.nextButtonText}>Next: Location</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render location section
  const renderLocationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Event Location</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Type*</Text>
        <View style={styles.eventTypeContainer}>
          <TouchableOpacity
            style={[
              styles.eventTypeButton,
              !formData.isVirtual && styles.selectedEventType
            ]}
            onPress={() => setFormData({ ...formData, isVirtual: false })}
          >
            <MaterialIcons 
              name="location-on" 
              size={24} 
              color={!formData.isVirtual ? "#007AFF" : "#6B7280"} 
            />
            <Text 
              style={[
                styles.eventTypeText, 
                !formData.isVirtual && styles.selectedEventTypeText
              ]}
            >
              In-Person
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.eventTypeButton,
              formData.isVirtual && styles.selectedEventType
            ]}
            onPress={() => setFormData({ ...formData, isVirtual: true })}
          >
            <MaterialIcons 
              name="videocam" 
              size={24} 
              color={formData.isVirtual ? "#007AFF" : "#6B7280"} 
            />
            <Text 
              style={[
                styles.eventTypeText, 
                formData.isVirtual && styles.selectedEventTypeText
              ]}
            >
              Virtual
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {formData.isVirtual ? (
        <View style={styles.formGroup}>
          <Text style={styles.label}>Virtual Event Link*</Text>
          <Text style={styles.helperText}>
            Provide the link where attendees will join your event
          </Text>
          <TextInput
            style={[styles.input, formErrors.virtualLink && styles.inputError]}
            value={formData.virtualLink}
            onChangeText={(text) => {
              setFormData({ ...formData, virtualLink: text });
              if (formErrors.virtualLink) {
                setFormErrors({ ...formErrors, virtualLink: undefined });
              }
            }}
            placeholder="Enter Zoom, Google Meet, or custom link"
            keyboardType="url"
            autoCapitalize="none"
            editable={!isSubmitting}
          />
          {formErrors.virtualLink && (
            <Text style={styles.errorText}>{formErrors.virtualLink}</Text>
          )}
        </View>
      ) : (
        <View style={styles.locationContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Country*</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.country}
                onValueChange={(itemValue) => {
                  setFormData({
                    ...formData,
                    country: itemValue,
                    // Reset state/province when country changes
                    state: '',
                    zipCode: ''
                  });
                  if (formErrors.country) {
                    setFormErrors({ ...formErrors, country: undefined });
                  }
                }}
                enabled={!isSubmitting}
                style={styles.picker}
              >
                {COUNTRIES.map((country) => (
                  <Picker.Item key={country} label={country} value={country} />
                ))}
              </Picker>
            </View>
            {formErrors.country && (
              <Text style={styles.errorText}>{formErrors.country}</Text>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Venue/Building Name</Text>
            <TextInput
              style={styles.input}
              value={formData.buildingName}
              onChangeText={(text) => setFormData({ ...formData, buildingName: text })}
              placeholder="Enter venue name (optional)"
              editable={!isSubmitting}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Street Address*</Text>
            <TextInput
              style={[styles.input, formErrors.address && styles.inputError]}
              value={formData.address}
              onChangeText={(text) => {
                setFormData({ ...formData, address: text });
                if (formErrors.address) {
                  setFormErrors({ ...formErrors, address: undefined });
                }
              }}
              placeholder="Enter street address"
              editable={!isSubmitting}
            />
            {formErrors.address && (
              <Text style={styles.errorText}>{formErrors.address}</Text>
            )}
          </View>

          <View style={styles.locationRow}>
            <View style={[styles.formGroup, { flex: 1.5, marginRight: 8 }]}>
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

            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>State/Province</Text>
              <TextInput
                style={[styles.input, formErrors.state && styles.inputError]}
                value={formData.state}
                onChangeText={(text) => {
                  // For US and Canada, limit to 2 characters and convert to uppercase
                  if ((formData.country === 'United States' || formData.country === 'Canada') &&
                      text.length <= 2) {
                    setFormData({ ...formData, state: text.toUpperCase() });
                  } else if (formData.country !== 'United States' && formData.country !== 'Canada') {
                    setFormData({ ...formData, state: text });
                  }
                  
                  if (formErrors.state) {
                    setFormErrors({ ...formErrors, state: undefined });
                  }
                }}
                placeholder={formData.country === 'United States' || formData.country === 'Canada' ?
                  "2-letter code" : "State/Province"}
                maxLength={formData.country === 'United States' || formData.country === 'Canada' ? 2 : 50}
                editable={!isSubmitting}
              />
              {formErrors.state && (
                <Text style={styles.errorText}>{formErrors.state}</Text>
              )}
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>ZIP/Postal Code</Text>
              <TextInput
                style={[styles.input, formErrors.zipCode && styles.inputError]}
                value={formData.zipCode}
                onChangeText={(text) => {
                  setFormData({ ...formData, zipCode: text });
                  if (formErrors.zipCode) {
                    setFormErrors({ ...formErrors, zipCode: undefined });
                  }
                }}
                placeholder={formData.country === 'United States' ? "ZIP" :
                  formData.country === 'Canada' ? "Postal Code" : "Postal/ZIP"}
                keyboardType={formData.country === 'United States' ? "numeric" : "default"}
                editable={!isSubmitting}
              />
              {formErrors.zipCode && (
                <Text style={styles.errorText}>{formErrors.zipCode}</Text>
              )}
            </View>
          </View>
        </View>
      )}
      
      <View style={styles.sectionNavigation}>
        <TouchableOpacity 
          style={styles.prevButton}
          onPress={() => navigateSection('previous')}
        >
          <MaterialIcons name="arrow-back" size={20} color="#6B7280" />
          <Text style={styles.prevButtonText}>Date & Time</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigateSection('next')}
        >
          <Text style={styles.nextButtonText}>Next: Tickets</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render tickets and registration section
  const renderTicketsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Tickets & Registration</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Capacity Limit</Text>
        <Text style={styles.helperText}>
          Maximum number of attendees (leave empty for unlimited)
        </Text>
        <TextInput
          style={[styles.input, formErrors.capacity && styles.inputError]}
          value={formData.capacity}
          onChangeText={(text) => {
            setFormData({ ...formData, capacity: text });
            if (formErrors.capacity) {
              setFormErrors({ ...formErrors, capacity: undefined });
            }
          }}
          placeholder="Enter maximum number of attendees"
          keyboardType="numeric"
          editable={!isSubmitting}
        />
        {formErrors.capacity && (
          <Text style={styles.errorText}>{formErrors.capacity}</Text>
        )}
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Is this a paid event?</Text>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>Free Event</Text>
          <Switch
            value={formData.isPaid}
            onValueChange={(value) => {
              setFormData({ 
                ...formData, 
                isPaid: value,
                price: value ? formData.price : ''
              });
            }}
            trackColor={{ false: '#D1D5DB', true: '#007AFF' }}
            thumbColor="#FFFFFF"
            disabled={isSubmitting}
          />
          <Text style={styles.toggleLabel}>Paid Event</Text>
        </View>
      </View>
      
      {formData.isPaid && (
        <>
          <View style={styles.ticketsContainer}>
            <View style={styles.ticketTypeHeader}>
              <Text style={styles.ticketTypeTitle}>Ticket Types</Text>
              <TouchableOpacity 
                style={styles.addTicketButton}
                onPress={() => {
                  setCurrentTicket({
                    id: Date.now().toString(),
                    name: '',
                    price: '',
                    quantity: '',
                    description: ''
                  });
                  setShowTicketModal(true);
                }}
              >
                <MaterialIcons name="add" size={20} color="#FFF" />
                <Text style={styles.addTicketText}>Add Ticket Type</Text>
              </TouchableOpacity>
            </View>
            
            {formData.ticketTypes.length > 0 ? (
              <View style={styles.ticketsList}>
                {formData.ticketTypes.map((ticket) => (
                  <View key={ticket.id} style={styles.ticketItem}>
                    <View style={styles.ticketInfo}>
                      <Text style={styles.ticketName}>{ticket.name}</Text>
                      <Text style={styles.ticketPrice}>${ticket.price}</Text>
                      {ticket.quantity && (
                        <Text style={styles.ticketQuantity}>Qty: {ticket.quantity}</Text>
                      )}
                      {ticket.description && (
                        <Text style={styles.ticketDescription}>{ticket.description}</Text>
                      )}
                    </View>
                    <View style={styles.ticketActions}>
                      <TouchableOpacity 
                        style={styles.editTicketButton}
                        onPress={() => {
                          setCurrentTicket(ticket);
                          setShowTicketModal(true);
                        }}
                      >
                        <MaterialIcons name="edit" size={20} color="#007AFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeTicketButton}
                        onPress={() => removeTicket(ticket.id)}
                      >
                        <MaterialIcons name="delete" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.singlePriceContainer}>
                <Text style={styles.label}>General Admission Price*</Text>
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
                  />
                </View>
                {formErrors.price && (
                  <Text style={styles.errorText}>{formErrors.price}</Text>
                )}
              </View>
            )}
            
            <Text style={styles.label}>Payment Methods*</Text>
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
      
      <View style={styles.formGroup}>
        <Text style={styles.sectionSubtitle}>Registration Form Fields</Text>
        <Text style={styles.helperText}>
          Add custom fields to collect additional information from attendees
        </Text>
        
        <View style={styles.customFieldsHeader}>
          <Text style={styles.customFieldsTitle}>Custom Fields</Text>
          <TouchableOpacity 
            style={styles.addFieldButton}
            onPress={() => {
              setCurrentCustomField({
                id: Date.now().toString(),
                label: '',
                type: 'text',
                required: false
              });
              setShowCustomFieldModal(true);
            }}
          >
            <MaterialIcons name="add" size={20} color="#FFF" />
            <Text style={styles.addFieldText}>Add Field</Text>
          </TouchableOpacity>
        </View>
        
        {formData.customFields.length > 0 ? (
          <View style={styles.customFieldsList}>
            {formData.customFields.map((field) => (
              <View key={field.id} style={styles.customFieldItem}>
                <View style={styles.customFieldInfo}>
                  <Text style={styles.customFieldLabel}>{field.label}</Text>
                  <View style={styles.customFieldDetails}>
                    <Text style={styles.customFieldType}>Type: {field.type}</Text>
                    <Text style={styles.customFieldRequired}>
                      {field.required ? 'Required' : 'Optional'}
                    </Text>
                  </View>
                  {field.type === 'select' && field.options && field.options.length > 0 && (
                    <Text style={styles.customFieldOptions}>
                      Options: {field.options.join(', ')}
                    </Text>
                  )}
                </View>
                <View style={styles.customFieldActions}>
                  <TouchableOpacity 
                    style={styles.editFieldButton}
                    onPress={() => {
                      setCurrentCustomField(field);
                      setShowCustomFieldModal(true);
                    }}
                  >
                    <MaterialIcons name="edit" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeFieldButton}
                    onPress={() => removeCustomField(field.id)}
                  >
                    <MaterialIcons name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noCustomFieldsText}>
            No custom fields added. Attendees will provide their name and email by default.
          </Text>
        )}
      </View>
      
      <View style={styles.sectionNavigation}>
        <TouchableOpacity 
          style={styles.prevButton}
          onPress={() => navigateSection('previous')}
        >
          <MaterialIcons name="arrow-back" size={20} color="#6B7280" />
          <Text style={styles.prevButtonText}>Location</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigateSection('next')}
        >
          <Text style={styles.nextButtonText}>Next: Speakers</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render speakers and content section
  const renderSpeakersSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Speakers & Content</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.sectionSubtitle}>Featured Speakers/Performers</Text>
        <Text style={styles.helperText}>
          Add speakers, performers, or presenters for your event
        </Text>
        
        <View style={styles.speakersHeader}>
          <Text style={styles.speakersTitle}>Speakers</Text>
          <TouchableOpacity 
            style={styles.addSpeakerButton}
            onPress={() => {
              setCurrentSpeaker({
                id: Date.now().toString(),
                name: '',
                role: '',
                bio: '',
                imageUri: null
              });
              setShowSpeakerModal(true);
            }}
          >
            <MaterialIcons name="add" size={20} color="#FFF" />
            <Text style={styles.addSpeakerText}>Add Speaker</Text>
          </TouchableOpacity>
        </View>
        
        {formData.speakers.length > 0 ? (
          <View style={styles.speakersList}>
            {formData.speakers.map((speaker) => (
              <View key={speaker.id} style={styles.speakerItem}>
                <View style={styles.speakerImageContainer}>
                  {speaker.imageUri ? (
                    <Image source={{ uri: speaker.imageUri }} style={styles.speakerImage} />
                  ) : (
                    <View style={styles.speakerImagePlaceholder}>
                      <Text style={styles.speakerImagePlaceholderText}>
                        {speaker.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.speakerInfo}>
                  <Text style={styles.speakerName}>{speaker.name}</Text>
                  <Text style={styles.speakerRole}>{speaker.role}</Text>
                  {speaker.bio && (
                    <Text style={styles.speakerBio} numberOfLines={2}>
                      {speaker.bio}
                    </Text>
                  )}
                </View>
                <View style={styles.speakerActions}>
                  <TouchableOpacity 
                    style={styles.editSpeakerButton}
                    onPress={() => {
                      setCurrentSpeaker(speaker);
                      setShowSpeakerModal(true);
                    }}
                  >
                    <MaterialIcons name="edit" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.removeSpeakerButton}
                    onPress={() => removeSpeaker(speaker.id)}
                  >
                    <MaterialIcons name="delete" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noSpeakersText}>
            No speakers added yet. Add speakers to provide more information about your event.
          </Text>
        )}
      </View>
      
      <View style={styles.sectionNavigation}>
        <TouchableOpacity 
          style={styles.prevButton}
          onPress={() => navigateSection('previous')}
        >
          <MaterialIcons name="arrow-back" size={20} color="#6B7280" />
          <Text style={styles.prevButtonText}>Tickets</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigateSection('next')}
        >
          <Text style={styles.nextButtonText}>Next: Settings</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render settings and policies section
  const renderSettingsSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Settings & Policies</Text>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Visibility</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Private Event</Text>
            <Text style={styles.settingDescription}>
              Only visible to invited people or those with the link
            </Text>
          </View>
          <Switch
            value={formData.isPrivate}
            onValueChange={(value) => setFormData({ ...formData, isPrivate: value })}
            trackColor={{ false: '#D1D5DB', true: '#007AFF' }}
            thumbColor="#FFFFFF"
            disabled={isSubmitting}
          />
        </View>
      </View>
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Event Engagement</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Enable Comments</Text>
            <Text style={styles.settingDescription}>
              Allow attendees to comment and discuss before the event
            </Text>
          </View>
          <Switch
            value={formData.enableComments}
            onValueChange={(value) => setFormData({ ...formData, enableComments: value })}
            trackColor={{ false: '#D1D5DB', true: '#007AFF' }}
            thumbColor="#FFFFFF"
            disabled={isSubmitting}
          />
        </View>
      </View>
      {/* Face Recognition Check-in feature removed as per requirements */}
      
      <View style={styles.formGroup}>
        <Text style={styles.label}>Cancellation Policy</Text>
        <Text style={styles.helperText}>
          Specify your policy for refunds or cancellations
        </Text>
        <TextInput
          style={styles.textArea}
          value={formData.cancellationPolicy}
          onChangeText={(text) => setFormData({ ...formData, cancellationPolicy: text })}
          placeholder="Enter your cancellation and refund policy..."
          multiline
          numberOfLines={4}
          editable={!isSubmitting}
          textAlignVertical="top"
        />
      </View>
      
      <View style={styles.submitContainer}>
        <TouchableOpacity 
          style={styles.prevButton}
          onPress={() => navigateSection('previous')}
        >
          <MaterialIcons name="arrow-back" size={20} color="#6B7280" />
          <Text style={styles.prevButtonText}>Speakers</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.createEventButton}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.createEventButtonText}>Create Event</Text>
              <MaterialIcons name="check-circle" size={20} color="#FFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
  
  // Render date picker modal
  const renderDatePickers = () => {
    if (Platform.OS === 'ios') {
      return (
        <>
          {showDatePicker && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showDatePicker}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.modalCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select Date</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.date}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setFormData({ ...formData, date: selectedDate });
                        if (formErrors.date) {
                          setFormErrors({ ...formErrors, date: undefined });
                        }
                      }
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
          
          {showEndDatePicker && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showEndDatePicker}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowEndDatePicker(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowEndDatePicker(false)}>
                      <Text style={styles.modalCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select End Date</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowEndDatePicker(false);
                      }}
                    >
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.endDate}
                    mode="date"
                    display="spinner"
                    minimumDate={formData.date}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setFormData({ ...formData, endDate: selectedDate });
                      }
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
          
          {showTimePicker && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showTimePicker}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowTimePicker(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowTimePicker(false)}>
                      <Text style={styles.modalCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select Time</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowTimePicker(false);
                      }}
                    >
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.time}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        setFormData({ ...formData, time: selectedTime });
                        if (formErrors.time) {
                          setFormErrors({ ...formErrors, time: undefined });
                        }
                      }
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
          
          {showEndTimePicker && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showEndTimePicker}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowEndTimePicker(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowEndTimePicker(false)}>
                      <Text style={styles.modalCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Select End Time</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowEndTimePicker(false);
                      }}
                    >
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.endTime}
                    mode="time"
                    display="spinner"
                    onChange={(event, selectedTime) => {
                      if (selectedTime) {
                        setFormData({ ...formData, endTime: selectedTime });
                      }
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
          
          {showDeadlinePicker && (
            <Modal
              transparent={true}
              animationType="slide"
              visible={showDeadlinePicker}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowDeadlinePicker(false)}
              >
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={() => setShowDeadlinePicker(false)}>
                      <Text style={styles.modalCancel}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Registration Deadline</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setShowDeadlinePicker(false);
                      }}
                    >
                      <Text style={styles.modalDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    value={formData.registrationDeadline || formData.date}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    maximumDate={formData.date}
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setFormData({ ...formData, registrationDeadline: selectedDate });
                      }
                    }}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          )}
        </>
      );
    } else {
      // For Android, render inline pickers when showDatePicker is true
      return (
        <>
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
          
          {showEndDatePicker && (
            <DateTimePicker
              value={formData.endDate}
              mode="date"
              display="default"
              minimumDate={formData.date}
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, endDate: selectedDate });
                }
              }}
            />
          )}
          
          {showTimePicker && (
            <DateTimePicker
              value={formData.time}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setFormData({ ...formData, time: selectedTime });
                  if (formErrors.time) {
                    setFormErrors({ ...formErrors, time: undefined });
                  }
                }
              }}
            />
          )}
          
          {showEndTimePicker && (
            <DateTimePicker
              value={formData.endTime}
              mode="time"
              display="default"
              onChange={(event, selectedTime) => {
                setShowEndTimePicker(false);
                if (selectedTime) {
                  setFormData({ ...formData, endTime: selectedTime });
                }
              }}
            />
          )}
          
          {showDeadlinePicker && (
            <DateTimePicker
              value={formData.registrationDeadline || formData.date}
              mode="date"
              display="default"
              minimumDate={new Date()}
              maximumDate={formData.date}
              onChange={(event, selectedDate) => {
                setShowDeadlinePicker(false);
                if (selectedDate) {
                  setFormData({ ...formData, registrationDeadline: selectedDate });
                }
              }}
            />
          )}
        </>
      );
    }
  };
  
  // Render ticket modal
  const renderTicketModal = () => (
    <Modal
      transparent={true}
      animationType="slide"
      visible={showTicketModal}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowTicketModal(false)}
      >
        <View style={styles.ticketModalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTicketModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {currentTicket?.id ? 'Edit Ticket' : 'Add Ticket'}
            </Text>
            <TouchableOpacity onPress={addOrUpdateTicket}>
              <Text style={styles.modalDone}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Ticket Name*</Text>
              <TextInput
                style={styles.input}
                value={currentTicket?.name || ''}
                onChangeText={(text) => 
                  setCurrentTicket(current => 
                    current ? { ...current, name: text } : null
                  )
                }
                placeholder="e.g. General Admission, VIP, Early Bird"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Price*</Text>
              <View style={styles.priceInputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.priceInput}
                  value={currentTicket?.price || ''}
                  onChangeText={(text) => 
                    setCurrentTicket(current => 
                      current ? { ...current, price: text } : null
                    )
                  }
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity Available</Text>
              <Text style={styles.helperText}>
                Leave empty for unlimited tickets of this type
              </Text>
              <TextInput
                style={styles.input}
                value={currentTicket?.quantity || ''}
                onChangeText={(text) => 
                  setCurrentTicket(current => 
                    current ? { ...current, quantity: text } : null
                  )
                }
                placeholder="Enter quantity"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={styles.textArea}
                value={currentTicket?.description || ''}
                onChangeText={(text) => 
                  setCurrentTicket(current => 
                    current ? { ...current, description: text } : null
                  )
                }
                placeholder="Describe what's included with this ticket"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
  
  // Render custom field modal
  const renderCustomFieldModal = () => (
    <Modal
      transparent={true}
      animationType="slide"
      visible={showCustomFieldModal}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowCustomFieldModal(false)}
      >
        <View style={styles.fieldModalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCustomFieldModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {currentCustomField?.id ? 'Edit Field' : 'Add Field'}
            </Text>
            <TouchableOpacity onPress={addOrUpdateCustomField}>
              <Text style={styles.modalDone}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Field Label*</Text>
              <TextInput
                style={styles.input}
                value={currentCustomField?.label || ''}
                onChangeText={(text) => 
                  setCurrentCustomField(current => 
                    current ? { ...current, label: text } : null
                  )
                }
                placeholder="e.g. Company Name, Dietary Restrictions"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Field Type*</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={currentCustomField?.type || 'text'}
                  onValueChange={(itemValue) => 
                    setCurrentCustomField(current => 
                      current ? { ...current, type: itemValue as 'text' | 'checkbox' | 'select' } : null
                    )
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="Text Field" value="text" />
                  <Picker.Item label="Checkbox" value="checkbox" />
                  <Picker.Item label="Select/Dropdown" value="select" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <View style={styles.toggleContainer}>
                <Text style={styles.toggleLabel}>Required Field</Text>
                <Switch
                  value={currentCustomField?.required || false}
                  onValueChange={(value) => 
                    setCurrentCustomField(current => 
                      current ? { ...current, required: value } : null
                    )
                  }
                  trackColor={{ false: '#D1D5DB', true: '#007AFF' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
            
            {currentCustomField?.type === 'select' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Options</Text>
                <Text style={styles.helperText}>
                  Add options for attendees to select from
                </Text>
                
                <View style={styles.optionsContainer}>
                  {(currentCustomField.options || []).map((option, index) => (
                    <View key={index} style={styles.optionItem}>
                      <Text style={styles.optionText}>{option}</Text>
                      <TouchableOpacity
                        onPress={() => removeOptionFromCustomField(option)}
                      >
                        <MaterialIcons name="close" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
                
                <View style={styles.optionInputContainer}>
                  <TextInput
                    style={styles.optionInput}
                    value={customFieldOption}
                    onChangeText={setCustomFieldOption}
                    placeholder="Add an option"
                    onSubmitEditing={addOptionToCustomField}
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    style={styles.addOptionButton}
                    onPress={addOptionToCustomField}
                  >
                    <MaterialIcons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
  
  // Render speaker modal
  const renderSpeakerModal = () => (
    <Modal
      transparent={true}
      animationType="slide"
      visible={showSpeakerModal}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSpeakerModal(false)}
      >
        <View style={styles.speakerModalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSpeakerModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {currentSpeaker?.id ? 'Edit Speaker' : 'Add Speaker'}
            </Text>
            <TouchableOpacity onPress={addOrUpdateSpeaker}>
              <Text style={styles.modalDone}>Save</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            <View style={styles.speakerImageUpload}>
              <Text style={styles.label}>Speaker Photo</Text>
              <ImageUpload
                onImageSelected={(uri) =>
                  setCurrentSpeaker(current =>
                    current ? { ...current, imageUri: uri } : null
                  )
                }
                initialImage={currentSpeaker?.imageUri || undefined}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Full Name*</Text>
              <TextInput
                style={styles.input}
                value={currentSpeaker?.name || ''}
                onChangeText={(text) => 
                  setCurrentSpeaker(current => 
                    current ? { ...current, name: text } : null
                  )
                }
                placeholder="Enter speaker's full name"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Role/Title*</Text>
              <TextInput
                style={styles.input}
                value={currentSpeaker?.role || ''}
                onChangeText={(text) => 
                  setCurrentSpeaker(current => 
                    current ? { ...current, role: text } : null
                  )
                }
                placeholder="e.g. CEO, Keynote Speaker, Performer"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={styles.textArea}
                value={currentSpeaker?.bio || ''}
                onChangeText={(text) => 
                  setCurrentSpeaker(current => 
                    current ? { ...current, bio: text } : null
                  )
                }
                placeholder="Brief biography or description"
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
  
  // Render preview modal
  const renderPreviewModal = () => (
    <Modal
      transparent={false}
      animationType="slide"
      visible={showPreview}
    >
      <View style={styles.previewContainer}>
        <View style={styles.previewHeader}>
          <TouchableOpacity 
            style={styles.closePreviewButton}
            onPress={() => setShowPreview(false)}
          >
            <MaterialIcons name="close" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.previewHeaderTitle}>Event Preview</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <ScrollView style={styles.previewScroll}>
          {/* Preview Banner */}
          <View style={styles.previewBanner}>
            {formData.imageUri ? (
              <Image 
                source={{ uri: formData.imageUri }} 
                style={styles.previewBannerImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.previewBannerPlaceholder}>
                <MaterialIcons name="event" size={60} color="#9CA3AF" />
                <Text style={styles.previewBannerText}>No Event Image</Text>
              </View>
            )}
            
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.7)']}
              style={styles.previewBannerGradient}
            />
            
            <View style={styles.previewBannerContent}>
              <View style={styles.previewEventType}>
                <Text style={styles.previewEventTypeText}>
                  {formData.isVirtual ? 'VIRTUAL EVENT' : 'IN-PERSON EVENT'}
                </Text>
              </View>
              <Text style={styles.previewTitle}>{formData.title || 'Event Title'}</Text>
              <View style={styles.previewOrganizerRow}>
                <MaterialIcons name="person" size={16} color="#FFFFFF" />
                <Text style={styles.previewOrganizerText}>
                  Organized by {user?.name || 'Event Host'}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Preview Details */}
          <View style={styles.previewDetails}>
            <View style={styles.previewDetailCard}>
              <View style={styles.previewDetailRow}>
                <MaterialIcons name="event" size={20} color="#3B82F6" />
                <View style={styles.previewDetailContent}>
                  <Text style={styles.previewDetailLabel}>Date & Time</Text>
                  <Text style={styles.previewDetailText}>
                    {formData.date.toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </Text>
                  <Text style={styles.previewDetailTextSecondary}>
                    {formData.time.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} - {formData.endTime.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })} ({formData.timeZone})
                  </Text>
                </View>
              </View>
              
              <View style={styles.previewDivider} />
              
              <View style={styles.previewDetailRow}>
                <MaterialIcons 
                  name={formData.isVirtual ? "videocam" : "location-on"} 
                  size={20} 
                  color="#10B981" 
                />
                <View style={styles.previewDetailContent}>
                  <Text style={styles.previewDetailLabel}>
                    {formData.isVirtual ? 'Virtual Event' : 'Location'}
                  </Text>
                  {formData.isVirtual ? (
                    <Text style={styles.previewDetailText}>
                      {formData.virtualLink || 'Virtual link will be provided'}
                    </Text>
                  ) : (
                    <>
                      <Text style={styles.previewDetailText}>
                        {formData.buildingName || 'Venue Name'}
                      </Text>
                      <Text style={styles.previewDetailTextSecondary}>
                        {formData.address}, {formData.city}, {formData.state} {formData.zipCode}, {formData.country}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              
              {formData.isPaid && (
                <>
                  <View style={styles.previewDivider} />
                  
                  <View style={styles.previewDetailRow}>
                    <MaterialIcons name="attach-money" size={20} color="#F59E0B" />
                    <View style={styles.previewDetailContent}>
                      <Text style={styles.previewDetailLabel}>Price</Text>
                      {formData.ticketTypes.length > 0 ? (
                        <View>
                          <Text style={styles.previewDetailText}>Multiple Ticket Types</Text>
                          {formData.ticketTypes.map((ticket, index) => (
                            <Text key={index} style={styles.previewTicketPrice}>
                              {ticket.name}: ${ticket.price}
                            </Text>
                          ))}
                        </View>
                      ) : (
                        <Text style={styles.previewDetailText}>
                          ${formData.price || '0.00'}
                        </Text>
                      )}
                    </View>
                  </View>
                </>
              )}
            </View>
            
            {/* Preview Description */}
            <View style={styles.previewSection}>
              <Text style={styles.previewSectionTitle}>About This Event</Text>
              <Text style={styles.previewDescription}>
                {formData.description || 'No description provided.'}
              </Text>
            </View>
            
            {/* Preview Category & Tags */}
            {(formData.category || formData.tags.length > 0) && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Category & Tags</Text>
                <View style={styles.previewCategoryContainer}>
                  <View style={styles.previewCategory}>
                    <Text style={styles.previewCategoryText}>{formData.category}</Text>
                  </View>
                  
                  {formData.tags.map((tag, index) => (
                    <View key={index} style={styles.previewTag}>
                      <Text style={styles.previewTagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            
            {/* Preview Speakers */}
            {formData.speakers.length > 0 && (
              <View style={styles.previewSection}>
                <Text style={styles.previewSectionTitle}>Speakers & Performers</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {formData.speakers.map((speaker, index) => (
                    <View key={index} style={styles.previewSpeakerCard}>
                      <View style={styles.previewSpeakerImageContainer}>
                        {speaker.imageUri ? (
                          <Image 
                            source={{ uri: speaker.imageUri }} 
                            style={styles.previewSpeakerImage} 
                          />
                        ) : (
                          <View style={styles.previewSpeakerImagePlaceholder}>
                            <Text style={styles.previewSpeakerImagePlaceholderText}>
                              {speaker.name.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.previewSpeakerName}>{speaker.name}</Text>
                      <Text style={styles.previewSpeakerRole}>{speaker.role}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>
        
        <View style={styles.previewFooter}>
          <TouchableOpacity
            style={styles.editEventButton}
            onPress={() => setShowPreview(false)}
          >
            <MaterialIcons name="edit" size={20} color="#6B7280" />
            <Text style={styles.editEventButtonText}>Continue Editing</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.publishEventButton}
            onPress={() => {
              setShowPreview(false);
              handleSubmit();
            }}
          >
            <Text style={styles.publishEventButtonText}>Create Event</Text>
            <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      {renderHeader()}
      {renderProgressIndicator()}
      
      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        ref={scrollViewRef}
      >
        {activeSection === 1 && renderBasicInfoSection()}
        {activeSection === 2 && renderDateTimeSection()}
        {activeSection === 3 && renderLocationSection()}
        {activeSection === 4 && renderTicketsSection()}
        {activeSection === 5 && renderSpeakersSection()}
        {activeSection === 6 && renderSettingsSection()}
      </ScrollView>
      
      {renderDatePickers()}
      {renderTicketModal()}
      {renderCustomFieldModal()}
      {renderSpeakerModal()}
      {renderPreviewModal()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  previewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
  },
  previewButtonText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  progressFill: {
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  activeStep: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeStepNumber: {
    color: '#FFFFFF',
  },
  stepLabelContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
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
  helperText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  textArea: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: '#FFFFFF',
    marginRight: 4,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    marginRight: 8,
  },
  tagAddButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryContainer: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  galleryImageContainer: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 8,
    position: 'relative',
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeGalleryImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addGalleryImageButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addGalleryText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  dateButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 8,
    color: '#1F2937',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eventTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  eventTypeButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  selectedEventType: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  eventTypeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 8,
  },
  selectedEventTypeText: {
    color: '#007AFF',
  },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  ticketsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ticketTypeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addTicketButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addTicketText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  ticketsList: {
    marginBottom: 16,
  },
  ticketItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  ticketInfo: {
    flex: 1,
  },
  ticketName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  ticketPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
  },
  ticketQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  ticketDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  ticketActions: {
    flexDirection: 'row',
  },
  editTicketButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  removeTicketButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singlePriceContainer: {
    marginBottom: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingLeft: 12,
  },
  currencySymbol: {
    fontSize: 16,
    color: '#6B7280',
  },
  priceInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  paymentOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  paymentOptionItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  paymentOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F9FF',
  },
  paymentOptionText: {
    color: '#6B7280',
    fontSize: 14,
  },
  paymentOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '500',
  },
  customFieldsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customFieldsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addFieldButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFieldText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  customFieldsList: {
    marginBottom: 16,
  },
  customFieldItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  customFieldInfo: {
    flex: 1,
  },
  customFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  customFieldDetails: {
    flexDirection: 'row',
  },
  customFieldType: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  customFieldRequired: {
    fontSize: 14,
    color: '#6B7280',
  },
  customFieldOptions: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  customFieldActions: {
    flexDirection: 'row',
  },
  editFieldButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  removeFieldButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCustomFieldsText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  speakersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  speakersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addSpeakerButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addSpeakerText: {
    color: '#FFFFFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  speakersList: {
    marginBottom: 16,
  },
  speakerItem: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  speakerImageContainer: {
    marginRight: 12,
  },
  speakerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  speakerImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerImagePlaceholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  speakerInfo: {
    flex: 1,
  },
  speakerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  speakerRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  speakerBio: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  speakerActions: {
    flexDirection: 'row',
  },
  editSpeakerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  removeSpeakerButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noSpeakersText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  sectionNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  prevButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginLeft: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginRight: 4,
  },
  submitContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
  },
  createEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  createEventButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  ticketModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.7,
  },
  fieldModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.6,
  },
  speakerModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCancel: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalBody: {
    padding: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  optionText: {
    color: '#4B5563',
    marginRight: 4,
  },
  optionInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    marginRight: 8,
  },
  addOptionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerImageUpload: {
    alignItems: 'center',
    marginBottom: 24,
  },
  speakerModalImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  speakerModalImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  speakerModalImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeSpeakerImageButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  changeSpeakerImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  previewHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closePreviewButton: {
    padding: 8,
  },
  previewScroll: {
    flex: 1,
  },
  previewBanner: {
    height: 200,
    position: 'relative',
  },
  previewBannerImage: {
    width: '100%',
    height: '100%',
  },
  previewBannerPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewBannerText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  previewBannerGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  previewBannerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  previewEventType: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  previewEventTypeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  previewOrganizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewOrganizerText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 6,
  },
  previewDetails: {
    padding: 16,
  },
  previewDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  previewDetailRow: {
    flexDirection: 'row',
    paddingVertical: 12,
  },
  previewDetailContent: {
    marginLeft: 12,
    flex: 1,
  },
  previewDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  previewDetailText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  previewDetailTextSecondary: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  previewTicketPrice: {
    fontSize: 14,
    color: '#10B981',
    marginTop: 2,
  },
  previewSection: {
    marginBottom: 24,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  previewDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  previewCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewCategory: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  previewCategoryText: {
    color: '#1D4ED8',
    fontSize: 14,
    fontWeight: '500',
  },
  previewTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  previewTagText: {
    color: '#4B5563',
    fontSize: 14,
  },
  previewSpeakerCard: {
    width: 120,
    marginRight: 12,
    alignItems: 'center',
  },
  previewSpeakerImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  previewSpeakerImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  previewSpeakerImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewSpeakerImagePlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9CA3AF',
  },
  previewSpeakerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  previewSpeakerRole: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  editEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  editEventButtonText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  publishEventButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#10B981',
  },
  publishEventButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
  },
});
/**
 * Event Services Architecture
 *
 * This implementation follows the repository pattern to separate:
 * - Domain models (Event)
 * - Data access (EventRepository)
 * - Business logic (EventService)
 */
import { qrCodeService } from './qrCodeService';
import { toDateObject, isValidDate, toFirestoreTimestamp } from '../utils/dateUtils';

import { Alert } from 'react-native';
import { db } from '../../lib/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  limit,
  startAfter,
  writeBatch,
  DocumentData,
  QueryDocumentSnapshot,
  FirestoreError
} from 'firebase/firestore';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Maximum number of cached items

/**
 * Event domain model
 */
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: Date | any; // Support for Firebase Timestamp
  time?: Date | any;
  imageUrl?: string;
  thumbnailUrl?: string; // New field for image thumbnail
  location?: string;
  locationDetails?: {
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    }
  };
  createdBy?: string;
  attendees?: string[];
  maxAttendees?: number;
  price?: number;
  isPaid?: boolean;
  category?: string;
  tags?: string[];
  duration?: number; // in milliseconds
  
  // New privacy and publishing fields
  privacyLevel: 'public' | 'connections' | 'private';
  publishStatus: 'draft' | 'published' | 'scheduled';
  scheduledPublishDate?: Date | any;
  
  // Timestamps
  createdAt?: any;
  updatedAt?: any;
}

/**
 * Event data validation schema
 */
interface EventValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Pagination options for queries
 */
export interface PaginationOptions {
  limit?: number;
  startAfter?: any;
}

/**
 * Event search/filter options
 */
export interface EventFilterOptions extends PaginationOptions {
  category?: string;
  createdBy?: string;
  attendee?: string;
  dateFrom?: Date;
  dateTo?: Date;
  location?: string;
  searchTerm?: string;
  isPaid?: boolean;
  tags?: string[];
  privacyLevel?: 'public' | 'connections' | 'private';
  publishStatus?: 'draft' | 'published' | 'scheduled';
}

/**
 * Response for paginated queries
 */
export interface PaginatedResponse<T> {
  items: T[];
  lastVisible: any | null;
  hasMore: boolean;
  totalFetched: number;
}

/**
 * Event repository interface
 * Defines contract for data access
 */
interface EventRepository {
  create(eventData: Omit<Event, 'id'>): Promise<Event>;
  getById(id: string): Promise<Event | null>;
  update(id: string, eventData: Partial<Event>): Promise<Event>;
  delete(id: string): Promise<boolean>;
  getBatch(options: EventFilterOptions): Promise<PaginatedResponse<Event>>;
  getUserEvents(userId: string, options?: PaginationOptions): Promise<PaginatedResponse<Event>>;
  getUserAttendingEvents(userId: string, options?: PaginationOptions): Promise<PaginatedResponse<Event>>;
  getEventsByCategory(category: string, options?: PaginationOptions): Promise<PaginatedResponse<Event>>;
  addAttendee(eventId: string, userId: string): Promise<boolean>;
  removeAttendee(eventId: string, userId: string): Promise<boolean>;
  deleteMultiple(ids: string[]): Promise<{success: string[], failed: string[]}>;
}

/**
 * Firestore implementation of EventRepository
 */
class FirestoreEventRepository implements EventRepository {
  private eventCache: Map<string, {event: Event, timestamp: number}> = new Map();
  private collectionName = 'events';
  
  /**
   * Helper to convert Firestore document to Event object
   */
  private convertDocToEvent(doc: QueryDocumentSnapshot<DocumentData>): Event {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // Use dateUtils for consistent date handling
      date: toDateObject(data.date),
      time: toDateObject(data.time),
      createdAt: toDateObject(data.createdAt),
      updatedAt: toDateObject(data.updatedAt),
      scheduledPublishDate: toDateObject(data.scheduledPublishDate)
    } as Event;
  }
  
  /**
   * Cache management - store event in cache
   */
  private cacheEvent(id: string, event: Event): void {
    // Remove oldest entry if cache is full
    if (this.eventCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.eventCache.keys().next().value;
      if (oldestKey !== undefined) {
        this.eventCache.delete(oldestKey);
      }
    }
    
    this.eventCache.set(id, {
      event,
      timestamp: Date.now()
    });
  }
  
  /**
   * Cache management - get event from cache if available and not expired
   */
  private getCachedEvent(id: string): Event | null {
    const cached = this.eventCache.get(id);
    if (!cached) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      this.eventCache.delete(id);
      return null;
    }
    
    return cached.event;
  }
  
  /**
   * Cache management - invalidate cache for an event
   */
  private invalidateCache(id: string): void {
    this.eventCache.delete(id);
  }
  
  /**
   * Create a new event
   */
  async create(eventData: Omit<Event, 'id'>): Promise<Event> {
    try {
      // Add timestamps and default values for new fields
      const eventWithTimestamps = {
        ...eventData,
        // Set default privacy level to public if not specified
        privacyLevel: eventData.privacyLevel || 'public',
        // Set default publish status to published if not specified
        publishStatus: eventData.publishStatus || 'published',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Add document to Firestore
      const eventsCollection = collection(db, this.collectionName);
      const docRef = await addDoc(eventsCollection, eventWithTimestamps);
      
      // Get the newly created document
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        throw new Error('Failed to create event');
      }
      
      // Create event object with current date for timestamps
      const newEvent: Event = {
        id: docRef.id,
        ...eventWithTimestamps,
        // Use current date for timestamps that haven't resolved yet
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Cache the new event
      this.cacheEvent(docRef.id, newEvent);
      
      return newEvent;
    } catch (error) {
      console.error('Error in create event repository:', error);
      throw this.handleFirestoreError(error);
    }
  }
  
  /**
   * Get an event by ID
   */
  async getById(id: string): Promise<Event | null> {
    try {
      // Check cache first
      const cachedEvent = this.getCachedEvent(id);
      if (cachedEvent) {
        console.log('Cache hit for event:', id);
        return cachedEvent;
      }
      
      // Cache miss, fetch from Firestore
      console.log('Cache miss for event:', id);
      const eventDoc = doc(db, this.collectionName, id);
      const docSnap = await getDoc(eventDoc);
      
      if (!docSnap.exists()) {
        console.log(`Event with ID ${id} not found`);
        return null;
      }
      
      // Convert document to Event object
      const event = this.convertDocToEvent(docSnap);
      
      // Cache the event
      this.cacheEvent(id, event);
      
      return event;
    } catch (error) {
      console.error('Error in getById event repository:', error);
      throw this.handleFirestoreError(error);
    }
  }
  
  /**
   * Update an existing event
   */
  async update(id: string, eventData: Partial<Event>): Promise<Event> {
    try {
      // Add updated timestamp
      const eventWithTimestamp = {
        ...eventData,
        updatedAt: serverTimestamp()
      };
      
      // Update document in Firestore
      const eventDoc = doc(db, this.collectionName, id);
      await updateDoc(eventDoc, eventWithTimestamp);
      
      // Get the updated document
      const docSnap = await getDoc(eventDoc);
      
      if (!docSnap.exists()) {
        throw new Error(`Event with ID ${id} not found after update`);
      }
      
      // Convert to Event object
      const updatedEvent = this.convertDocToEvent(docSnap);
      
      // Update cache
      this.cacheEvent(id, updatedEvent);
      
      return updatedEvent;
    } catch (error) {
      console.error('Error in update event repository:', error);
      throw this.handleFirestoreError(error);
    }
  }
  
  /**
   * Delete an event
   */
  async delete(id: string): Promise<boolean> {
    try {
      // Delete document from Firestore
      const eventDoc = doc(db, this.collectionName, id);
      await deleteDoc(eventDoc);
      
      // Invalidate cache
      this.invalidateCache(id);
      
      return true;
    } catch (error) {
      console.error('Error in delete event repository:', error);
      throw this.handleFirestoreError(error);
    }
  }
  
  /**
   * Get batch of events with filtering and pagination
   */
  async getBatch(options: EventFilterOptions): Promise<PaginatedResponse<Event>> {
    try {
      const {
        limit: limitCount = 10,
        startAfter: startAfterDoc,
        category,
        createdBy,
        attendee,
        dateFrom,
        dateTo,
        isPaid,
        searchTerm,
        tags,
        privacyLevel,
        publishStatus
      } = options;
      
      // Build base query
      let eventQuery = query(
        collection(db, this.collectionName),
        orderBy('date', 'asc'),
        limit(limitCount + 1) // Fetch one extra to determine if there are more
      );
      
      // Add filters if provided
      if (category) {
        eventQuery = query(eventQuery, where('category', '==', category));
      }
      
      if (createdBy) {
        eventQuery = query(eventQuery, where('createdBy', '==', createdBy));
      }
      
      if (attendee) {
        eventQuery = query(eventQuery, where('attendees', 'array-contains', attendee));
      }
      
      if (isPaid !== undefined) {
        eventQuery = query(eventQuery, where('isPaid', '==', isPaid));
      }
      
      // Add privacy level filter if provided
      if (privacyLevel) {
        eventQuery = query(eventQuery, where('privacyLevel', '==', privacyLevel));
      }
      
      // Add publish status filter if provided
      if (publishStatus) {
        eventQuery = query(eventQuery, where('publishStatus', '==', publishStatus));
      }
      
      // Add startAfter if provided
      if (startAfterDoc) {
        eventQuery = query(eventQuery, startAfter(startAfterDoc));
      }
      
      // Execute query
      const querySnapshot = await getDocs(eventQuery);
      
      // Process results
      const events: Event[] = [];
      let lastVisible = null;
      let index = 0;
      
      querySnapshot.forEach((doc) => {
        // Only add up to the requested limit
        if (index < limitCount) {
          const event = this.convertDocToEvent(doc);
          
          // Apply client-side filtering for date range if specified
          if (dateFrom && event.date < dateFrom) return;
          if (dateTo && event.date > dateTo) return;
          
          // Apply client-side text search if specified
          if (searchTerm && searchTerm.length > 0) {
            const term = searchTerm.toLowerCase();
            const matchesSearch = 
              event.title.toLowerCase().includes(term) ||
              (event.description && event.description.toLowerCase().includes(term)) ||
              (event.location && event.location.toLowerCase().includes(term));
            
            if (!matchesSearch) return;
          }
          
          // Apply client-side tag filtering if specified
          if (tags && tags.length > 0) {
            const eventTags = event.tags || [];
            const hasMatchingTag = tags.some(tag => eventTags.includes(tag));
            if (!hasMatchingTag) return;
          }
          
          events.push(event);
          index++;
        }
        
        // Update the last visible document for pagination
        if (index === limitCount - 1) {
          lastVisible = doc;
        }
      });
      
      return {
        items: events,
        lastVisible: lastVisible,
        hasMore: querySnapshot.size > limitCount,
        totalFetched: events.length
      };
    } catch (error) {
      console.error('Error in getBatch event repository:', error);
      throw this.handleFirestoreError(error);
    }
  }
  
  /**
   * Get events created by a specific user
   */
  async getUserEvents(userId: string, options: PaginationOptions = {}): Promise<PaginatedResponse<Event>> {
    return this.getBatch({
      ...options,
      createdBy: userId
    });
  }
  
  /**
   * Get events that a user is attending
   */
  async getUserAttendingEvents(userId: string, options: PaginationOptions = {}): Promise<PaginatedResponse<Event>> {
    return this.getBatch({
      ...options,
      attendee: userId
    });
  }
  
  /**
   * Get events by category
   */
  async getEventsByCategory(category: string, options: PaginationOptions = {}): Promise<PaginatedResponse<Event>> {
    return this.getBatch({
      ...options,
      category
    });
  }
  
  /**
   * Add a user to an event's attendees
   */
  async addAttendee(eventId: string, userId: string): Promise<boolean> {
    try {
      // Update the event document to add the user to the attendees array
      const eventDoc = doc(db, this.collectionName, eventId);
      await updateDoc(eventDoc, {
        attendees: arrayUnion(userId),
        updatedAt: serverTimestamp()
      });
      
      // Invalidate cache
      this.invalidateCache(eventId);
      
      return true;
    } catch (error) {
      console.error('Error in addAttendee event repository:', error);
      throw this.handleFirestoreError(error);
    }
  }
  
  /**
   * Remove a user from an event's attendees
   */
  async removeAttendee(eventId: string, userId: string): Promise<boolean> {
    try {
      // Update the event document to remove the user from the attendees array
      const eventDoc = doc(db, this.collectionName, eventId);
      await updateDoc(eventDoc, {
        attendees: arrayRemove(userId),
        updatedAt: serverTimestamp()
      });
      
      // Invalidate cache
      this.invalidateCache(eventId);
      
      return true;
    } catch (error) {
      console.error('Error in removeAttendee event repository:', error);
      throw this.handleFirestoreError(error);
    }
  }
  
  /**
   * Delete multiple events in a batch operation
   */
  async deleteMultiple(ids: string[]): Promise<{success: string[], failed: string[]}> {
    const success: string[] = [];
    const failed: string[] = [];
    
    if (ids.length === 0) {
      return { success, failed };
    }
    
    try {
      const batch = writeBatch(db);
      
      // Add each document to the batch
      for (const id of ids) {
        try {
          const eventDoc = doc(db, this.collectionName, id);
          batch.delete(eventDoc);
        } catch (error) {
          console.error(`Failed to queue deletion for event ${id}:`, error);
          failed.push(id);
        }
      }
      
      // Commit the batch
      await batch.commit();
      
      // Determine successful operations
      const successIds = ids.filter(id => !failed.includes(id));
      
      // Update cache
      successIds.forEach(id => this.invalidateCache(id));
      
      return { 
        success: successIds, 
        failed 
      };
    } catch (error) {
      console.error('Error in deleteMultiple event repository:', error);
      // If batch fails, consider all operations failed
      return { success: [], failed: ids };
    }
  }
  
  /**
   * Handle and transform Firestore errors to more user-friendly errors
   */
  private handleFirestoreError(error: any): Error {
    console.log('Handling Firestore error:', error);
    
    if (error instanceof FirestoreError) {
      switch (error.code) {
        case 'permission-denied':
          return new Error('You do not have permission to perform this operation');
        case 'not-found':
          return new Error('The requested resource was not found');
        case 'already-exists':
          return new Error('This event already exists');
        case 'resource-exhausted':
          return new Error('You have exceeded your quota. Please try again later');
        case 'cancelled':
          return new Error('The operation was cancelled');
        case 'invalid-argument':
          return new Error('Invalid data provided');
        case 'failed-precondition':
          // This often happens when a required index is missing
          if (error.message.includes('requires an index')) {
            console.error('Missing Firestore index detected:', error.message);
            // Extract the index creation URL if available
            const indexUrlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com\/[^\s]+/);
            if (indexUrlMatch) {
              console.info('Index creation URL:', indexUrlMatch[0]);
            }
            return new Error('Database query requires an index. Please try again later or contact support.');
          }
          return new Error(`Database precondition failed: ${error.message}`);
        default:
          return new Error(`Database error: ${error.message}`);
      }
    }
    
    // Check for index errors in non-FirestoreError objects
    if (error instanceof Error && error.message.includes('requires an index')) {
      console.error('Missing Firestore index detected in non-FirestoreError:', error.message);
      return new Error('Database query requires an index. Please try again later or contact support.');
    }
    
    return error instanceof Error ? error : new Error('An unknown error occurred');
  }
  
  /**
   * Clear the event cache
   * @returns Promise resolving to success
   */
  async clearCache(): Promise<boolean> {
    try {
      console.log('Clearing event cache');
      
      // Clear in-memory cache
      this.eventCache.clear();
      
      return true;
    } catch (error) {
      console.error('Error in clearCache:', error);
      throw this.handleFirestoreError(error);
    }
  }
}

/**
 * Event Validator
 * Handles validation of event data
 */
class EventValidator {
  /**
   * Validate event data for creation
   */
  validateForCreate(eventData: Omit<Event, 'id'>): EventValidationResult {
    const errors: string[] = [];
    
    // Required fields
    if (!eventData.title || eventData.title.trim().length === 0) {
      errors.push('Event title is required');
    } else if (eventData.title.length > 100) {
      errors.push('Event title must be less than 100 characters');
    }
    
    // Validate privacy level
    if (eventData.privacyLevel &&
        !['public', 'connections', 'private'].includes(eventData.privacyLevel)) {
      errors.push('Invalid privacy level');
    }
    
    // Validate publish status
    if (eventData.publishStatus &&
        !['draft', 'published', 'scheduled'].includes(eventData.publishStatus)) {
      errors.push('Invalid publish status');
    }
    
    // If scheduled, require scheduledPublishDate
    if (eventData.publishStatus === 'scheduled' && !eventData.scheduledPublishDate) {
      errors.push('Scheduled publish date is required for scheduled events');
    }
    
    if (!eventData.date) {
      errors.push('Event date is required');
    }
    
    // Validate price if isPaid is true
    if (eventData.isPaid && (typeof eventData.price !== 'number' || eventData.price < 0)) {
      errors.push('A valid price is required for paid events');
    }
    
    // Validate max attendees if provided
    if (eventData.maxAttendees !== undefined && 
        (typeof eventData.maxAttendees !== 'number' || eventData.maxAttendees <= 0)) {
      errors.push('Maximum attendees must be a positive number');
    }
    
    // Validate location coordinates if provided
    if (eventData.locationDetails?.coordinates) {
      const { latitude, longitude } = eventData.locationDetails.coordinates;
      
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        errors.push('Location coordinates must be valid numbers');
      }
      
      if (latitude < -90 || latitude > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
      
      if (longitude < -180 || longitude > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate event data for update
   */
  validateForUpdate(eventData: Partial<Event>): EventValidationResult {
    const errors: string[] = [];
    
    // Title validation if provided
    if (eventData.title !== undefined) {
      if (eventData.title.trim().length === 0) {
        errors.push('Event title cannot be empty');
      } else if (eventData.title.length > 100) {
        errors.push('Event title must be less than 100 characters');
      }
    }
    
    // Validate privacy level if provided
    if (eventData.privacyLevel &&
        !['public', 'connections', 'private'].includes(eventData.privacyLevel)) {
      errors.push('Invalid privacy level');
    }
    
    // Validate publish status if provided
    if (eventData.publishStatus &&
        !['draft', 'published', 'scheduled'].includes(eventData.publishStatus)) {
      errors.push('Invalid publish status');
    }
    
    // If scheduled, require scheduledPublishDate
    if (eventData.publishStatus === 'scheduled' &&
        !eventData.scheduledPublishDate &&
        eventData.scheduledPublishDate !== undefined) {
      errors.push('Scheduled publish date is required for scheduled events');
    }
    
    // Validate price if isPaid is being updated to true
    if (eventData.isPaid === true && 
        (eventData.price === undefined || typeof eventData.price !== 'number' || eventData.price < 0)) {
      errors.push('A valid price is required for paid events');
    }
    
    // Validate max attendees if provided
    if (eventData.maxAttendees !== undefined && 
        (typeof eventData.maxAttendees !== 'number' || eventData.maxAttendees <= 0)) {
      errors.push('Maximum attendees must be a positive number');
    }
    
    // Validate location coordinates if provided
    if (eventData.locationDetails?.coordinates) {
      const { latitude, longitude } = eventData.locationDetails.coordinates;
      
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        errors.push('Location coordinates must be valid numbers');
      }
      
      if (latitude < -90 || latitude > 90) {
        errors.push('Latitude must be between -90 and 90');
      }
      
      if (longitude < -180 || longitude > 180) {
        errors.push('Longitude must be between -180 and 180');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Main EventService class
 * Handles business logic and uses the repository for data access
 */
class EventService {
  private repository: EventRepository;
  private validator: EventValidator;
  
  constructor() {
    this.repository = new FirestoreEventRepository();
    this.validator = new EventValidator();
  }
  
  /**
   * Create a new event
   */
  async createEvent(eventData: Omit<Event, 'id'>): Promise<Event> {
    try {
      console.log('Creating event with data:', eventData);
      
      // Validate event data
      const validationResult = this.validator.validateForCreate(eventData);
      if (!validationResult.isValid) {
        throw new Error(`Invalid event data: ${validationResult.errors.join(', ')}`);
      }
      
      // Create event through repository
      return await this.repository.create(eventData);
    } catch (error) {
      console.error('Error in createEvent service:', error);
      throw error;
    }
  }
  
  /**
   * Get an event by ID
   */
  async getEventById(id: string): Promise<Event | null> {
    try {
      console.log('Getting event with ID:', id);
      
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid event ID');
      }
      
      return await this.repository.getById(id);
    } catch (error) {
      console.error('Error in getEventById service:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing event
   */
  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event> {
    try {
      console.log('Updating event with ID:', id, 'and data:', eventData);
      
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid event ID');
      }
      
      // Validate event data
      const validationResult = this.validator.validateForUpdate(eventData);
      if (!validationResult.isValid) {
        throw new Error(`Invalid event data: ${validationResult.errors.join(', ')}`);
      }
      
      // Update event through repository
      return await this.repository.update(id, eventData);
    } catch (error) {
      console.error('Error in updateEvent service:', error);
      throw error;
    }
  }
  
  /**
   * Delete an event
   */
  async deleteEvent(id: string): Promise<boolean> {
    try {
      console.log('Deleting event with ID:', id);
      
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid event ID');
      }
      
      return await this.repository.delete(id);
    } catch (error) {
      console.error('Error in deleteEvent service:', error);
      throw error;
    }
  }
  
  /**
   * Get events with pagination and filtering
   */
  async getEvents(options: EventFilterOptions = {}): Promise<PaginatedResponse<Event>> {
    try {
      console.log('Getting events with options:', options);
      return await this.repository.getBatch(options);
    } catch (error) {
      console.error('Error in getEvents service:', error);
      throw error;
    }
  }
  
  /**
   * Get events created by a specific user
   */
  async getUserEvents(userId: string, options: PaginationOptions = {}): Promise<PaginatedResponse<Event>> {
    try {
      console.log('Getting events for user:', userId);
      
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
      
      return await this.repository.getUserEvents(userId, options);
    } catch (error) {
      console.error('Error in getUserEvents service:', error);
      throw error;
    }
  }
  
  /**
   * Get events that a user is attending
   */
  async getUserAttendingEvents(userId: string, options: PaginationOptions = {}): Promise<PaginatedResponse<Event>> {
    try {
      console.log('Getting attending events for user:', userId);
      
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
      
      return await this.repository.getUserAttendingEvents(userId, options);
    } catch (error) {
      console.error('Error in getUserAttendingEvents service:', error);
      throw error;
    }
  }
  
  /**
   * Get events by category
   */
  async getEventsByCategory(category: string, options: PaginationOptions = {}): Promise<PaginatedResponse<Event>> {
    try {
      console.log('Getting events by category:', category);
      
      if (!category || typeof category !== 'string') {
        throw new Error('Invalid category');
      }
      
      return await this.repository.getEventsByCategory(category, options);
    } catch (error) {
      console.error('Error in getEventsByCategory service:', error);
      throw error;
    }
  }
  
  /**
   * Add a user to an event's attendees
   */
  async addAttendee(eventId: string, userId: string): Promise<boolean> {
    try {
      console.log('Adding attendee to event:', eventId, 'user:', userId);
      
      if (!eventId || typeof eventId !== 'string') {
        throw new Error('Invalid event ID');
      }
      
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
      
      // Check if the event exists and has space
      const event = await this.repository.getById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Check if the event has a maximum number of attendees
      if (event.maxAttendees !== undefined && event.attendees) {
        if (event.attendees.length >= event.maxAttendees) {
          throw new Error('Event has reached maximum capacity');
        }
      }
      
      // Check if the user is already an attendee
      if (event.attendees && event.attendees.includes(userId)) {
        return true; // User is already an attendee, consider this a success
      }
      
      return await this.repository.addAttendee(eventId, userId);
    } catch (error) {
      console.error('Error in addAttendee service:', error);
      throw error;
    }
  }
  
  /**
   * Remove a user from an event's attendees
   */
  async removeAttendee(eventId: string, userId: string): Promise<boolean> {
    try {
      console.log('Removing attendee from event:', eventId, 'user:', userId);
      
      if (!eventId || typeof eventId !== 'string') {
        throw new Error('Invalid event ID');
      }
      
      if (!userId || typeof userId !== 'string') {
        throw new Error('Invalid user ID');
      }
      
      return await this.repository.removeAttendee(eventId, userId);
    } catch (error) {
      console.error('Error in removeAttendee service:', error);
      throw error;
    }
  }
  
  /**
   * Delete multiple events
   */
  async deleteMultipleEvents(ids: string[]): Promise<{success: string[], failed: string[]}> {
    try {
      console.log('Deleting multiple events:', ids);
      
      if (!Array.isArray(ids)) {
        throw new Error('Invalid event IDs');
      }
      
      if (ids.length === 0) {
        return { success: [], failed: [] };
      }
      
      return await this.repository.deleteMultiple(ids);
    } catch (error) {
      console.error('Error in deleteMultipleEvents service:', error);
      throw error;
    }
  }
  
  /**
   * Search events by text
   */
  async searchEvents(query: string, options: PaginationOptions = {}): Promise<PaginatedResponse<Event>> {
    try {
      console.log('Searching events with query:', query);
      
      if (!query || typeof query !== 'string') {
        return await this.repository.getBatch(options);
      }
      
      return await this.repository.getBatch({
        ...options,
        searchTerm: query
      });
    } catch (error) {
      console.error('Error in searchEvents service:', error);
      throw error;
    }
  }
  
  /**
   * Check if a user can join an event
   */
  async canUserJoinEvent(eventId: string, userId: string): Promise<{ canJoin: boolean, reason?: string }> {
    try {
      const event = await this.repository.getById(eventId);
      if (!event) {
        return { canJoin: false, reason: 'Event not found' };
      }
      
      // Check if the user is already attending
      if (event.attendees && event.attendees.includes(userId)) {
        return { canJoin: false, reason: 'You are already attending this event' };
      }
      
      // Check if the event is at capacity
      if (event.maxAttendees !== undefined && event.attendees) {
        if (event.attendees.length >= event.maxAttendees) {
          return { canJoin: false, reason: 'Event has reached maximum capacity' };
        }
      }
      
      // Check if the event date has passed
      const eventDate = toDateObject(event.date);
      if (eventDate && eventDate < new Date()) {
        return { canJoin: false, reason: 'Event has already occurred' };
      }
      
      return { canJoin: true };
    } catch (error) {
      console.error('Error in canUserJoinEvent service:', error);
      throw error;
    }
  }

  /**
   * Get attendees for a specific event
   */
  async getEventAttendees(eventId: string): Promise<string[]> {
    try {
      console.log('Getting event with ID:', eventId);
      
      const event = await this.getEventById(eventId);
      if (!event) {
        throw new Error('Event not found');
      }
      
      return event.attendees || [];
    } catch (error) {
      console.error('Error in getEventAttendees service:', error);
      throw error;
    }
  }

  /**
   * Process QR code check-in for an event
   * @param qrCodeURI The QR code URI to process
   * @param validatorId The ID of the person validating the QR code
   * @returns Promise resolving to success status and message
   */
  async processQRCheckIn(qrCodeURI: string, validatorId: string): Promise<{success: boolean, message: string}> {
    try {
      console.log('Processing QR check-in with URI:', qrCodeURI);
      
      // Validate the QR code
      const validationResult = await qrCodeService.validateQRCode(qrCodeURI, validatorId);
      
      if (!validationResult.isValid) {
        console.error('QR code validation failed:', validationResult.message);
        return {
          success: false,
          message: validationResult.message
        };
      }
      
      // If we have QR data, extract eventId and userId
      if (validationResult.data) {
        const { eventId, userId } = validationResult.data;
        
        // Get the event
        const event = await this.getEventById(eventId);
        if (!event) {
          console.error('Event not found');
          return {
            success: false,
            message: 'Event not found'
          };
        }

        // Check if attendee is registered for this event
        const attendees = event.attendees || [];
        if (!attendees.includes(userId)) {
          console.error('Attendee not registered for this event');
          return {
            success: false,
            message: 'Attendee not registered for this event'
          };
        }
        
        // If this is an offline validation, we'll just return success
        // The actual check-in will be processed when online
        if (validationResult.isOfflineValidation) {
          console.log('Offline check-in successful for attendee:', userId);
          return {
            success: true,
            message: 'Offline check-in successful. Will sync when online.'
          };
        }
        
        console.log('Check-in successful for attendee:', userId);
        return {
          success: true,
          message: 'Check-in successful'
        };
      }
      
      // If we don't have QR data but validation passed, return generic success
      return {
        success: true,
        message: 'Check-in successful'
      };
    } catch (error) {
      console.error('Error in processQRCheckIn service:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

// Export the singleton service instance
const eventService = new EventService();
export default eventService;
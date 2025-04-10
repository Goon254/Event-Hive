import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  collectionGroup,
  writeBatch,
  increment,
  limit,
  orderBy,
  startAfter,
  DocumentSnapshot,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../lib/firebaseConfig';

// Import auth for current user reference
const auth = getAuth();

interface LocationDetails {
  buildingName?: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
}

interface CreateEventData {
  title: string;
  description: string;
  date: Date;
  time: Date;
  location: string;
  locationDetails?: LocationDetails;
  capacity: number;
  isPrivate: boolean;
  isPaid?: boolean;
  price?: number;
  paymentOptions?: string[];
  createdBy: string;
  organizerName?: string;
  createdAt?: Date;
  duration?: number; // Event duration in milliseconds
  imageUrl?: string;
  galleryImages?: string[]; // Array of image URLs for the event gallery
  endDate?: Date; // Optional end date for the event
  endTime?: Date; // Optional end time for the event
  registrationDeadline?: Date; // Optional registration deadline for the event
  enableFaceRecognition?: boolean; // Support for face recognition
}

export interface Attendee {
  id: string;
  name: string;
  userId?: string;
  avatar?: string;
  email?: string;
  checkInStatus: 'pending' | 'checked-in' | 'absent';
  paymentStatus?: 'pending' | 'completed' | 'failed'; // Corrected field name
  createdAt: Timestamp; // Timestamp of when the attendee was added
  checkedInAt?: Timestamp;
}

export interface Event extends Omit<CreateEventData, 'date' | 'time' | 'createdAt'> {
  id: string;
  date: Timestamp | Date;
  time: Timestamp | Date;
  createdAt: Timestamp;
  locationDetails?: LocationDetails;
  isPaid: boolean;
  price?: number;
  paymentOptions?: string[];
  organizerName?: string;
  duration?: number;
  attendees?: string[];
  imageUrl?: string;
  timeZone?: string;
  isVirtual?: boolean;
  virtualLink?: string;
  cancellationPolicy?: string;
  speakers?: { name: string; role: string; bio?: string; imageUri?: string }[];
  requireFaceRecognition?: boolean;
  attendeeCount?: number; // Track count in the document for efficiency
  tags?: string[]; // Optional tags for categorizing events
}

// Define page size for pagination
const PAGE_SIZE = 20;

class EventService {
  // Create a new event
  async createEvent(eventData: CreateEventData): Promise<Event> {
    try {
      console.log("Creating event with data:", JSON.stringify(eventData, null, 2));
      
      // Convert dates to Firestore Timestamps
      const firestoreData = {
        ...eventData,
        date: Timestamp.fromDate(eventData.date),
        time: Timestamp.fromDate(eventData.time),
        createdAt: serverTimestamp(), // Use server timestamp for better accuracy
        // Default duration to 3 hours if not specified
        duration: eventData.duration || 3 * 60 * 60 * 1000, // 3 hours in milliseconds
        // Ensure isPaid is a boolean, default to false
        isPaid: eventData.isPaid === true,
        // Only include price and payment options if it's a paid event
        ...(eventData.isPaid ? {
          price: Number(eventData.price) || 0,
          paymentOptions: Array.isArray(eventData.paymentOptions) ? eventData.paymentOptions : []
        } : {
          price: 0,
          paymentOptions: []
        }),
        // Handle optional fields to avoid undefined values
        ...(eventData.endDate && { endDate: Timestamp.fromDate(eventData.endDate) }),
        ...(eventData.endTime && { endTime: Timestamp.fromDate(eventData.endTime) }),
        ...(eventData.registrationDeadline && { 
          registrationDeadline: Timestamp.fromDate(eventData.registrationDeadline) 
        }),
        // Initialize attendee count
        attendeeCount: 0,
        // Set face recognition requirement
        requireFaceRecognition: eventData.enableFaceRecognition || false
      };

      // Add imageUrl only if defined
      if (eventData.imageUrl) {
        firestoreData.imageUrl = eventData.imageUrl;
      }

      // Add galleryImages only if defined and not empty
      if (eventData.galleryImages && eventData.galleryImages.length > 0) {
        firestoreData.galleryImages = eventData.galleryImages;
      }

      // Create a new document in the events collection
      const docRef = await addDoc(collection(db, "events"), firestoreData);
      console.log("Event created with ID:", docRef.id);
      
      // Get the actual document with server timestamp resolved
      const eventDoc = await getDoc(docRef);
      const eventWithData = eventDoc.data() || firestoreData;
      
      // Return the created event with its ID
      return { 
        id: docRef.id, 
        ...eventWithData
      } as Event;
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof Error) {
        // Log Firebase error code if available
        if ('code' in error) {
          console.error(`Firebase error code: ${(error as any).code}`);
        }
      }
      throw error;
    }
  }

  // Get attendees for a specific event
  async getEventAttendees(eventId: string, pageSize: number = PAGE_SIZE, lastDoc?: DocumentSnapshot): Promise<{attendees: Attendee[], lastDoc: DocumentSnapshot | null}> {
    try {
      const attendeesRef = collection(db, "events", eventId, "attendees");
      
      // Create query with pagination support
      let attendeesQuery = query(
        attendeesRef, 
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      
      // If we have a last document, start after it
      if (lastDoc) {
        attendeesQuery = query(
          attendeesRef,
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }
      
      const snapshot = await getDocs(attendeesQuery);
      
      // Get the last visible document for pagination
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      
      const attendees = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Attendee));
      
      return { 
        attendees, 
        lastDoc: lastVisible 
      };
    } catch (error) {
      console.error("Error getting attendees:", error);
      throw new Error(`Failed to get attendees: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Add an attendee to an event with transaction to ensure consistency
  async addEventAttendee(eventId: string, attendeeData: Omit<Attendee, 'id'>): Promise<Attendee> {
    try {
      console.log(`Adding attendee to event ${eventId}:`, attendeeData);
      
      // Validate required fields
      if (!attendeeData.name) {
        throw new Error("Attendee name is required");
      }
      
      if (!attendeeData.checkInStatus) {
        throw new Error("CheckInStatus is required");
      }
      
      // Get user ID from attendee data or current user
      const userId = attendeeData.userId || auth.currentUser?.uid;
      
      if (!userId) {
        throw new Error("User ID is required to register for an event");
      }
      
      // Use a transaction to ensure data consistency
      return await runTransaction(db, async (transaction) => {
        // Get the event document first to check capacity
        const eventRef = doc(db, "events", eventId);
        const eventDoc = await transaction.get(eventRef);
        
        if (!eventDoc.exists()) {
          throw new Error("Event not found");
        }
        
        const eventData = eventDoc.data() as Event;
        
        // Check if event has reached capacity
        if (eventData.capacity && eventData.attendeeCount && eventData.attendeeCount >= eventData.capacity) {
          throw new Error("Event has reached maximum capacity");
        }
        
        // Check if user is already registered
        const attendeesRef = collection(db, "events", eventId, "attendees");
        const existingQuery = query(attendeesRef, where("userId", "==", userId));
        const existingQuerySnapshot = await getDocs(existingQuery);
        
        if (!existingQuerySnapshot.empty) {
          throw new Error("You are already registered for this event");
        }
        
        // Prepare attendee data with timestamps
        const completeAttendeeData = {
          ...attendeeData,
          userId,
          createdAt: serverTimestamp()
        };
        
        // Create new attendee document
        const newAttendeeRef = doc(collection(db, "events", eventId, "attendees"));
        transaction.set(newAttendeeRef, completeAttendeeData);
        
        // Update event's attendee count
        transaction.update(eventRef, {
          attendeeCount: increment(1)
        });
        
        // We need to manually construct the return object because serverTimestamp()
        // doesn't resolve until the transaction completes
        const returnAttendee = {
          id: newAttendeeRef.id,
          ...completeAttendeeData,
          createdAt: Timestamp.now() // Use current timestamp as a fallback
        } as Attendee;
        
        console.log(`Attendee added with ID: ${newAttendeeRef.id}`);
        
        return returnAttendee;
      });
    } catch (error) {
      console.error("Error adding attendee:", error);
      throw new Error(`Failed to add attendee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Remove an attendee with transaction to update counts
  async removeEventAttendee(eventId: string, attendeeId: string): Promise<boolean> {
    try {
      console.log(`Removing attendee ${attendeeId} from event ${eventId}`);
      
      return await runTransaction(db, async (transaction) => {
        // Get the event document
        const eventRef = doc(db, "events", eventId);
        const eventDoc = await transaction.get(eventRef);
        
        if (!eventDoc.exists()) {
          throw new Error("Event not found");
        }
        
        // Reference to the attendee document
        const attendeeRef = doc(db, "events", eventId, "attendees", attendeeId);
        const attendeeDoc = await transaction.get(attendeeRef);
        
        if (!attendeeDoc.exists()) {
          throw new Error("Attendee not found");
        }
        
        // Delete the attendee document
        transaction.delete(attendeeRef);
        
        // Update event's attendee count
        transaction.update(eventRef, {
          attendeeCount: increment(-1)
        });
        
        return true;
      });
    } catch (error) {
      console.error("Error removing attendee:", error);
      throw new Error(`Failed to cancel attendance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Check in an attendee
  async checkInAttendee(eventId: string, attendeeId: string): Promise<void> {
    try {
      const attendeeRef = doc(db, "events", eventId, "attendees", attendeeId);
      await updateDoc(attendeeRef, { 
        checkInStatus: 'checked-in',
        checkedInAt: serverTimestamp() // Use server timestamp for accuracy
      });
    } catch (error) {
      console.error("Error checking in attendee:", error);
      throw new Error(`Failed to check in attendee: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update attendee status
  async updateAttendeeStatus(eventId: string, attendeeId: string, status: 'pending' | 'checked-in' | 'absent'): Promise<void> {
    try {
      const attendeeRef = doc(db, "events", eventId, "attendees", attendeeId);
      
      // Get current attendee data
      const attendeeDoc = await getDoc(attendeeRef);
      if (!attendeeDoc.exists()) {
        throw new Error("Attendee not found");
      }
      
      const updateData: Record<string, any> = { checkInStatus: status };
      
      // Add timestamp if checking in and not already checked in
      if (status === 'checked-in' && attendeeDoc.data().checkInStatus !== 'checked-in') {
        updateData.checkedInAt = serverTimestamp();
      }
      
      await updateDoc(attendeeRef, updateData);
    } catch (error) {
      console.error("Error updating attendee status:", error);
      throw new Error(`Failed to update attendee status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get events with pagination
  async getEvents(pageSize: number = PAGE_SIZE, lastDoc?: DocumentSnapshot): Promise<{events: Event[], lastDoc: DocumentSnapshot | null}> {
    try {
      const eventsRef = collection(db, "events");
      
      // Create query with pagination
      let eventsQuery = query(
        eventsRef,
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      
      // If we have a last document, start after it
      if (lastDoc) {
        eventsQuery = query(
          eventsRef,
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }
      
      const snapshot = await getDocs(eventsQuery);
      
      // Get the last visible document for pagination
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      
      const events = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Event));
      
      return { 
        events, 
        lastDoc: lastVisible 
      };
    } catch (error) {
      console.error("Error getting events:", error);
      throw new Error(`Failed to get events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get events created by a specific user
  async getUserEvents(userId: string, pageSize: number = PAGE_SIZE, lastDoc?: DocumentSnapshot): Promise<{events: Event[], lastDoc: DocumentSnapshot | null}> {
    try {
      const eventsRef = collection(db, "events");
      
      // Create query with pagination
      let userEventsQuery = query(
        eventsRef,
        where("createdBy", "==", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize)
      );
      
      // If we have a last document, start after it
      if (lastDoc) {
        userEventsQuery = query(
          eventsRef,
          where("createdBy", "==", userId),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }
      
      const snapshot = await getDocs(userEventsQuery);
      
      // Get the last visible document for pagination
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      
      const events = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Event));
      
      return { 
        events, 
        lastDoc: lastVisible 
      };
    } catch (error) {
      console.error("Error getting user events:", error);
      throw new Error(`Failed to get user events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get events a user is attending - improved implementation using collectionGroup
  async getUserAttendingEvents(userId: string, pageSize: number = PAGE_SIZE, lastDoc?: DocumentSnapshot): Promise<{events: Event[], lastDoc: DocumentSnapshot | null}> {
    try {
      // Use a collection group query to find all attendees with this userId across events
      let attendeesQuery = query(
        collectionGroup(db, "attendees"),
        where("userId", "==", userId),
        orderBy("createdAt", "desc"),
        limit(pageSize * 2) // Get more since we'll be filtering and deduping
      );
      
      if (lastDoc) {
        attendeesQuery = query(
          collectionGroup(db, "attendees"),
          where("userId", "==", userId),
          orderBy("createdAt", "desc"),
          startAfter(lastDoc),
          limit(pageSize * 2)
        );
      }
      
      const attendeesSnapshot = await getDocs(attendeesQuery);
      
      // Extract event IDs from the paths
      const eventIds = new Set<string>();
      attendeesSnapshot.docs.forEach(doc => {
        // Path format: "events/{eventId}/attendees/{attendeeId}"
        const pathParts = doc.ref.path.split('/');
        if (pathParts.length >= 2) {
          eventIds.add(pathParts[1]);
        }
      });
      
      // Get event details for each event ID
      const eventPromises = Array.from(eventIds).map(eventId => 
        getDoc(doc(db, "events", eventId))
      );
      
      const eventDocs = await Promise.all(eventPromises);
      const events = eventDocs
        .filter(doc => doc.exists())
        .map(doc => ({ id: doc.id, ...doc.data() } as Event))
        .sort((a, b) => {
          // Sort by date descending
          const dateA = a.date instanceof Date ? a.date : a.date.toDate();
          const dateB = b.date instanceof Date ? b.date : b.date.toDate();
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, pageSize); // Limit to requested page size
      
      // Get the last visible attendee doc for pagination
      const lastVisible = attendeesSnapshot.docs.length > 0 ? 
        attendeesSnapshot.docs[attendeesSnapshot.docs.length - 1] : null;
      
      return { 
        events, 
        lastDoc: lastVisible 
      };
    } catch (error) {
      console.error("Error getting attending events:", error);
      throw new Error(`Failed to get attending events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get a single event by ID
  async getEventById(eventId: string): Promise<Event | undefined> {
    try {
      const eventRef = doc(db, "events", eventId);
      const snapshot = await getDoc(eventRef);
      
      if (!snapshot.exists()) return undefined;
      
      // Convert the document to an Event object
      return { 
        id: snapshot.id, 
        ...snapshot.data() 
      } as Event;
    } catch (error) {
      console.error("Error getting event:", error);
      throw new Error(`Failed to get event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Update an event
  async updateEvent(eventId: string, eventData: Partial<CreateEventData>): Promise<Event | undefined> {
    try {
      const eventRef = doc(db, "events", eventId);
      
      // Create a copy of the data for Firestore updates
      const firestoreData: Record<string, any> = { ...eventData };
      
      // Convert dates to Firestore Timestamps if provided
      if (eventData.date instanceof Date) {
        firestoreData.date = Timestamp.fromDate(eventData.date);
      }
      
      if (eventData.time instanceof Date) {
        firestoreData.time = Timestamp.fromDate(eventData.time);
      }
      
      if (eventData.endDate instanceof Date) {
        firestoreData.endDate = Timestamp.fromDate(eventData.endDate);
      }
      
      if (eventData.endTime instanceof Date) {
        firestoreData.endTime = Timestamp.fromDate(eventData.endTime);
      }
      
      if (eventData.registrationDeadline instanceof Date) {
        firestoreData.registrationDeadline = Timestamp.fromDate(eventData.registrationDeadline);
      }
      
      // Handle special fields for paid events
      if (eventData.isPaid !== undefined) {
        firestoreData.isPaid = eventData.isPaid === true;
        
        if (eventData.isPaid) {
          if (eventData.price !== undefined) {
            firestoreData.price = Number(eventData.price) || 0;
          }
          
          if (eventData.paymentOptions !== undefined) {
            firestoreData.paymentOptions = Array.isArray(eventData.paymentOptions) 
              ? eventData.paymentOptions 
              : [];
          }
        } else {
          // If switching to a free event, reset price-related fields
          firestoreData.price = 0;
          firestoreData.paymentOptions = [];
        }
      }
      
      // Add last updated timestamp
      firestoreData.updatedAt = serverTimestamp();
      
      // Update the document
      await updateDoc(eventRef, firestoreData);
      
      // Fetch the updated document
      const updatedSnapshot = await getDoc(eventRef);
      if (!updatedSnapshot.exists()) return undefined;
      
      return { 
        id: updatedSnapshot.id, 
        ...updatedSnapshot.data() 
      } as Event;
    } catch (error) {
      console.error("Error updating event:", error);
      throw new Error(`Failed to update event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Delete an event and its subcollections
  async deleteEvent(eventId: string): Promise<void> {
    try {
      // Use batch write for atomic operations
      const batch = writeBatch(db);
      
      // Delete attendees subcollection (up to 500 documents - Firestore limit)
      const attendeesRef = collection(db, "events", eventId, "attendees");
      const attendeesSnapshot = await getDocs(attendeesRef);
      
      attendeesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Delete the event document itself
      const eventRef = doc(db, "events", eventId);
      batch.delete(eventRef);
      
      // Commit the batch
      await batch.commit();
      
      // Note: For events with more than 500 attendees, we would need recursive deletion
      // This would typically be handled by a Cloud Function in production
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new Error(`Failed to delete event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // QR Code Check-in Support with transaction for consistency
  async validateQRCode(eventId: string, userId: string): Promise<boolean> {
    try {
      // Check if the event exists
      const event = await this.getEventById(eventId);
      if (!event) return false;
      
      // Check if the user is an attendee
      const attendeesRef = collection(db, "events", eventId, "attendees");
      const q = query(attendeesRef, where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) return false;
      
      const attendee = querySnapshot.docs[0];
      
      // Check if already checked in
      if (attendee.data().checkInStatus === 'checked-in') return false;
      
      // Valid QR code
      return true;
    } catch (error) {
      console.error("Error validating QR code:", error);
      return false;
    }
  }

  // Process QR code check-in with transaction
  async processQRCheckIn(eventId: string, userId: string): Promise<boolean> {
    try {
      return await runTransaction(db, async (transaction) => {
        // Find the attendee with this userId
        const attendeesRef = collection(db, "events", eventId, "attendees");
        const q = query(attendeesRef, where("userId", "==", userId));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) return false;
        
        const attendeeDoc = querySnapshot.docs[0];
        const attendeeData = attendeeDoc.data();
        
        // Check if already checked in
        if (attendeeData.checkInStatus === 'checked-in') return false;
        
        // Update status to checked-in
        transaction.update(attendeeDoc.ref, {
          checkInStatus: 'checked-in',
          checkedInAt: serverTimestamp()
        });
        
        return true;
      });
    } catch (error) {
      console.error("Error processing QR check-in:", error);
      return false;
    }
  }

  // Get upcoming events using server timestamp
  async getUpcomingEvents(pageSize: number = PAGE_SIZE, lastDoc?: DocumentSnapshot): Promise<{events: Event[], lastDoc: DocumentSnapshot | null}> {
    try {
      const eventsRef = collection(db, "events");
      const now = Timestamp.now();
      
      // Create query with pagination
      let upcomingQuery = query(
        eventsRef,
        where("date", ">=", now),
        orderBy("date", "asc"),
        limit(pageSize)
      );
      
      // If we have a last document, start after it
      if (lastDoc) {
        upcomingQuery = query(
          eventsRef,
          where("date", ">=", now),
          orderBy("date", "asc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }
      
      const snapshot = await getDocs(upcomingQuery);
      
      // Get the last visible document for pagination
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      
      const events = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Event));
      
      return { 
        events, 
        lastDoc: lastVisible 
      };
    } catch (error) {
      console.error("Error getting upcoming events:", error);
      throw new Error(`Failed to get upcoming events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Search events with improved implementation
  async searchEvents(searchTerm: string, pageSize: number = PAGE_SIZE): Promise<Event[]> {
    try {
      // Basic search implementation - in production, would use Firebase Extensions like Algolia
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(query(eventsRef, limit(500))); // Limit to prevent excessive client-side filtering
      
      const searchTermLower = searchTerm.toLowerCase();
      
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Event))
        .filter(event => 
          event.title?.toLowerCase().includes(searchTermLower) ||
          event.description?.toLowerCase().includes(searchTermLower) ||
          event.location?.toLowerCase().includes(searchTermLower) ||
          event.locationDetails?.city?.toLowerCase().includes(searchTermLower) ||
          event.organizerName?.toLowerCase().includes(searchTermLower) ||
          (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchTermLower)))
        )
        .slice(0, pageSize); // Limit results
    } catch (error) {
      console.error("Error searching events:", error);
      throw new Error(`Failed to search events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get events by city
  async getEventsByCity(city: string, pageSize: number = PAGE_SIZE, lastDoc?: DocumentSnapshot): Promise<{events: Event[], lastDoc: DocumentSnapshot | null}> {
    try {
      // Normalize the city name to ensure consistent search
      const normalizedCity = city.trim().toLowerCase();
      
      const eventsRef = collection(db, "events");
      
      // Create query with pagination
      let cityQuery = query(
        eventsRef,
        where("locationDetails.city", "==", normalizedCity),
        orderBy("date", "asc"),
        limit(pageSize)
      );
      
      // If we have a last document, start after it
      if (lastDoc) {
        cityQuery = query(
          eventsRef,
          where("locationDetails.city", "==", normalizedCity),
          orderBy("date", "asc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }
      
      const snapshot = await getDocs(cityQuery);
      
      // Get the last visible document for pagination
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      
      const events = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Event));
      
      return { 
        events, 
        lastDoc: lastVisible 
      };
    } catch (error) {
      console.error("Error getting events by city:", error);
      throw new Error(`Failed to get events by city: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Get events by category
  async getEventsByCategory(category: string, pageSize: number = PAGE_SIZE, lastDoc?: DocumentSnapshot): Promise<{events: Event[], lastDoc: DocumentSnapshot | null}> {
    try {
      const eventsRef = collection(db, "events");
      
      // Create query with pagination
      let categoryQuery = query(
        eventsRef,
        where("category", "==", category),
        orderBy("date", "asc"),
        limit(pageSize)
      );
      
      // If we have a last document, start after it
      if (lastDoc) {
        categoryQuery = query(
          eventsRef,
          where("category", "==", category),
          orderBy("date", "asc"),
          startAfter(lastDoc),
          limit(pageSize)
        );
      }
      
      const snapshot = await getDocs(categoryQuery);
      
      // Get the last visible document for pagination
      const lastVisible = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      
      const events = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Event));
      
      return { 
        events, 
        lastDoc: lastVisible 
      };
    } catch (error) {
      console.error("Error getting events by category:", error);
      throw new Error(`Failed to get events by category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

const eventService = new EventService();
export default eventService; // Export the instance for use in other parts of the application
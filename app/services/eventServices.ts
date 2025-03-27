// app/services/eventServices.ts
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
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig';

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
}

export interface Attendee {
  id: string;
  name: string;
  avatar?: string;
  checkInStatus: 'pending' | 'checked-in' | 'absent';
  checkedInAt?: Timestamp;
}

export interface Event extends Omit<CreateEventData, 'date' | 'time' | 'createdAt'> {
  imageUrl: any;
  requireFaceRecognition: any;
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
}

class EventService {
  async createEvent(eventData: CreateEventData): Promise<Event> {
    try {
      console.log("Creating event with data:", JSON.stringify(eventData, null, 2));
      
      // Convert dates to Firestore Timestamps
      const firestoreData = {
        ...eventData,
        date: Timestamp.fromDate(eventData.date),
        time: Timestamp.fromDate(eventData.time),
        createdAt: Timestamp.now(),
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
        })
      };

      const docRef = await addDoc(collection(db, "events"), firestoreData);
      console.log("Event created with ID:", docRef.id);
      return { id: docRef.id, ...firestoreData, imageUrl: null, requireFaceRecognition: false };
    } catch (error) {
      console.error("Error creating event:", error);
      if (error instanceof Error && 'code' in error) {
        console.error(`Firebase error code: ${error.code}`);
      }
      throw error;
    }
  }

  async getEventAttendees(eventId: string): Promise<Attendee[]> {
    try {
      const attendeesRef = collection(db, "events", eventId, "attendees");
      const snapshot = await getDocs(attendeesRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendee));
    } catch (error) {
      console.error("Error getting attendees:", error);
      return [];
    }
  }

  async addEventAttendee(eventId: string, attendeeData: Omit<Attendee, 'id'>): Promise<Attendee> {
    try {
      const attendeesRef = collection(db, "events", eventId, "attendees");
      const docRef = await addDoc(attendeesRef, {
        ...attendeeData,
        checkInStatus: attendeeData.checkInStatus || 'pending'
      });
      return { id: docRef.id, ...attendeeData };
    } catch (error) {
      console.error("Error adding attendee:", error);
      throw new Error("Failed to add attendee");
    }
  }

  async checkInAttendee(eventId: string, attendeeId: string): Promise<void> {
    try {
      const attendeeRef = doc(db, "events", eventId, "attendees", attendeeId);
      await updateDoc(attendeeRef, { 
        checkInStatus: 'checked-in',
        checkedInAt: Timestamp.now()
      });
    } catch (error) {
      console.error("Error checking in attendee:", error);
      throw new Error("Failed to check in attendee");
    }
  }

  async updateAttendeeStatus(eventId: string, attendeeId: string, status: 'pending' | 'checked-in' | 'absent'): Promise<void> {
    try {
      const attendeeRef = doc(db, "events", eventId, "attendees", attendeeId);
      const updateData: any = { checkInStatus: status };
      
      // Add timestamp if checking in
      if (status === 'checked-in') {
        updateData.checkedInAt = Timestamp.now();
      }
      
      await updateDoc(attendeeRef, updateData);
    } catch (error) {
      console.error("Error updating attendee status:", error);
      throw new Error("Failed to update attendee status");
    }
  }

  async getEvents(): Promise<Event[]> {
    try {
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(eventsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }

  async getUserEvents(userId: string): Promise<Event[]> {
    try {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("createdBy", "==", userId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
      console.error("Error getting user events:", error);
      return [];
    }
  }

  async getUserAttendingEvents(userId: string): Promise<Event[]> {
    try {
      // This is a complex query requiring a collection group query
      // For simplicity, we'll fetch all events and filter client-side
      // For a production app, consider using Cloud Functions or a different data structure
      const events = await this.getEvents();
      const eventsWithAttendees = await Promise.all(
        events.map(async (event) => {
          const attendees = await this.getEventAttendees(event.id);
          return { event, isAttending: attendees.some(a => a.id === userId) };
        })
      );
      
      return eventsWithAttendees
        .filter(({ isAttending }) => isAttending)
        .map(({ event }) => event);
    } catch (error) {
      console.error("Error getting attending events:", error);
      return [];
    }
  }

  async getEventById(eventId: string): Promise<Event | undefined> {
    try {
      const eventRef = doc(db, "events", eventId);
      const snapshot = await getDoc(eventRef);
      if (!snapshot.exists()) return undefined;
      return { id: snapshot.id, ...snapshot.data() } as Event;
    } catch (error) {
      console.error("Error getting event:", error);
      return undefined;
    }
  }

  async updateEvent(eventId: string, eventData: Partial<CreateEventData>): Promise<Event | undefined> {
    try {
      const eventRef = doc(db, "events", eventId);
      
      // Create a copy of the data for Firestore updates
      const firestoreData = { ...eventData };
      
      // Convert dates to Firestore Timestamps if provided
      if (eventData.date instanceof Date) (firestoreData as any).date = Timestamp.fromDate(eventData.date);
      if (eventData.time instanceof Date) (firestoreData as any).time = Timestamp.fromDate(eventData.time);
      
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
      
      await updateDoc(eventRef, firestoreData);
      
      // Fetch the updated document
      const updatedSnapshot = await getDoc(eventRef);
      if (!updatedSnapshot.exists()) return undefined;
      return { id: updatedSnapshot.id, ...updatedSnapshot.data() } as Event;
    } catch (error) {
      console.error("Error updating event:", error);
      return undefined;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      const eventRef = doc(db, "events", eventId);
      await deleteDoc(eventRef);
    } catch (error) {
      console.error("Error deleting event:", error);
      throw new Error("Failed to delete event");
    }
  }

  // QR Code Check-in Support
  async validateQRCode(eventId: string, userId: string): Promise<boolean> {
    try {
      // Check if the event exists
      const event = await this.getEventById(eventId);
      if (!event) return false;
      
      // Check if the user is an attendee
      const attendees = await this.getEventAttendees(eventId);
      const attendee = attendees.find(a => a.id === userId);
      
      if (!attendee) return false;
      
      // Check if already checked in
      if (attendee.checkInStatus === 'checked-in') return false;
      
      // Valid QR code
      return true;
    } catch (error) {
      console.error("Error validating QR code:", error);
      return false;
    }
  }

  async processQRCheckIn(eventId: string, userId: string): Promise<boolean> {
    try {
      // Validate the QR code first
      const isValid = await this.validateQRCode(eventId, userId);
      if (!isValid) return false;
      
      // Find the attendee
      const attendees = await this.getEventAttendees(eventId);
      const attendee = attendees.find(a => a.id === userId);
      
      if (!attendee) return false;
      
      // Update status to checked-in
      await this.updateAttendeeStatus(eventId, attendee.id, 'checked-in');
      return true;
    } catch (error) {
      console.error("Error processing QR check-in:", error);
      return false;
    }
  }

  // New methods for filtering and searching events
  async getUpcomingEvents(): Promise<Event[]> {
    try {
      const eventsRef = collection(db, "events");
      const now = Timestamp.now();
      const q = query(eventsRef, where("date", ">=", now));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
      console.error("Error getting upcoming events:", error);
      return [];
    }
  }

  async searchEvents(searchTerm: string): Promise<Event[]> {
    try {
      // Basic search implementation - can be improved with a proper search index
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(eventsRef);
      
      const searchTermLower = searchTerm.toLowerCase();
      
      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Event))
        .filter(event => 
          event.title.toLowerCase().includes(searchTermLower) ||
          event.description?.toLowerCase().includes(searchTermLower) ||
          event.location?.toLowerCase().includes(searchTermLower) ||
          event.locationDetails?.city.toLowerCase().includes(searchTermLower) ||
          event.organizerName?.toLowerCase().includes(searchTermLower)
        );
    } catch (error) {
      console.error("Error searching events:", error);
      return [];
    }
  }

  async getEventsByCity(city: string): Promise<Event[]> {
    try {
      const eventsRef = collection(db, "events");
      const q = query(eventsRef, where("locationDetails.city", "==", city));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Event));
    } catch (error) {
      console.error("Error getting events by city:", error);
      return [];
    }
  }
}

const eventService = new EventService();
export default eventService;
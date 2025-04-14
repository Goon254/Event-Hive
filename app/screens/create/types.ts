/**
 * Type definitions for the Event Creation form
 * These types are shared across all components in the event creation flow
 */

// Ticket type definition
export interface TicketType {
  id: string;
  name: string;
  price: string;
  quantity: string;
  description: string;
}

// Custom field for registration
export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'checkbox' | 'select';
  required: boolean;
  options?: string[]; // For select fields
}

// Speaker/performer
export interface Speaker {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUri: string | null;
  // Additional fields for enhanced speaker profiles
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
  };
  expertiseTags?: string[];
  contactEmail?: string;
  contactPhone?: string;
  sessionTitle?: string;
}

// Main form data structure
export interface EventForm {
  id?: string; // Optional ID for the event (will be set when saved)
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
  country: string;
  virtualLink: string;
  capacity: string;
  registrationDeadline: Date | null;
  isPrivate: boolean;
  isPaid: boolean;
  price: string;
  imageUri: string | null;
  ticketTypes: TicketType[];
  customFields: CustomField[];
  speakers: Speaker[];
  cancellationPolicy: string;
}

// Form validation errors
export interface FormErrors {
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

// Section completion tracking
export interface SectionCompletion {
  1: boolean; // Basic Info
  2: boolean; // Date & Time
  3: boolean; // Location
  4: boolean; // Tickets & Registration
  5: boolean; // Speakers
  6: boolean; // Settings & Policies
}

// Navigation direction type
export type NavigationDirection = 'next' | 'previous';

// User type (simplified for this context)
export interface User {
  id: string;
  name?: string;
  email?: string;
}
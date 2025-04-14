/**
 * Constants used throughout the event creation flow
 * Extracted from the original Create.tsx file to improve maintainability
 */

// Define event categories
export const EVENT_CATEGORIES = [
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
export const TIME_ZONES = [
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

// Country list for international address support
export const COUNTRIES = [
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

// Form section names for display
export const SECTION_NAMES = {
  1: 'Basic Details',
  2: 'Date & Time',
  3: 'Location',
  4: 'Tickets & Registration',
  5: 'Speakers & Content',
  6: 'Settings & Policies'
};

// Default form values
export const DEFAULT_FORM_VALUES = {
  id: '',
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
  imageUri: null,
  ticketTypes: [],
  customFields: [],
  speakers: [],
  cancellationPolicy: '',
};

// Default section completion state
export const DEFAULT_SECTION_COMPLETION = {
  1: false, // Basic Info
  2: false, // Date & Time
  3: false, // Location
  4: false, // Tickets & Registration
  5: false, // Speakers
  6: false  // Settings & Policies
};
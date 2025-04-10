// In app/services/locationService.ts
export interface LocationDetails {
    buildingName?: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    // Coordinates for map integration
    latitude?: number;
    longitude?: number;
    // Optional: Add a method to generate full address
    fullAddress?: string;
  }
  
  // Class to implement LocationDetails and generate full address
  export class CustomLocation implements LocationDetails {
    buildingName?: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    latitude?: number;
    longitude?: number;

    constructor(details: LocationDetails) {
      this.buildingName = details.buildingName;
      this.streetAddress = details.streetAddress;
      this.city = details.city;
      this.state = details.state;
      this.zipCode = details.zipCode;
      this.latitude = details.latitude;
      this.longitude = details.longitude;
    }

    generateFullAddress(): string {
      return [

        this.streetAddress,
        this.city,
        this.state,
        this.zipCode
      ].filter(Boolean).join(', ');
    }
  }
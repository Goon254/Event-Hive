// In app/services/eventServices.ts
interface LocationDetails {
    buildingName?: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    // Optional: Add a method to generate full address
    fullAddress?: string;
  }
  
  // Class to implement LocationDetails and generate full address
  class CustomLocation implements LocationDetails {
    buildingName?: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;

    constructor(details: LocationDetails) {
      this.buildingName = details.buildingName;
      this.streetAddress = details.streetAddress;
      this.city = details.city;
      this.state = details.state;
      this.zipCode = details.zipCode;
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
// app/utils/geocodingService.ts
import axios from 'axios';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export class GeocodingService {
  private static API_KEY = 'AIzaSyCmExPy3R_vQkxZnz0asVm5WyJIQp9Jubk';

  static async geocodeAddress(locationDetails: LocationDetails): Promise<GeocodingResult | null> {
    try {
      // Generate full address string
      const fullAddress = [
        locationDetails.buildingName,
        locationDetails.streetAddress,
        locationDetails.city,
        locationDetails.state,
        locationDetails.zipCode
      ].filter(Boolean).join(', ');

      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          address: fullAddress,
          key: this.API_KEY
        }
      });

      if (response.data.status === 'OK') {
        const location = response.data.results[0].geometry.location;
        return {
          latitude: location.lat,
          longitude: location.lng,
          formattedAddress: response.data.results[0].formatted_address
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding Error:', error);
      return null;
    }
  }

  // Reverse geocoding (optional)
  static async reverseGeocode(latitude: number, longitude: number): Promise<LocationDetails | null> {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${latitude},${longitude}`,
          key: this.API_KEY
        }
      });

      if (response.data.status === 'OK') {
        const addressComponents = response.data.results[0].address_components;
        
        return {
          streetAddress: this.findAddressComponent(addressComponents, 'street_number') + ' ' + 
                         this.findAddressComponent(addressComponents, 'route'),
          city: this.findAddressComponent(addressComponents, 'locality'),
          state: this.findAddressComponent(addressComponents, 'administrative_area_level_1'),
          zipCode: this.findAddressComponent(addressComponents, 'postal_code')
        };
      }

      return null;
    } catch (error) {
      console.error('Reverse Geocoding Error:', error);
      return null;
    }
  }

  // Helper to extract specific address components
  private static findAddressComponent(components: any[], type: string): string {
    const component = components.find(
      comp => comp.types.includes(type)
    );
    return component ? component.long_name : '';
  }
}
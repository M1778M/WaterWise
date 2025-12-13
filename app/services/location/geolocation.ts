import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IP_API_URL = 'http://ip-api.com/json/';
const LOCATION_STORAGE_KEY = '@waterwise_location';

export interface LocationData {
  country: string;
  countryCode: string;
  city: string;
  lat: number;
  lon: number;
  timezone: string;
  regionName: string;
}

export const getLocationFromIP = async (): Promise<LocationData> => {
  try {
    const response = await axios.get(IP_API_URL, {
      timeout: 10000,
    });

    if (response.data.status === 'fail') {
      throw new Error('Failed to detect location from IP');
    }

    const locationData: LocationData = {
      country: response.data.country,
      countryCode: response.data.countryCode,
      city: response.data.city,
      lat: response.data.lat,
      lon: response.data.lon,
      timezone: response.data.timezone,
      regionName: response.data.regionName,
    };

    await saveLocation(locationData);
    return locationData;
  } catch (error) {
    if (__DEV__) {
      console.error('IP geolocation error:', error);
    }
    throw new Error('Failed to detect your location. Please set it manually.');
  }
};

export const saveLocation = async (location: LocationData): Promise<void> => {
  try {
    await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to save location:', error);
    }
  }
};

export const getSavedLocation = async (): Promise<LocationData | null> => {
  try {
    const data = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to get saved location:', error);
    }
    return null;
  }
};

export const getLocation = async (): Promise<LocationData> => {
  try {
    const saved = await getSavedLocation();
    if (saved) {
      return saved;
    }

    try {
      return await getLocationFromIP();
    } catch (ipError) {
      const defaultLocation: LocationData = {
        country: 'Iran',
        countryCode: 'IR',
        city: 'Tehran',
        lat: 35.6892,
        lon: 51.3890,
        timezone: 'Asia/Tehran',
        regionName: 'Tehran',
      };
      await saveLocation(defaultLocation);
      return defaultLocation;
    }
  } catch (error) {
    return {
      country: 'Iran',
      countryCode: 'IR',
      city: 'Tehran',
      lat: 35.6892,
      lon: 51.3890,
      timezone: 'Asia/Tehran',
      regionName: 'Tehran',
    };
  }
};

export const clearLocation = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(LOCATION_STORAGE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.error('Failed to clear location:', error);
    }
  }
};

export const POPULAR_CITIES: LocationData[] = [
  { country: 'Iran', countryCode: 'IR', city: 'Tehran', lat: 35.6892, lon: 51.3890, timezone: 'Asia/Tehran', regionName: 'Tehran' },
  { country: 'Iran', countryCode: 'IR', city: 'Mashhad', lat: 36.2974, lon: 59.6059, timezone: 'Asia/Tehran', regionName: 'Razavi Khorasan' },
  { country: 'Iran', countryCode: 'IR', city: 'Isfahan', lat: 32.6539, lon: 51.6660, timezone: 'Asia/Tehran', regionName: 'Isfahan' },
  { country: 'United States', countryCode: 'US', city: 'New York', lat: 40.7128, lon: -74.0060, timezone: 'America/New_York', regionName: 'New York' },
  { country: 'United Kingdom', countryCode: 'GB', city: 'London', lat: 51.5074, lon: -0.1278, timezone: 'Europe/London', regionName: 'England' },
  { country: 'Japan', countryCode: 'JP', city: 'Tokyo', lat: 35.6762, lon: 139.6503, timezone: 'Asia/Tokyo', regionName: 'Tokyo' },
];

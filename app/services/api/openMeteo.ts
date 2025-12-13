import axios from 'axios';
import { getCache, setCache } from '../db/cache';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1';

export interface WeatherData {
  latitude: number;
  longitude: number;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  weatherCode: number;
}

export interface ClimateData {
  latitude: number;
  longitude: number;
  dailyRainfall: number[];
  dailyTemperature: number[];
  dates: string[];
}

const handleApiError = (error: any, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new Error('No internet connection. Please check your network.');
    }
    return new Error(error.response?.data?.reason || fallbackMessage);
  }
  return error instanceof Error ? error : new Error(String(error));
};

export const getCurrentWeather = async (
  latitude: number,
  longitude: number,
  useCache: boolean = true
): Promise<WeatherData> => {
  const cacheKey = `weather_${latitude}_${longitude}`;

  if (useCache) {
    const cached = await getCache<WeatherData>(cacheKey, 60);
    if (cached) return cached;
  }

  try {
    const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
      params: {
        latitude,
        longitude,
        current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
        timezone: 'auto',
      },
      timeout: 10000,
    });

    const current = response.data.current;
    const weatherData: WeatherData = {
      latitude,
      longitude,
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      precipitation: current.precipitation,
      windSpeed: current.wind_speed_10m,
      weatherCode: current.weather_code,
    };

    await setCache(cacheKey, weatherData, 60);
    return weatherData;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch weather data');
  }
};

export const getHistoricalClimate = async (
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
  useCache: boolean = true
): Promise<ClimateData> => {
  const cacheKey = `climate_${latitude}_${longitude}_${startDate}_${endDate}`;

  if (useCache) {
    const cached = await getCache<ClimateData>(cacheKey, 360);
    if (cached) return cached;
  }

  try {
    const response = await axios.get(`${OPEN_METEO_BASE_URL}/forecast`, {
      params: {
        latitude,
        longitude,
        start_date: startDate,
        end_date: endDate,
        daily: 'precipitation_sum,temperature_2m_mean',
        timezone: 'auto',
      },
      timeout: 15000,
    });

    const daily = response.data.daily;
    const climateData: ClimateData = {
      latitude,
      longitude,
      dailyRainfall: daily.precipitation_sum,
      dailyTemperature: daily.temperature_2m_mean,
      dates: daily.time,
    };

    await setCache(cacheKey, climateData, 360);
    return climateData;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch climate data');
  }
};

export const getDroughtIndicator = async (
  latitude: number,
  longitude: number,
  days: number = 30,
  useCache: boolean = true
): Promise<{ avgPrecipitation: number; isDroughtRisk: boolean }> => {
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const cacheKey = `drought_${latitude}_${longitude}_${days}`;

  if (useCache) {
    const cached = await getCache<{ avgPrecipitation: number; isDroughtRisk: boolean }>(cacheKey, 120);
    if (cached) return cached;
  }

  try {
    const climateData = await getHistoricalClimate(latitude, longitude, startDate, endDate, useCache);
    const totalPrecipitation = climateData.dailyRainfall.reduce((sum, val) => sum + val, 0);
    const avgPrecipitation = totalPrecipitation / climateData.dailyRainfall.length;
    const isDroughtRisk = avgPrecipitation < 1.5;

    const result = { avgPrecipitation, isDroughtRisk };
    await setCache(cacheKey, result, 120);
    return result;
  } catch (error) {
    throw handleApiError(error, 'Failed to calculate drought indicator');
  }
};

export const getWeatherDescriptionKey = (code: number): string => {
  const weatherCodeKeys: { [key: number]: string } = {
    0: 'weather.clearSky',
    1: 'weather.mainlyClear',
    2: 'weather.partlyCloudy',
    3: 'weather.overcast',
    45: 'weather.foggy',
    48: 'weather.depositingRimeFog',
    51: 'weather.lightDrizzle',
    53: 'weather.moderateDrizzle',
    55: 'weather.denseDrizzle',
    61: 'weather.slightRain',
    63: 'weather.moderateRain',
    65: 'weather.heavyRain',
    71: 'weather.slightSnow',
    73: 'weather.moderateSnow',
    75: 'weather.heavySnow',
    77: 'weather.snowGrains',
    80: 'weather.slightRainShowers',
    81: 'weather.moderateRainShowers',
    82: 'weather.violentRainShowers',
    85: 'weather.slightSnowShowers',
    86: 'weather.heavySnowShowers',
    95: 'weather.thunderstorm',
    96: 'weather.thunderstormSlightHail',
    99: 'weather.thunderstormHeavyHail',
  };

  return weatherCodeKeys[code] || 'weather.unknown';
};

export const getWeatherDescription = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Foggy',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };

  return weatherCodes[code] || 'Unknown';
};

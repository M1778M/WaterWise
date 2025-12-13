import axios from 'axios';
import { getCache, setCache } from '../db/cache';

const WORLDBANK_BASE_URL = 'https://api.worldbank.org/v2';

export interface WorldBankIndicator {
  id: string;
  value: string;
}

export interface WorldBankDataPoint {
  indicator: WorldBankIndicator;
  country: {
    id: string;
    value: string;
  };
  countryiso3code: string;
  date: string;
  value: number | null;
  unit: string;
  decimal: number;
}

export interface WorldBankResponse {
  page: number;
  pages: number;
  per_page: number;
  total: number;
  data: WorldBankDataPoint[];
}

// Water-related indicator codes
export const WATER_INDICATORS = {
  FRESHWATER_WITHDRAWAL: 'ER.H2O.FWTL.K3', // Annual freshwater withdrawals, total (billion cubic meters)
  AGRICULTURE_WITHDRAWAL: 'ER.H2O.FWAG.K3', // Agricultural water withdrawal (billion cubic meters)
  INDUSTRIAL_WITHDRAWAL: 'ER.H2O.FWIN.K3', // Industrial water withdrawal (billion cubic meters)
  DOMESTIC_WITHDRAWAL: 'ER.H2O.FWDM.K3', // Domestic water withdrawal (billion cubic meters)
  BASIC_DRINKING_WATER: 'SH.H2O.BASW.ZS', // People using at least basic drinking water services (% of population)
  SAFE_DRINKING_WATER: 'SH.H2O.SMDW.ZS', // People using safely managed drinking water services (% of population)
};

const handleApiError = (error: any, fallbackMessage: string): Error => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return new Error('No internet connection. Please check your network.');
    }
    return new Error(error.response?.data?.message?.[0]?.value || fallbackMessage);
  }
  return error instanceof Error ? error : new Error(String(error));
};

/**
 * Fetch indicator data for a specific country
 */
export const getCountryIndicatorData = async (
  countryCode: string,
  indicatorCode: string,
  options?: {
    perPage?: number;
    page?: number;
    dateRange?: { start: string; end: string };
    useCache?: boolean;
  }
): Promise<WorldBankDataPoint[]> => {
  const { perPage = 50, page = 1, dateRange, useCache = true } = options || {};
  
  const cacheKey = `worldbank_${countryCode}_${indicatorCode}_${page}_${dateRange?.start || ''}_${dateRange?.end || ''}`;
  
  if (useCache) {
    const cached = await getCache<WorldBankDataPoint[]>(cacheKey, 360); // 6 hours
    if (cached) return cached;
  }

  try {
    let url = `${WORLDBANK_BASE_URL}/country/${countryCode}/indicator/${indicatorCode}?format=json&per_page=${perPage}&page=${page}`;
    
    if (dateRange) {
      url += `&date=${dateRange.start}:${dateRange.end}`;
    }

    const response = await axios.get(url, {
      timeout: 15000,
    });

    // WorldBank returns array with metadata at index 0, data at index 1
    const [metadata, data] = response.data;
    
    if (!data || data.length === 0) {
      return [];
    }

    // Filter out null values and sort by date descending
    const validData = data.filter((d: WorldBankDataPoint) => d.value !== null);
    
    await setCache(cacheKey, validData, 360);
    return validData;
  } catch (error) {
    throw handleApiError(error, `Failed to fetch ${indicatorCode} data for ${countryCode}`);
  }
};

/**
 * Fetch indicator data for all countries
 */
export const getGlobalIndicatorData = async (
  indicatorCode: string,
  options?: {
    perPage?: number;
    page?: number;
    dateRange?: { start: string; end: string };
    useCache?: boolean;
  }
): Promise<WorldBankDataPoint[]> => {
  const { perPage = 100, page = 1, dateRange, useCache = true } = options || {};
  
  const cacheKey = `worldbank_global_${indicatorCode}_${page}_${dateRange?.start || ''}_${dateRange?.end || ''}`;
  
  if (useCache) {
    const cached = await getCache<WorldBankDataPoint[]>(cacheKey, 360); // 6 hours
    if (cached) return cached;
  }

  try {
    let url = `${WORLDBANK_BASE_URL}/country/all/indicator/${indicatorCode}?format=json&per_page=${perPage}&page=${page}`;
    
    if (dateRange) {
      url += `&date=${dateRange.start}:${dateRange.end}`;
    }

    const response = await axios.get(url, {
      timeout: 20000,
    });

    const [metadata, data] = response.data;
    
    if (!data || data.length === 0) {
      return [];
    }

    // Filter out null values
    const validData = data.filter((d: WorldBankDataPoint) => d.value !== null);
    
    await setCache(cacheKey, validData, 360);
    return validData;
  } catch (error) {
    throw handleApiError(error, `Failed to fetch global ${indicatorCode} data`);
  }
};

/**
 * Fetch latest data point for a country and indicator
 */
export const getLatestCountryData = async (
  countryCode: string,
  indicatorCode: string,
  useCache: boolean = true
): Promise<WorldBankDataPoint | null> => {
  const data = await getCountryIndicatorData(countryCode, indicatorCode, {
    perPage: 10,
    page: 1,
    useCache,
  });

  // Return the most recent data point with a value
  return data.length > 0 ? data[0] : null;
};

/**
 * Fetch water statistics for a country (all water indicators)
 */
export const getCountryWaterStats = async (
  countryCode: string,
  useCache: boolean = true
): Promise<Record<string, WorldBankDataPoint | null>> => {
  const cacheKey = `worldbank_water_stats_${countryCode}`;
  
  if (useCache) {
    const cached = await getCache<Record<string, WorldBankDataPoint | null>>(cacheKey, 360);
    if (cached) return cached;
  }

  const stats: Record<string, WorldBankDataPoint | null> = {};

  try {
    // Fetch all water indicators in parallel
    const results = await Promise.allSettled([
      getLatestCountryData(countryCode, WATER_INDICATORS.FRESHWATER_WITHDRAWAL, useCache),
      getLatestCountryData(countryCode, WATER_INDICATORS.AGRICULTURE_WITHDRAWAL, useCache),
      getLatestCountryData(countryCode, WATER_INDICATORS.INDUSTRIAL_WITHDRAWAL, useCache),
      getLatestCountryData(countryCode, WATER_INDICATORS.DOMESTIC_WITHDRAWAL, useCache),
      getLatestCountryData(countryCode, WATER_INDICATORS.BASIC_DRINKING_WATER, useCache),
      getLatestCountryData(countryCode, WATER_INDICATORS.SAFE_DRINKING_WATER, useCache),
    ]);

    const indicators = Object.keys(WATER_INDICATORS);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        stats[indicators[index]] = result.value;
      } else {
        stats[indicators[index]] = null;
      }
    });

    await setCache(cacheKey, stats, 360);
    return stats;
  } catch (error) {
    throw handleApiError(error, `Failed to fetch water statistics for ${countryCode}`);
  }
};

/**
 * Get top countries by water consumption
 */
export const getTopWaterConsumers = async (
  limit: number = 10,
  year?: string,
  useCache: boolean = true
): Promise<WorldBankDataPoint[]> => {
  const cacheKey = `worldbank_top_consumers_${limit}_${year || 'latest'}`;
  
  if (useCache) {
    const cached = await getCache<WorldBankDataPoint[]>(cacheKey, 360);
    if (cached) return cached;
  }

  try {
    const options: any = {
      perPage: 300,
      page: 1,
      useCache,
    };

    if (year) {
      options.dateRange = { start: year, end: year };
    }

    const data = await getGlobalIndicatorData(
      WATER_INDICATORS.FRESHWATER_WITHDRAWAL,
      options
    );

    // Sort by value descending and take top N, filter duplicates
    const topConsumers = data
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .filter((item, index, self) => 
        self.findIndex(t => t.countryiso3code === item.countryiso3code) === index
      )
      .slice(0, limit);

    await setCache(cacheKey, topConsumers, 360);
    return topConsumers;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch top water consumers');
  }
};

/**
 * Compare countries water statistics
 */
export const compareCountriesWater = async (
  countryCodes: string[],
  indicatorCode: string,
  useCache: boolean = true
): Promise<Record<string, WorldBankDataPoint | null>> => {
  const cacheKey = `worldbank_compare_${countryCodes.join('_')}_${indicatorCode}`;
  
  if (useCache) {
    const cached = await getCache<Record<string, WorldBankDataPoint | null>>(cacheKey, 360);
    if (cached) return cached;
  }

  const comparison: Record<string, WorldBankDataPoint | null> = {};

  try {
    const results = await Promise.allSettled(
      countryCodes.map(code => getLatestCountryData(code, indicatorCode, useCache))
    );

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        comparison[countryCodes[index]] = result.value;
      } else {
        comparison[countryCodes[index]] = null;
      }
    });

    await setCache(cacheKey, comparison, 360);
    return comparison;
  } catch (error) {
    throw handleApiError(error, 'Failed to compare countries');
  }
};

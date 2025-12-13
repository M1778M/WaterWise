import { getDatabase } from './database';

export const setCache = async (key: string, value: any, ttlMinutes: number = 60): Promise<void> => {
  const db = getDatabase();
  const timestamp = Date.now();
  const valueStr = JSON.stringify(value);

  await db.runAsync(
    'INSERT OR REPLACE INTO cache (key, value, timestamp) VALUES (?, ?, ?)',
    [key, valueStr, timestamp]
  );
};

export const getCache = async <T>(key: string, ttlMinutes: number = 60): Promise<T | null> => {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ value: string; timestamp: number }>(
    'SELECT value, timestamp FROM cache WHERE key = ?',
    [key]
  );

  if (!result) return null;

  const age = Date.now() - result.timestamp;
  const maxAge = ttlMinutes * 60 * 1000;

  if (age > maxAge) {
    await deleteCache(key);
    return null;
  }

  return JSON.parse(result.value) as T;
};

export const deleteCache = async (key: string): Promise<void> => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM cache WHERE key = ?', [key]);
};

export const clearOldCache = async (maxAgeMinutes: number = 360): Promise<void> => {
  const db = getDatabase();
  const cutoff = Date.now() - (maxAgeMinutes * 60 * 1000);
  await db.runAsync('DELETE FROM cache WHERE timestamp < ?', [cutoff]);
};

export const clearAllCache = async (): Promise<void> => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM cache');
};

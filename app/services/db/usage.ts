import { getDatabase } from './database';

export interface Usage {
  id: number;
  liters: number;
  date: string;
  time?: string;
  category?: string;
  location?: string;
  description?: string;
}

export const addUsage = async (usage: Omit<Usage, 'id'>): Promise<void> => {
  const db = getDatabase();
  await db.runAsync(
    'INSERT INTO usage (liters, date, time, category, location, description) VALUES (?, ?, ?, ?, ?, ?)',
    [usage.liters, usage.date, usage.time || null, usage.category || null, usage.location || null, usage.description || null]
  );
};

export const getAllUsage = async (): Promise<Usage[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<Usage>('SELECT * FROM usage ORDER BY date DESC');
  return result;
};

export const getUsageByDateRange = async (startDate: string, endDate: string): Promise<Usage[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<Usage>(
    'SELECT * FROM usage WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startDate, endDate]
  );
  return result;
};

export const getUsageByDate = async (date: string): Promise<Usage[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<Usage>(
    'SELECT * FROM usage WHERE date = ? ORDER BY id DESC',
    [date]
  );
  return result;
};

export const getTotalUsageByDate = async (date: string): Promise<number> => {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(liters), 0) as total FROM usage WHERE date = ?',
    [date]
  );
  return result?.total || 0;
};

export const getAverageDailyUsage = async (days: number = 30): Promise<number> => {
  const db = getDatabase();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  const result = await db.getFirstAsync<{ avg: number }>(
    'SELECT COALESCE(AVG(daily_total), 0) as avg FROM (SELECT date, SUM(liters) as daily_total FROM usage WHERE date >= ? GROUP BY date)',
    [startDateStr]
  );
  return result?.avg || 0;
};

export const deleteUsage = async (id: number): Promise<void> => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM usage WHERE id = ?', [id]);
};

export const updateUsage = async (id: number, updates: Partial<Omit<Usage, 'id'>>): Promise<void> => {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(value);
  });

  values.push(id);
  await db.runAsync(
    `UPDATE usage SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Type guard for web environment
declare var window: any;

// Web platform mock database using localStorage
class WebDatabase {
  private getTable(tableName: string): any[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];
    const data = window.localStorage.getItem(`waterwise_${tableName}`);
    return data ? JSON.parse(data) : [];
  }

  private saveTable(tableName: string, data: any[]): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(`waterwise_${tableName}`, JSON.stringify(data));
    }
  }

  async execAsync(query: string): Promise<any> {
    // For CREATE TABLE and other DDL commands
    if (__DEV__) {
      console.log('Web DB exec:', query.substring(0, 100));
    }
    return Promise.resolve();
  }

  async runAsync(query: string, params?: any[]): Promise<any> {
    const lowerQuery = query.toLowerCase();
    
    // INSERT
    if (lowerQuery.includes('insert into bills')) {
      const bills = this.getTable('bills');
      const newBill = {
        id: params?.[0],
        amount: params?.[1],
        date: params?.[2],
        consumptionLiters: params?.[3],
      };
      bills.push(newBill);
      this.saveTable('bills', bills);
      return { lastInsertRowId: bills.length, changes: 1 };
    }
    
    if (lowerQuery.includes('insert into usage')) {
      const usage = this.getTable('usage');
      const newUsage = {
        id: usage.length + 1,
        liters: params?.[0],
        date: params?.[1],
        description: params?.[2],
      };
      usage.push(newUsage);
      this.saveTable('usage', usage);
      return { lastInsertRowId: newUsage.id, changes: 1 };
    }
    
    // DELETE
    if (lowerQuery.includes('delete from bills')) {
      const bills = this.getTable('bills');
      const filtered = bills.filter(b => b.id !== params?.[0]);
      this.saveTable('bills', filtered);
      return { changes: bills.length - filtered.length };
    }
    
    if (lowerQuery.includes('delete from usage')) {
      const usage = this.getTable('usage');
      const filtered = usage.filter(u => u.id !== params?.[0]);
      this.saveTable('usage', filtered);
      return { changes: usage.length - filtered.length };
    }
    
    // UPDATE
    if (lowerQuery.includes('update bills')) {
      const bills = this.getTable('bills');
      const index = bills.findIndex(b => b.id === params?.[params.length - 1]);
      if (index !== -1) {
        // Simple update - you'd need to parse the SET clause properly
        bills[index] = { ...bills[index], ...params };
      }
      this.saveTable('bills', bills);
      return { changes: index !== -1 ? 1 : 0 };
    }
    
    return { lastInsertRowId: 0, changes: 0 };
  }

  async getFirstAsync<T>(query: string, params?: any[]): Promise<T | null> {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('from bills')) {
      const bills = this.getTable('bills');
      
      // SUM queries
      if (lowerQuery.includes('sum(consumptionliters)')) {
        const total = bills.reduce((sum, b) => sum + (b.consumptionLiters || 0), 0);
        return { total } as T;
      }
      if (lowerQuery.includes('sum(amount)')) {
        const total = bills.reduce((sum, b) => sum + (b.amount || 0), 0);
        return { total } as T;
      }
      
      return bills[0] as T || null;
    }
    
    if (lowerQuery.includes('from usage')) {
      const usage = this.getTable('usage');
      
      // SUM queries
      if (lowerQuery.includes('sum(liters)')) {
        const dateParam = params?.[0];
        let filtered = usage;
        if (dateParam) {
          filtered = usage.filter(u => u.date === dateParam);
        }
        const total = filtered.reduce((sum, u) => sum + (u.liters || 0), 0);
        return { total } as T;
      }
      
      // AVG queries
      if (lowerQuery.includes('avg(liters)')) {
        const total = usage.reduce((sum, u) => sum + (u.liters || 0), 0);
        const avg = usage.length > 0 ? total / usage.length : 0;
        return { avg } as T;
      }
      
      return usage[0] as T || null;
    }
    
    if (lowerQuery.includes('from cache')) {
      const cache = this.getTable('cache');
      const key = params?.[0];
      const item = cache.find(c => c.key === key);
      return item as T || null;
    }
    
    return null;
  }

  async getAllAsync<T>(query: string, params?: any[]): Promise<T[]> {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('from bills')) {
      let bills = this.getTable('bills');
      
      // Filter by date range if params provided
      if (params && params.length >= 2) {
        const [startDate, endDate] = params;
        bills = bills.filter(b => b.date >= startDate && b.date <= endDate);
      }
      
      // Sort by date DESC
      bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return bills as T[];
    }
    
    if (lowerQuery.includes('from usage')) {
      let usage = this.getTable('usage');
      
      // Filter by date range if params provided
      if (params && params.length >= 2) {
        const [startDate, endDate] = params;
        usage = usage.filter(u => u.date >= startDate && u.date <= endDate);
      }
      
      // Sort by date DESC
      usage.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      return usage as T[];
    }
    
    if (lowerQuery.includes('from cache')) {
      return this.getTable('cache') as T[];
    }
    
    return [];
  }

  async closeAsync(): Promise<void> {
    return Promise.resolve();
  }
}

export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  if (db) return db;
  if (initPromise) return initPromise;

  if (Platform.OS === 'web') {
    // For web platform, create a functional database that uses localStorage
    const webDb = new WebDatabase() as any;
    db = webDb;
    if (__DEV__) {
      console.log('Database initialized (web mode with localStorage)');
    }
    return webDb;
  }

  initPromise = (async () => {
    const database = await SQLite.openDatabaseAsync('waterwise.db');

    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS bills (
        id TEXT PRIMARY KEY NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        consumptionLiters REAL NOT NULL,
        currency TEXT DEFAULT 'USD'
      );

      CREATE TABLE IF NOT EXISTS usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        liters REAL NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        category TEXT,
        location TEXT,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS cache (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_bills_date ON bills(date);
      CREATE INDEX IF NOT EXISTS idx_usage_date ON usage(date);
      CREATE INDEX IF NOT EXISTS idx_cache_timestamp ON cache(timestamp);
    `);

    if (__DEV__) {
      console.log('Database initialized successfully');
    }
    
    db = database;
    return database;
  })();

  try {
    const result = await initPromise;
    return result;
  } catch (error) {
    console.error('Database initialization error:', error);
    initPromise = null;
    throw error;
  }
};

export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase first.');
  }
  return db;
};

export const closeDatabase = async (): Promise<void> => {
  if (db && Platform.OS !== 'web') {
    await db.closeAsync();
    db = null;
  }
};

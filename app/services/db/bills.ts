import { getDatabase } from './database';

export interface Bill {
  id: string;
  amount: number;
  date: string;
  consumptionLiters: number;
  currency?: string;
}

export const addBill = async (bill: Omit<Bill, 'id'> & { id?: string }): Promise<void> => {
  const db = getDatabase();
  const billId = bill.id || `BILL-${Date.now()}`;
  const currency = bill.currency || 'USD';

  await db.runAsync(
    'INSERT INTO bills (id, amount, date, consumptionLiters, currency) VALUES (?, ?, ?, ?, ?)',
    [billId, bill.amount, bill.date, bill.consumptionLiters, currency]
  );
};

export const getAllBills = async (): Promise<Bill[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<Bill>('SELECT * FROM bills ORDER BY date DESC');
  return result;
};

export const getBillsByDateRange = async (startDate: string, endDate: string): Promise<Bill[]> => {
  const db = getDatabase();
  const result = await db.getAllAsync<Bill>(
    'SELECT * FROM bills WHERE date >= ? AND date <= ? ORDER BY date DESC',
    [startDate, endDate]
  );
  return result;
};

export const updateBill = async (id: string, updates: Partial<Omit<Bill, 'id'>>): Promise<void> => {
  const db = getDatabase();
  const fields: string[] = [];
  const values: any[] = [];

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ?`);
    values.push(value);
  });

  values.push(id);
  await db.runAsync(
    `UPDATE bills SET ${fields.join(', ')} WHERE id = ?`,
    values
  );
};

export const deleteBill = async (id: string): Promise<void> => {
  const db = getDatabase();
  await db.runAsync('DELETE FROM bills WHERE id = ?', [id]);
};

export const getTotalConsumption = async (): Promise<number> => {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(consumptionLiters), 0) as total FROM bills'
  );
  return result?.total || 0;
};

export const getTotalCost = async (): Promise<number> => {
  const db = getDatabase();
  const result = await db.getFirstAsync<{ total: number }>(
    'SELECT COALESCE(SUM(amount), 0) as total FROM bills'
  );
  return result?.total || 0;
};

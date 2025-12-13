import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllBills } from '../db/bills';
import { getAllUsage } from '../db/usage';
import { Platform } from 'react-native';

export interface ExportData {
  version: string;
  exportDate: string;
  bills: any[];
  usage: any[];
}

declare const document: any;

export async function exportToJSON(): Promise<string> {
  try {
    const [bills, usage] = await Promise.all([
      getAllBills(),
      getAllUsage()
    ]);

    const exportData: ExportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      bills,
      usage
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const fileName = `waterwise_export_${new Date().toISOString().split('T')[0]}.json`;
    
    if (Platform.OS === 'web') {
      // Web export using download link
      const element = document.createElement('a');
      element.setAttribute('href', 'data:application/json;charset=utf-8,' + encodeURIComponent(jsonString));
      element.setAttribute('download', fileName);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      return fileName;
    } else {
      const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      
      return fileUri;
    }
  } catch (error) {
    console.error('Export error:', error);
    throw new Error('Failed to export data');
  }
}

export async function exportToCSV(): Promise<string> {
  try {
    const [bills, usage] = await Promise.all([
      getAllBills(),
      getAllUsage()
    ]);

    // Bills CSV
    let billsCSV = 'Date,Amount,Consumption (L)\n';
    bills.forEach(bill => {
      billsCSV += `${bill.date},${bill.amount},${bill.consumptionLiters}\n`;
    });

    // Usage CSV
    let usageCSV = 'Date,Liters,Description\n';
    usage.forEach(u => {
      usageCSV += `${u.date},${u.liters},"${u.description || ''}"\n`;
    });

    const combinedCSV = `=== BILLS ===\n${billsCSV}\n=== USAGE ===\n${usageCSV}`;
    const fileName = `waterwise_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    if (Platform.OS === 'web') {
      // Web export using download link
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(combinedCSV));
      element.setAttribute('download', fileName);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      return fileName;
    } else {
      const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;
      await FileSystem.writeAsStringAsync(fileUri, combinedCSV);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      }
      
      return fileUri;
    }
  } catch (error) {
    console.error('Export error:', error);
    throw new Error('Failed to export CSV');
  }
}

export async function importFromJSON(jsonString: string): Promise<{
  billsImported: number;
  usageImported: number;
}> {
  try {
    const data: ExportData = JSON.parse(jsonString);
    
    if (!data.version || !data.bills || !data.usage) {
      throw new Error('Invalid import file format');
    }

    const { addBill } = require('../db/bills');
    const { addUsage } = require('../db/usage');

    let billsImported = 0;
    let usageImported = 0;

    for (const bill of data.bills) {
      try {
        await addBill({
          amount: bill.amount,
          date: bill.date,
          consumptionLiters: bill.consumptionLiters,
          billId: bill.billId
        });
        billsImported++;
      } catch (error) {
        console.warn('Failed to import bill:', error);
      }
    }

    for (const usage of data.usage) {
      try {
        await addUsage({
          liters: usage.liters,
          date: usage.date,
          description: usage.description
        });
        usageImported++;
      } catch (error) {
        console.warn('Failed to import usage:', error);
      }
    }

    return { billsImported, usageImported };
  } catch (error) {
    console.error('Import error:', error);
    throw new Error('Failed to import data');
  }
}

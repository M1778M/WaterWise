import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'IRR', symbol: '﷼', name: 'Iranian Rial' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
];

interface CurrencySelectorProps {
  selectedCurrency: string;
  onSelect: (currency: string) => void;
  visible: boolean;
  onClose: () => void;
}

export function CurrencySelector({ selectedCurrency, onSelect, visible, onClose }: CurrencySelectorProps) {
  const handleSelect = (code: string) => {
    onSelect(code);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Select Currency</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.listContainer}>
            {CURRENCIES.map((currency) => (
              <TouchableOpacity
                key={currency.code}
                style={[
                  styles.currencyItem,
                  selectedCurrency === currency.code && styles.currencyItemSelected,
                ]}
                onPress={() => handleSelect(currency.code)}
              >
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                  <View>
                    <Text style={styles.currencyCode}>{currency.code}</Text>
                    <Text style={styles.currencyName}>{currency.name}</Text>
                  </View>
                </View>
                {selectedCurrency === currency.code && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function getCurrencySymbol(code: string): string {
  const currency = CURRENCIES.find(c => c.code === code);
  return currency ? currency.symbol : '$';
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  listContainer: {
    padding: 8,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
  currencyItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  currencyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
    width: 40,
    textAlign: 'center',
  },
  currencyCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currencyName: {
    fontSize: 14,
    color: '#666',
  },
  checkmark: {
    fontSize: 24,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});

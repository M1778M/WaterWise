import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { getAllBills, deleteBill, getTotalConsumption, getTotalCost, Bill } from '../services/db/bills';
import { t } from '../i18n';

type BillsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Bills'>;

interface Props {
  navigation: BillsScreenNavigationProp;
}

export default function BillsScreen({ navigation }: Props) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadBills = async () => {
    try {
      const [billsData, consumption, cost] = await Promise.all([
        getAllBills(),
        getTotalConsumption(),
        getTotalCost(),
      ]);
      setBills(billsData);
      setTotalConsumption(consumption);
      setTotalCost(cost);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load bills:', error);
      }
      Alert.alert(t('common.error'), t('bills.loadError'));
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadBills();
  };

  const handleDeleteBill = (id: string) => {
    Alert.alert(t('bills.deleteBill'), t('bills.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteBill(id);
            loadBills();
          } catch (error) {
            if (__DEV__) {
              console.error('Failed to delete bill:', error);
            }
            Alert.alert(t('common.error'), t('bills.deleteError'));
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('bills.totalConsumption')}</Text>
          <Text style={styles.summaryValue}>{totalConsumption.toFixed(0)} L</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t('bills.totalCost')}</Text>
          <Text style={styles.summaryValue}>${totalCost.toFixed(2)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddBill')}
      >
        <Text style={styles.addButtonText}>+ {t('bills.addBill')}</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.billsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {bills.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('bills.noBills')}</Text>
            <Text style={styles.emptySubtext}>{t('bills.noBillsMessage')}</Text>
          </View>
        ) : (
          bills.map((bill) => (
            <View key={bill.id} style={styles.billCard}>
              <View style={styles.billHeader}>
                <Text style={styles.billId}>{bill.id}</Text>
                <TouchableOpacity onPress={() => handleDeleteBill(bill.id)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.billDetails}>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>{t('bills.date')}:</Text>
                  <Text style={styles.billValue}>{formatDate(bill.date)}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>{t('bills.amount')}:</Text>
                  <Text style={styles.billValue}>${bill.amount.toFixed(2)}</Text>
                </View>
                <View style={styles.billRow}>
                  <Text style={styles.billLabel}>{t('bills.consumption')}:</Text>
                  <Text style={styles.billValue}>{bill.consumptionLiters.toFixed(0)} L</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  billsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
  },
  billCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  billId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    fontSize: 20,
  },
  billDetails: {
    gap: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  billLabel: {
    fontSize: 15,
    color: '#666',
  },
  billValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
});

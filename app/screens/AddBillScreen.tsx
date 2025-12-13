import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { addBill } from '../services/db/bills';
import { t } from '../i18n';
import { DatePicker } from '../components/DatePicker';
import { CurrencySelector, getCurrencySymbol } from '../components/CurrencySelector';

type AddBillScreenNavigationProp = StackNavigationProp<RootStackParamList, 'AddBill'>;

interface Props {
  navigation: AddBillScreenNavigationProp;
}

export default function AddBillScreen({ navigation }: Props) {
  const [billId, setBillId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [consumptionLiters, setConsumptionLiters] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  const handleSave = async () => {
    if (!billId.trim()) {
      Alert.alert(t('common.error'), 'Please enter a bill ID');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert(t('common.error'), 'Please enter a valid amount');
      return;
    }

    const consumptionNum = parseFloat(consumptionLiters);
    if (isNaN(consumptionNum) || consumptionNum <= 0) {
      Alert.alert(t('common.error'), 'Please enter valid consumption');
      return;
    }

    try {
      setSaving(true);
      await addBill({
        id: billId.trim(),
        amount: amountNum,
        date: date.toISOString().split('T')[0],
        consumptionLiters: consumptionNum,
        currency,
      });

      showToast('✓ Bill added successfully!');
      Alert.alert(t('common.success'), t('addBill.addSuccess'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to add bill:', error);
      }
      Alert.alert(t('common.error'), t('addBill.addError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('addBill.billId')} *</Text>
            <TextInput
              style={styles.input}
              value={billId}
              onChangeText={setBillId}
              placeholder={t('addBill.billIdPlaceholder')}
              placeholderTextColor="#999"
            />
            <Text style={styles.hint}>Use any format to identify your bill</Text>
          </View>

          <DatePicker
            label={`${t('addBill.date')} *`}
            value={date}
            onChange={setDate}
            mode="date"
          />

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('addBill.amount')} *</Text>
            <View style={styles.amountContainer}>
              <TouchableOpacity
                style={styles.currencyButton}
                onPress={() => setShowCurrencySelector(true)}
              >
                <Text style={styles.currencyButtonText}>{getCurrencySymbol(currency)} {currency}</Text>
              </TouchableOpacity>
              <TextInput
                style={[styles.input, styles.amountInput]}
                value={amount}
                onChangeText={setAmount}
                placeholder={t('addBill.amountPlaceholder')}
                keyboardType="decimal-pad"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('addBill.consumption')} *</Text>
            <TextInput
              style={styles.input}
              value={consumptionLiters}
              onChangeText={setConsumptionLiters}
              placeholder={t('addBill.consumptionPlaceholder')}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
            <Text style={styles.hint}>Check your bill for water consumption in liters</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? t('common.loading') : t('addBill.addButton')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CurrencySelector
        selectedCurrency={currency}
        onSelect={setCurrency}
        visible={showCurrencySelector}
        onClose={() => setShowCurrencySelector(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  amountContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  currencyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 12,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  amountInput: {
    flex: 1,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    elevation: 3,
  },
  saveButtonDisabled: {
    backgroundColor: '#a5d6a7',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

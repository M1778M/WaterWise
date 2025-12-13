import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getAllUsage,
  addUsage,
  deleteUsage,
  getTotalUsageByDate,
  getAverageDailyUsage,
  Usage,
} from '../services/db/usage';
import { t } from '../i18n';
import { DatePicker } from '../components/DatePicker';

export default function UsageScreen() {
  const [usages, setUsages] = useState<Usage[]>([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [avgDaily, setAvgDaily] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLiters, setNewLiters] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [newTime, setNewTime] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsages = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [usagesData, todayUsage, avgUsage] = await Promise.all([
        getAllUsage(),
        getTotalUsageByDate(today),
        getAverageDailyUsage(30),
      ]);

      setUsages(usagesData);
      setTodayTotal(todayUsage);
      setAvgDaily(avgUsage);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load usage data:', error);
      }
      Alert.alert(t('common.error'), t('usage.loadError'));
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadUsages();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadUsages();
  };

  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  const handleAddUsage = async () => {
    const liters = parseFloat(newLiters);
    if (isNaN(liters) || liters <= 0) {
      Alert.alert(t('common.error'), t('usage.validationError'));
      return;
    }

    try {
      setSaving(true);
      await addUsage({
        liters,
        date: newDate.toISOString().split('T')[0],
        time: newTime.trim() || undefined,
        category: newCategory.trim() || undefined,
        location: newLocation.trim() || undefined,
        description: newDescription.trim() || undefined,
      });

      setNewLiters('');
      setNewDescription('');
      setNewDate(new Date());
      setNewTime('');
      setNewCategory('');
      setNewLocation('');
      setShowAddForm(false);
      
      showToast('✓ Usage added successfully!');
      loadUsages();
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to add usage:', error);
      }
      Alert.alert(t('common.error'), t('usage.addError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUsage = (id: number) => {
    Alert.alert(t('usage.deleteUsage'), t('usage.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteUsage(id);
            showToast('✓ Usage deleted successfully!');
            loadUsages();
          } catch (error) {
            if (__DEV__) {
              console.error('Failed to delete usage:', error);
            }
            Alert.alert(t('common.error'), t('usage.deleteError'));
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return '';
    return timeString;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('home.todayUsage')}</Text>
            <Text style={styles.summaryValue}>{todayTotal.toFixed(1)} L</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{t('home.avgDaily')}</Text>
            <Text style={styles.summaryValue}>{avgDaily.toFixed(1)} L/day</Text>
          </View>
        </View>

        {!showAddForm ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(true)}
          >
            <Text style={styles.addButtonText}>+ {t('usage.addUsage')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.addForm}>
            <Text style={styles.formLabel}>Amount (Liters) *</Text>
            <TextInput
              style={styles.input}
              value={newLiters}
              onChangeText={setNewLiters}
              placeholder={t('usage.litersPlaceholder')}
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
            
            <DatePicker
              label="Date *"
              value={newDate}
              onChange={setNewDate}
              mode="date"
            />
            
            <Text style={styles.formLabel}>Time (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newTime}
              onChangeText={setNewTime}
              placeholder="e.g., 14:30 or 2:30 PM"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.formLabel}>Category (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="e.g., Shower, Cooking, Washing"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.formLabel}>Location (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newLocation}
              onChangeText={setNewLocation}
              placeholder="e.g., Kitchen, Bathroom, Garden"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.formLabel}>Description (Optional)</Text>
            <TextInput
              style={styles.input}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Additional notes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={2}
            />
            
            <View style={styles.formButtons}>
              <TouchableOpacity
                style={[styles.formButton, styles.saveFormButton]}
                onPress={handleAddUsage}
                disabled={saving}
              >
                <Text style={styles.formButtonText}>
                  {saving ? t('common.loading') : t('common.save')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelFormButton]}
                onPress={() => {
                  setShowAddForm(false);
                  setNewLiters('');
                  setNewDescription('');
                  setNewDate(new Date());
                  setNewTime('');
                  setNewCategory('');
                  setNewLocation('');
                }}
                disabled={saving}
              >
                <Text style={styles.cancelFormButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {usages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('usage.noUsage')}</Text>
            <Text style={styles.emptySubtext}>{t('usage.noUsageMessage')}</Text>
          </View>
        ) : (
          usages.map((usage) => (
            <View key={usage.id} style={styles.usageCard}>
              <View style={styles.usageHeader}>
                <View style={styles.usageHeaderLeft}>
                  <Text style={styles.usageDate}>{formatDate(usage.date)}</Text>
                  {usage.time && <Text style={styles.usageTime}>⏰ {formatTime(usage.time)}</Text>}
                </View>
                <TouchableOpacity onPress={() => handleDeleteUsage(usage.id)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.usageLiters}>{usage.liters.toFixed(1)} L</Text>
              {usage.category && (
                <Text style={styles.usageCategory}>📁 {usage.category}</Text>
              )}
              {usage.location && (
                <Text style={styles.usageLocation}>📍 {usage.location}</Text>
              )}
              {usage.description && (
                <Text style={styles.usageDescription}>{usage.description}</Text>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
    backgroundColor: '#00BCD4',
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
  addForm: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveFormButton: {
    backgroundColor: '#4CAF50',
  },
  cancelFormButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  formButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelFormButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  usageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  usageHeaderLeft: {
    flex: 1,
  },
  usageDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  usageTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  deleteButton: {
    fontSize: 20,
  },
  usageLiters: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00BCD4',
    marginBottom: 8,
  },
  usageCategory: {
    fontSize: 13,
    color: '#4CAF50',
    marginBottom: 4,
    fontWeight: '600',
  },
  usageLocation: {
    fontSize: 13,
    color: '#FF9800',
    marginBottom: 4,
    fontWeight: '600',
  },
  usageDescription: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

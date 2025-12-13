import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { t } from '../i18n';

export type ChartType = 'line' | 'bar' | 'area' | 'pie';
export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

interface ChartControlsProps {
  onChartTypeChange?: (type: ChartType) => void;
  onTimeRangeChange?: (range: TimeRange) => void;
  selectedChartType?: ChartType;
  selectedTimeRange?: TimeRange;
  showChartType?: boolean;
  showTimeRange?: boolean;
}

const getChartTypes = (): { value: ChartType; label: string; icon: string }[] => [
  { value: 'line', label: t('charts.line'), icon: '📈' },
  { value: 'bar', label: t('charts.bar'), icon: '📊' },
  { value: 'area', label: t('charts.area'), icon: '📉' },
  { value: 'pie', label: t('charts.pie'), icon: '🥧' },
];

const getTimeRanges = (): { value: TimeRange; label: string; icon: string }[] => [
  { value: 'daily', label: t('charts.daily'), icon: '📅' },
  { value: 'weekly', label: t('charts.weekly'), icon: '📆' },
  { value: 'monthly', label: t('charts.monthly'), icon: '🗓️' },
  { value: 'yearly', label: t('charts.yearly'), icon: '📊' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
];

export const ChartControls: React.FC<ChartControlsProps> = ({
  onChartTypeChange,
  onTimeRangeChange,
  selectedChartType = 'line',
  selectedTimeRange = 'monthly',
  showChartType = true,
  showTimeRange = true,
}) => {
  const [showChartPicker, setShowChartPicker] = useState(false);
  const [showRangePicker, setShowRangePicker] = useState(false);

  const CHART_TYPES = getChartTypes();
  const TIME_RANGES = getTimeRanges();

  const currentChartType = CHART_TYPES.find(t => t.value === selectedChartType);
  const currentTimeRange = TIME_RANGES.find(t => t.value === selectedTimeRange);

  return (
    <View style={styles.container}>
      {showChartType && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowChartPicker(true)}
        >
          <Text style={styles.buttonIcon}>{currentChartType?.icon}</Text>
          <Text style={styles.buttonText}>{currentChartType?.label}</Text>
        </TouchableOpacity>
      )}

      {showTimeRange && (
        <TouchableOpacity
          style={styles.button}
          onPress={() => setShowRangePicker(true)}
        >
          <Text style={styles.buttonIcon}>{currentTimeRange?.icon}</Text>
          <Text style={styles.buttonText}>{currentTimeRange?.label}</Text>
        </TouchableOpacity>
      )}

      <Modal
        visible={showChartPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChartPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('charts.chartType')}</Text>
            <FlatList
              data={CHART_TYPES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.value === selectedChartType && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    onChartTypeChange?.(item.value);
                    setShowChartPicker(false);
                  }}
                >
                  <Text style={styles.optionIcon}>{item.icon}</Text>
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === selectedChartType && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowChartPicker(false)}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showRangePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRangePicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('charts.timeRange')}</Text>
            <FlatList
              data={TIME_RANGES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    item.value === selectedTimeRange && styles.optionItemSelected,
                  ]}
                  onPress={() => {
                    onTimeRangeChange?.(item.value);
                    setShowRangePicker(false);
                  }}
                >
                  <Text style={styles.optionIcon}>{item.icon}</Text>
                  <Text style={styles.optionText}>{item.label}</Text>
                  {item.value === selectedTimeRange && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowRangePicker(false)}
            >
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  buttonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionItemSelected: {
    backgroundColor: '#E3F2FD',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  checkmark: {
    fontSize: 20,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
});

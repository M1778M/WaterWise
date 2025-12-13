import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { getTopWaterConsumers, WorldBankDataPoint } from '../services/api/worldBank';
import { t, isRTL } from '../i18n';

const screenWidth = Dimensions.get('window').width;

export default function GlobalStatsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [topConsumers, setTopConsumers] = useState<WorldBankDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setError(null);
      const data = await getTopWaterConsumers(10);
      
      if (!data || data.length === 0) {
        setError(t('global.noData'));
        console.warn('No data returned from World Bank API');
        setTopConsumers([]);
        return;
      }
      
      console.log('Loaded data:', data);
      setTopConsumers(data);
    } catch (err) {
      if (__DEV__) {
        console.error('Failed to load global stats:', err);
      }
      const errorMsg = err instanceof Error ? err.message : t('global.errorLoading');
      setError(errorMsg);
      Alert.alert(t('common.error'), t('global.errorMessage'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{t('global.loadingData')}</Text>
      </View>
    );
  }

  const hasData = topConsumers.length > 0;
  const rtl = isRTL();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={[styles.section, rtl && styles.sectionRTL]}>
        <Text style={[styles.sectionTitle, rtl && styles.rtlText]}>
          {t('global.pageTitle')}
        </Text>
        <Text style={[styles.infoText, rtl && styles.rtlText]}>
          {t('global.infoText')}
        </Text>

        {error && (
          <View style={styles.errorCard}>
            <Text style={[styles.errorText, rtl && styles.rtlText]}>⚠️ {error}</Text>
            <Text style={[styles.errorSubtext, rtl && styles.rtlText]}>
              {t('global.pullToRetry')}
            </Text>
          </View>
        )}

        {hasData && (
          <>
            {/* Top Consumers Bar Chart */}
            <View style={styles.statCard}>
              <Text style={[styles.statTitle, rtl && styles.rtlText]}>
                {t('global.topConsumers')}
              </Text>
              <Text style={[styles.statSubtitle, rtl && styles.rtlText]}>
                {t('global.annualWithdrawals')}
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <BarChart
                  data={{
                    labels: topConsumers.map(d => d.countryiso3code),
                    datasets: [
                      {
                        data: topConsumers.map(d => d.value || 0),
                      },
                    ],
                  }}
                  width={Math.max(screenWidth - 32, topConsumers.length * 60)}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    backgroundColor: '#fff',
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                  }}
                  style={styles.chart}
                />
              </ScrollView>
            </View>

            {/* Ranking List */}
            <View style={styles.statCard}>
              <Text style={[styles.statTitle, rtl && styles.rtlText]}>
                {t('global.topConsumers')}
              </Text>

              {topConsumers.slice(0, 10).map((item, index) => (
                <View key={`${item.countryiso3code}-${index}`} style={styles.listItem}>
                  <Text style={[styles.listRank, rtl && styles.rtlText]}>#{index + 1}</Text>
                  <Text style={[styles.listCountry, rtl && styles.rtlText]}>
                    {item.country.value}
                  </Text>
                  <Text style={[styles.listValue, rtl && styles.rtlText]}>
                    {item.value?.toFixed(1)} B m³
                  </Text>
                </View>
              ))}

              <Text style={[styles.dataSource, rtl && styles.rtlText]}>
                {t('global.dataSource')}: {topConsumers[0]?.date} | {t('global.worldBankData')}
              </Text>
            </View>

            {/* Key Insights */}
            <View style={styles.statCard}>
              <Text style={[styles.statTitle, rtl && styles.rtlText]}>
                {t('global.keyInsights')}
              </Text>
              <Text style={[styles.statItem, rtl && styles.rtlText]}>
                • <Text style={{ fontWeight: 'bold' }}>
                  {t('global.largestConsumer')}:
                </Text>{' '}
                {topConsumers[0]?.country.value} {t('global.withdraws')}{' '}
                {topConsumers[0]?.value?.toFixed(1)} B m³ {t('global.perYear')}
              </Text>

              <Text style={[styles.statItem, rtl && styles.rtlText]}>
                • <Text style={{ fontWeight: 'bold' }}>{t('global.topShare')}:</Text>{' '}
                {topConsumers.slice(0, 3).reduce((sum, d) => sum + (d.value || 0), 0).toFixed(1)} B m³ (
                {(
                  (topConsumers.slice(0, 3).reduce((sum, d) => sum + (d.value || 0), 0) /
                    topConsumers.slice(0, 10).reduce((sum, d) => sum + (d.value || 0), 0)) *
                  100
                ).toFixed(0)}
                % {t('global.of')} {rtl ? 'برتر ۱۰' : 'top 10'})
              </Text>

              <Text style={[styles.statItem, rtl && styles.rtlText]}>
                • <Text style={{ fontWeight: 'bold' }}>{t('global.average')}:</Text>{' '}
                {(
                  topConsumers.slice(0, 10).reduce((sum, d) => sum + (d.value || 0), 0) / 10
                ).toFixed(1)}{' '}
                B m³ {t('global.perCountry')}
              </Text>

              <Text style={[styles.statItem, rtl && styles.rtlText]}>
                • <Text style={{ fontWeight: 'bold' }}>{t('global.globalTotal')}:</Text>{' '}
                {topConsumers
                  .slice(0, 10)
                  .reduce((sum, d) => sum + (d.value || 0), 0)
                  .toFixed(1)}{' '}
                B m³ {t('global.annually')}
              </Text>

              <Text style={[styles.statItem, rtl && styles.rtlText]}>
                • <Text style={{ fontWeight: 'bold' }}>
                  {t('global.perCapitaGap')}:
                </Text>{' '}
                {t('global.waterUsageVaries')}
              </Text>
            </View>
          </>
        )}

        {!hasData && !error && (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, rtl && styles.rtlText]}>
              {t('global.noData')}
            </Text>
            <Text style={[styles.emptySubtext, rtl && styles.rtlText]}>
              {t('global.tryAgain')}
            </Text>
          </View>
        )}

        {/* Water Conservation Tips */}
        <View style={styles.statCard}>
          <Text style={[styles.statTitle, rtl && styles.rtlText]}>
            {t('global.conservationTips')}
          </Text>
          <Text style={[styles.sectionSubtitle, rtl && styles.rtlText]}>
            {t('global.individualActions')}
          </Text>

          <Text style={[styles.statItem, rtl && styles.rtlText]}>
            🚿 <Text style={{ fontWeight: 'bold' }}>
              {t('global.shortShowers')}:
            </Text>{' '}
            5 min = 50L | Bath = 150L (saves 100L/shower)
          </Text>

          <Text style={[styles.statItem, rtl && styles.rtlText]}>
            🔧 <Text style={{ fontWeight: 'bold' }}>
              {t('global.fixLeaks')}:
            </Text>{' '}
            1 drip/sec = 20L/day = 7,300L/year per leak
          </Text>

          <Text style={[styles.statItem, rtl && styles.rtlText]}>
            🌱 <Text style={{ fontWeight: 'bold' }}>
              {t('global.smartGardening')}:
            </Text>{' '}
            Drip irrigation saves 50% vs sprinklers
          </Text>

          <Text style={[styles.statItem, rtl && styles.rtlText]}>
            🧺 <Text style={{ fontWeight: 'bold' }}>
              {t('global.fullLoads')}:
            </Text>{' '}
            Use 40L+ per cycle
          </Text>

          <Text style={[styles.statItem, rtl && styles.rtlText]}>
            💰 <Text style={{ fontWeight: 'bold' }}>
              {t('global.economicValue')}:
            </Text>{' '}
            Save water = Save money
          </Text>

          <Text style={[styles.statItem, rtl && styles.rtlText]}>
            🌍 <Text style={{ fontWeight: 'bold' }}>
              {t('global.yourImpact')}:
            </Text>{' '}
            50L/day = 18,000L/year
          </Text>
        </View>

        <Text style={[styles.footnote, rtl && styles.rtlText]}>
          📊 {t('global.lastUpdated')}: {new Date().toLocaleDateString()} • Pull down to refresh
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 16,
  },
  sectionRTL: {
    direction: 'rtl',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#FF9800',
    marginBottom: 12,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  errorCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  errorText: {
    fontSize: 16,
    color: '#C62828',
    fontWeight: '600',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    alignItems: 'center',
    marginVertical: 60,
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
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 8,
  },
  statSubtitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    width: 40,
  },
  listCountry: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    marginHorizontal: 8,
  },
  listValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9800',
    minWidth: 80,
    textAlign: 'right',
  },
  dataSource: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  statItem: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  footnote: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 32,
    fontStyle: 'italic',
  },
  rtlText: {
    textAlign: 'right',
    direction: 'rtl',
  },
});

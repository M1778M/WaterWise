import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { t, isRTL } from '../i18n';
import { useTheme } from '../services/theme/ThemeContext';
import {
  generateUsageReport,
  UsagePattern,
  MonthlyTrend,
  WaterSavingsOpportunity,
} from '../services/analytics/usageAnalytics';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<'patterns' | 'trends' | 'opportunities'>('trends');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rtl = isRTL();

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const data = await generateUsageReport();
      setReport(data);
      
      // Animate entrance
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>{t('analytics.loading')}</Text>
      </View>
    );
  }

  if (!report || report.summary.totalDays === 0) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={[styles.emptyText, { color: colors.text }, rtl && styles.rtlText]}>{t('analytics.noData')}</Text>
        <Text style={[styles.emptySubtext, { color: colors.textSecondary }, rtl && styles.rtlText]}>{t('analytics.startTracking')}</Text>
      </View>
    );
  }

  const renderTrends = () => {
    if (report.trends.length === 0) {
      return <Text style={[styles.noDataText, rtl && styles.rtlText]}>{t('analytics.notEnoughData')}</Text>;
    }

    const labels = report.trends.map((t: MonthlyTrend) => t.month.slice(5));
    const usageData = report.trends.map((t: MonthlyTrend) => t.averageDaily);

    return (
      <View>
        <Text style={[styles.chartTitle, rtl && styles.rtlText]}>{t('analytics.monthlyAverageDailyUsage')}</Text>
        <LineChart
          data={{
            labels,
            datasets: [{ data: usageData }],
          }}
          width={screenWidth - 48}
          height={220}
          chartConfig={{
            backgroundColor: '#FF9800',
            backgroundGradientFrom: '#FF9800',
            backgroundGradientTo: '#F57C00',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: { borderRadius: 16 },
          }}
          bezier
          style={styles.chart}
        />

        <View style={styles.trendsList}>
          {report.trends.map((trend: MonthlyTrend, index: number) => (
            <View key={index} style={styles.trendCard}>
              <Text style={styles.trendMonth}>{trend.month}</Text>
              <View style={styles.trendRow}>
                <View style={styles.trendItem}>
                  <Text style={[styles.trendLabel, rtl && styles.rtlText]}>{t('analytics.totalUsage')}</Text>
                  <Text style={styles.trendValue}>{trend.totalUsage.toFixed(0)} L</Text>
                </View>
                <View style={styles.trendItem}>
                  <Text style={[styles.trendLabel, rtl && styles.rtlText]}>{t('analytics.averageDaily')}</Text>
                  <Text style={styles.trendValue}>{trend.averageDaily.toFixed(1)} L</Text>
                </View>
                <View style={styles.trendItem}>
                  <Text style={[styles.trendLabel, rtl && styles.rtlText]}>💰 {t('analytics.cost')}</Text>
                  <Text style={styles.trendValue}>${trend.totalCost.toFixed(2)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderPatterns = () => {
    if (report.patterns.length === 0) {
      return <Text style={[styles.noDataText, rtl && styles.rtlText]}>{t('analytics.notEnoughDataPatterns')}</Text>;
    }

    const labels = report.patterns.map((p: UsagePattern) => p.dayOfWeek.slice(0, 3));
    const data = report.patterns.map((p: UsagePattern) => p.averageUsage);

    return (
      <View>
        <Text style={[styles.chartTitle, rtl && styles.rtlText]}>{t('analytics.usageByDay')}</Text>
        <BarChart
          data={{
            labels,
            datasets: [{ data }],
          }}
          width={screenWidth - 48}
          height={220}
          yAxisLabel=""
          yAxisSuffix="L"
          chartConfig={{
            backgroundColor: '#2196F3',
            backgroundGradientFrom: '#2196F3',
            backgroundGradientTo: '#1976D2',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: { borderRadius: 16 },
          }}
          style={styles.chart}
        />

        <View style={styles.patternsList}>
          {report.patterns.map((pattern: UsagePattern, index: number) => (
            <View key={index} style={styles.patternCard}>
              <Text style={styles.patternDay}>{pattern.dayOfWeek}</Text>
              <Text style={styles.patternUsage}>{pattern.averageUsage.toFixed(1)} L avg</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderOpportunities = () => {
    if (report.opportunities.length === 0) {
      return (
        <View style={styles.goodJobCard}>
          <Text style={styles.goodJobIcon}>🎉</Text>
          <Text style={[styles.goodJobText, rtl && styles.rtlText]}>{t('analytics.greatJob')}</Text>
          <Text style={[styles.goodJobSubtext, rtl && styles.rtlText]}>
            {t('analytics.withinLimits')}
          </Text>
        </View>
      );
    }

    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'high': return '#FF5252';
        case 'medium': return '#FF9800';
        case 'low': return '#4CAF50';
        default: return '#2196F3';
      }
    };

    return (
      <View style={styles.opportunitiesList}>
        <Text style={[styles.sectionDescription, rtl && styles.rtlText]}>
          {t('analytics.basedOnPatterns')}
        </Text>
        {report.opportunities.map((opp: WaterSavingsOpportunity, index: number) => (
          <View
            key={index}
            style={[styles.opportunityCard, { borderLeftColor: getPriorityColor(opp.priority) }]}
          >
            <View style={styles.oppHeader}>
              <Text style={[styles.oppCategory, rtl && styles.rtlText]}>{opp.category}</Text>
              <Text style={[styles.oppPriority, { color: getPriorityColor(opp.priority) }]}>
                {opp.priority === 'high' ? t('analytics.high') : opp.priority === 'medium' ? t('analytics.medium') : t('analytics.low')}
              </Text>
            </View>
            <Text style={[styles.oppDescription, rtl && styles.rtlText]}>{opp.description}</Text>
            <View style={styles.oppStats}>
              <View style={styles.oppStat}>
                <Text style={[styles.oppStatLabel, rtl && styles.rtlText]}>{t('analytics.current')}</Text>
                <Text style={styles.oppStatValue}>{opp.currentUsage.toFixed(0)} L/day</Text>
              </View>
              <Text style={styles.oppArrow}>→</Text>
              <View style={styles.oppStat}>
                <Text style={[styles.oppStatLabel, rtl && styles.rtlText]}>{t('analytics.target')}</Text>
                <Text style={[styles.oppStatValue, { color: '#4CAF50' }]}>
                  {opp.recommendedUsage.toFixed(0)} L/day
                </Text>
              </View>
            </View>
            <View style={styles.savingsBox}>
              <Text style={[styles.savingsText, rtl && styles.rtlText]}>
                💰 {t('analytics.savePerMonth')}: {opp.potentialSavings.toFixed(0)}L
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }, rtl && styles.headerRTL]}>
        <Text style={[styles.title, { color: '#fff' }, rtl && styles.rtlText]}>{t('analytics.title')}</Text>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.summaryTitle, { color: colors.text }, rtl && styles.rtlText]}>{t('analytics.summary')}</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{report.summary.totalDays}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }, rtl && styles.rtlText]}>{t('analytics.totalDays')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{report.summary.totalUsage.toFixed(0)} L</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }, rtl && styles.rtlText]}>{t('analytics.totalLiters')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>{report.summary.averageDaily.toFixed(1)} L</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }, rtl && styles.rtlText]}>{t('analytics.avgDailyUsage')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: colors.primary }]}>${report.summary.totalCost.toFixed(2)}</Text>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }, rtl && styles.rtlText]}>💰 {t('analytics.cost')}</Text>
          </View>
        </View>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }, rtl && styles.tabContainerRTL]}>
        <TouchableOpacity
          style={[styles.tab, selectedView === 'trends' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setSelectedView('trends')}
        >
          <Text style={[styles.tabText, selectedView === 'trends' && styles.tabTextActive, { color: selectedView === 'trends' ? '#fff' : colors.textSecondary }, rtl && styles.rtlText]}>
            {t('analytics.monthlyTrends')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedView === 'patterns' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setSelectedView('patterns')}
        >
          <Text style={[styles.tabText, selectedView === 'patterns' && styles.tabTextActive, { color: selectedView === 'patterns' ? '#fff' : colors.textSecondary }, rtl && styles.rtlText]}>
            {t('analytics.usagePatterns')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedView === 'opportunities' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
          onPress={() => setSelectedView('opportunities')}
        >
          <Text style={[styles.tabText, selectedView === 'opportunities' && styles.tabTextActive, { color: selectedView === 'opportunities' ? '#fff' : colors.textSecondary }, rtl && styles.rtlText]}>
            {t('analytics.savingOpportunities')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.content, { backgroundColor: colors.background }]}>
        {selectedView === 'trends' && renderTrends()}
        {selectedView === 'patterns' && renderPatterns()}
        {selectedView === 'opportunities' && renderOpportunities()}
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
  rtlText: {
    textAlign: 'right',
    direction: 'rtl',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  header: {
    backgroundColor: '#FF9800',
    padding: 24,
    alignItems: 'center',
  },
  headerRTL: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
  },
  tabContainerRTL: {
    flexDirection: 'row-reverse',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FF9800',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 24,
  },
  trendsList: {
    marginTop: 16,
  },
  trendCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  trendMonth: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  trendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  patternsList: {
    marginTop: 16,
  },
  patternCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
  },
  patternDay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  patternUsage: {
    fontSize: 16,
    color: '#2196F3',
  },
  opportunitiesList: {
    marginTop: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  opportunityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    elevation: 2,
  },
  oppHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  oppCategory: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  oppPriority: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  oppDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  oppStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  oppStat: {
    alignItems: 'center',
  },
  oppStatLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  oppStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  oppArrow: {
    fontSize: 24,
    color: '#999',
  },
  savingsBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 10,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#388E3C',
    textAlign: 'center',
  },
  goodJobCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    elevation: 2,
  },
  goodJobIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  goodJobText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  goodJobSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

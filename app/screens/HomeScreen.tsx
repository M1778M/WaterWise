import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../App';
import { getTotalUsageByDate, getAverageDailyUsage } from '../services/db/usage';
import { getTotalConsumption, getTotalCost } from '../services/db/bills';
import { StatCard } from '../components/cards';
import { t } from '../i18n';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

interface Stats {
  todayUsage: number;
  avgDailyUsage: number;
  totalConsumption: number;
  totalCost: number;
}

export default function HomeScreen({ navigation }: Props) {
  const [stats, setStats] = useState<Stats>({
    todayUsage: 0,
    avgDailyUsage: 0,
    totalConsumption: 0,
    totalCost: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [todayUsage, avgDailyUsage, totalConsumption, totalCost] = await Promise.all([
        getTotalUsageByDate(today),
        getAverageDailyUsage(30),
        getTotalConsumption(),
        getTotalCost(),
      ]);

      setStats({
        todayUsage,
        avgDailyUsage,
        totalConsumption,
        totalCost,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load stats:', error);
      }
      Alert.alert(t('common.error'), t('home.loadingStats'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  const MenuButton = ({ title, onPress, color, icon }: { title: string; onPress: () => void; color: string; icon: string }) => (
    <TouchableOpacity style={[styles.menuButton, { backgroundColor: color }]} onPress={onPress}>
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={styles.menuButtonText}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{t('home.welcomeText')}</Text>
        <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard 
          title={t('home.todayUsage')} 
          value={`${stats.todayUsage.toFixed(1)} L`}
          icon="💧"
          color="#2196F3"
        />
        <StatCard 
          title={t('home.avgDaily')} 
          value={`${stats.avgDailyUsage.toFixed(1)} L`}
          subtitle={t('home.perDay')}
          icon="📊"
          color="#4CAF50"
        />
        <StatCard 
          title={t('home.totalConsumption')} 
          value={`${stats.totalConsumption.toFixed(0)} L`}
          subtitle={t('home.allTime')}
          icon="🌊"
          color="#00BCD4"
        />
        <StatCard 
          title={t('home.totalCost')} 
          value={`$${stats.totalCost.toFixed(2)}`}
          subtitle={t('home.allBills')}
          icon="💰"
          color="#FF9800"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        <View style={styles.menuGrid}>
          <MenuButton
            title={t('home.regionStats')}
            icon="🌤️"
            onPress={() => navigation.navigate('RegionStats')}
            color="#4CAF50"
          />
          <MenuButton
            title={t('home.globalStats')}
            icon="🌍"
            onPress={() => navigation.navigate('GlobalStats')}
            color="#2196F3"
          />
        </View>

        <View style={styles.menuGrid}>
          <MenuButton
            title={t('home.waterBills')}
            icon="💰"
            onPress={() => navigation.navigate('Bills')}
            color="#FF9800"
          />
          <MenuButton
            title={t('home.usageTracker')}
            icon="📝"
            onPress={() => navigation.navigate('Usage')}
            color="#00BCD4"
          />
        </View>

        <View style={styles.menuGrid}>
          <MenuButton
            title={t('home.weather')}
            icon="🌦️"
            onPress={() => navigation.navigate('Weather')}
            color="#00BCD4"
          />
          <MenuButton
            title={t('home.analytics')}
            icon="📊"
            onPress={() => navigation.navigate('Analytics')}
            color="#FF5722"
          />
        </View>

        <TouchableOpacity
          style={[styles.fullWidthButton, { backgroundColor: '#9C27B0' }]}
          onPress={() => navigation.navigate('AIAdvisor')}
        >
          <Text style={styles.menuIcon}>🤖</Text>
          <Text style={styles.menuButtonText}>{t('home.aiAdvisor')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.fullWidthButton, { backgroundColor: '#607D8B' }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuButtonText}>{t('home.settings')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipIcon}>💡</Text>
        <View style={styles.tipContent}>
          <Text style={styles.tipTitle}>{t('home.tipTitle')}</Text>
          <Text style={styles.tipText}>{t('home.tipText')}</Text>
        </View>
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
  header: {
    backgroundColor: '#2196F3',
    padding: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#E3F2FD',
  },
  statsGrid: {
    padding: 16,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  menuButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fullWidthButton: {
    backgroundColor: '#9C27B0',
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipCard: {
    backgroundColor: '#FFF9C4',
    borderRadius: 16,
    padding: 16,
    margin: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F57F17',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
  },
});

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet, Text, TouchableOpacity, I18nManager } from 'react-native';
import { initDatabase, closeDatabase } from './services/db/database';
import { clearOldCache } from './services/db/cache';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initI18n, t, setLanguage, isRTL } from './i18n';
import { ThemeProvider } from './services/theme/ThemeContext';

import HomeScreen from './screens/HomeScreen';
import RegionStatsScreen from './screens/RegionStatsScreen';
import GlobalStatsScreen from './screens/GlobalStatsScreen';
import BillsScreen from './screens/BillsScreen';
import AddBillScreen from './screens/AddBillScreen';
import UsageScreen from './screens/UsageScreen';
import AIAdvisorScreen from './screens/AIAdvisorScreen';
import SettingsScreen from './screens/SettingsScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import WeatherScreen from './screens/WeatherScreen';

export type RootStackParamList = {
  Home: undefined;
  RegionStats: undefined;
  GlobalStats: undefined;
  Bills: undefined;
  AddBill: undefined;
  Usage: undefined;
  AIAdvisor: undefined;
  Settings: undefined;
  Analytics: undefined;
  Weather: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const initialize = async () => {
      try {
        await initI18n();
        await initDatabase();
        await clearOldCache(360);
        setIsReady(true);
      } catch (err) {
        console.error('Initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize app');
      }
    };

    initialize();

    return () => {
      closeDatabase().catch(console.error);
    };
  }, []);

  const toggleLanguage = async () => {
    const newLang = currentLanguage === 'en' ? 'fa' : 'en';
    await setLanguage(newLang);
    setCurrentLanguage(newLang);
    setIsReady(false);
    setTimeout(() => setIsReady(true), 100);
  };

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <Stack.Navigator
            initialRouteName="Home"
            screenOptions={({ navigation }) => ({
              headerStyle: {
                backgroundColor: '#2196F3',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              headerRight: () => (
                <TouchableOpacity onPress={toggleLanguage} style={styles.languageButton}>
                  <Text style={styles.languageButtonText}>
                    {currentLanguage === 'en' ? 'فا' : 'EN'}
                  </Text>
                </TouchableOpacity>
              ),
            })}
          >
            <Stack.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: t('home.title') }}
            />
            <Stack.Screen
              name="RegionStats"
              component={RegionStatsScreen}
              options={{ title: t('region.title') }}
            />
            <Stack.Screen
              name="GlobalStats"
              component={GlobalStatsScreen}
              options={{ title: t('global.title') }}
            />
            <Stack.Screen
              name="Bills"
              component={BillsScreen}
              options={{ title: t('bills.title') }}
            />
            <Stack.Screen
              name="AddBill"
              component={AddBillScreen}
              options={{ title: t('addBill.title') }}
            />
            <Stack.Screen
              name="Usage"
              component={UsageScreen}
              options={{ title: t('usage.title') }}
            />
            <Stack.Screen
              name="Weather"
              component={WeatherScreen}
              options={{ title: t('weather.title') }}
            />
            <Stack.Screen
              name="AIAdvisor"
              component={AIAdvisorScreen}
              options={{ title: t('aiAdvisor.title') }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: t('settings.title') || 'Settings' }}
            />
            <Stack.Screen
              name="Analytics"
              component={AnalyticsScreen}
              options={{ title: t('analytics.title') }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  languageButton: {
    marginRight: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  languageButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

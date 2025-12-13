import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
  TextInput,
  Animated,
} from 'react-native';
import {
  getCurrentWeather,
  getHistoricalClimate,
  getDroughtIndicator,
  getWeatherDescription,
  getWeatherDescriptionKey,
  WeatherData,
} from '../services/api/openMeteo';
import { getLocation } from '../services/location/geolocation';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { t, isRTL } from '../i18n';

const screenWidth = Dimensions.get('window').width;

interface ForecastDay {
  date: string;
  temp: number;
  precipitation: number;
}

export default function WeatherScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [droughtInfo, setDroughtInfo] = useState<{ avgPrecipitation: number; isDroughtRisk: boolean } | null>(null);
  const [location, setLocation] = useState({ lat: 0, lon: 0, city: 'Unknown' });
  const [searchCity, setSearchCity] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rtl = isRTL();

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      setError(null);
      
      const userLoc = await getLocation();
      setLocation({
        lat: userLoc.lat,
        lon: userLoc.lon,
        city: userLoc.city,
      });

      const [weatherData, droughtData] = await Promise.all([
        getCurrentWeather(userLoc.lat, userLoc.lon, true),
        getDroughtIndicator(userLoc.lat, userLoc.lon, 30, true),
      ]);

      setWeather(weatherData);
      setDroughtInfo(droughtData);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const climate = await getHistoricalClimate(
        userLoc.lat,
        userLoc.lon,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        true
      );

      const forecastData: ForecastDay[] = climate.dates.map((date, index) => ({
        date,
        temp: climate.dailyTemperature[index],
        precipitation: climate.dailyRainfall[index],
      }));

      setForecast(forecastData);
    } catch (err) {
      console.error('Weather error:', err);
      setError(err instanceof Error ? err.message : t('weather.loadingWeather'));
      Alert.alert(t('common.error'), t('weather.loadingWeather'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadWeatherData();
  };

  const getWeatherIcon = (code: number): string => {
    if (code === 0 || code === 1) return '☀️';
    if (code === 2) return '⛅';
    if (code === 3) return '☁️';
    if (code >= 45 && code <= 48) return '🌫️';
    if (code >= 51 && code <= 67) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌦️';
    if (code >= 95) return '⛈️';
    return '🌤️';
  };

  const getWaterAdvice = (): string => {
    if (!weather || !droughtInfo) return '';
    
    if (droughtInfo.isDroughtRisk) {
      return t('weather.droughtRisk') + ' ⚠️ ' + t('analytics.savingTip');
    }
    
    if (weather.precipitation > 5) {
      return '🌧️ ' + t('weather.forecast') + ' ' + t('global.yourImpact');
    }
    
    return '💧 ' + t('weather.normalConditions');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00BCD4" />
        <Text style={[styles.loadingText, rtl && styles.rtlText]}>{t('weather.loadingWeather')}</Text>
      </View>
    );
  }

  if (error && !weather) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorText, rtl && styles.rtlText]}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadWeatherData}>
          <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, rtl && styles.headerRTL]}>
        <Text style={[styles.title, rtl && styles.rtlText]}>🌦️ {t('weather.title')}</Text>
        <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
          <Text style={[styles.locationButton, rtl && styles.rtlText]}>📍 {location.city}</Text>
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchCity}
            onChangeText={setSearchCity}
            placeholder={t('weather.enterCity')}
            placeholderTextColor="#999"
            editable={true}
          />
          <Text style={styles.searchHint}>{t('weather.searchHint')}</Text>
        </View>
      )}

      {weather && (
        <>
          <View style={styles.currentWeatherCard}>
            <View style={styles.weatherHeader}>
              <Text style={styles.weatherIcon}>{getWeatherIcon(weather.weatherCode)}</Text>
              <View style={styles.weatherInfo}>
                <Text style={styles.temperature}>{weather.temperature.toFixed(1)}°C</Text>
                <Text style={styles.weatherDescription}>
                  {t(getWeatherDescriptionKey(weather.weatherCode))}
                </Text>
              </View>
            </View>
            
            <View style={styles.weatherDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💧</Text>
                <Text style={[styles.detailLabel, rtl && styles.rtlText]}>{t('region.humidity')}</Text>
                <Text style={styles.detailValue}>{weather.humidity}%</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>🌧️</Text>
                <Text style={[styles.detailLabel, rtl && styles.rtlText]}>{t('region.precipitation')}</Text>
                <Text style={styles.detailValue}>{weather.precipitation.toFixed(1)} mm</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailIcon}>💨</Text>
                <Text style={[styles.detailLabel, rtl && styles.rtlText]}>{t('region.windSpeed')}</Text>
                <Text style={styles.detailValue}>{weather.windSpeed.toFixed(1)} m/s</Text>
              </View>
            </View>
          </View>

          {droughtInfo && (
            <View style={[styles.alertCard, droughtInfo.isDroughtRisk ? styles.alertCardDanger : styles.alertCardNormal]}>
              <Text style={[styles.alertTitle, rtl && styles.rtlText]}>
                {droughtInfo.isDroughtRisk ? t('region.droughtRisk') : t('region.normalConditions')}
              </Text>
              <Text style={[styles.alertText, rtl && styles.rtlText]}>
                {t('region.droughtIndicator')}: {droughtInfo.avgPrecipitation.toFixed(2)} mm/day
              </Text>
              <Text style={[styles.alertAdvice, rtl && styles.rtlText]}>{getWaterAdvice()}</Text>
            </View>
          )}

          {forecast.length > 0 && (
            <View style={styles.forecastCard}>
              <Text style={[styles.cardTitle, rtl && styles.rtlText]}>{t('weather.weatherTrend')}</Text>
              <LineChart
                data={{
                  labels: forecast.map(f => f.date.slice(5)),
                  datasets: [{
                    data: forecast.map(f => f.temp),
                  }],
                }}
                width={screenWidth - 48}
                height={220}
                yAxisLabel="°C "
                chartConfig={{
                  backgroundColor: '#00BCD4',
                  backgroundGradientFrom: '#00BCD4',
                  backgroundGradientTo: '#0097A7',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '5',
                    strokeWidth: '2',
                    stroke: '#fff',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          )}

          <View style={styles.tipsCard}>
            <Text style={[styles.cardTitle, rtl && styles.rtlText]}>{t('weather.waterSavingTips')}</Text>
            <Text style={[styles.tipItem, rtl && styles.rtlText]}>
              • {weather.precipitation > 5 ? t('weather.collectRainwater') : t('weather.checkWeather')}
            </Text>
            <Text style={[styles.tipItem, rtl && styles.rtlText]}>
              • {weather.humidity > 70 ? t('weather.goodHumidity') : t('weather.lowHumidity')}
            </Text>
            <Text style={[styles.tipItem, rtl && styles.rtlText]}>
              • {droughtInfo?.isDroughtRisk ? t('weather.droughtPriority') : t('weather.maintainHabits')}
            </Text>
          </View>
        </>
      )}

      <Text style={[styles.footer, rtl && styles.rtlText]}>
        {t('weather.dataUpdates')}
      </Text>
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerRTL: {
    direction: 'rtl',
  },
  rtlText: {
    textAlign: 'right',
    direction: 'rtl',
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  locationButton: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  searchHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  currentWeatherCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    elevation: 3,
  },
  weatherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weatherIcon: {
    fontSize: 64,
    marginRight: 20,
  },
  weatherInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#00BCD4',
  },
  weatherDescription: {
    fontSize: 18,
    color: '#666',
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  detailItem: {
    alignItems: 'center',
  },
  detailIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  alertCard: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    elevation: 2,
  },
  alertCardDanger: {
    backgroundColor: '#FFEBEE',
    borderLeftColor: '#F44336',
  },
  alertCardNormal: {
    backgroundColor: '#E8F5E9',
    borderLeftColor: '#4CAF50',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  alertAdvice: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  forecastCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  tipsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  tipItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  footer: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginVertical: 24,
    fontStyle: 'italic',
  },
});

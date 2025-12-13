import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { getCurrentWeather, getHistoricalClimate, getDroughtIndicator, getWeatherDescription } from '../services/api/openMeteo';
import { getLocation, saveLocation, LocationData, POPULAR_CITIES } from '../services/location/geolocation';
import { ChartControls, ChartType, TimeRange } from '../components/ChartControls';
import { t } from '../i18n';

const screenWidth = Dimensions.get('window').width;

export default function RegionStatsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [climateData, setClimateData] = useState<any>(null);
  const [droughtData, setDroughtData] = useState<any>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly');

  const loadData = async (loc?: LocationData) => {
    try {
      setLoading(true);

      const currentLocation = loc || location || await getLocation();
      setLocation(currentLocation);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const [weather, climate, drought] = await Promise.all([
        getCurrentWeather(currentLocation.lat, currentLocation.lon),
        getHistoricalClimate(currentLocation.lat, currentLocation.lon, startDate, endDate),
        getDroughtIndicator(currentLocation.lat, currentLocation.lon, 30),
      ]);

      setWeatherData(weather);
      setClimateData(climate);
      setDroughtData(drought);
    } catch (error) {
      if (__DEV__) {
        console.error('Failed to load region stats:', error);
      }
      Alert.alert(t('common.error'), error instanceof Error ? error.message : t('region.loadingData'));
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

  const handleLocationSelect = async (selectedLocation: LocationData) => {
    await saveLocation(selectedLocation);
    setShowLocationPicker(false);
    setLocation(selectedLocation);
    loadData(selectedLocation);
  };

  if (loading && !weatherData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>{t('region.loadingData')}</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.locationHeader}>
          <View style={styles.locationInfo}>
            <Text style={styles.locationCity}>📍 {location?.city || 'Unknown'}</Text>
            <Text style={styles.locationCountry}>{location?.country || ''}</Text>
          </View>
          <TouchableOpacity 
            style={styles.changeLocationButton}
            onPress={() => setShowLocationPicker(true)}
          >
            <Text style={styles.changeLocationText}>{t('region.changeLocation')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('region.currentWeather')}</Text>
          {weatherData && (
            <View style={styles.weatherCard}>
              <View style={styles.weatherRow}>
                <Text style={styles.weatherLabel}>{t('region.temperature')}:</Text>
                <Text style={styles.weatherValue}>{weatherData.temperature.toFixed(1)}°C</Text>
              </View>
              <View style={styles.weatherRow}>
                <Text style={styles.weatherLabel}>{t('region.humidity')}:</Text>
                <Text style={styles.weatherValue}>{weatherData.humidity.toFixed(0)}%</Text>
              </View>
              <View style={styles.weatherRow}>
                <Text style={styles.weatherLabel}>{t('region.precipitation')}:</Text>
                <Text style={styles.weatherValue}>{weatherData.precipitation.toFixed(1)} mm</Text>
              </View>
              <View style={styles.weatherRow}>
                <Text style={styles.weatherLabel}>{t('region.windSpeed')}:</Text>
                <Text style={styles.weatherValue}>{weatherData.windSpeed.toFixed(1)} km/h</Text>
              </View>
              <View style={styles.weatherRow}>
                <Text style={styles.weatherLabel}>{t('region.condition')}:</Text>
                <Text style={styles.weatherValue}>{getWeatherDescription(weatherData.weatherCode)}</Text>
              </View>
            </View>
          )}
        </View>

      {droughtData && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('region.droughtIndicator')}</Text>
          <View style={[styles.droughtCard, droughtData.isDroughtRisk && styles.droughtWarning]}>
            <Text style={styles.droughtText}>
              {t('region.avgPrecipitation')}: {droughtData.avgPrecipitation.toFixed(2)} mm/day
            </Text>
            <Text style={[styles.droughtStatus, droughtData.isDroughtRisk && styles.droughtStatusWarning]}>
              {droughtData.isDroughtRisk ? t('region.droughtRisk') : t('region.normalConditions')}
            </Text>
          </View>
        </View>
      )}

      {climateData && climateData.dailyRainfall.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('region.rainfallTrend')}</Text>
          
          <ChartControls
            onChartTypeChange={setChartType}
            onTimeRangeChange={setTimeRange}
            selectedChartType={chartType}
            selectedTimeRange={timeRange}
            showTimeRange={false}
          />
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chartType === 'line' ? (
              <LineChart
                data={{
                  labels: climateData.dates.map((d: string) => d.split('-')[2]),
                  datasets: [
                    {
                      data: climateData.dailyRainfall,
                    },
                  ],
                }}
                width={Math.max(screenWidth - 32, climateData.dates.length * 40)}
                height={220}
                chartConfig={{
                  backgroundColor: '#2196F3',
                  backgroundGradientFrom: '#2196F3',
                  backgroundGradientTo: '#1976D2',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#fff',
                  },
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <BarChart
                data={{
                  labels: climateData.dates.map((d: string) => d.split('-')[2]),
                  datasets: [
                    {
                      data: climateData.dailyRainfall,
                    },
                  ],
                }}
                width={Math.max(screenWidth - 32, climateData.dates.length * 40)}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#2196F3',
                  backgroundGradientFrom: '#2196F3',
                  backgroundGradientTo: '#1976D2',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={styles.chart}
              />
            )}
          </ScrollView>
          <Text style={styles.chartLabel}>{t('region.dailyPrecipitation')}</Text>
        </View>
      )}

      {climateData && climateData.dailyTemperature.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('region.temperatureTrend')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {chartType === 'line' ? (
              <LineChart
                data={{
                  labels: climateData.dates.map((d: string) => d.split('-')[2]),
                  datasets: [
                    {
                      data: climateData.dailyTemperature,
                    },
                  ],
                }}
                width={Math.max(screenWidth - 32, climateData.dates.length * 40)}
                height={220}
                chartConfig={{
                  backgroundColor: '#FF9800',
                  backgroundGradientFrom: '#FF9800',
                  backgroundGradientTo: '#F57C00',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#fff',
                  },
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <BarChart
                data={{
                  labels: climateData.dates.map((d: string) => d.split('-')[2]),
                  datasets: [
                    {
                      data: climateData.dailyTemperature,
                    },
                  ],
                }}
                width={Math.max(screenWidth - 32, climateData.dates.length * 40)}
                height={220}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  backgroundColor: '#FF9800',
                  backgroundGradientFrom: '#FF9800',
                  backgroundGradientTo: '#F57C00',
                  decimalPlaces: 1,
                  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                  style: {
                    borderRadius: 16,
                  },
                }}
                style={styles.chart}
              />
            )}
          </ScrollView>
          <Text style={styles.chartLabel}>{t('region.meanTemperature')}</Text>
        </View>
      )}
      </ScrollView>

      <Modal
        visible={showLocationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('region.selectLocation')}</Text>
            <FlatList
              data={POPULAR_CITIES}
              keyExtractor={(item) => `${item.city}-${item.countryCode}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityItem}
                  onPress={() => handleLocationSelect(item)}
                >
                  <Text style={styles.cityName}>{item.city}</Text>
                  <Text style={styles.cityCountry}>{item.country}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowLocationPicker(false)}
            >
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
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
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  locationInfo: {
    flex: 1,
  },
  locationCity: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  locationCountry: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  changeLocationButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  changeLocationText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  cityItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cityName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cityCountry: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  weatherCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  weatherRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weatherLabel: {
    fontSize: 16,
    color: '#666',
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  droughtCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  droughtWarning: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  droughtText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  droughtStatus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  droughtStatusWarning: {
    color: '#FF9800',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartLabel: {
    textAlign: 'center',
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { t, isRTL } from '../i18n';
import {
  getNotificationSettings,
  saveNotificationSettings,
  getDailyGoal,
  setDailyGoal,
  NotificationSettings,
} from '../services/notifications/waterNotifications';
import { exportToJSON, exportToCSV } from '../services/export/dataExport';
import { useTheme } from '../services/theme/ThemeContext';

export default function SettingsScreen() {
  const { theme, toggleTheme, colors } = useTheme();
  const rtl = isRTL();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [dailyGoal, setDailyGoalState] = useState<string>('100');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [notifSettings, goal] = await Promise.all([
        getNotificationSettings(),
        getDailyGoal()
      ]);
      setSettings(notifSettings);
      setDailyGoalState(goal.toString());
    } catch (error) {
      console.error('Failed to load settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const goal = parseInt(dailyGoal, 10);
      
      if (isNaN(goal) || goal <= 0) {
        Alert.alert(t('common.error'), t('settings.invalidGoal'));
        return;
      }

      await Promise.all([
        saveNotificationSettings(settings),
        setDailyGoal(goal)
      ]);

      Alert.alert(t('common.success'), t('settings.settingsSaved'));
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert(t('common.error'), t('settings.settingsError'));
    } finally {
      setSaving(false);
    }
  };

  const handleExportJSON = async () => {
    try {
      Alert.alert(t('common.loading'), t('settings.savingSettings'));
      const result = await exportToJSON();
      Alert.alert(t('common.success'), `Data exported to ${result}`);
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(t('common.error'), t('settings.settingsError'));
    }
  };

  const handleExportCSV = async () => {
    try {
      Alert.alert(t('common.loading'), t('settings.savingSettings'));
      const result = await exportToCSV();
      Alert.alert(t('common.success'), `Data exported to ${result}`);
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(t('common.error'), t('settings.settingsError'));
    }
  };

  if (loading || !settings) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>{t('settings.loadingSettings')}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.title}>{t('settings.title')}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.appearance')}</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.theme')}</Text>
            <Text style={[styles.settingHint, { color: colors.textSecondary }]}>
              {theme === 'light' ? t('settings.lightMode') : t('settings.darkMode')}
            </Text>
          </View>
          <Switch
            value={theme === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: '#ccc', true: colors.primary }}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.dailyGoal')}</Text>
        <View style={styles.goalContainer}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{t('settings.targetDailyUsage')}</Text>
          <TextInput
            style={[styles.goalInput, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
            value={dailyGoal}
            onChangeText={setDailyGoalState}
            keyboardType="number-pad"
            placeholder="100"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.notifications')}</Text>
        
        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.enableNotifications')}</Text>
          <Switch
            value={settings.enabled}
            onValueChange={(value) => setSettings({ ...settings, enabled: value })}
            trackColor={{ false: '#ccc', true: colors.success }}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.dailyReminders')}</Text>
          <Switch
            value={settings.dailyReminder}
            onValueChange={(value) => setSettings({ ...settings, dailyReminder: value })}
            trackColor={{ false: '#ccc', true: colors.success }}
            disabled={!settings.enabled}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.usageAlerts')}</Text>
          <Switch
            value={settings.usageAlerts}
            onValueChange={(value) => setSettings({ ...settings, usageAlerts: value })}
            trackColor={{ false: '#ccc', true: colors.success }}
            disabled={!settings.enabled}
          />
        </View>

        <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>{t('settings.goalReminders')}</Text>
          <Switch
            value={settings.goalReminders}
            onValueChange={(value) => setSettings({ ...settings, goalReminders: value })}
            trackColor={{ false: '#ccc', true: colors.success }}
            disabled={!settings.enabled}
          />
        </View>
      </View>

      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('settings.dataExport')}</Text>
        
        <TouchableOpacity style={[styles.exportButton, { borderColor: colors.primary }]} onPress={handleExportJSON}>
          <Text style={[styles.exportButtonText, { color: colors.primary }]}>{t('settings.exportJSON')}</Text>
          <Text style={[styles.exportButtonSubtext, { color: colors.textSecondary }]}>{t('settings.exportJSONDesc')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.exportButton, { borderColor: colors.primary }]} onPress={handleExportCSV}>
          <Text style={[styles.exportButtonText, { color: colors.primary }]}>{t('settings.exportCSV')}</Text>
          <Text style={[styles.exportButtonSubtext, { color: colors.textSecondary }]}>{t('settings.exportCSVDesc')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, { backgroundColor: colors.success }, saving && styles.saveButtonDisabled]}
        onPress={handleSaveSettings}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? t('settings.savingSettings') : t('settings.saveButton')}
        </Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textSecondary }]}>{t('settings.appVersion')}</Text>
        <Text style={[styles.footerSubtext, { color: colors.textSecondary }]}>{t('settings.appDescription')}</Text>
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
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  goalContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  goalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    fontWeight: 'bold',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  settingHint: {
    fontSize: 13,
    color: '#999',
  },
  exportButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 4,
  },
  exportButtonSubtext: {
    fontSize: 12,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#999',
  },
});

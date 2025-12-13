import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTotalUsageByDate } from '../db/usage';

const NOTIFICATION_STORAGE_KEY = '@waterwise_notifications';
const DAILY_GOAL_STORAGE_KEY = '@waterwise_daily_goal';
const DEFAULT_DAILY_GOAL = 100; // liters

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  usageAlerts: boolean;
  goalReminders: boolean;
  reminderTime: string; // HH:MM format
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminder: true,
  usageAlerts: true,
  goalReminders: true,
  reminderTime: '20:00'
};

export async function getNotificationSettings(): Promise<NotificationSettings> {
  try {
    const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Failed to get notification settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveNotificationSettings(settings: NotificationSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save notification settings:', error);
    throw error;
  }
}

export async function getDailyGoal(): Promise<number> {
  try {
    const stored = await AsyncStorage.getItem(DAILY_GOAL_STORAGE_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_DAILY_GOAL;
  } catch (error) {
    console.error('Failed to get daily goal:', error);
    return DEFAULT_DAILY_GOAL;
  }
}

export async function setDailyGoal(goal: number): Promise<void> {
  try {
    await AsyncStorage.setItem(DAILY_GOAL_STORAGE_KEY, goal.toString());
  } catch (error) {
    console.error('Failed to set daily goal:', error);
    throw error;
  }
}

export async function checkDailyUsageAlert(): Promise<{
  shouldAlert: boolean;
  message: string;
  currentUsage: number;
  goal: number;
}> {
  try {
    const settings = await getNotificationSettings();
    if (!settings.enabled || !settings.usageAlerts) {
      return { shouldAlert: false, message: '', currentUsage: 0, goal: 0 };
    }

    const today = new Date().toISOString().split('T')[0];
    const currentUsage = await getTotalUsageByDate(today);
    const goal = await getDailyGoal();

    const percentUsed = (currentUsage / goal) * 100;

    if (percentUsed >= 100) {
      return {
        shouldAlert: true,
        message: `⚠️ You've reached your daily goal of ${goal}L. Current usage: ${currentUsage.toFixed(1)}L`,
        currentUsage,
        goal
      };
    } else if (percentUsed >= 80) {
      return {
        shouldAlert: true,
        message: `⚡ You're at ${percentUsed.toFixed(0)}% of your daily water goal (${currentUsage.toFixed(1)}L / ${goal}L)`,
        currentUsage,
        goal
      };
    }

    return { shouldAlert: false, message: '', currentUsage, goal };
  } catch (error) {
    console.error('Failed to check usage alert:', error);
    return { shouldAlert: false, message: '', currentUsage: 0, goal: 0 };
  }
}

export function generateDailyReminderMessage(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return '🌅 Good morning! Remember to track your water usage today.';
  } else if (hour < 18) {
    return '☀️ Don\'t forget to log your water consumption!';
  } else {
    return '🌙 Before bed, record today\'s water usage.';
  }
}

export async function shouldShowDailyReminder(): Promise<boolean> {
  const settings = await getNotificationSettings();
  if (!settings.enabled || !settings.dailyReminder) {
    return false;
  }

  const lastShown = await AsyncStorage.getItem('@waterwise_last_reminder');
  const today = new Date().toISOString().split('T')[0];
  
  if (lastShown === today) {
    return false;
  }

  await AsyncStorage.setItem('@waterwise_last_reminder', today);
  return true;
}

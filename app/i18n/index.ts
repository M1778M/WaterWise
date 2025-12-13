import { I18n } from 'i18n-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const translations = {
  en: require('./translations/en.json'),
  fa: require('./translations/fa.json'),
};

const i18n = new I18n(translations);

i18n.defaultLocale = 'en';
i18n.locale = 'en';
i18n.enableFallback = true;

const LANGUAGE_KEY = '@waterwise_language';

export const setLanguage = async (locale: string) => {
  i18n.locale = locale;
  await AsyncStorage.setItem(LANGUAGE_KEY, locale);
};

export const getLanguage = async (): Promise<string> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    return savedLanguage || 'en';
  } catch (error) {
    return 'en';
  }
};

export const initI18n = async () => {
  const savedLanguage = await getLanguage();
  i18n.locale = savedLanguage;
};

export const t = (key: string, options?: any) => {
  return i18n.t(key, options);
};

export const isRTL = () => {
  return i18n.locale === 'fa';
};

export default i18n;


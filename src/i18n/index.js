import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import tr from './tr.json';
import en from './en.json';
import ar from './ar.json';

i18n.use(initReactI18next).init({
  resources: { tr: { translation: tr }, en: { translation: en }, ar: { translation: ar } },
  lng: localStorage.getItem('salibiyyat-lang') || 'tr',
  fallbackLng: 'tr',
  interpolation: { escapeValue: false },
});

export default i18n;
export const isRTL = () => i18n.language === 'ar';

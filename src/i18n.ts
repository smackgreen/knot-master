import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import frCommon from './locales/fr/common.json';
import enMarketing from './locales/en/marketing.json';
import frMarketing from './locales/fr/marketing.json';
import enPricing from './locales/en/pricing.json';
import frPricing from './locales/fr/pricing.json';
import enSubscription from './locales/en/subscription.json';
import frSubscription from './locales/fr/subscription.json';
import enNav from './locales/en/nav.json';
import frNav from './locales/fr/nav.json';
import enAccount from './locales/en/account.json';
import frAccount from './locales/fr/account.json';

// Configure i18next
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    debug: process.env.NODE_ENV === 'development',
    fallbackLng: ['fr', 'en'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    resources: {
      en: {
        common: enCommon,
        marketing: enMarketing,
        pricing: enPricing,
        subscription: enSubscription,
        nav: enNav,
        account: enAccount,
      },
      fr: {
        common: frCommon,
        marketing: frMarketing,
        pricing: frPricing,
        subscription: frSubscription,
        nav: frNav,
        account: frAccount,
      },
    },
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;

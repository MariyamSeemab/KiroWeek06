/**
 * Internationalization (i18n) support for Smart-Silo Storage Referee
 * Supporting Hindi, Tamil, and English for AI for Bharat
 */

import React from 'react';

export type SupportedLanguage = 'en' | 'hi' | 'ta';

export interface TranslationStrings {
  // App Title and Navigation
  appTitle: string;
  appSubtitle: string;
  
  // Crop Selection
  selectCrop: string;
  cropWheat: string;
  cropChili: string;
  cropTomato: string;
  
  // Input Labels
  distanceFromHub: string;
  cropVolume: string;
  quintals: string;
  kilometers: string;
  
  // Environmental Monitoring
  environmentalConditions: string;
  temperature: string;
  humidity: string;
  riskLevel: string;
  
  // Risk Levels
  riskLow: string;
  riskMedium: string;
  riskHigh: string;
  safe: string;
  warning: string;
  critical: string;
  
  // Storage Methods
  coldStorage: string;
  solarDrying: string;
  
  // Verdict Card
  refereeRecommends: string;
  whyThisChoice: string;
  potentialSavings: string;
  alternativeOption: string;
  acceptRecommendation: string;
  
  // Weather
  weatherForecast: string;
  sunny: string;
  cloudy: string;
  rainy: string;
  stormy: string;
  
  // Actions
  analyze: string;
  reset: string;
  compare: string;
  
  // Status
  connected: string;
  disconnected: string;
  loading: string;
  
  // Currency
  rupees: string;
  save: string;
  loss: string;
  
  // Common
  yes: string;
  no: string;
  ok: string;
  cancel: string;
}

const translations: Record<SupportedLanguage, TranslationStrings> = {
  en: {
    // App Title and Navigation
    appTitle: 'Smart-Silo Storage Referee',
    appSubtitle: 'AI-powered storage decisions for optimal crop preservation',
    
    // Crop Selection
    selectCrop: 'Select Crop Type',
    cropWheat: 'Wheat',
    cropChili: 'Chili',
    cropTomato: 'Tomato',
    
    // Input Labels
    distanceFromHub: 'Distance from Market Hub',
    cropVolume: 'Crop Volume',
    quintals: 'quintals',
    kilometers: 'km',
    
    // Environmental Monitoring
    environmentalConditions: 'Environmental Conditions',
    temperature: 'Temperature',
    humidity: 'Humidity',
    riskLevel: 'Risk Level',
    
    // Risk Levels
    riskLow: 'Low Risk',
    riskMedium: 'Medium Risk',
    riskHigh: 'High Risk',
    safe: 'Safe',
    warning: 'Warning',
    critical: 'Critical',
    
    // Storage Methods
    coldStorage: 'Cold Storage',
    solarDrying: 'Solar Drying',
    
    // Verdict Card
    refereeRecommends: 'The Referee Recommends:',
    whyThisChoice: 'Why This Choice?',
    potentialSavings: 'Potential Savings:',
    alternativeOption: 'Alternative Option',
    acceptRecommendation: 'Accept Recommendation',
    
    // Weather
    weatherForecast: 'Weather Forecast',
    sunny: 'Sunny',
    cloudy: 'Cloudy',
    rainy: 'Rainy',
    stormy: 'Stormy',
    
    // Actions
    analyze: 'Analyze',
    reset: 'Reset',
    compare: 'Compare',
    
    // Status
    connected: 'Connected',
    disconnected: 'Disconnected',
    loading: 'Loading',
    
    // Currency
    rupees: '₹',
    save: 'Save',
    loss: 'Loss',
    
    // Common
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    cancel: 'Cancel'
  },
  
  hi: {
    // App Title and Navigation
    appTitle: 'स्मार्ट-साइलो भंडारण रेफरी',
    appSubtitle: 'फसल संरक्षण के लिए AI-संचालित भंडारण निर्णय',
    
    // Crop Selection
    selectCrop: 'फसल का प्रकार चुनें',
    cropWheat: 'गेहूं',
    cropChili: 'मिर्च',
    cropTomato: 'टमाटर',
    
    // Input Labels
    distanceFromHub: 'बाजार केंद्र से दूरी',
    cropVolume: 'फसल की मात्रा',
    quintals: 'क्विंटल',
    kilometers: 'किमी',
    
    // Environmental Monitoring
    environmentalConditions: 'पर्यावरणीय स्थितियां',
    temperature: 'तापमान',
    humidity: 'आर्द्रता',
    riskLevel: 'जोखिम स्तर',
    
    // Risk Levels
    riskLow: 'कम जोखिम',
    riskMedium: 'मध्यम जोखिम',
    riskHigh: 'उच्च जोखिम',
    safe: 'सुरक्षित',
    warning: 'चेतावनी',
    critical: 'गंभीर',
    
    // Storage Methods
    coldStorage: 'कोल्ड स्टोरेज',
    solarDrying: 'सौर सुखाई',
    
    // Verdict Card
    refereeRecommends: 'रेफरी की सिफारिश:',
    whyThisChoice: 'यह विकल्प क्यों?',
    potentialSavings: 'संभावित बचत:',
    alternativeOption: 'वैकल्पिक विकल्प',
    acceptRecommendation: 'सिफारिश स्वीकार करें',
    
    // Weather
    weatherForecast: 'मौसम पूर्वानुमान',
    sunny: 'धूप',
    cloudy: 'बादल',
    rainy: 'बारिश',
    stormy: 'तूफान',
    
    // Actions
    analyze: 'विश्लेषण करें',
    reset: 'रीसेट करें',
    compare: 'तुलना करें',
    
    // Status
    connected: 'जुड़ा हुआ',
    disconnected: 'डिस्कनेक्ट',
    loading: 'लोड हो रहा है',
    
    // Currency
    rupees: '₹',
    save: 'बचत',
    loss: 'नुकसान',
    
    // Common
    yes: 'हां',
    no: 'नहीं',
    ok: 'ठीक है',
    cancel: 'रद्द करें'
  },
  
  ta: {
    // App Title and Navigation
    appTitle: 'ஸ்மார்ட்-சைலோ சேமிப்பு நடுவர்',
    appSubtitle: 'உகந்த பயிர் பாதுகாப்பிற்கான AI-இயங்கும் சேமிப்பு முடிவுகள்',
    
    // Crop Selection
    selectCrop: 'பயிர் வகையைத் தேர்ந்தெடுக்கவும்',
    cropWheat: 'கோதுமை',
    cropChili: 'மிளகாய்',
    cropTomato: 'தக்காளி',
    
    // Input Labels
    distanceFromHub: 'சந்தை மையத்திலிருந்து தூரம்',
    cropVolume: 'பயிர் அளவு',
    quintals: 'குவிண்டால்கள்',
    kilometers: 'கிமீ',
    
    // Environmental Monitoring
    environmentalConditions: 'சுற்றுச்சூழல் நிலைமைகள்',
    temperature: 'வெப்பநிலை',
    humidity: 'ஈரப்பதம்',
    riskLevel: 'ஆபத்து நிலை',
    
    // Risk Levels
    riskLow: 'குறைந்த ஆபத்து',
    riskMedium: 'நடுத்தர ஆபத்து',
    riskHigh: 'அதிக ஆபத்து',
    safe: 'பாதுகாப்பான',
    warning: 'எச்சரிக்கை',
    critical: 'முக்கியமான',
    
    // Storage Methods
    coldStorage: 'குளிர் சேமிப்பு',
    solarDrying: 'சூரிய உலர்த்துதல்',
    
    // Verdict Card
    refereeRecommends: 'நடுவரின் பரிந்துரை:',
    whyThisChoice: 'ஏன் இந்த தேர்வு?',
    potentialSavings: 'சாத்தியமான சேமிப்பு:',
    alternativeOption: 'மாற்று விருப்பம்',
    acceptRecommendation: 'பரிந்துரையை ஏற்கவும்',
    
    // Weather
    weatherForecast: 'வானிலை முன்னறிவிப்பு',
    sunny: 'வெயில்',
    cloudy: 'மேகமூட்டம்',
    rainy: 'மழை',
    stormy: 'புயல்',
    
    // Actions
    analyze: 'பகுப்பாய்வு செய்யவும்',
    reset: 'மீட்டமைக்கவும்',
    compare: 'ஒப்பிடவும்',
    
    // Status
    connected: 'இணைக்கப்பட்டது',
    disconnected: 'துண்டிக்கப்பட்டது',
    loading: 'ஏற்றுகிறது',
    
    // Currency
    rupees: '₹',
    save: 'சேமிப்பு',
    loss: 'இழப்பு',
    
    // Common
    yes: 'ஆம்',
    no: 'இல்லை',
    ok: 'சரி',
    cancel: 'ரத்து செய்'
  }
};

class I18nService {
  private currentLanguage: SupportedLanguage = 'en';
  private listeners: ((language: SupportedLanguage) => void)[] = [];

  constructor() {
    // Try to detect language from browser or localStorage
    const savedLanguage = localStorage.getItem('smart-silo-language') as SupportedLanguage;
    const browserLanguage = navigator.language.split('-')[0] as SupportedLanguage;
    
    if (savedLanguage && this.isSupported(savedLanguage)) {
      this.currentLanguage = savedLanguage;
    } else if (this.isSupported(browserLanguage)) {
      this.currentLanguage = browserLanguage;
    }
  }

  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  setLanguage(language: SupportedLanguage): void {
    if (!this.isSupported(language)) {
      console.warn(`Language ${language} not supported, falling back to English`);
      language = 'en';
    }

    this.currentLanguage = language;
    localStorage.setItem('smart-silo-language', language);
    
    // Notify listeners
    this.listeners.forEach(listener => listener(language));
  }

  t(key: keyof TranslationStrings): string {
    return translations[this.currentLanguage][key] || translations.en[key] || key;
  }

  getTranslations(): TranslationStrings {
    return translations[this.currentLanguage];
  }

  getSupportedLanguages(): { code: SupportedLanguage; name: string; nativeName: string }[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' }
    ];
  }

  onLanguageChange(callback: (language: SupportedLanguage) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private isSupported(language: string): language is SupportedLanguage {
    return ['en', 'hi', 'ta'].includes(language);
  }

  // Utility methods for formatting
  formatCurrency(amount: number): string {
    const symbol = this.t('rupees');
    return `${symbol}${amount.toLocaleString(this.getLocale())}`;
  }

  formatNumber(number: number): string {
    return number.toLocaleString(this.getLocale());
  }

  private getLocale(): string {
    switch (this.currentLanguage) {
      case 'hi': return 'hi-IN';
      case 'ta': return 'ta-IN';
      default: return 'en-IN';
    }
  }
}

// Singleton instance
export const i18n = new I18nService();

// React hook for using translations
export function useTranslation() {
  const [language, setLanguage] = React.useState(i18n.getCurrentLanguage());

  React.useEffect(() => {
    const unsubscribe = i18n.onLanguageChange(setLanguage);
    return unsubscribe;
  }, []);

  return {
    t: i18n.t.bind(i18n),
    language,
    setLanguage: i18n.setLanguage.bind(i18n),
    getSupportedLanguages: i18n.getSupportedLanguages.bind(i18n)
  };
}

export default i18n;
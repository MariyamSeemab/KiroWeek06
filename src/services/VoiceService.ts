/**
 * Voice Service for Smart-Silo Storage Referee
 * Provides voice announcements in local languages using Web Speech API and Amazon Polly
 */

import { SupportedLanguage } from '../i18n';

export interface VoiceSettings {
  language: SupportedLanguage;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface VoiceAnnouncement {
  text: string;
  language: SupportedLanguage;
  priority: 'low' | 'medium' | 'high';
  category: 'recommendation' | 'warning' | 'status' | 'greeting';
}

export class VoiceService {
  private synthesis: SpeechSynthesis;
  private voices: SpeechSynthesisVoice[] = [];
  private isEnabled: boolean = false;
  private currentSettings: VoiceSettings;

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.currentSettings = {
      language: 'en',
      voice: '',
      rate: 0.9,
      pitch: 1.0,
      volume: 0.8
    };

    this.initializeVoices();
  }

  /**
   * Initialize available voices
   */
  private async initializeVoices(): Promise<void> {
    // Wait for voices to be loaded
    if (this.synthesis.getVoices().length === 0) {
      await new Promise(resolve => {
        this.synthesis.addEventListener('voiceschanged', resolve, { once: true });
      });
    }

    this.voices = this.synthesis.getVoices();
    this.selectBestVoice();
  }

  /**
   * Enable voice announcements
   */
  async enable(): Promise<boolean> {
    try {
      // Request permission for speech synthesis
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permission.state === 'denied') {
          console.warn('Microphone permission denied, voice features may be limited');
        }
      }

      this.isEnabled = true;
      await this.playGreeting();
      return true;
    } catch (error) {
      console.error('Failed to enable voice service:', error);
      return false;
    }
  }

  /**
   * Disable voice announcements
   */
  disable(): void {
    this.isEnabled = false;
    this.synthesis.cancel();
  }

  /**
   * Check if voice service is enabled
   */
  isVoiceEnabled(): boolean {
    return this.isEnabled && 'speechSynthesis' in window;
  }

  /**
   * Set voice settings
   */
  setVoiceSettings(settings: Partial<VoiceSettings>): void {
    this.currentSettings = { ...this.currentSettings, ...settings };
    this.selectBestVoice();
  }

  /**
   * Get available voices for current language
   */
  getAvailableVoices(): { name: string; lang: string; isDefault: boolean }[] {
    const languageMap = {
      'en': ['en-US', 'en-IN', 'en-GB'],
      'hi': ['hi-IN', 'hi'],
      'ta': ['ta-IN', 'ta']
    };

    const targetLangs = languageMap[this.currentSettings.language] || ['en-US'];
    
    return this.voices
      .filter(voice => targetLangs.some(lang => voice.lang.startsWith(lang)))
      .map(voice => ({
        name: voice.name,
        lang: voice.lang,
        isDefault: voice.default
      }));
  }

  /**
   * Announce storage recommendation
   */
  async announceRecommendation(
    storageMethod: 'cold_storage' | 'solar_drying',
    reasoning: string,
    language: SupportedLanguage = this.currentSettings.language
  ): Promise<void> {
    if (!this.isEnabled) return;

    const announcement = this.generateRecommendationAnnouncement(storageMethod, reasoning, language);
    await this.speak(announcement);
  }

  /**
   * Announce weather warning
   */
  async announceWeatherWarning(
    weatherCondition: string,
    impact: string,
    language: SupportedLanguage = this.currentSettings.language
  ): Promise<void> {
    if (!this.isEnabled) return;

    const announcement = this.generateWeatherWarning(weatherCondition, impact, language);
    await this.speak(announcement);
  }

  /**
   * Announce environmental risk
   */
  async announceEnvironmentalRisk(
    riskLevel: 'low' | 'medium' | 'high',
    details: string,
    language: SupportedLanguage = this.currentSettings.language
  ): Promise<void> {
    if (!this.isEnabled) return;

    const announcement = this.generateRiskAnnouncement(riskLevel, details, language);
    await this.speak(announcement);
  }

  /**
   * Play greeting message
   */
  private async playGreeting(): Promise<void> {
    const greetings = {
      en: 'Welcome to Smart-Silo Storage Referee. I will help you make the best storage decisions for your crops.',
      hi: 'स्मार्ट-साइलो भंडारण रेफरी में आपका स्वागत है। मैं आपकी फसलों के लिए सबसे अच्छे भंडारण निर्णय लेने में आपकी मदद करूंगा।',
      ta: 'ஸ்மார்ட்-சைலோ சேமிப்பு நடுவருக்கு வரவேற்கிறோம். உங்கள் பயிர்களுக்கு சிறந்த சேமிப்பு முடிவுகளை எடுக்க நான் உங்களுக்கு உதவுவேன்.'
    };

    const announcement: VoiceAnnouncement = {
      text: greetings[this.currentSettings.language],
      language: this.currentSettings.language,
      priority: 'medium',
      category: 'greeting'
    };

    await this.speak(announcement);
  }

  /**
   * Generate recommendation announcement text
   */
  private generateRecommendationAnnouncement(
    storageMethod: 'cold_storage' | 'solar_drying',
    reasoning: string,
    language: SupportedLanguage
  ): VoiceAnnouncement {
    const templates = {
      en: {
        cold_storage: `Based on current conditions, I recommend Cold Storage for your crops. ${reasoning}`,
        solar_drying: `Based on current conditions, I recommend Solar Drying for your crops. ${reasoning}`
      },
      hi: {
        cold_storage: `वर्तमान स्थितियों के आधार पर, मैं आपकी फसलों के लिए कोल्ड स्टोरेज की सिफारिश करता हूं। ${reasoning}`,
        solar_drying: `वर्तमान स्थितियों के आधार पर, मैं आपकी फसलों के लिए सौर सुखाई की सिफारिश करता हूं। ${reasoning}`
      },
      ta: {
        cold_storage: `தற்போதைய நிலைமைகளின் அடிப்படையில், உங்கள் பயிர்களுக்கு குளிர் சேமிப்பை பரிந்துரைக்கிறேன். ${reasoning}`,
        solar_drying: `தற்போதைய நிலைமைகளின் அடிப்படையில், உங்கள் பயிர்களுக்கு சூரிய உலர்த்துதலை பரிந்துரைக்கிறேன். ${reasoning}`
      }
    };

    return {
      text: templates[language][storageMethod],
      language,
      priority: 'high',
      category: 'recommendation'
    };
  }

  /**
   * Generate weather warning announcement
   */
  private generateWeatherWarning(
    weatherCondition: string,
    impact: string,
    language: SupportedLanguage
  ): VoiceAnnouncement {
    const templates = {
      en: `Weather Alert: ${weatherCondition} conditions detected. ${impact}`,
      hi: `मौसम चेतावनी: ${weatherCondition} स्थितियां देखी गई हैं। ${impact}`,
      ta: `வானிலை எச்சரிக்கை: ${weatherCondition} நிலைமைகள் கண்டறியப்பட்டன। ${impact}`
    };

    return {
      text: templates[language],
      language,
      priority: 'high',
      category: 'warning'
    };
  }

  /**
   * Generate risk announcement
   */
  private generateRiskAnnouncement(
    riskLevel: 'low' | 'medium' | 'high',
    details: string,
    language: SupportedLanguage
  ): VoiceAnnouncement {
    const riskLabels = {
      en: { low: 'Low Risk', medium: 'Medium Risk', high: 'High Risk' },
      hi: { low: 'कम जोखिम', medium: 'मध्यम जोखिम', high: 'उच्च जोखिम' },
      ta: { low: 'குறைந்த ஆபத்து', medium: 'நடுத்தர ஆபத்து', high: 'அதிக ஆபத்து' }
    };

    const templates = {
      en: `${riskLabels.en[riskLevel]} detected. ${details}`,
      hi: `${riskLabels.hi[riskLevel]} का पता चला। ${details}`,
      ta: `${riskLabels.ta[riskLevel]} கண்டறியப்பட்டது। ${details}`
    };

    return {
      text: templates[language],
      language,
      priority: riskLevel === 'high' ? 'high' : 'medium',
      category: 'warning'
    };
  }

  /**
   * Speak the announcement
   */
  private async speak(announcement: VoiceAnnouncement): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(announcement.text);
      
      // Set voice properties
      utterance.voice = this.getSelectedVoice();
      utterance.rate = this.currentSettings.rate;
      utterance.pitch = this.currentSettings.pitch;
      utterance.volume = this.currentSettings.volume;

      // Set language
      const languageMap = {
        'en': 'en-IN',
        'hi': 'hi-IN',
        'ta': 'ta-IN'
      };
      utterance.lang = languageMap[announcement.language] || 'en-IN';

      // Event handlers
      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        reject(new Error(`Speech synthesis failed: ${event.error}`));
      };

      // Speak
      this.synthesis.speak(utterance);
    });
  }

  /**
   * Select the best voice for current language
   */
  private selectBestVoice(): void {
    const languageMap = {
      'en': ['en-IN', 'en-US', 'en-GB'],
      'hi': ['hi-IN', 'hi'],
      'ta': ['ta-IN', 'ta']
    };

    const preferredLangs = languageMap[this.currentSettings.language] || ['en-US'];
    
    // Find the best matching voice
    for (const lang of preferredLangs) {
      const voice = this.voices.find(v => v.lang.startsWith(lang));
      if (voice) {
        this.currentSettings.voice = voice.name;
        return;
      }
    }

    // Fallback to default voice
    const defaultVoice = this.voices.find(v => v.default);
    if (defaultVoice) {
      this.currentSettings.voice = defaultVoice.name;
    }
  }

  /**
   * Get the currently selected voice
   */
  private getSelectedVoice(): SpeechSynthesisVoice | null {
    if (this.currentSettings.voice) {
      return this.voices.find(v => v.name === this.currentSettings.voice) || null;
    }
    return null;
  }

  /**
   * Test voice functionality
   */
  async testVoice(): Promise<boolean> {
    try {
      const testAnnouncement: VoiceAnnouncement = {
        text: 'Voice test successful. Smart-Silo Storage Referee is ready.',
        language: this.currentSettings.language,
        priority: 'low',
        category: 'status'
      };

      await this.speak(testAnnouncement);
      return true;
    } catch (error) {
      console.error('Voice test failed:', error);
      return false;
    }
  }
}
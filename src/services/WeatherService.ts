/**
 * Weather-aware intelligence service for Smart-Silo Storage Referee
 * Integrates weather forecasting to enhance solar drying recommendations
 */

export interface WeatherCondition {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  temperature: number;
  humidity: number;
  windSpeed: number;
  uvIndex: number;
  icon: string;
}

export interface WeatherForecast {
  date: Date;
  condition: WeatherCondition;
  solarDryingViability: number; // 0-1 scale
  riskFactors: string[];
}

export interface WeatherData {
  current: WeatherCondition;
  forecast: WeatherForecast[];
  location: string;
  lastUpdated: Date;
}

export class WeatherService {
  private cache: Map<string, WeatherData> = new Map();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  /**
   * Get weather data for a location (with mock data for demo)
   */
  async getWeatherData(location: string = 'Delhi'): Promise<WeatherData> {
    const cached = this.getCachedWeather(location);
    if (cached) return cached;

    try {
      // In production, this would call a real weather API
      const weatherData = this.generateMockWeatherData(location);
      this.setCachedWeather(location, weatherData);
      return weatherData;
    } catch (error) {
      console.error('Weather API failed, using fallback data:', error);
      return this.getFallbackWeatherData(location);
    }
  }

  /**
   * Calculate solar drying penalty based on weather forecast
   */
  calculateWeatherPenalty(forecast: WeatherForecast[]): {
    penalty: number;
    reasoning: string[];
    riskLevel: 'low' | 'medium' | 'high';
  } {
    const reasoning: string[] = [];
    let totalPenalty = 0;
    let rainyDays = 0;
    let cloudyDays = 0;

    forecast.forEach((day, index) => {
      const dayLabel = index === 0 ? 'Today' : index === 1 ? 'Tomorrow' : `Day ${index + 1}`;
      
      switch (day.condition.condition) {
        case 'rainy':
        case 'stormy':
          totalPenalty += 0.4; // 40% penalty per rainy day
          rainyDays++;
          reasoning.push(`${dayLabel}: ${day.condition.condition} 🌧️ - Solar drying impossible`);
          break;
        case 'cloudy':
          totalPenalty += 0.2; // 20% penalty per cloudy day
          cloudyDays++;
          reasoning.push(`${dayLabel}: Cloudy ☁️ - Reduced solar efficiency`);
          break;
        case 'sunny':
          reasoning.push(`${dayLabel}: Sunny ☀️ - Optimal for solar drying`);
          break;
      }

      // Additional penalties for poor drying conditions
      if (day.condition.humidity > 80) {
        totalPenalty += 0.1;
        reasoning.push(`${dayLabel}: High humidity (${day.condition.humidity}%) increases spoilage risk`);
      }

      if (day.condition.uvIndex < 3) {
        totalPenalty += 0.05;
        reasoning.push(`${dayLabel}: Low UV index - slower drying`);
      }
    });

    // Cap penalty at 100%
    const penalty = Math.min(totalPenalty, 1.0);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high';
    if (rainyDays >= 3 || penalty > 0.7) {
      riskLevel = 'high';
      reasoning.unshift('⚠️ HIGH RISK: Multiple rainy days make solar drying extremely risky');
    } else if (rainyDays >= 1 || cloudyDays >= 3 || penalty > 0.3) {
      riskLevel = 'medium';
      reasoning.unshift('⚡ MEDIUM RISK: Weather conditions may affect solar drying efficiency');
    } else {
      riskLevel = 'low';
      reasoning.unshift('✅ LOW RISK: Weather conditions favorable for solar drying');
    }

    return { penalty, reasoning, riskLevel };
  }

  /**
   * Get weather impact summary for UI display
   */
  getWeatherImpactSummary(weatherData: WeatherData): {
    recommendation: string;
    icon: string;
    color: string;
    details: string;
  } {
    const forecast5Day = weatherData.forecast.slice(0, 5);
    const { penalty, riskLevel } = this.calculateWeatherPenalty(forecast5Day);

    if (riskLevel === 'high') {
      return {
        recommendation: 'Weather Strongly Favors Cold Storage',
        icon: '🌧️',
        color: '#e53e3e',
        details: `${Math.round(penalty * 100)}% penalty to solar drying due to poor weather`
      };
    } else if (riskLevel === 'medium') {
      return {
        recommendation: 'Weather Conditions Mixed',
        icon: '⛅',
        color: '#dd6b20',
        details: `${Math.round(penalty * 100)}% penalty to solar drying due to variable weather`
      };
    } else {
      return {
        recommendation: 'Weather Favors Solar Drying',
        icon: '☀️',
        color: '#38a169',
        details: 'Optimal weather conditions for solar drying'
      };
    }
  }

  // Private methods

  private generateMockWeatherData(location: string): WeatherData {
    const icons = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      stormy: '⛈️'
    };

    // Generate realistic weather patterns
    const forecast: WeatherForecast[] = [];
    
    for (let i = 0; i < 7; i++) {
      // Bias towards more realistic weather patterns
      let condition: WeatherCondition['condition'];
      const random = Math.random();
      
      if (i === 0) {
        // Current day - slightly favor good weather for demo
        condition = random < 0.4 ? 'sunny' : random < 0.7 ? 'cloudy' : random < 0.9 ? 'rainy' : 'stormy';
      } else {
        // Future days - more varied
        condition = random < 0.3 ? 'sunny' : random < 0.6 ? 'cloudy' : random < 0.85 ? 'rainy' : 'stormy';
      }

      const baseTemp = 25 + Math.random() * 15; // 25-40°C
      const baseHumidity = condition === 'rainy' ? 70 + Math.random() * 25 : 40 + Math.random() * 40;
      
      const weatherCondition: WeatherCondition = {
        condition,
        temperature: Math.round(baseTemp),
        humidity: Math.round(baseHumidity),
        windSpeed: Math.round(5 + Math.random() * 15),
        uvIndex: condition === 'sunny' ? 7 + Math.random() * 4 : condition === 'cloudy' ? 3 + Math.random() * 4 : Math.random() * 3,
        icon: icons[condition]
      };

      const solarViability = this.calculateSolarViability(weatherCondition);
      const riskFactors = this.generateRiskFactors(weatherCondition);

      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        condition: weatherCondition,
        solarDryingViability: solarViability,
        riskFactors
      });
    }

    return {
      current: forecast[0].condition,
      forecast,
      location,
      lastUpdated: new Date()
    };
  }

  private calculateSolarViability(condition: WeatherCondition): number {
    let viability = 1.0;

    // Condition penalties
    switch (condition.condition) {
      case 'rainy':
      case 'stormy':
        viability = 0.1; // Almost impossible
        break;
      case 'cloudy':
        viability = 0.6; // Reduced efficiency
        break;
      case 'sunny':
        viability = 1.0; // Optimal
        break;
    }

    // Humidity penalty
    if (condition.humidity > 80) {
      viability *= 0.7;
    } else if (condition.humidity > 60) {
      viability *= 0.9;
    }

    // UV index bonus/penalty
    if (condition.uvIndex > 7) {
      viability *= 1.1; // Bonus for high UV
    } else if (condition.uvIndex < 3) {
      viability *= 0.8; // Penalty for low UV
    }

    return Math.max(0, Math.min(1, viability));
  }

  private generateRiskFactors(condition: WeatherCondition): string[] {
    const factors: string[] = [];

    if (condition.condition === 'rainy' || condition.condition === 'stormy') {
      factors.push('Rain will prevent solar drying completely');
    }

    if (condition.humidity > 80) {
      factors.push('High humidity increases fungal growth risk');
    }

    if (condition.uvIndex < 3) {
      factors.push('Low UV index means slower drying times');
    }

    if (condition.windSpeed < 5) {
      factors.push('Low wind speed reduces drying efficiency');
    }

    return factors;
  }

  private getCachedWeather(location: string): WeatherData | null {
    const cached = this.cache.get(location);
    if (!cached) return null;

    const age = Date.now() - cached.lastUpdated.getTime();
    if (age > this.CACHE_DURATION) {
      this.cache.delete(location);
      return null;
    }

    return cached;
  }

  private setCachedWeather(location: string, data: WeatherData): void {
    this.cache.set(location, data);
  }

  private getFallbackWeatherData(location: string): WeatherData {
    // Fallback to neutral weather conditions
    const neutralCondition: WeatherCondition = {
      condition: 'cloudy',
      temperature: 28,
      humidity: 65,
      windSpeed: 8,
      uvIndex: 5,
      icon: '☁️'
    };

    const forecast: WeatherForecast[] = [];
    for (let i = 0; i < 7; i++) {
      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        condition: neutralCondition,
        solarDryingViability: 0.7,
        riskFactors: ['Weather data unavailable - using conservative estimates']
      });
    }

    return {
      current: neutralCondition,
      forecast,
      location,
      lastUpdated: new Date()
    };
  }
}
import { CropType, EnvironmentalData, MarketData, SeasonalPattern } from '../types';

export class Crop implements CropType {
  id: string;
  name: string;
  perishabilityScore: number;
  icon: string;
  averageMarketPrice: number;
  optimalStorageTemp: number;
  optimalHumidity: number;
  marketCategory: 'grain' | 'pulse' | 'vegetable' | 'spice' | 'fruit' | 'oilseed' | 'cash crop' | 'fiber' | 'fodder' | 'medicinal' | 'nut';
  seasonality: SeasonalPattern;

  constructor(cropData: CropType & { seasonality: SeasonalPattern }) {
    this.id = cropData.id;
    this.name = cropData.name;
    this.perishabilityScore = cropData.perishabilityScore;
    this.icon = cropData.icon;
    this.averageMarketPrice = cropData.averageMarketPrice;
    this.optimalStorageTemp = cropData.optimalStorageTemp;
    this.optimalHumidity = cropData.optimalHumidity;
    this.marketCategory = cropData.marketCategory;
    this.seasonality = cropData.seasonality;
  }

  /**
   * Calculate spoilage risk based on environmental conditions
   * Higher risk when conditions deviate from optimal storage parameters
   */
  calculateSpoilageRisk(environment: EnvironmentalData): number {
    const tempDeviation = Math.abs(environment.temperature - this.optimalStorageTemp);
    const humidityDeviation = Math.abs(environment.humidity - this.optimalHumidity);
    
    // Normalize deviations (0-1 scale)
    const tempRisk = Math.min(tempDeviation / 30, 1); // 30°C max deviation
    const humidityRisk = Math.min(humidityDeviation / 50, 1); // 50% max deviation
    
    // Combine with perishability score (higher score = more perishable)
    const baseRisk = (tempRisk + humidityRisk) / 2;
    const perishabilityMultiplier = this.perishabilityScore / 10;
    
    return Math.min(baseRisk * perishabilityMultiplier, 1);
  }

  /**
   * Calculate market value for given volume and current market data
   */
  getMarketValue(volume: number, marketData: MarketData): number {
    const currentPrice = marketData.currentPrice || this.averageMarketPrice;
    const seasonalMultiplier = this.getSeasonalMultiplier();
    
    return volume * currentPrice * seasonalMultiplier;
  }

  /**
   * Get seasonal price multiplier based on current month
   */
  private getSeasonalMultiplier(): number {
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    
    if (this.seasonality.peakSeason.includes(currentMonth)) {
      return this.seasonality.priceMultiplier;
    } else if (this.seasonality.offSeason.includes(currentMonth)) {
      return 1 / this.seasonality.priceMultiplier;
    }
    
    return 1; // Normal season
  }
}

// Crop database with predefined crop types
export const CROP_DATABASE: Record<string, Crop> = {
  // GRAINS & CEREALS
  wheat: new Crop({
    id: 'wheat',
    name: 'Wheat',
    perishabilityScore: 3,
    icon: '🌾',
    averageMarketPrice: 2500,
    optimalStorageTemp: 15,
    optimalHumidity: 12,
    marketCategory: 'grain',
    seasonality: {
      peakSeason: ['March', 'April', 'May'],
      offSeason: ['September', 'October', 'November'],
      priceMultiplier: 1.2
    }
  }),

  rice: new Crop({
    id: 'rice',
    name: 'Rice',
    perishabilityScore: 2,
    icon: '🍚',
    averageMarketPrice: 2200,
    optimalStorageTemp: 18,
    optimalHumidity: 14,
    marketCategory: 'grain',
    seasonality: {
      peakSeason: ['October', 'November', 'December'],
      offSeason: ['June', 'July', 'August'],
      priceMultiplier: 1.15
    }
  }),

  maize: new Crop({
    id: 'maize',
    name: 'Maize (Corn)',
    perishabilityScore: 4,
    icon: '🌽',
    averageMarketPrice: 1800,
    optimalStorageTemp: 16,
    optimalHumidity: 13,
    marketCategory: 'grain',
    seasonality: {
      peakSeason: ['February', 'March', 'April'],
      offSeason: ['August', 'September', 'October'],
      priceMultiplier: 1.25
    }
  }),

  // PULSES & LEGUMES
  chickpea: new Crop({
    id: 'chickpea',
    name: 'Chickpea (Chana)',
    perishabilityScore: 2,
    icon: '🫘',
    averageMarketPrice: 5500,
    optimalStorageTemp: 18,
    optimalHumidity: 10,
    marketCategory: 'pulse',
    seasonality: {
      peakSeason: ['March', 'April', 'May'],
      offSeason: ['October', 'November', 'December'],
      priceMultiplier: 1.3
    }
  }),

  // VEGETABLES
  tomato: new Crop({
    id: 'tomato',
    name: 'Tomato',
    perishabilityScore: 9,
    icon: '🍅',
    averageMarketPrice: 3000,
    optimalStorageTemp: 12,
    optimalHumidity: 85,
    marketCategory: 'vegetable',
    seasonality: {
      peakSeason: ['December', 'January', 'February'],
      offSeason: ['May', 'June', 'July'],
      priceMultiplier: 1.8
    }
  }),

  onion: new Crop({
    id: 'onion',
    name: 'Onion',
    perishabilityScore: 6,
    icon: '🧅',
    averageMarketPrice: 2500,
    optimalStorageTemp: 0,
    optimalHumidity: 65,
    marketCategory: 'vegetable',
    seasonality: {
      peakSeason: ['March', 'April', 'May'],
      offSeason: ['September', 'October', 'November'],
      priceMultiplier: 2.0
    }
  }),

  potato: new Crop({
    id: 'potato',
    name: 'Potato',
    perishabilityScore: 5,
    icon: '🥔',
    averageMarketPrice: 1500,
    optimalStorageTemp: 4,
    optimalHumidity: 90,
    marketCategory: 'vegetable',
    seasonality: {
      peakSeason: ['February', 'March', 'April'],
      offSeason: ['August', 'September', 'October'],
      priceMultiplier: 1.6
    }
  }),

  // SPICES
  chili: new Crop({
    id: 'chili',
    name: 'Chili',
    perishabilityScore: 7,
    icon: '🌶️',
    averageMarketPrice: 8000,
    optimalStorageTemp: 10,
    optimalHumidity: 60,
    marketCategory: 'spice',
    seasonality: {
      peakSeason: ['October', 'November', 'December'],
      offSeason: ['June', 'July', 'August'],
      priceMultiplier: 1.5
    }
  }),

  turmeric: new Crop({
    id: 'turmeric',
    name: 'Turmeric',
    perishabilityScore: 4,
    icon: '🟡',
    averageMarketPrice: 12000,
    optimalStorageTemp: 20,
    optimalHumidity: 65,
    marketCategory: 'spice',
    seasonality: {
      peakSeason: ['February', 'March', 'April'],
      offSeason: ['August', 'September', 'October'],
      priceMultiplier: 1.3
    }
  }),

  // OILSEEDS
  mustard: new Crop({
    id: 'mustard',
    name: 'Mustard',
    perishabilityScore: 3,
    icon: '🟨',
    averageMarketPrice: 5500,
    optimalStorageTemp: 18,
    optimalHumidity: 7,
    marketCategory: 'oilseed',
    seasonality: {
      peakSeason: ['March', 'April', 'May'],
      offSeason: ['October', 'November', 'December'],
      priceMultiplier: 1.3
    }
  }),

  groundnut: new Crop({
    id: 'groundnut',
    name: 'Groundnut (Peanut)',
    perishabilityScore: 4,
    icon: '🥜',
    averageMarketPrice: 5000,
    optimalStorageTemp: 20,
    optimalHumidity: 7,
    marketCategory: 'oilseed',
    seasonality: {
      peakSeason: ['February', 'March', 'April'],
      offSeason: ['August', 'September', 'October'],
      priceMultiplier: 1.35
    }
  }),

  // FRUITS
  mango: new Crop({
    id: 'mango',
    name: 'Mango',
    perishabilityScore: 8,
    icon: '🥭',
    averageMarketPrice: 4000,
    optimalStorageTemp: 13,
    optimalHumidity: 85,
    marketCategory: 'fruit',
    seasonality: {
      peakSeason: ['April', 'May', 'June'],
      offSeason: ['September', 'October', 'November'],
      priceMultiplier: 1.2
    }
  }),

  banana: new Crop({
    id: 'banana',
    name: 'Banana',
    perishabilityScore: 9,
    icon: '🍌',
    averageMarketPrice: 2000,
    optimalStorageTemp: 14,
    optimalHumidity: 90,
    marketCategory: 'fruit',
    seasonality: {
      peakSeason: ['All year'],
      offSeason: [],
      priceMultiplier: 1.1
    }
  }),

  apple: new Crop({
    id: 'apple',
    name: 'Apple',
    perishabilityScore: 6,
    icon: '🍎',
    averageMarketPrice: 8000,
    optimalStorageTemp: 0,
    optimalHumidity: 90,
    marketCategory: 'fruit',
    seasonality: {
      peakSeason: ['October', 'November', 'December'],
      offSeason: ['March', 'April', 'May'],
      priceMultiplier: 1.8
    }
  }),

  // CASH CROPS
  cotton: new Crop({
    id: 'cotton',
    name: 'Cotton',
    perishabilityScore: 2,
    icon: '🌱',
    averageMarketPrice: 6500,
    optimalStorageTemp: 20,
    optimalHumidity: 8,
    marketCategory: 'cash crop',
    seasonality: {
      peakSeason: ['October', 'November', 'December'],
      offSeason: ['April', 'May', 'June'],
      priceMultiplier: 1.25
    }
  }),

  sugarcane: new Crop({
    id: 'sugarcane',
    name: 'Sugarcane',
    perishabilityScore: 7,
    icon: '🎋',
    averageMarketPrice: 350,
    optimalStorageTemp: 20,
    optimalHumidity: 85,
    marketCategory: 'cash crop',
    seasonality: {
      peakSeason: ['December', 'January', 'February'],
      offSeason: ['June', 'July', 'August'],
      priceMultiplier: 1.3
    }
  })
};

/**
 * Get crop by ID with fallback to default
 */
export function getCropById(id: string): Crop {
  return CROP_DATABASE[id] || CROP_DATABASE.wheat;
}

/**
 * Get all available crops as array
 */
export function getAllCrops(): Crop[] {
  return Object.values(CROP_DATABASE);
}
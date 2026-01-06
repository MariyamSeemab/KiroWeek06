// Core data types for Smart-Silo Storage Referee

export enum RiskLevel {
  GREEN = 'GREEN',
  YELLOW = 'YELLOW',
  RED = 'RED'
}

export enum StorageMethod {
  COLD_STORAGE = 'COLD_STORAGE',
  SOLAR_DRYING = 'SOLAR_DRYING'
}

export enum UrgencyLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export interface CropType {
  id: string;
  name: string;
  perishabilityScore: number; // 1-10 scale
  icon: string;
  averageMarketPrice: number;
  optimalStorageTemp: number;
  optimalHumidity: number;
  marketCategory: 'grain' | 'pulse' | 'vegetable' | 'spice' | 'fruit' | 'oilseed' | 'cash crop' | 'fiber' | 'fodder' | 'medicinal' | 'nut';
}

export interface FarmerInputs {
  cropType: CropType;
  distanceFromHub: number; // kilometers
  cropVolume: number; // quintals
  urgencyLevel: UrgencyLevel;
}

export interface EnvironmentalData {
  temperature: number; // Celsius
  humidity: number; // percentage
  timestamp: Date;
  sensorId: string;
  riskLevel: RiskLevel;
}

export interface RiskAssessment {
  solarDryingViability: number; // 0-1 scale
  spoilageRisk: number; // 0-1 scale
  environmentalMultiplier: number;
}

export interface StorageOption {
  method: StorageMethod;
  totalCost: number;
  expectedLosses: number;
  netValue: number;
  riskFactors: string[];
  carbonFootprint?: number; // kg CO2
  sustainabilityScore?: number; // 0-100
}

export interface EconomicVerdict {
  recommendedOption: StorageOption;
  alternativeOption: StorageOption;
  reasoning: string;
  confidenceLevel: number;
  potentialSavings: number;
  weatherImpact?: {
    penalty: number;
    reasoning: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  sustainabilityComparison?: {
    carbonSavings: number;
    environmentalWinner: 'cold_storage' | 'solar_drying';
    sustainabilityAdvantage: string;
  };
}

export interface PricePoint {
  date: Date;
  price: number;
  volume: number;
}

export interface MarketData {
  cropId: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  lastUpdated: Date;
  source: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ErrorRecovery {
  fallbackData: () => any;
  retryMechanism: (operation: () => Promise<any>) => Promise<any>;
  userNotification: (error: Error) => string;
  gracefulDegradation: (feature: string) => any;
}

// Seasonal pattern for crops
export interface SeasonalPattern {
  peakSeason: string[];
  offSeason: string[];
  priceMultiplier: number;
}

// Market simulation types
export interface MarketSimulation {
  currentPrice: number;
  futurePrice: number;
  priceChangePercentage: number;
  timeHorizon: number; // days
  confidence: number; // 0-1 scale
  factors: string[]; // factors affecting price change
}

// Future price prediction
export interface PricePrediction {
  predictedPrice: number;
  confidence: number;
  timeframe: number; // days
  factors: {
    seasonal: number;
    demand: number;
    supply: number;
    weather: number;
    market: number;
  };
}
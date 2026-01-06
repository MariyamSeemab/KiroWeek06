import { StorageMethod, FarmerInputs, EnvironmentalData, StorageOption } from '../types';
import { Crop } from './Crop';
import { RiskAssessmentEngine } from '../services/RiskAssessmentEngine';

export interface StorageCosts {
  baseCost: number; // INR per quintal per day
  logisticsCost: number; // INR per quintal per km
  setupCost: number; // One-time setup cost
  maintenanceCost: number; // Daily maintenance cost
}

export interface StorageParameters {
  method: StorageMethod;
  costs: StorageCosts;
  spoilageRate: number; // Base spoilage rate per day (0-1)
  capacityLimit: number; // Maximum quintals
  availabilityFactor: number; // 0-1, availability of this storage method
}

export class StorageStrategy {
  method: StorageMethod;
  baseCost: number;
  distanceMultiplier: number;
  environmentalRisk: number;
  private parameters: StorageParameters;
  private riskEngine: RiskAssessmentEngine;

  constructor(parameters: StorageParameters) {
    this.method = parameters.method;
    this.baseCost = parameters.costs.baseCost;
    this.distanceMultiplier = parameters.costs.logisticsCost;
    this.environmentalRisk = parameters.spoilageRate;
    this.parameters = parameters;
    this.riskEngine = new RiskAssessmentEngine();
  }

  /**
   * Calculate total cost for storage strategy
   */
  calculateTotalCost(
    inputs: FarmerInputs,
    environment: EnvironmentalData,
    storageDays: number = 30
  ): number {
    const { cropVolume, distanceFromHub } = inputs;

    // Base storage cost
    const baseStorageCost = this.baseCost * cropVolume * storageDays;

    // Distance-based logistics cost
    const logisticsCost = this.distanceMultiplier * cropVolume * distanceFromHub;

    // Setup cost (one-time)
    const setupCost = this.parameters.costs.setupCost;

    // Maintenance cost
    const maintenanceCost = this.parameters.costs.maintenanceCost * storageDays;

    // Environmental adjustment for solar drying
    let environmentalAdjustment = 0;
    if (this.method === StorageMethod.SOLAR_DRYING) {
      const riskAssessment = this.riskEngine.assessSolarDryingRisk(
        environment,
        inputs.cropType as Crop,
        storageDays * 24
      );
      environmentalAdjustment = baseStorageCost * riskAssessment.environmentalMultiplier * 0.1;
    }

    return baseStorageCost + logisticsCost + setupCost + maintenanceCost + environmentalAdjustment;
  }

  /**
   * Estimate losses due to spoilage
   */
  estimateLosses(
    crop: Crop,
    environment: EnvironmentalData,
    volume: number,
    marketPrice: number,
    storageDays: number = 30
  ): number {
    let spoilageRate = this.parameters.spoilageRate;

    // Adjust spoilage rate based on method
    if (this.method === StorageMethod.SOLAR_DRYING) {
      const riskAssessment = this.riskEngine.assessSolarDryingRisk(
        environment,
        crop,
        storageDays * 24
      );
      spoilageRate = riskAssessment.spoilageRisk;
    } else if (this.method === StorageMethod.COLD_STORAGE) {
      // Cold storage has very low spoilage rate
      spoilageRate = 0.001; // 0.1% per day
    }

    // Calculate cumulative spoilage over time
    const dailySpoilageRate = spoilageRate / storageDays;
    const totalSpoilage = 1 - Math.pow(1 - dailySpoilageRate, storageDays);
    const spoiledVolume = volume * totalSpoilage;

    return spoiledVolume * marketPrice;
  }

  /**
   * Calculate net value after costs and losses
   */
  calculateNetValue(
    inputs: FarmerInputs,
    environment: EnvironmentalData,
    marketPrice: number,
    storageDays: number = 30
  ): number {
    const { cropVolume } = inputs;
    const crop = inputs.cropType as Crop;

    // Gross value
    const grossValue = cropVolume * marketPrice;

    // Total costs
    const totalCost = this.calculateTotalCost(inputs, environment, storageDays);

    // Estimated losses
    const estimatedLosses = this.estimateLosses(
      crop,
      environment,
      cropVolume,
      marketPrice,
      storageDays
    );

    return grossValue - totalCost - estimatedLosses;
  }

  /**
   * Get risk factors for this storage method
   */
  getRiskFactors(
    crop: Crop,
    environment: EnvironmentalData,
    inputs: FarmerInputs
  ): string[] {
    const riskFactors: string[] = [];

    if (this.method === StorageMethod.SOLAR_DRYING) {
      const riskAnalysis = this.riskEngine.getDetailedRiskAnalysis(environment, crop);
      
      if (environment.humidity > 70) {
        riskFactors.push('High humidity increases fungal growth risk');
      }
      
      if (environment.temperature > 35) {
        riskFactors.push('High temperature accelerates spoilage');
      }
      
      if (crop.perishabilityScore > 7) {
        riskFactors.push('Highly perishable crop unsuitable for solar drying');
      }

      riskFactors.push(...riskAnalysis.warnings);
    } else if (this.method === StorageMethod.COLD_STORAGE) {
      if (inputs.distanceFromHub > 200) {
        riskFactors.push('Long distance increases transportation costs');
      }
      
      if (inputs.cropVolume < 10) {
        riskFactors.push('Small volume may not justify cold storage costs');
      }
    }

    // Availability factor
    if (this.parameters.availabilityFactor < 0.8) {
      riskFactors.push('Limited availability of this storage method');
    }

    return riskFactors;
  }

  /**
   * Generate storage option summary
   */
  generateStorageOption(
    inputs: FarmerInputs,
    environment: EnvironmentalData,
    marketPrice: number,
    storageDays: number = 30
  ): StorageOption {
    const crop = inputs.cropType as Crop;

    return {
      method: this.method,
      totalCost: this.calculateTotalCost(inputs, environment, storageDays),
      expectedLosses: this.estimateLosses(
        crop,
        environment,
        inputs.cropVolume,
        marketPrice,
        storageDays
      ),
      netValue: this.calculateNetValue(inputs, environment, marketPrice, storageDays),
      riskFactors: this.getRiskFactors(crop, environment, inputs)
    };
  }

  /**
   * Check if this storage method is suitable for given conditions
   */
  isSuitable(
    inputs: FarmerInputs,
    environment: EnvironmentalData
  ): { suitable: boolean; reasons: string[] } {
    const reasons: string[] = [];
    let suitable = true;

    // Volume constraints
    if (inputs.cropVolume > this.parameters.capacityLimit) {
      suitable = false;
      reasons.push(`Volume exceeds capacity limit of ${this.parameters.capacityLimit} quintals`);
    }

    // Availability
    if (this.parameters.availabilityFactor < 0.5) {
      suitable = false;
      reasons.push('Storage method not readily available');
    }

    // Method-specific constraints
    if (this.method === StorageMethod.SOLAR_DRYING) {
      const crop = inputs.cropType as Crop;
      const riskAssessment = this.riskEngine.assessSolarDryingRisk(environment, crop);
      
      if (riskAssessment.spoilageRisk > 0.8) {
        suitable = false;
        reasons.push('Environmental conditions too risky for solar drying');
      }
    }

    return { suitable, reasons };
  }
}

// Predefined storage strategies
export const STORAGE_STRATEGIES: Record<StorageMethod, StorageStrategy> = {
  [StorageMethod.COLD_STORAGE]: new StorageStrategy({
    method: StorageMethod.COLD_STORAGE,
    costs: {
      baseCost: 15, // INR per quintal per day
      logisticsCost: 2, // INR per quintal per km
      setupCost: 500, // One-time setup cost
      maintenanceCost: 50 // Daily maintenance
    },
    spoilageRate: 0.001, // 0.1% per day
    capacityLimit: 1000, // quintals
    availabilityFactor: 0.8
  }),

  [StorageMethod.SOLAR_DRYING]: new StorageStrategy({
    method: StorageMethod.SOLAR_DRYING,
    costs: {
      baseCost: 2, // INR per quintal per day (very low)
      logisticsCost: 0.5, // Minimal logistics cost
      setupCost: 100, // Low setup cost
      maintenanceCost: 5 // Minimal maintenance
    },
    spoilageRate: 0.05, // 5% base rate, adjusted by environment
    capacityLimit: 500, // quintals
    availabilityFactor: 0.95 // Usually available
  })
};

/**
 * Get storage strategy by method
 */
export function getStorageStrategy(method: StorageMethod): StorageStrategy {
  return STORAGE_STRATEGIES[method];
}

/**
 * Get all available storage strategies
 */
export function getAllStorageStrategies(): StorageStrategy[] {
  return Object.values(STORAGE_STRATEGIES);
}
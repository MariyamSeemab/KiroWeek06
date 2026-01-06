import { 
  FarmerInputs, 
  EnvironmentalData, 
  MarketData, 
  EconomicVerdict, 
  ValidationResult,
  StorageMethod,
  StorageOption
} from '../types';
import { Crop } from './Crop';
import { getAllStorageStrategies } from './StorageStrategy';

export interface DecisionParameters {
  storageDays: number;
  riskTolerance: 'low' | 'medium' | 'high';
  prioritizeProfit: boolean;
  considerEnvironmentalImpact: boolean;
}

export class DecisionContext {
  farmerInputs: FarmerInputs;
  environmentalData: EnvironmentalData;
  marketData: MarketData;
  timestamp: Date;

  constructor(
    farmerInputs: FarmerInputs,
    environmentalData: EnvironmentalData,
    marketData: MarketData
  ) {
    this.farmerInputs = farmerInputs;
    this.environmentalData = environmentalData;
    this.marketData = marketData;
    this.timestamp = new Date();
  }

  /**
   * Generate economic recommendation based on all factors
   */
  generateRecommendation(parameters: DecisionParameters = this.getDefaultParameters()): EconomicVerdict {
    // Validate inputs first
    const validation = this.validateInputs();
    if (!validation.isValid) {
      throw new Error(`Invalid inputs: ${validation.errors.join(', ')}`);
    }

    // Calculate options for all storage methods
    const storageOptions = this.calculateAllStorageOptions(parameters);
    
    // Determine the best option
    const recommendedOption = this.selectBestOption(storageOptions, parameters);
    const alternativeOption = this.selectAlternativeOption(storageOptions, recommendedOption);
    
    // Generate reasoning
    const reasoning = this.generateReasoning(recommendedOption, alternativeOption);
    
    // Calculate confidence level
    const confidenceLevel = this.calculateConfidenceLevel(storageOptions);
    
    // Calculate potential savings
    const potentialSavings = this.calculatePotentialSavings(recommendedOption, alternativeOption);

    return {
      recommendedOption,
      alternativeOption,
      reasoning,
      confidenceLevel,
      potentialSavings
    };
  }

  /**
   * Validate all inputs for completeness and correctness
   */
  validateInputs(): ValidationResult {
    const errors: string[] = [];

    // Validate farmer inputs
    if (!this.farmerInputs.cropType) {
      errors.push('Crop type is required');
    }

    if (this.farmerInputs.distanceFromHub <= 0 || this.farmerInputs.distanceFromHub > 1000) {
      errors.push('Distance from hub must be between 1 and 1000 km');
    }

    if (this.farmerInputs.cropVolume <= 0 || this.farmerInputs.cropVolume > 10000) {
      errors.push('Crop volume must be between 1 and 10000 quintals');
    }

    // Validate environmental data
    if (this.environmentalData.temperature < -10 || this.environmentalData.temperature > 60) {
      errors.push('Temperature reading appears invalid');
    }

    if (this.environmentalData.humidity < 0 || this.environmentalData.humidity > 100) {
      errors.push('Humidity reading must be between 0 and 100%');
    }

    // Validate market data
    if (!this.marketData.currentPrice || this.marketData.currentPrice <= 0) {
      errors.push('Valid market price is required');
    }

    // Check data freshness
    const dataAge = Date.now() - this.environmentalData.timestamp.getTime();
    if (dataAge > 24 * 60 * 60 * 1000) { // 24 hours
      errors.push('Environmental data is too old (>24 hours)');
    }

    const marketAge = Date.now() - this.marketData.lastUpdated.getTime();
    if (marketAge > 7 * 24 * 60 * 60 * 1000) { // 7 days
      errors.push('Market data is too old (>7 days)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate storage options for all available methods
   */
  private calculateAllStorageOptions(parameters: DecisionParameters): StorageOption[] {
    const strategies = getAllStorageStrategies();
    const options: StorageOption[] = [];

    for (const strategy of strategies) {
      try {
        // Check if strategy is suitable
        const suitability = strategy.isSuitable(this.farmerInputs, this.environmentalData);
        
        if (suitability.suitable || parameters.riskTolerance === 'high') {
          const option = strategy.generateStorageOption(
            this.farmerInputs,
            this.environmentalData,
            this.marketData.currentPrice,
            parameters.storageDays
          );
          
          // Add suitability warnings to risk factors
          if (!suitability.suitable) {
            option.riskFactors.push(...suitability.reasons);
          }
          
          options.push(option);
        }
      } catch (error) {
        console.warn(`Failed to calculate option for ${strategy.method}:`, error);
      }
    }

    return options;
  }

  /**
   * Select the best storage option based on parameters
   */
  private selectBestOption(options: StorageOption[], parameters: DecisionParameters): StorageOption {
    if (options.length === 0) {
      throw new Error('No suitable storage options available');
    }

    // Sort options by net value (profit)
    const sortedByProfit = [...options].sort((a, b) => b.netValue - a.netValue);
    
    // Sort options by risk (lowest risk first)
    const sortedByRisk = [...options].sort((a, b) => a.riskFactors.length - b.riskFactors.length);

    // Decision logic based on parameters
    if (parameters.prioritizeProfit) {
      return sortedByProfit[0];
    }

    // Risk-based selection
    switch (parameters.riskTolerance) {
      case 'low':
        // Prefer lowest risk option with reasonable profit
        const lowRiskOptions = sortedByRisk.filter(opt => opt.riskFactors.length <= 2);
        return lowRiskOptions.length > 0 ? lowRiskOptions[0] : sortedByRisk[0];
        
      case 'high':
        // Prefer highest profit regardless of risk
        return sortedByProfit[0];
        
      case 'medium':
      default:
        // Balance profit and risk
        return this.selectBalancedOption(options);
    }
  }

  /**
   * Select balanced option considering both profit and risk
   */
  private selectBalancedOption(options: StorageOption[]): StorageOption {
    let bestOption = options[0];
    let bestScore = -Infinity;

    for (const option of options) {
      // Normalize net value (0-1 scale)
      const maxNetValue = Math.max(...options.map(o => o.netValue));
      const minNetValue = Math.min(...options.map(o => o.netValue));
      const normalizedProfit = maxNetValue > minNetValue 
        ? (option.netValue - minNetValue) / (maxNetValue - minNetValue)
        : 0.5;

      // Risk penalty (0-1 scale, lower is better)
      const maxRiskFactors = Math.max(...options.map(o => o.riskFactors.length));
      const riskPenalty = maxRiskFactors > 0 ? option.riskFactors.length / maxRiskFactors : 0;

      // Combined score (profit - risk penalty)
      const score = normalizedProfit - (riskPenalty * 0.3);

      if (score > bestScore) {
        bestScore = score;
        bestOption = option;
      }
    }

    return bestOption;
  }

  /**
   * Select alternative option (second best)
   */
  private selectAlternativeOption(options: StorageOption[], recommended: StorageOption): StorageOption {
    const alternatives = options.filter(opt => opt.method !== recommended.method);
    
    if (alternatives.length === 0) {
      // Return a modified version of the recommended option
      return {
        ...recommended,
        method: recommended.method === StorageMethod.COLD_STORAGE 
          ? StorageMethod.SOLAR_DRYING 
          : StorageMethod.COLD_STORAGE
      };
    }

    // Return the best alternative
    return alternatives.sort((a, b) => b.netValue - a.netValue)[0];
  }

  /**
   * Generate human-readable reasoning for the recommendation
   */
  private generateReasoning(
    recommended: StorageOption,
    alternative: StorageOption
  ): string {
    const crop = this.farmerInputs.cropType as Crop;
    const reasons: string[] = [];

    // Environmental factors
    if (this.environmentalData.humidity > 70 && recommended.method === StorageMethod.COLD_STORAGE) {
      reasons.push(`High humidity (${this.environmentalData.humidity}%) makes solar drying risky`);
    }

    if (this.environmentalData.temperature > 35 && recommended.method === StorageMethod.COLD_STORAGE) {
      reasons.push(`High temperature (${this.environmentalData.temperature}°C) increases spoilage risk`);
    }

    // Economic factors
    const profitDifference = recommended.netValue - alternative.netValue;
    if (profitDifference > 1000) {
      reasons.push(`${recommended.method.replace('_', ' ').toLowerCase()} provides ₹${Math.round(profitDifference)} more profit`);
    }

    // Distance factors
    if (this.farmerInputs.distanceFromHub > 100 && recommended.method === StorageMethod.SOLAR_DRYING) {
      reasons.push(`Long distance (${this.farmerInputs.distanceFromHub}km) makes cold storage expensive`);
    }

    // Crop-specific factors
    if (crop.perishabilityScore > 7 && recommended.method === StorageMethod.COLD_STORAGE) {
      reasons.push(`${crop.name} is highly perishable and requires controlled storage`);
    }

    // Risk factors
    if (recommended.riskFactors.length < alternative.riskFactors.length) {
      reasons.push(`Lower risk option with ${recommended.riskFactors.length} vs ${alternative.riskFactors.length} risk factors`);
    }

    // Default reasoning if no specific reasons found
    if (reasons.length === 0) {
      reasons.push(`${recommended.method.replace('_', ' ').toLowerCase()} offers the best balance of cost and risk for your situation`);
    }

    return reasons.join('. ') + '.';
  }

  /**
   * Calculate confidence level in the recommendation
   */
  private calculateConfidenceLevel(options: StorageOption[]): number {
    if (options.length < 2) {
      return 0.6; // Lower confidence with limited options
    }

    const sortedByProfit = [...options].sort((a, b) => b.netValue - a.netValue);
    const best = sortedByProfit[0];
    const secondBest = sortedByProfit[1];

    // Calculate profit margin between best and second best
    const profitMargin = best.netValue - secondBest.netValue;
    const relativeMargin = best.netValue > 0 ? profitMargin / best.netValue : 0;

    // Base confidence on profit margin
    let confidence = Math.min(0.9, 0.5 + relativeMargin);

    // Adjust for data quality
    const dataAge = Date.now() - this.environmentalData.timestamp.getTime();
    if (dataAge > 6 * 60 * 60 * 1000) { // 6 hours
      confidence *= 0.9; // Reduce confidence for older data
    }

    // Adjust for risk factors
    const avgRiskFactors = options.reduce((sum, opt) => sum + opt.riskFactors.length, 0) / options.length;
    if (avgRiskFactors > 3) {
      confidence *= 0.8; // Reduce confidence in high-risk scenarios
    }

    return Math.round(confidence * 100) / 100;
  }

  /**
   * Calculate potential savings from choosing recommended over alternative
   */
  private calculatePotentialSavings(recommended: StorageOption, alternative: StorageOption): number {
    return Math.max(0, recommended.netValue - alternative.netValue);
  }

  /**
   * Get default decision parameters
   */
  private getDefaultParameters(): DecisionParameters {
    return {
      storageDays: 30,
      riskTolerance: 'medium',
      prioritizeProfit: true,
      considerEnvironmentalImpact: false
    };
  }

  /**
   * Update context with new data
   */
  updateEnvironmentalData(newData: EnvironmentalData): void {
    this.environmentalData = newData;
    this.timestamp = new Date();
  }

  /**
   * Update market data
   */
  updateMarketData(newData: MarketData): void {
    this.marketData = newData;
    this.timestamp = new Date();
  }

  /**
   * Get summary of current context
   */
  getSummary(): {
    crop: string;
    volume: number;
    distance: number;
    temperature: number;
    humidity: number;
    marketPrice: number;
    dataFreshness: string;
  } {
    const dataAge = Date.now() - this.environmentalData.timestamp.getTime();
    const hoursOld = Math.floor(dataAge / (60 * 60 * 1000));
    
    return {
      crop: this.farmerInputs.cropType.name,
      volume: this.farmerInputs.cropVolume,
      distance: this.farmerInputs.distanceFromHub,
      temperature: this.environmentalData.temperature,
      humidity: this.environmentalData.humidity,
      marketPrice: this.marketData.currentPrice,
      dataFreshness: hoursOld === 0 ? 'Current' : `${hoursOld}h old`
    };
  }
}
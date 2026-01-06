/**
 * Sustainability Service for Smart-Silo Storage Referee
 * Calculates carbon footprint and environmental impact of storage decisions
 */

export interface CarbonFootprint {
  totalEmissions: number; // kg CO2
  breakdown: {
    electricity: number;
    transportation: number;
    refrigeration: number;
    infrastructure: number;
  };
  equivalents: {
    treesNeeded: number; // Trees needed to offset
    carKilometers: number; // Equivalent car travel
    coalBurned: number; // kg of coal
  };
}

export interface SustainabilityMetrics {
  carbonFootprint: CarbonFootprint;
  waterUsage: number; // liters
  energyConsumption: number; // kWh
  renewableEnergyPercentage: number;
  sustainabilityScore: number; // 0-100 scale
  certifications: string[];
}

export interface EnvironmentalComparison {
  coldStorage: SustainabilityMetrics;
  solarDrying: SustainabilityMetrics;
  recommendation: {
    environmentalWinner: 'cold_storage' | 'solar_drying';
    carbonSavings: number;
    sustainabilityAdvantage: string;
    tradeoffAnalysis: string;
  };
}

export class SustainabilityService {
  // Carbon emission factors (kg CO2 per unit)
  private readonly EMISSION_FACTORS = {
    electricityPerKWh: 0.82, // India grid average kg CO2/kWh
    dieselPerLiter: 2.68, // kg CO2/liter
    transportPerKmPerKg: 0.0001, // kg CO2 per km per kg of cargo
    refrigerationLeakage: 1.4, // kg CO2 equivalent per kg of crop per month
  };

  // Energy consumption factors
  private readonly ENERGY_FACTORS = {
    coldStoragePerKgPerDay: 0.15, // kWh per kg per day
    transportationPerKmPerKg: 0.0002, // kWh per km per kg
    facilityOverheadPerDay: 50, // kWh per day for facility operations
  };

  /**
   * Calculate comprehensive environmental comparison
   */
  calculateEnvironmentalComparison(
    cropVolumeKg: number,
    distanceKm: number,
    storageDays: number
  ): EnvironmentalComparison {
    const coldStorageMetrics = this.calculateColdStorageImpact(cropVolumeKg, distanceKm, storageDays);
    const solarDryingMetrics = this.calculateSolarDryingImpact(cropVolumeKg, distanceKm, storageDays);

    const recommendation = this.generateEnvironmentalRecommendation(
      coldStorageMetrics,
      solarDryingMetrics
    );

    return {
      coldStorage: coldStorageMetrics,
      solarDrying: solarDryingMetrics,
      recommendation
    };
  }

  /**
   * Calculate carbon footprint for cold storage
   */
  private calculateColdStorageImpact(
    cropVolumeKg: number,
    distanceKm: number,
    storageDays: number
  ): SustainabilityMetrics {
    // Electricity consumption for refrigeration
    const refrigerationEnergy = cropVolumeKg * this.ENERGY_FACTORS.coldStoragePerKgPerDay * storageDays;
    
    // Transportation energy (round trip)
    const transportationEnergy = cropVolumeKg * distanceKm * this.ENERGY_FACTORS.transportationPerKmPerKg * 2;
    
    // Facility overhead
    const facilityEnergy = this.ENERGY_FACTORS.facilityOverheadPerDay * storageDays;
    
    const totalEnergy = refrigerationEnergy + transportationEnergy + facilityEnergy;

    // Carbon emissions breakdown
    const electricityEmissions = totalEnergy * this.EMISSION_FACTORS.electricityPerKWh;
    const transportationEmissions = cropVolumeKg * distanceKm * this.EMISSION_FACTORS.transportPerKmPerKg * 2;
    const refrigerationLeakage = (cropVolumeKg / 1000) * (storageDays / 30) * this.EMISSION_FACTORS.refrigerationLeakage;
    const infrastructureEmissions = cropVolumeKg * 0.01; // Amortized infrastructure impact

    const totalEmissions = electricityEmissions + transportationEmissions + refrigerationLeakage + infrastructureEmissions;

    const carbonFootprint: CarbonFootprint = {
      totalEmissions,
      breakdown: {
        electricity: electricityEmissions,
        transportation: transportationEmissions,
        refrigeration: refrigerationLeakage,
        infrastructure: infrastructureEmissions
      },
      equivalents: {
        treesNeeded: Math.ceil(totalEmissions / 22), // 22 kg CO2 per tree per year
        carKilometers: Math.round(totalEmissions / 0.12), // 0.12 kg CO2 per km average car
        coalBurned: Math.round(totalEmissions / 2.42) // 2.42 kg CO2 per kg coal
      }
    };

    return {
      carbonFootprint,
      waterUsage: cropVolumeKg * 2.5, // liters per kg for cooling systems
      energyConsumption: totalEnergy,
      renewableEnergyPercentage: 20, // Assume 20% renewable in Indian grid
      sustainabilityScore: this.calculateSustainabilityScore(totalEmissions, totalEnergy, false),
      certifications: ['Energy Star', 'Green Building']
    };
  }

  /**
   * Calculate carbon footprint for solar drying
   */
  private calculateSolarDryingImpact(
    cropVolumeKg: number,
    distanceKm: number,
    storageDays: number
  ): SustainabilityMetrics {
    // Solar drying uses minimal electricity (fans, monitoring)
    const minimalElectricity = cropVolumeKg * 0.01 * storageDays; // Very low energy for fans/monitoring
    
    // Transportation (shorter distance to local solar facilities)
    const localTransportDistance = Math.min(distanceKm * 0.3, 50); // Assume local solar facilities
    const transportationEnergy = cropVolumeKg * localTransportDistance * this.ENERGY_FACTORS.transportationPerKmPerKg * 2;
    
    const totalEnergy = minimalElectricity + transportationEnergy;

    // Carbon emissions (minimal)
    const electricityEmissions = minimalElectricity * this.EMISSION_FACTORS.electricityPerKWh;
    const transportationEmissions = cropVolumeKg * localTransportDistance * this.EMISSION_FACTORS.transportPerKmPerKg * 2;
    const infrastructureEmissions = cropVolumeKg * 0.002; // Much lower infrastructure impact

    const totalEmissions = electricityEmissions + transportationEmissions + infrastructureEmissions;

    const carbonFootprint: CarbonFootprint = {
      totalEmissions,
      breakdown: {
        electricity: electricityEmissions,
        transportation: transportationEmissions,
        refrigeration: 0, // No refrigeration
        infrastructure: infrastructureEmissions
      },
      equivalents: {
        treesNeeded: Math.ceil(totalEmissions / 22),
        carKilometers: Math.round(totalEmissions / 0.12),
        coalBurned: Math.round(totalEmissions / 2.42)
      }
    };

    return {
      carbonFootprint,
      waterUsage: 0, // Solar drying uses no additional water
      energyConsumption: totalEnergy,
      renewableEnergyPercentage: 95, // Mostly solar energy
      sustainabilityScore: this.calculateSustainabilityScore(totalEmissions, totalEnergy, true),
      certifications: ['Solar Powered', 'Carbon Neutral', 'Organic Compatible']
    };
  }

  /**
   * Generate environmental recommendation
   */
  private generateEnvironmentalRecommendation(
    coldStorage: SustainabilityMetrics,
    solarDrying: SustainabilityMetrics
  ): EnvironmentalComparison['recommendation'] {
    const carbonSavings = coldStorage.carbonFootprint.totalEmissions - solarDrying.carbonFootprint.totalEmissions;
    const environmentalWinner = carbonSavings > 0 ? 'solar_drying' : 'cold_storage';

    let sustainabilityAdvantage: string;
    let tradeoffAnalysis: string;

    if (environmentalWinner === 'solar_drying') {
      sustainabilityAdvantage = `Solar drying saves ${Math.round(carbonSavings)} kg CO2 emissions`;
      tradeoffAnalysis = `While solar drying is environmentally superior, consider weather risks and crop spoilage potential. The carbon savings equivalent to ${solarDrying.carbonFootprint.equivalents.treesNeeded} trees planted.`;
    } else {
      sustainabilityAdvantage = `Cold storage has ${Math.round(Math.abs(carbonSavings))} kg higher emissions but better preservation`;
      tradeoffAnalysis = `Cold storage has higher environmental impact but significantly reduces food waste, which can offset emissions through prevented spoilage.`;
    }

    return {
      environmentalWinner,
      carbonSavings: Math.abs(carbonSavings),
      sustainabilityAdvantage,
      tradeoffAnalysis
    };
  }

  /**
   * Calculate overall sustainability score (0-100)
   */
  private calculateSustainabilityScore(
    emissions: number,
    energy: number,
    isRenewable: boolean
  ): number {
    let score = 100;

    // Penalize high emissions (per kg of crop)
    const emissionsPenalty = Math.min(emissions * 2, 50);
    score -= emissionsPenalty;

    // Penalize high energy consumption
    const energyPenalty = Math.min(energy * 0.1, 30);
    score -= energyPenalty;

    // Bonus for renewable energy
    if (isRenewable) {
      score += 20;
    }

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Get sustainability impact summary for UI
   */
  getSustainabilityImpactSummary(comparison: EnvironmentalComparison): {
    winner: string;
    impact: string;
    color: string;
    icon: string;
    details: string[];
  } {
    const { recommendation, coldStorage, solarDrying } = comparison;
    
    if (recommendation.environmentalWinner === 'solar_drying') {
      return {
        winner: 'Solar Drying',
        impact: `${Math.round(recommendation.carbonSavings)} kg CO2 saved`,
        color: '#38a169',
        icon: '🌱',
        details: [
          `Equivalent to ${solarDrying.carbonFootprint.equivalents.treesNeeded} trees planted`,
          `95% renewable energy usage`,
          `Zero water consumption`,
          `Carbon neutral operation`
        ]
      };
    } else {
      return {
        winner: 'Cold Storage',
        impact: `${Math.round(recommendation.carbonSavings)} kg CO2 higher emissions`,
        color: '#dd6b20',
        icon: '⚡',
        details: [
          `Higher energy consumption but prevents food waste`,
          `${coldStorage.renewableEnergyPercentage}% renewable energy`,
          `Reliable preservation reduces spoilage emissions`,
          `Infrastructure efficiency improving`
        ]
      };
    }
  }

  /**
   * Calculate environmental cost in monetary terms
   */
  calculateEnvironmentalCost(emissions: number): number {
    // Using social cost of carbon: ~$50 per ton CO2 (₹4000 per ton)
    const socialCostPerKg = 4; // ₹4 per kg CO2
    return emissions * socialCostPerKg;
  }
}
import { EnvironmentalData, RiskAssessment, RiskLevel } from '../types';
import { Crop } from '../models/Crop';

export interface RiskThresholds {
  temperature: {
    optimal: { min: number; max: number };
    warning: { min: number; max: number };
    critical: { min: number; max: number };
  };
  humidity: {
    optimal: { min: number; max: number };
    warning: { min: number; max: number };
    critical: { min: number; max: number };
  };
}

export interface RiskFactors {
  temperature: number; // 0-1 scale
  humidity: number; // 0-1 scale
  perishability: number; // 0-1 scale
  timeExposure: number; // 0-1 scale
}

export class RiskAssessmentEngine {
  private static readonly DEFAULT_THRESHOLDS: RiskThresholds = {
    temperature: {
      optimal: { min: 15, max: 25 },
      warning: { min: 10, max: 35 },
      critical: { min: 0, max: 45 }
    },
    humidity: {
      optimal: { min: 40, max: 60 },
      warning: { min: 20, max: 80 },
      critical: { min: 0, max: 100 }
    }
  };

  private thresholds: RiskThresholds;
  private riskHistory: Map<string, EnvironmentalData[]> = new Map();

  constructor(customThresholds?: Partial<RiskThresholds>) {
    this.thresholds = this.mergeThresholds(customThresholds);
  }

  /**
   * Assess environmental risk for solar drying based on current conditions
   */
  assessSolarDryingRisk(
    environment: EnvironmentalData,
    crop: Crop,
    exposureHours: number = 24
  ): RiskAssessment {
    // Calculate individual risk factors
    const riskFactors = this.calculateRiskFactors(environment, crop, exposureHours);
    
    // Calculate overall spoilage risk
    const spoilageRisk = this.calculateSpoilageRisk(riskFactors);
    
    // Calculate solar drying viability (inverse of risk)
    const solarDryingViability = Math.max(0, 1 - spoilageRisk);
    
    // Calculate environmental multiplier for cost calculations
    const environmentalMultiplier = this.calculateEnvironmentalMultiplier(environment);

    // Store risk history for trend analysis
    this.updateRiskHistory(environment.sensorId, environment);

    return {
      solarDryingViability,
      spoilageRisk,
      environmentalMultiplier
    };
  }

  /**
   * Get risk level based on environmental conditions
   */
  getRiskLevel(environment: EnvironmentalData): RiskLevel {
    const tempRisk = this.getTemperatureRisk(environment.temperature);
    const humidityRisk = this.getHumidityRisk(environment.humidity);
    
    // Combine risks to determine overall level
    if (tempRisk === 'critical' || humidityRisk === 'critical') {
      return RiskLevel.RED;
    } else if (tempRisk === 'warning' || humidityRisk === 'warning') {
      return RiskLevel.YELLOW;
    } else {
      return RiskLevel.GREEN;
    }
  }

  /**
   * Get detailed risk analysis with recommendations
   */
  getDetailedRiskAnalysis(
    environment: EnvironmentalData,
    crop: Crop
  ): {
    riskLevel: RiskLevel;
    riskFactors: RiskFactors;
    recommendations: string[];
    warnings: string[];
    timeToAction: number; // hours until action needed
  } {
    const riskLevel = this.getRiskLevel(environment);
    const riskFactors = this.calculateRiskFactors(environment, crop, 24);
    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Generate recommendations based on conditions
    if (environment.temperature > this.thresholds.temperature.warning.max) {
      recommendations.push('Consider cold storage due to high temperature');
      warnings.push(`Temperature ${environment.temperature}°C exceeds safe storage limit`);
    }

    if (environment.humidity > this.thresholds.humidity.warning.max) {
      recommendations.push('High humidity increases fungal growth risk');
      warnings.push(`Humidity ${environment.humidity}% may cause spoilage`);
    }

    if (crop.perishabilityScore > 7) {
      recommendations.push('Highly perishable crop requires immediate action');
    }

    if (riskLevel === RiskLevel.RED) {
      recommendations.push('URGENT: Move to cold storage immediately');
    }

    // Calculate time to action based on risk progression
    const timeToAction = this.calculateTimeToAction(riskLevel, riskFactors);

    return {
      riskLevel,
      riskFactors,
      recommendations,
      warnings,
      timeToAction
    };
  }

  /**
   * Get risk trend analysis for a sensor
   */
  getRiskTrend(sensorId: string, hours: number = 24): {
    trend: 'improving' | 'stable' | 'worsening';
    averageRisk: number;
    peakRisk: number;
    dataPoints: number;
  } {
    const history = this.riskHistory.get(sensorId) || [];
    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    const recentData = history.filter(d => d.timestamp.getTime() > cutoffTime);

    if (recentData.length < 2) {
      return {
        trend: 'stable',
        averageRisk: 0,
        peakRisk: 0,
        dataPoints: recentData.length
      };
    }

    // Calculate risk scores for trend analysis
    const riskScores = recentData.map(data => {
      const tempRisk = this.getTemperatureRiskScore(data.temperature);
      const humidityRisk = this.getHumidityRiskScore(data.humidity);
      return (tempRisk + humidityRisk) / 2;
    });

    const averageRisk = riskScores.reduce((sum, risk) => sum + risk, 0) / riskScores.length;
    const peakRisk = Math.max(...riskScores);

    // Determine trend
    const firstHalf = riskScores.slice(0, Math.floor(riskScores.length / 2));
    const secondHalf = riskScores.slice(Math.floor(riskScores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, risk) => sum + risk, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, risk) => sum + risk, 0) / secondHalf.length;

    let trend: 'improving' | 'stable' | 'worsening';
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.1) {
      trend = 'worsening';
    } else if (difference < -0.1) {
      trend = 'improving';
    } else {
      trend = 'stable';
    }

    return {
      trend,
      averageRisk,
      peakRisk,
      dataPoints: recentData.length
    };
  }

  /**
   * Calculate environmental multiplier for economic calculations
   */
  private calculateEnvironmentalMultiplier(environment: EnvironmentalData): number {
    const tempScore = this.getTemperatureRiskScore(environment.temperature);
    const humidityScore = this.getHumidityRiskScore(environment.humidity);
    
    // Base multiplier of 1.0, increases with risk
    const baseMultiplier = 1.0;
    const riskMultiplier = (tempScore + humidityScore) / 2;
    
    // Multiplier ranges from 1.0 (no risk) to 3.0 (maximum risk)
    return baseMultiplier + (riskMultiplier * 2.0);
  }

  /**
   * Calculate individual risk factors
   */
  private calculateRiskFactors(
    environment: EnvironmentalData,
    crop: Crop,
    exposureHours: number
  ): RiskFactors {
    return {
      temperature: this.getTemperatureRiskScore(environment.temperature),
      humidity: this.getHumidityRiskScore(environment.humidity),
      perishability: crop.perishabilityScore / 10,
      timeExposure: Math.min(exposureHours / 72, 1) // 72 hours = maximum exposure
    };
  }

  /**
   * Calculate overall spoilage risk from individual factors
   */
  private calculateSpoilageRisk(factors: RiskFactors): number {
    // Weighted combination of risk factors
    const weights = {
      temperature: 0.3,
      humidity: 0.3,
      perishability: 0.25,
      timeExposure: 0.15
    };

    const weightedRisk = 
      factors.temperature * weights.temperature +
      factors.humidity * weights.humidity +
      factors.perishability * weights.perishability +
      factors.timeExposure * weights.timeExposure;

    // Apply exponential scaling for high-risk scenarios
    return Math.min(1, weightedRisk * (1 + weightedRisk));
  }

  /**
   * Get temperature risk category
   */
  private getTemperatureRisk(temperature: number): 'optimal' | 'warning' | 'critical' {
    const { optimal, warning } = this.thresholds.temperature;
    
    if (temperature >= optimal.min && temperature <= optimal.max) {
      return 'optimal';
    } else if (temperature >= warning.min && temperature <= warning.max) {
      return 'warning';
    } else {
      return 'critical';
    }
  }

  /**
   * Get humidity risk category
   */
  private getHumidityRisk(humidity: number): 'optimal' | 'warning' | 'critical' {
    const { optimal, warning } = this.thresholds.humidity;
    
    if (humidity >= optimal.min && humidity <= optimal.max) {
      return 'optimal';
    } else if (humidity >= warning.min && humidity <= warning.max) {
      return 'warning';
    } else {
      return 'critical';
    }
  }

  /**
   * Get temperature risk score (0-1)
   */
  private getTemperatureRiskScore(temperature: number): number {
    const { optimal, critical } = this.thresholds.temperature;
    
    if (temperature >= optimal.min && temperature <= optimal.max) {
      return 0; // No risk in optimal range
    }
    
    // Calculate distance from optimal range
    let distance: number;
    if (temperature < optimal.min) {
      distance = optimal.min - temperature;
    } else {
      distance = temperature - optimal.max;
    }
    
    // Normalize to 0-1 scale based on critical thresholds
    const maxDistance = Math.max(
      optimal.min - critical.min,
      critical.max - optimal.max
    );
    
    return Math.min(1, distance / maxDistance);
  }

  /**
   * Get humidity risk score (0-1)
   */
  private getHumidityRiskScore(humidity: number): number {
    const { optimal, critical } = this.thresholds.humidity;
    
    if (humidity >= optimal.min && humidity <= optimal.max) {
      return 0; // No risk in optimal range
    }
    
    // Calculate distance from optimal range
    let distance: number;
    if (humidity < optimal.min) {
      distance = optimal.min - humidity;
    } else {
      distance = humidity - optimal.max;
    }
    
    // Normalize to 0-1 scale
    const maxDistance = Math.max(
      optimal.min - critical.min,
      critical.max - optimal.max
    );
    
    return Math.min(1, distance / maxDistance);
  }

  /**
   * Calculate time until action is needed (in hours)
   */
  private calculateTimeToAction(riskLevel: RiskLevel, factors: RiskFactors): number {
    switch (riskLevel) {
      case RiskLevel.RED:
        return 0; // Immediate action required
      case RiskLevel.YELLOW:
        return Math.max(1, 24 * (1 - factors.perishability)); // 1-24 hours
      case RiskLevel.GREEN:
        return 72; // 3 days
      default:
        return 24;
    }
  }

  /**
   * Update risk history for trend analysis
   */
  private updateRiskHistory(sensorId: string, data: EnvironmentalData): void {
    if (!this.riskHistory.has(sensorId)) {
      this.riskHistory.set(sensorId, []);
    }
    
    const history = this.riskHistory.get(sensorId)!;
    history.push(data);
    
    // Keep only last 100 data points per sensor
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Merge custom thresholds with defaults
   */
  private mergeThresholds(custom?: Partial<RiskThresholds>): RiskThresholds {
    if (!custom) return RiskAssessmentEngine.DEFAULT_THRESHOLDS;
    
    return {
      temperature: { ...RiskAssessmentEngine.DEFAULT_THRESHOLDS.temperature, ...custom.temperature },
      humidity: { ...RiskAssessmentEngine.DEFAULT_THRESHOLDS.humidity, ...custom.humidity }
    };
  }
}
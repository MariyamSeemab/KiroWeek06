import React, { useState, useEffect } from 'react';
import { EconomicVerdict, StorageMethod } from '../types';
import { CurrencyFormatter } from '../utils/CurrencyFormatter';
import './VerdictCard.css';

interface VerdictCardProps {
  verdict: EconomicVerdict;
  isLoading?: boolean;
  onAcceptRecommendation?: () => void;
  onViewAlternative?: () => void;
  showActions?: boolean;
  animated?: boolean;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({
  verdict,
  isLoading = false,
  onAcceptRecommendation,
  onViewAlternative,
  showActions = true,
  animated = true
}) => {
  const [isVisible, setIsVisible] = useState(!animated);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  if (isLoading) {
    return (
      <div className="verdict-card loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h2>Analyzing Your Options...</h2>
          <p>The Smart-Silo Referee is calculating the best storage strategy for your crop.</p>
        </div>
      </div>
    );
  }

  const getMethodIcon = (method: StorageMethod): string => {
    switch (method) {
      case StorageMethod.COLD_STORAGE:
        return '❄️';
      case StorageMethod.SOLAR_DRYING:
        return '☀️';
      default:
        return '📦';
    }
  };

  const getMethodName = (method: StorageMethod): string => {
    switch (method) {
      case StorageMethod.COLD_STORAGE:
        return 'Cold Storage';
      case StorageMethod.SOLAR_DRYING:
        return 'Solar Drying';
      default:
        return 'Unknown Method';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.6) return 'medium';
    return 'low';
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return 'High Confidence';
    if (confidence >= 0.6) return 'Medium Confidence';
    return 'Low Confidence';
  };

  const getSavingsColor = (savings: number): string => {
    if (savings > 5000) return 'high';
    if (savings > 1000) return 'medium';
    return 'low';
  };

  const formatConfidence = (confidence: number): string => {
    return `${Math.round(confidence * 100)}%`;
  };

  return (
    <div className={`verdict-card ${isVisible ? 'visible' : ''}`}>
      <div className="verdict-header">
        <div className="referee-badge">
          <span className="referee-icon">⚖️</span>
          <span className="referee-text">Smart-Silo Referee</span>
        </div>
        <div className={`confidence-indicator ${getConfidenceColor(verdict.confidenceLevel)}`}>
          <span className="confidence-text">{getConfidenceText(verdict.confidenceLevel)}</span>
          <span className="confidence-percentage">{formatConfidence(verdict.confidenceLevel)}</span>
        </div>
      </div>

      <div className="verdict-main">
        <div className="recommendation-section">
          <h1 className="verdict-title">The Referee Recommends:</h1>
          
          <div className="recommended-method">
            <span className="method-icon-large">
              {getMethodIcon(verdict.recommendedOption.method)}
            </span>
            <div className="method-details">
              <h2 className="method-name">
                {getMethodName(verdict.recommendedOption.method)}
              </h2>
              <div className="method-metrics">
                <div className="metric">
                  <span className="metric-label">Net Value:</span>
                  <span className={`metric-value ${verdict.recommendedOption.netValue >= 0 ? 'positive' : 'negative'}`}>
                    {CurrencyFormatter.formatCompact(verdict.recommendedOption.netValue)}
                  </span>
                </div>
                <div className="metric">
                  <span className="metric-label">Total Cost:</span>
                  <span className="metric-value">
                    {CurrencyFormatter.formatCompact(verdict.recommendedOption.totalCost)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="reasoning-section">
            <h3 className="reasoning-title">Why This Choice?</h3>
            <p className="reasoning-text">{verdict.reasoning}</p>
          </div>

          {verdict.potentialSavings > 0 && (
            <div className={`savings-highlight ${getSavingsColor(verdict.potentialSavings)}`}>
              <span className="savings-icon">💰</span>
              <div className="savings-content">
                <span className="savings-label">Potential Savings:</span>
                <span className="savings-amount">
                  {CurrencyFormatter.formatSavings(verdict.potentialSavings)}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="alternative-section">
          <h3 className="alternative-title">Alternative Option</h3>
          <div className="alternative-method">
            <span className="method-icon">
              {getMethodIcon(verdict.alternativeOption.method)}
            </span>
            <div className="alternative-details">
              <span className="alternative-name">
                {getMethodName(verdict.alternativeOption.method)}
              </span>
              <span className="alternative-value">
                Net Value: {CurrencyFormatter.formatCompact(verdict.alternativeOption.netValue)}
              </span>
            </div>
            {onViewAlternative && (
              <button 
                className="view-alternative-button"
                onClick={onViewAlternative}
              >
                Compare
              </button>
            )}
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="verdict-details">
          <div className="details-grid">
            <div className="detail-section">
              <h4>Recommended Option Details</h4>
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Expected Losses:</span>
                  <span className="detail-value">
                    {CurrencyFormatter.formatCompact(verdict.recommendedOption.expectedLosses)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Risk Factors:</span>
                  <span className="detail-value">
                    {verdict.recommendedOption.riskFactors.length} identified
                  </span>
                </div>
              </div>
              
              {verdict.recommendedOption.riskFactors.length > 0 && (
                <div className="risk-factors">
                  <h5>Risk Factors:</h5>
                  <ul className="risk-list">
                    {verdict.recommendedOption.riskFactors.map((factor, index) => (
                      <li key={index} className="risk-item">
                        <span className="risk-icon">⚠️</span>
                        <span className="risk-text">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="detail-section">
              <h4>Alternative Option Details</h4>
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Total Cost:</span>
                  <span className="detail-value">
                    {CurrencyFormatter.formatCompact(verdict.alternativeOption.totalCost)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Expected Losses:</span>
                  <span className="detail-value">
                    {CurrencyFormatter.formatCompact(verdict.alternativeOption.expectedLosses)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Risk Factors:</span>
                  <span className="detail-value">
                    {verdict.alternativeOption.riskFactors.length} identified
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="verdict-footer">
        <button 
          className="details-toggle"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
          <span className={`toggle-arrow ${showDetails ? 'up' : 'down'}`}>
            {showDetails ? '▲' : '▼'}
          </span>
        </button>

        {showActions && (
          <div className="verdict-actions">
            {onAcceptRecommendation && (
              <button 
                className="accept-button"
                onClick={onAcceptRecommendation}
              >
                <span className="button-icon">✅</span>
                Accept Recommendation
              </button>
            )}
            
            <button 
              className="recalculate-button"
              onClick={() => window.location.reload()}
            >
              <span className="button-icon">🔄</span>
              Recalculate
            </button>
          </div>
        )}
      </div>

      <div className="verdict-timestamp">
        <span className="timestamp-icon">🕒</span>
        <span className="timestamp-text">
          Analysis completed at {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

export default VerdictCard;
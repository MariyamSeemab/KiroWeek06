import React from 'react';
import { StorageOption, StorageMethod } from '../types';
import { CurrencyFormatter } from '../utils/CurrencyFormatter';
import './StorageComparison.css';

interface StorageComparisonProps {
  options: StorageOption[];
  recommendedOption?: StorageOption;
  onOptionSelect?: (option: StorageOption) => void;
  showDetails?: boolean;
  compactView?: boolean;
}

export const StorageComparison: React.FC<StorageComparisonProps> = ({
  options,
  recommendedOption,
  onOptionSelect,
  showDetails = true,
  compactView = false
}) => {
  if (options.length === 0) {
    return (
      <div className="storage-comparison empty">
        <div className="empty-state">
          <span className="empty-icon">📊</span>
          <h3>No Storage Options Available</h3>
          <p>Please check your inputs and try again.</p>
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
        return 'Unknown';
    }
  };

  const getValueRetentionPercentage = (option: StorageOption): number => {
    const grossValue = option.netValue + option.totalCost + option.expectedLosses;
    if (grossValue <= 0) return 0;
    return ((grossValue - option.expectedLosses) / grossValue) * 100;
  };

  const getRiskLevelColor = (riskFactorCount: number): string => {
    if (riskFactorCount === 0) return 'green';
    if (riskFactorCount <= 2) return 'yellow';
    return 'red';
  };

  const getRiskLevelText = (riskFactorCount: number): string => {
    if (riskFactorCount === 0) return 'Low Risk';
    if (riskFactorCount <= 2) return 'Medium Risk';
    return 'High Risk';
  };

  const isRecommended = (option: StorageOption): boolean => {
    return recommendedOption?.method === option.method;
  };

  const getBestValue = (): number => {
    return Math.max(...options.map(opt => opt.netValue));
  };

  const getLowestCost = (): number => {
    return Math.min(...options.map(opt => opt.totalCost));
  };

  const bestValue = getBestValue();
  const lowestCost = getLowestCost();

  return (
    <div className={`storage-comparison ${compactView ? 'compact' : ''}`}>
      <div className="comparison-header">
        <h3 className="comparison-title">Storage Options Comparison</h3>
        <div className="comparison-subtitle">
          Compare costs, risks, and returns for different storage methods
        </div>
      </div>

      <div className="comparison-table">
        <div className="table-header">
          <div className="header-cell method-header">Storage Method</div>
          <div className="header-cell cost-header">Total Cost</div>
          <div className="header-cell losses-header">Expected Losses</div>
          <div className="header-cell value-header">Net Value</div>
          <div className="header-cell retention-header">Value Retention</div>
          <div className="header-cell risk-header">Risk Level</div>
          {showDetails && <div className="header-cell details-header">Details</div>}
        </div>

        {options.map((option) => (
          <div 
            key={option.method}
            className={`table-row ${isRecommended(option) ? 'recommended' : ''} ${onOptionSelect ? 'clickable' : ''}`}
            onClick={() => onOptionSelect?.(option)}
          >
            <div className="cell method-cell">
              <div className="method-info">
                <span className="method-icon">
                  {getMethodIcon(option.method)}
                </span>
                <div className="method-details">
                  <span className="method-name">
                    {getMethodName(option.method)}
                  </span>
                  {isRecommended(option) && (
                    <span className="recommended-badge">Recommended</span>
                  )}
                </div>
              </div>
            </div>

            <div className="cell cost-cell">
              <span className="cost-value">
                {CurrencyFormatter.formatCompact(option.totalCost)}
              </span>
              {option.totalCost === lowestCost && (
                <span className="best-indicator">Lowest</span>
              )}
            </div>

            <div className="cell losses-cell">
              <span className="losses-value">
                {CurrencyFormatter.formatCompact(option.expectedLosses)}
              </span>
              <span className="losses-percentage">
                ({(100 - getValueRetentionPercentage(option)).toFixed(1)}% loss)
              </span>
            </div>

            <div className="cell value-cell">
              <span className={`value-amount ${option.netValue >= 0 ? 'positive' : 'negative'}`}>
                {CurrencyFormatter.formatCompact(option.netValue)}
              </span>
              {option.netValue === bestValue && (
                <span className="best-indicator">Best</span>
              )}
            </div>

            <div className="cell retention-cell">
              <div className="retention-bar">
                <div 
                  className="retention-fill"
                  style={{ width: `${getValueRetentionPercentage(option)}%` }}
                />
                <span className="retention-text">
                  {getValueRetentionPercentage(option).toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="cell risk-cell">
              <span className={`risk-badge ${getRiskLevelColor(option.riskFactors.length)}`}>
                {getRiskLevelText(option.riskFactors.length)}
              </span>
              <span className="risk-count">
                ({option.riskFactors.length} factors)
              </span>
            </div>

            {showDetails && (
              <div className="cell details-cell">
                <button 
                  className="details-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Toggle details view - could be implemented with state
                  }}
                >
                  View Details
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Detailed Risk Factors */}
      {showDetails && (
        <div className="risk-factors-section">
          <h4 className="risk-factors-title">Risk Factors Analysis</h4>
          <div className="risk-factors-grid">
            {options.map((option) => (
              <div key={option.method} className="risk-factors-card">
                <div className="risk-card-header">
                  <span className="method-icon">
                    {getMethodIcon(option.method)}
                  </span>
                  <span className="method-name">
                    {getMethodName(option.method)}
                  </span>
                </div>
                
                {option.riskFactors.length > 0 ? (
                  <ul className="risk-factors-list">
                    {option.riskFactors.map((factor, index) => (
                      <li key={index} className="risk-factor-item">
                        <span className="risk-factor-icon">⚠️</span>
                        <span className="risk-factor-text">{factor}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="no-risks">
                    <span className="no-risks-icon">✅</span>
                    <span className="no-risks-text">No significant risks identified</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Insights */}
      <div className="comparison-insights">
        <h4 className="insights-title">Key Insights</h4>
        <div className="insights-grid">
          <div className="insight-item">
            <span className="insight-icon">💰</span>
            <div className="insight-content">
              <span className="insight-label">Cost Difference</span>
              <span className="insight-value">
                {CurrencyFormatter.formatCompact(
                  Math.max(...options.map(o => o.totalCost)) - 
                  Math.min(...options.map(o => o.totalCost))
                )}
              </span>
            </div>
          </div>
          
          <div className="insight-item">
            <span className="insight-icon">📈</span>
            <div className="insight-content">
              <span className="insight-label">Value Difference</span>
              <span className="insight-value">
                {CurrencyFormatter.formatCompact(
                  Math.max(...options.map(o => o.netValue)) - 
                  Math.min(...options.map(o => o.netValue))
                )}
              </span>
            </div>
          </div>
          
          <div className="insight-item">
            <span className="insight-icon">⚖️</span>
            <div className="insight-content">
              <span className="insight-label">Risk Spread</span>
              <span className="insight-value">
                {Math.min(...options.map(o => o.riskFactors.length))} - {Math.max(...options.map(o => o.riskFactors.length))} factors
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {onOptionSelect && (
        <div className="comparison-actions">
          <div className="actions-note">
            💡 Click on any storage option above to select it for detailed analysis
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageComparison;
import React, { useState, useEffect, useCallback } from 'react';
import { CurrencyFormatter } from '../utils/CurrencyFormatter';
import './VolumeInput.css';

interface VolumeInputProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  marketPrice?: number;
  disabled?: boolean;
  showValueCalculation?: boolean;
  minVolume?: number;
  maxVolume?: number;
  unit?: string;
}

interface ValidationError {
  type: 'required' | 'min' | 'max' | 'invalid';
  message: string;
}

export const VolumeInput: React.FC<VolumeInputProps> = ({
  volume,
  onVolumeChange,
  marketPrice = 0,
  disabled = false,
  showValueCalculation = true,
  minVolume = 0.1,
  maxVolume = 10000,
  unit = 'quintals'
}) => {
  const [inputValue, setInputValue] = useState(volume.toString());
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Sync with external volume changes
  useEffect(() => {
    if (!isFocused) {
      setInputValue(volume.toString());
    }
  }, [volume, isFocused]);

  // Validation function
  const validateVolume = useCallback((value: string): ValidationError | null => {
    if (!value || value.trim() === '') {
      return {
        type: 'required',
        message: 'Volume is required'
      };
    }

    const numValue = parseFloat(value);
    
    if (isNaN(numValue)) {
      return {
        type: 'invalid',
        message: 'Please enter a valid number'
      };
    }

    if (numValue < minVolume) {
      return {
        type: 'min',
        message: `Volume must be at least ${minVolume} ${unit}`
      };
    }

    if (numValue > maxVolume) {
      return {
        type: 'max',
        message: `Volume cannot exceed ${maxVolume} ${unit}`
      };
    }

    return null;
  }, [minVolume, maxVolume, unit]);

  // Handle input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);

    // Validate input
    const error = validateVolume(value);
    setValidationError(error);
    setIsValid(!error);

    // Update parent if valid
    if (!error) {
      const numValue = parseFloat(value);
      onVolumeChange(numValue);
    }
  };

  // Handle focus events
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    
    // Format the input value on blur if valid
    if (isValid && inputValue) {
      const numValue = parseFloat(inputValue);
      const formattedValue = numValue.toString();
      setInputValue(formattedValue);
    }
  };

  // Calculate total value
  const totalValue = volume * marketPrice;

  // Get volume category
  const getVolumeCategory = (vol: number): { category: string; color: string; description: string } => {
    if (vol < 10) {
      return {
        category: 'Small',
        color: 'blue',
        description: 'Individual farmer scale'
      };
    } else if (vol < 100) {
      return {
        category: 'Medium',
        color: 'green',
        description: 'Small group/cooperative'
      };
    } else {
      return {
        category: 'Large',
        color: 'purple',
        description: 'Commercial scale'
      };
    }
  };

  const volumeInfo = getVolumeCategory(volume);

  // Quick select buttons
  const quickSelectValues = [1, 5, 10, 25, 50, 100];

  const handleQuickSelect = (value: number) => {
    setInputValue(value.toString());
    setValidationError(null);
    setIsValid(true);
    onVolumeChange(value);
  };

  return (
    <div className={`volume-input ${disabled ? 'disabled' : ''}`}>
      <div className="volume-input-header">
        <label className="volume-input-label">
          Crop Volume
        </label>
        {showValueCalculation && marketPrice > 0 && (
          <div className="volume-value">
            <span className="value-label">Total Value:</span>
            <span className="value-amount">
              {CurrencyFormatter.formatCompact(totalValue)}
            </span>
          </div>
        )}
      </div>

      <div className={`input-container ${!isValid ? 'error' : ''} ${isFocused ? 'focused' : ''}`}>
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder="Enter volume"
          min={minVolume}
          max={maxVolume}
          step="0.1"
          className="volume-input-field"
        />
        <span className="input-unit">{unit}</span>
      </div>

      {validationError && (
        <div className="validation-error">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{validationError.message}</span>
        </div>
      )}

      {isValid && volume > 0 && (
        <div className="volume-feedback">
          <div className="volume-category">
            <span className={`category-badge ${volumeInfo.color}`}>
              {volumeInfo.category} Scale
            </span>
            <span className="category-description">
              {volumeInfo.description}
            </span>
          </div>
        </div>
      )}

      <div className="quick-select">
        <span className="quick-select-label">Quick Select:</span>
        <div className="quick-select-buttons">
          {quickSelectValues.map((value) => (
            <button
              key={value}
              onClick={() => handleQuickSelect(value)}
              disabled={disabled}
              className={`quick-select-button ${volume === value ? 'active' : ''}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      {showValueCalculation && marketPrice > 0 && volume > 0 && (
        <div className="value-breakdown">
          <h4 className="breakdown-title">Value Calculation</h4>
          <div className="breakdown-item">
            <span className="breakdown-label">Volume:</span>
            <span className="breakdown-value">{volume} {unit}</span>
          </div>
          <div className="breakdown-item">
            <span className="breakdown-label">Market Price:</span>
            <span className="breakdown-value">
              {CurrencyFormatter.formatPrecise(marketPrice)}/{unit.slice(0, -1)}
            </span>
          </div>
          <div className="breakdown-item total">
            <span className="breakdown-label">Total Value:</span>
            <span className="breakdown-value">
              {CurrencyFormatter.formatPrecise(totalValue)}
            </span>
          </div>
          <div className="breakdown-formula">
            <small>
              {volume} × {CurrencyFormatter.formatPrecise(marketPrice)} = {CurrencyFormatter.formatPrecise(totalValue)}
            </small>
          </div>
        </div>
      )}

      <div className="volume-impact">
        <h4 className="impact-title">Volume Impact</h4>
        <div className="impact-grid">
          <div className="impact-item">
            <span className="impact-icon">📦</span>
            <div className="impact-content">
              <span className="impact-label">Storage Need</span>
              <span className="impact-value">
                {volume < 10 ? 'Small' : volume < 100 ? 'Medium' : 'Large'}
              </span>
            </div>
          </div>
          <div className="impact-item">
            <span className="impact-icon">🚛</span>
            <div className="impact-content">
              <span className="impact-label">Transport</span>
              <span className="impact-value">
                {volume < 10 ? '1 Trip' : volume < 50 ? '2-3 Trips' : 'Multiple Trips'}
              </span>
            </div>
          </div>
          <div className="impact-item">
            <span className="impact-icon">💰</span>
            <div className="impact-content">
              <span className="impact-label">Cost Efficiency</span>
              <span className="impact-value">
                {volume < 10 ? 'Low' : volume < 100 ? 'Good' : 'High'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {volume > 1000 && (
        <div className="volume-warning">
          <span className="warning-icon">💡</span>
          <span className="warning-text">
            Large volume may require specialized storage facilities and handling equipment.
          </span>
        </div>
      )}

      <div className="volume-tips">
        <h5 className="tips-title">💡 Tips</h5>
        <ul className="tips-list">
          <li>Accurate volume measurement ensures better cost calculations</li>
          <li>Consider seasonal variations in your crop yield</li>
          <li>Larger volumes often get better storage rates</li>
          {volume < 5 && (
            <li>Small volumes might benefit from cooperative storage</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default VolumeInput;
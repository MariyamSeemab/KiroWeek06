import React, { useState, useEffect } from 'react';
import { CropType } from '../types';
import { getAllCrops } from '../models/Crop';
import './CropSelector.css';

interface CropSelectorProps {
  selectedCrop: CropType | null;
  onCropSelect: (crop: CropType) => void;
  disabled?: boolean;
  showDetails?: boolean;
}

export const CropSelector: React.FC<CropSelectorProps> = ({
  selectedCrop,
  onCropSelect,
  disabled = false,
  showDetails = true
}) => {
  const [crops] = useState<CropType[]>(getAllCrops());
  const [isOpen, setIsOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.crop-selector')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCropSelect = (crop: CropType) => {
    onCropSelect(crop);
    setIsOpen(false);
  };

  const getPerishabilityLabel = (score: number): string => {
    if (score <= 3) return 'Low';
    if (score <= 6) return 'Medium';
    return 'High';
  };

  const getPerishabilityColor = (score: number): string => {
    if (score <= 3) return 'green';
    if (score <= 6) return 'orange';
    return 'red';
  };

  return (
    <div className={`crop-selector ${disabled ? 'disabled' : ''}`}>
      <label className="crop-selector-label">
        Select Crop Type
      </label>
      
      <div 
        className={`crop-selector-button ${isOpen ? 'open' : ''} ${selectedCrop ? 'selected' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            !disabled && setIsOpen(!isOpen);
          }
        }}
      >
        {selectedCrop ? (
          <div className="selected-crop">
            <span className="crop-icon" role="img" aria-label={selectedCrop.name}>
              {selectedCrop.icon}
            </span>
            <span className="crop-name">{selectedCrop.name}</span>
            {showDetails && (
              <span className="crop-price">
                ₹{selectedCrop.averageMarketPrice}/quintal
              </span>
            )}
          </div>
        ) : (
          <div className="placeholder">
            <span className="placeholder-icon">🌾</span>
            <span className="placeholder-text">Choose your crop</span>
          </div>
        )}
        
        <span className={`dropdown-arrow ${isOpen ? 'up' : 'down'}`}>
          {isOpen ? '▲' : '▼'}
        </span>
      </div>

      {isOpen && (
        <div className="crop-dropdown">
          <div className="crop-list">
            {crops.map((crop) => (
              <div
                key={crop.id}
                className={`crop-option ${selectedCrop?.id === crop.id ? 'selected' : ''}`}
                onClick={() => handleCropSelect(crop)}
                role="option"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCropSelect(crop);
                  }
                }}
              >
                <div className="crop-option-main">
                  <span className="crop-icon" role="img" aria-label={crop.name}>
                    {crop.icon}
                  </span>
                  <div className="crop-info">
                    <span className="crop-name">{crop.name}</span>
                    <span className="crop-category">{crop.marketCategory}</span>
                  </div>
                  <span className="crop-price">
                    ₹{crop.averageMarketPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                
                {showDetails && (
                  <div className="crop-details">
                    <div className="detail-item">
                      <span className="detail-label">Perishability:</span>
                      <span 
                        className={`perishability-badge ${getPerishabilityColor(crop.perishabilityScore)}`}
                      >
                        {getPerishabilityLabel(crop.perishabilityScore)} ({crop.perishabilityScore}/10)
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Optimal Storage:</span>
                      <span className="storage-conditions">
                        {crop.optimalStorageTemp}°C, {crop.optimalHumidity}% humidity
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="crop-dropdown-footer">
            <small className="help-text">
              💡 Perishability affects storage risk and costs
            </small>
          </div>
        </div>
      )}

      {selectedCrop && showDetails && (
        <div className="crop-summary">
          <div className="summary-item">
            <span className="summary-label">Selected:</span>
            <span className="summary-value">
              {selectedCrop.icon} {selectedCrop.name}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Market Price:</span>
            <span className="summary-value">
              ₹{selectedCrop.averageMarketPrice.toLocaleString('en-IN')}/quintal
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Storage Risk:</span>
            <span className={`summary-value ${getPerishabilityColor(selectedCrop.perishabilityScore)}`}>
              {getPerishabilityLabel(selectedCrop.perishabilityScore)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CropSelector;
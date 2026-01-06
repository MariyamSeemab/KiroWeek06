import React, { useState, useEffect, useCallback } from 'react';
import { CurrencyFormatter } from '../utils/CurrencyFormatter';
import './DistanceSlider.css';

interface DistanceSliderProps {
  distance: number;
  onDistanceChange: (distance: number) => void;
  cropVolume?: number;
  disabled?: boolean;
  showLogisticsCost?: boolean;
  minDistance?: number;
  maxDistance?: number;
}

export const DistanceSlider: React.FC<DistanceSliderProps> = ({
  distance,
  onDistanceChange,
  cropVolume = 0,
  disabled = false,
  showLogisticsCost = true,
  minDistance = 1,
  maxDistance = 500
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [localDistance, setLocalDistance] = useState(distance);

  // Sync with external distance changes
  useEffect(() => {
    setLocalDistance(distance);
  }, [distance]);

  // Calculate logistics cost in real-time
  const calculateLogisticsCost = useCallback((dist: number, volume: number): number => {
    const costPerQuintalPerKm = 2; // INR per quintal per km
    return dist * volume * costPerQuintalPerKm;
  }, []);

  const logisticsCost = calculateLogisticsCost(localDistance, cropVolume);

  // Get distance category and color
  const getDistanceCategory = (dist: number): { category: string; color: string; description: string } => {
    if (dist <= 50) {
      return {
        category: 'Near',
        color: 'green',
        description: 'Low transportation costs'
      };
    } else if (dist <= 150) {
      return {
        category: 'Medium',
        color: 'orange',
        description: 'Moderate transportation costs'
      };
    } else {
      return {
        category: 'Far',
        color: 'red',
        description: 'High transportation costs'
      };
    }
  };

  const distanceInfo = getDistanceCategory(localDistance);

  // Handle slider change
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDistance = parseInt(event.target.value);
    setLocalDistance(newDistance);
    onDistanceChange(newDistance);
  };

  // Handle input field change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    const numValue = parseInt(value) || 0;
    
    if (numValue >= minDistance && numValue <= maxDistance) {
      setLocalDistance(numValue);
      onDistanceChange(numValue);
    }
  };

  // Handle mouse events for visual feedback
  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  // Calculate slider percentage for styling
  const sliderPercentage = ((localDistance - minDistance) / (maxDistance - minDistance)) * 100;

  return (
    <div className={`distance-slider ${disabled ? 'disabled' : ''}`}>
      <div className="distance-slider-header">
        <label className="distance-slider-label">
          Distance from Market Hub
        </label>
        <div className="distance-input-group">
          <input
            type="number"
            value={localDistance}
            onChange={handleInputChange}
            min={minDistance}
            max={maxDistance}
            disabled={disabled}
            className="distance-input"
          />
          <span className="distance-unit">km</span>
        </div>
      </div>

      <div className="slider-container">
        <div className="slider-track">
          <div 
            className="slider-progress"
            style={{ width: `${sliderPercentage}%` }}
          />
          <input
            type="range"
            min={minDistance}
            max={maxDistance}
            value={localDistance}
            onChange={handleSliderChange}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            disabled={disabled}
            className={`slider ${isDragging ? 'dragging' : ''}`}
          />
        </div>
        
        <div className="slider-labels">
          <span className="slider-label-min">{minDistance}km</span>
          <span className="slider-label-max">{maxDistance}km</span>
        </div>
      </div>

      <div className="distance-feedback">
        <div className="distance-category">
          <span className={`category-badge ${distanceInfo.color}`}>
            {distanceInfo.category}
          </span>
          <span className="category-description">
            {distanceInfo.description}
          </span>
        </div>

        {showLogisticsCost && cropVolume > 0 && (
          <div className="logistics-cost">
            <div className="cost-item">
              <span className="cost-label">Transportation Cost:</span>
              <span className={`cost-value ${distanceInfo.color}`}>
                {CurrencyFormatter.formatCompact(logisticsCost)}
              </span>
            </div>
            <div className="cost-breakdown">
              <small className="cost-formula">
                {localDistance}km × {cropVolume}Q × ₹2/km = {CurrencyFormatter.formatPrecise(logisticsCost)}
              </small>
            </div>
          </div>
        )}
      </div>

      <div className="distance-markers">
        <div className="marker-group">
          <div className="marker near">
            <div className="marker-dot"></div>
            <span className="marker-label">Local Market</span>
            <span className="marker-distance">0-50km</span>
          </div>
          <div className="marker medium">
            <div className="marker-dot"></div>
            <span className="marker-label">Regional Hub</span>
            <span className="marker-distance">50-150km</span>
          </div>
          <div className="marker far">
            <div className="marker-dot"></div>
            <span className="marker-label">Major City</span>
            <span className="marker-distance">150km+</span>
          </div>
        </div>
      </div>

      {localDistance > 200 && (
        <div className="distance-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">
            Long distance may significantly increase storage costs. Consider local storage options.
          </span>
        </div>
      )}

      <div className="distance-impact">
        <h4 className="impact-title">Distance Impact</h4>
        <div className="impact-grid">
          <div className="impact-item">
            <span className="impact-icon">🚛</span>
            <div className="impact-content">
              <span className="impact-label">Transportation</span>
              <span className={`impact-value ${distanceInfo.color}`}>
                {localDistance <= 50 ? 'Low Cost' : localDistance <= 150 ? 'Medium Cost' : 'High Cost'}
              </span>
            </div>
          </div>
          <div className="impact-item">
            <span className="impact-icon">⏱️</span>
            <div className="impact-content">
              <span className="impact-label">Transit Time</span>
              <span className="impact-value">
                {localDistance <= 50 ? '< 2 hours' : localDistance <= 150 ? '2-5 hours' : '5+ hours'}
              </span>
            </div>
          </div>
          <div className="impact-item">
            <span className="impact-icon">🏪</span>
            <div className="impact-content">
              <span className="impact-label">Storage Options</span>
              <span className="impact-value">
                {localDistance <= 50 ? 'Many' : localDistance <= 150 ? 'Limited' : 'Few'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistanceSlider;
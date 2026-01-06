import React, { useEffect, useRef, useState } from 'react';
import { RiskLevel } from '../types';
import './GaugeChart.css';

interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  title: string;
  riskLevel: RiskLevel;
  thresholds?: {
    green: { min: number; max: number };
    yellow: { min: number; max: number };
    red: { min: number; max: number };
  };
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
  showThresholds?: boolean;
  animated?: boolean;
  lastUpdated?: Date;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min,
  max,
  unit,
  title,
  riskLevel,
  thresholds,
  size = 'medium',
  showValue = true,
  showThresholds = true,
  animated = true,
  lastUpdated
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animatedValue, setAnimatedValue] = useState(animated ? min : value);

  // Animation effect
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const startValue = animatedValue;
    const endValue = value;
    const duration = 1000; // 1 second
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (endValue - startValue) * easeOut;
      
      setAnimatedValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, animated]);

  // Draw gauge
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw gauge background
    drawGaugeBackground(ctx, centerX, centerY, radius);
    
    // Draw threshold zones if provided
    if (thresholds && showThresholds) {
      drawThresholdZones(ctx, centerX, centerY, radius, thresholds, min, max);
    }
    
    // Draw gauge arc
    drawGaugeArc(ctx, centerX, centerY, radius, animatedValue, min, max, riskLevel);
    
    // Draw needle
    drawNeedle(ctx, centerX, centerY, radius, animatedValue, min, max);
    
    // Draw center circle
    drawCenterCircle(ctx, centerX, centerY);

  }, [animatedValue, min, max, riskLevel, thresholds, showThresholds]);

  const drawGaugeBackground = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number
  ) => {
    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 20;
    ctx.stroke();
  };

  const drawThresholdZones = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    thresholds: NonNullable<GaugeChartProps['thresholds']>,
    min: number,
    max: number
  ) => {
    const range = max - min;
    const startAngle = Math.PI;
    const totalAngle = Math.PI;

    // Green zone
    const greenStart = startAngle + ((thresholds.green.min - min) / range) * totalAngle;
    const greenEnd = startAngle + ((thresholds.green.max - min) / range) * totalAngle;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, greenStart, greenEnd);
    ctx.strokeStyle = '#48bb78';
    ctx.lineWidth = 20;
    ctx.stroke();

    // Yellow zone
    const yellowStart = startAngle + ((thresholds.yellow.min - min) / range) * totalAngle;
    const yellowEnd = startAngle + ((thresholds.yellow.max - min) / range) * totalAngle;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, yellowStart, yellowEnd);
    ctx.strokeStyle = '#ed8936';
    ctx.lineWidth = 20;
    ctx.stroke();

    // Red zone
    const redStart = startAngle + ((thresholds.red.min - min) / range) * totalAngle;
    const redEnd = startAngle + ((thresholds.red.max - min) / range) * totalAngle;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, redStart, redEnd);
    ctx.strokeStyle = '#f56565';
    ctx.lineWidth = 20;
    ctx.stroke();
  };

  const drawGaugeArc = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    value: number,
    min: number,
    max: number,
    riskLevel: RiskLevel
  ) => {
    const range = max - min;
    const normalizedValue = Math.max(0, Math.min(1, (value - min) / range));
    const startAngle = Math.PI;
    const endAngle = startAngle + normalizedValue * Math.PI;

    const colors = {
      [RiskLevel.GREEN]: '#48bb78',
      [RiskLevel.YELLOW]: '#ed8936',
      [RiskLevel.RED]: '#f56565'
    };

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.strokeStyle = colors[riskLevel];
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const drawNeedle = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    radius: number,
    value: number,
    min: number,
    max: number
  ) => {
    const range = max - min;
    const normalizedValue = Math.max(0, Math.min(1, (value - min) / range));
    const angle = Math.PI + normalizedValue * Math.PI;
    
    const needleLength = radius - 30;
    const needleX = centerX + Math.cos(angle) * needleLength;
    const needleY = centerY + Math.sin(angle) * needleLength;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = '#2d3748';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
  };

  const drawCenterCircle = (
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number
  ) => {
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#2d3748';
    ctx.fill();
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'gauge-small';
      case 'large': return 'gauge-large';
      default: return 'gauge-medium';
    }
  };

  const getRiskLevelColor = () => {
    switch (riskLevel) {
      case RiskLevel.GREEN: return '#48bb78';
      case RiskLevel.YELLOW: return '#ed8936';
      case RiskLevel.RED: return '#f56565';
      default: return '#718096';
    }
  };

  const getRiskLevelText = () => {
    switch (riskLevel) {
      case RiskLevel.GREEN: return 'Safe';
      case RiskLevel.YELLOW: return 'Warning';
      case RiskLevel.RED: return 'Critical';
      default: return 'Unknown';
    }
  };

  const formatValue = (val: number): string => {
    return val % 1 === 0 ? val.toString() : val.toFixed(1);
  };

  const getDataAge = (): string => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <div className={`gauge-chart ${getSizeClass()}`}>
      <div className="gauge-header">
        <h3 className="gauge-title">{title}</h3>
        <div className="gauge-status">
          <span 
            className="status-indicator"
            style={{ backgroundColor: getRiskLevelColor() }}
          />
          <span className="status-text">{getRiskLevelText()}</span>
        </div>
      </div>

      <div className="gauge-container">
        <canvas
          ref={canvasRef}
          width={200}
          height={120}
          className="gauge-canvas"
        />
        
        {showValue && (
          <div className="gauge-value">
            <span className="value-number">{formatValue(animatedValue)}</span>
            <span className="value-unit">{unit}</span>
          </div>
        )}
      </div>

      <div className="gauge-footer">
        <div className="gauge-range">
          <span className="range-min">{min}{unit}</span>
          <span className="range-max">{max}{unit}</span>
        </div>
        
        {lastUpdated && (
          <div className="gauge-timestamp">
            <span className="timestamp-icon">🕒</span>
            <span className="timestamp-text">{getDataAge()}</span>
          </div>
        )}
      </div>

      {showThresholds && thresholds && (
        <div className="gauge-legend">
          <div className="legend-item">
            <span className="legend-color green"></span>
            <span className="legend-text">
              Safe ({thresholds.green.min}-{thresholds.green.max}{unit})
            </span>
          </div>
          <div className="legend-item">
            <span className="legend-color yellow"></span>
            <span className="legend-text">
              Warning ({thresholds.yellow.min}-{thresholds.yellow.max}{unit})
            </span>
          </div>
          <div className="legend-item">
            <span className="legend-color red"></span>
            <span className="legend-text">
              Critical ({thresholds.red.min}-{thresholds.red.max}{unit})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaugeChart;
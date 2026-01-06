import React, { useState, useEffect } from 'react';
import { EnvironmentalData, RiskLevel } from '../types';
import GaugeChart from './GaugeChart';
import './EnvironmentalMonitor.css';

interface EnvironmentalMonitorProps {
  environmentalData: EnvironmentalData[];
  isConnected: boolean;
  onConnectionRetry?: () => void;
  showWarnings?: boolean;
  compactView?: boolean;
}

interface WarningMessage {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  sensorId?: string;
  autoHide?: boolean;
}

export const EnvironmentalMonitor: React.FC<EnvironmentalMonitorProps> = ({
  environmentalData,
  isConnected,
  onConnectionRetry,
  showWarnings = true,
  compactView = false
}) => {
  const [warnings, setWarnings] = useState<WarningMessage[]>([]);
  const [backgroundRiskLevel, setBackgroundRiskLevel] = useState<RiskLevel>(RiskLevel.GREEN);
  const [isBlinking, setIsBlinking] = useState(false);

  // Temperature and humidity thresholds
  const temperatureThresholds = {
    green: { min: 15, max: 25 },
    yellow: { min: 10, max: 35 },
    red: { min: 0, max: 45 }
  };

  const humidityThresholds = {
    green: { min: 40, max: 60 },
    yellow: { min: 20, max: 80 },
    red: { min: 0, max: 100 }
  };

  // Monitor environmental data for warnings
  useEffect(() => {
    if (!environmentalData.length) return;

    const newWarnings: WarningMessage[] = [];
    let highestRiskLevel = RiskLevel.GREEN;

    environmentalData.forEach((data) => {
      // Check for critical conditions
      if (data.riskLevel === RiskLevel.RED) {
        highestRiskLevel = RiskLevel.RED;
        
        if (data.temperature > 35) {
          newWarnings.push({
            id: `temp-critical-${data.sensorId}`,
            type: 'critical',
            title: 'Critical Temperature',
            message: `Temperature ${data.temperature}°C exceeds safe storage limits. Immediate action required!`,
            timestamp: new Date(),
            sensorId: data.sensorId
          });
        }

        if (data.humidity > 80) {
          newWarnings.push({
            id: `humidity-critical-${data.sensorId}`,
            type: 'critical',
            title: 'Critical Humidity',
            message: `Humidity ${data.humidity}% creates high spoilage risk. Consider cold storage immediately!`,
            timestamp: new Date(),
            sensorId: data.sensorId
          });
        }
      } else if (data.riskLevel === RiskLevel.YELLOW && highestRiskLevel !== RiskLevel.RED) {
        highestRiskLevel = RiskLevel.YELLOW;
        
        if (data.temperature > 30 || data.temperature < 10) {
          newWarnings.push({
            id: `temp-warning-${data.sensorId}`,
            type: 'warning',
            title: 'Temperature Warning',
            message: `Temperature ${data.temperature}°C is outside optimal range. Monitor closely.`,
            timestamp: new Date(),
            sensorId: data.sensorId,
            autoHide: true
          });
        }

        if (data.humidity > 70 || data.humidity < 30) {
          newWarnings.push({
            id: `humidity-warning-${data.sensorId}`,
            type: 'warning',
            title: 'Humidity Warning',
            message: `Humidity ${data.humidity}% may affect storage quality. Consider adjustments.`,
            timestamp: new Date(),
            sensorId: data.sensorId,
            autoHide: true
          });
        }
      }
    });

    // Check for stale data
    const now = new Date();
    environmentalData.forEach((data) => {
      const dataAge = now.getTime() - data.timestamp.getTime();
      if (dataAge > 30 * 60 * 1000) { // 30 minutes
        newWarnings.push({
          id: `stale-data-${data.sensorId}`,
          type: 'warning',
          title: 'Stale Sensor Data',
          message: `Sensor ${data.sensorId} data is ${Math.floor(dataAge / (60 * 1000))} minutes old.`,
          timestamp: new Date(),
          sensorId: data.sensorId
        });
      }
    });

    setWarnings(newWarnings);
    setBackgroundRiskLevel(highestRiskLevel);

    // Trigger blinking for critical warnings
    if (highestRiskLevel.toString() === RiskLevel.RED.toString()) {
      setIsBlinking(true);
      const timer = setTimeout(() => setIsBlinking(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [environmentalData]);

  // Auto-hide warnings
  useEffect(() => {
    const timer = setTimeout(() => {
      setWarnings(prev => prev.filter(warning => !warning.autoHide));
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [warnings]);

  const dismissWarning = (warningId: string) => {
    setWarnings(prev => prev.filter(warning => warning.id !== warningId));
  };

  const getLatestData = (): EnvironmentalData | null => {
    if (!environmentalData.length) return null;
    return environmentalData.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  };

  const getAverageData = (): { temperature: number; humidity: number } | null => {
    if (!environmentalData.length) return null;
    
    const sum = environmentalData.reduce(
      (acc, data) => ({
        temperature: acc.temperature + data.temperature,
        humidity: acc.humidity + data.humidity
      }),
      { temperature: 0, humidity: 0 }
    );

    return {
      temperature: sum.temperature / environmentalData.length,
      humidity: sum.humidity / environmentalData.length
    };
  };

  const latestData = getLatestData();
  const averageData = getAverageData();

  const getConnectionStatusColor = (): string => {
    if (!isConnected) return '#e53e3e';
    if (environmentalData.length === 0) return '#ed8936';
    return '#48bb78';
  };

  const getConnectionStatusText = (): string => {
    if (!isConnected) return 'Disconnected';
    if (environmentalData.length === 0) return 'No Data';
    return 'Connected';
  };

  return (
    <div className={`environmental-monitor ${compactView ? 'compact' : ''}`}>
      <div 
        className={`monitor-background ${backgroundRiskLevel.toLowerCase()} ${isBlinking ? 'blinking' : ''}`}
      >
        <div className="monitor-header">
          <div className="header-left">
            <h2 className="monitor-title">Environmental Conditions</h2>
            <div className="connection-status">
              <span 
                className="status-dot"
                style={{ backgroundColor: getConnectionStatusColor() }}
              />
              <span className="status-text">{getConnectionStatusText()}</span>
              {!isConnected && onConnectionRetry && (
                <button 
                  className="retry-button"
                  onClick={onConnectionRetry}
                >
                  Retry
                </button>
              )}
            </div>
          </div>
          
          <div className="sensor-count">
            <span className="count-number">{environmentalData.length}</span>
            <span className="count-label">Sensors</span>
          </div>
        </div>

        {/* Warning Messages */}
        {showWarnings && warnings.length > 0 && (
          <div className="warnings-container">
            {warnings.map((warning) => (
              <div 
                key={warning.id}
                className={`warning-message ${warning.type}`}
              >
                <div className="warning-content">
                  <div className="warning-header">
                    <span className="warning-icon">
                      {warning.type === 'critical' ? '🚨' : warning.type === 'warning' ? '⚠️' : 'ℹ️'}
                    </span>
                    <span className="warning-title">{warning.title}</span>
                    <button 
                      className="warning-dismiss"
                      onClick={() => dismissWarning(warning.id)}
                    >
                      ×
                    </button>
                  </div>
                  <p className="warning-text">{warning.message}</p>
                  {warning.sensorId && (
                    <small className="warning-sensor">Sensor: {warning.sensorId}</small>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Gauge Charts */}
        <div className={`gauges-container ${compactView ? 'compact' : ''}`}>
          {latestData ? (
            <>
              <GaugeChart
                value={latestData.temperature}
                min={0}
                max={50}
                unit="°C"
                title="Temperature"
                riskLevel={latestData.riskLevel}
                thresholds={temperatureThresholds}
                size={compactView ? 'small' : 'medium'}
                lastUpdated={latestData.timestamp}
                animated={true}
              />
              
              <GaugeChart
                value={latestData.humidity}
                min={0}
                max={100}
                unit="%"
                title="Humidity"
                riskLevel={latestData.riskLevel}
                thresholds={humidityThresholds}
                size={compactView ? 'small' : 'medium'}
                lastUpdated={latestData.timestamp}
                animated={true}
              />
            </>
          ) : (
            <div className="no-data-message">
              <span className="no-data-icon">📡</span>
              <h3>No Sensor Data</h3>
              <p>
                {!isConnected 
                  ? 'Connection to sensors lost. Check your network connection.'
                  : 'Waiting for sensor data...'
                }
              </p>
              {!isConnected && onConnectionRetry && (
                <button className="retry-button-large" onClick={onConnectionRetry}>
                  Reconnect Sensors
                </button>
              )}
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        {environmentalData.length > 1 && averageData && (
          <div className="summary-stats">
            <h4 className="stats-title">Multi-Sensor Summary</h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Avg Temperature</span>
                <span className="stat-value">
                  {averageData.temperature.toFixed(1)}°C
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Avg Humidity</span>
                <span className="stat-value">
                  {averageData.humidity.toFixed(1)}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Active Sensors</span>
                <span className="stat-value">
                  {environmentalData.length}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Risk Level</span>
                <span className={`stat-value risk-${backgroundRiskLevel.toLowerCase()}`}>
                  {backgroundRiskLevel}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isConnected && environmentalData.length === 0 && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading sensor data...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnvironmentalMonitor;
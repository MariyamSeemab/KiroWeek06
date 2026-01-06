import React, { useState, useEffect } from 'react';
import { WeatherService, WeatherData } from '../services/WeatherService';
import './WeatherWidget.css';

interface WeatherWidgetProps {
  location?: string;
  onWeatherChange?: (weatherData: WeatherData) => void;
  compact?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  location = 'Delhi',
  onWeatherChange,
  compact = false
}) => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherService] = useState(() => new WeatherService());

  useEffect(() => {
    loadWeatherData();
    
    // Refresh weather data every 30 minutes
    const interval = setInterval(loadWeatherData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [location]);

  const loadWeatherData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await weatherService.getWeatherData(location);
      setWeatherData(data);
      onWeatherChange?.(data);
    } catch (err) {
      setError('Failed to load weather data');
      console.error('Weather loading error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherImpact = () => {
    if (!weatherData) return null;
    return weatherService.getWeatherImpactSummary(weatherData);
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleDateString('en-IN', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className={`weather-widget ${compact ? 'compact' : ''} loading`}>
        <div className="weather-loading">
          <div className="loading-spinner"></div>
          <span>Loading weather...</span>
        </div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className={`weather-widget ${compact ? 'compact' : ''} error`}>
        <div className="weather-error">
          <span className="error-icon">⚠️</span>
          <span>Weather unavailable</span>
          <button onClick={loadWeatherData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const impact = getWeatherImpact();
  const forecast5Day = weatherData.forecast.slice(0, 5);
  const weatherPenalty = weatherService.calculateWeatherPenalty(forecast5Day);

  return (
    <div className={`weather-widget ${compact ? 'compact' : ''}`}>
      <div className="weather-header">
        <div className="weather-title">
          <span className="weather-icon">🌦️</span>
          <span className="title-text">Weather Forecast</span>
          <span className="location-text">{weatherData.location}</span>
        </div>
        <div className="last-updated">
          Updated: {weatherData.lastUpdated.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </div>
      </div>

      {/* Current Weather */}
      <div className="current-weather">
        <div className="current-main">
          <span className="current-icon">{weatherData.current.icon}</span>
          <div className="current-details">
            <div className="current-temp">{weatherData.current.temperature}°C</div>
            <div className="current-condition">
              {weatherData.current.condition.charAt(0).toUpperCase() + 
               weatherData.current.condition.slice(1)}
            </div>
          </div>
        </div>
        <div className="current-metrics">
          <div className="metric">
            <span className="metric-label">Humidity</span>
            <span className="metric-value">{weatherData.current.humidity}%</span>
          </div>
          <div className="metric">
            <span className="metric-label">UV Index</span>
            <span className="metric-value">{weatherData.current.uvIndex.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Weather Impact on Solar Drying */}
      {impact && (
        <div className={`weather-impact ${weatherPenalty.riskLevel}`}>
          <div className="impact-header">
            <span className="impact-icon">{impact.icon}</span>
            <span className="impact-title">{impact.recommendation}</span>
          </div>
          <div className="impact-details">{impact.details}</div>
          
          {weatherPenalty.penalty > 0 && (
            <div className="penalty-info">
              <span className="penalty-label">Solar Drying Penalty:</span>
              <span className="penalty-value">
                -{Math.round(weatherPenalty.penalty * 100)}%
              </span>
            </div>
          )}
        </div>
      )}

      {/* 5-Day Forecast */}
      {!compact && (
        <div className="forecast-section">
          <h4 className="forecast-title">5-Day Forecast</h4>
          <div className="forecast-grid">
            {forecast5Day.map((day, index) => (
              <div key={index} className="forecast-day">
                <div className="forecast-date">
                  {index === 0 ? 'Today' : formatTime(day.date)}
                </div>
                <div className="forecast-icon">{day.condition.icon}</div>
                <div className="forecast-temp">{day.condition.temperature}°C</div>
                <div className="forecast-condition">
                  {day.condition.condition.charAt(0).toUpperCase() + 
                   day.condition.condition.slice(1)}
                </div>
                <div className="solar-viability">
                  <div className="viability-bar">
                    <div 
                      className="viability-fill"
                      style={{ width: `${day.solarDryingViability * 100}%` }}
                    />
                  </div>
                  <span className="viability-text">
                    {Math.round(day.solarDryingViability * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather Reasoning */}
      {weatherPenalty.reasoning.length > 0 && !compact && (
        <div className="weather-reasoning">
          <h4 className="reasoning-title">Weather Analysis</h4>
          <ul className="reasoning-list">
            {weatherPenalty.reasoning.slice(0, 3).map((reason, index) => (
              <li key={index} className="reasoning-item">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Refresh Button */}
      <div className="weather-actions">
        <button 
          onClick={loadWeatherData}
          className="refresh-button"
          disabled={isLoading}
        >
          <span className="refresh-icon">🔄</span>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default WeatherWidget;
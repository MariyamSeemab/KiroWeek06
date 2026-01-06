import React, { useState, useEffect, useCallback } from 'react';
import { 
  FarmerInputs, 
  EnvironmentalData, 
  MarketData, 
  EconomicVerdict, 
  CropType,
  UrgencyLevel,
  RiskLevel
} from '../types';
import { DecisionContext } from '../models/DecisionContext';
import { MarketDataService } from '../services/MarketDataService';
import { IoTDataService } from '../services/IoTDataService';
import CropSelector from './CropSelector';
import DistanceSlider from './DistanceSlider';
import VolumeInput from './VolumeInput';
import EnvironmentalMonitor from './EnvironmentalMonitor';
import StorageComparison from './StorageComparison';
import VerdictCard from './VerdictCard';
import './SmartSiloApp.css';

interface AppState {
  // Input data
  selectedCrop: CropType | null;
  distance: number;
  volume: number;
  urgencyLevel: UrgencyLevel;
  
  // Environmental data
  environmentalData: EnvironmentalData[];
  isIoTConnected: boolean;
  
  // Market data
  marketData: MarketData | null;
  
  // Analysis results
  verdict: EconomicVerdict | null;
  isAnalyzing: boolean;
  
  // UI state
  currentStep: 'inputs' | 'analysis' | 'results';
  showComparison: boolean;
  isMobileMenuOpen: boolean;
}

export const SmartSiloApp: React.FC = () => {
  const [state, setState] = useState<AppState>({
    selectedCrop: null,
    distance: 50,
    volume: 10,
    urgencyLevel: UrgencyLevel.MEDIUM,
    environmentalData: [],
    isIoTConnected: false,
    marketData: null,
    verdict: null,
    isAnalyzing: false,
    currentStep: 'inputs',
    showComparison: false,
    isMobileMenuOpen: false
  });

  // Services
  const [marketService] = useState(() => new MarketDataService({
    bucketName: 'smart-silo-data',
    region: 'us-east-1'
  }));

  const [iotService] = useState(() => new IoTDataService({
    url: 'wss://iot-sensors.smart-silo.com/ws'
  }));

  // Initialize services and demo data
  useEffect(() => {
    initializeServices();
    loadDemoData();
  }, []);

  const initializeServices = async () => {
    try {
      // For demo purposes, create mock environmental data immediately
      const mockEnvironmentalData: EnvironmentalData = {
        timestamp: new Date(),
        sensorId: 'demo-sensor-001',
        temperature: 25.5,
        humidity: 65.2,
        riskLevel: RiskLevel.GREEN
      };

      // Set mock data immediately
      setState(prev => ({
        ...prev,
        environmentalData: [mockEnvironmentalData],
        isIoTConnected: true
      }));

      // Start IoT simulation for demo (optional)
      try {
        const stopSimulation = iotService.startSimulation(5000);
        
        // Subscribe to IoT data
        const unsubscribe = iotService.subscribe({
          onData: (data: EnvironmentalData) => {
            setState(prev => ({
              ...prev,
              environmentalData: [data], // For demo, just keep latest
              isIoTConnected: true
            }));
          },
          onError: (error: Error) => {
            console.warn('IoT Error (using mock data):', error);
            // Keep using mock data even if IoT fails
          },
          onConnectionChange: (connected: boolean) => {
            // Don't change connection status if we have mock data
            if (!connected) {
              console.warn('IoT disconnected, continuing with mock data');
            }
          }
        });

        // Cleanup on unmount
        return () => {
          stopSimulation();
          unsubscribe();
        };
      } catch (iotError) {
        console.warn('IoT service failed, using mock data:', iotError);
        // Mock data is already set, so continue normally
      }
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  };

  const loadDemoData = async () => {
    try {
      // Try to load market data for default crop (wheat)
      const wheatData = await marketService.getMarketData('wheat');
      setState(prev => ({ ...prev, marketData: wheatData }));
    } catch (error) {
      console.warn('Failed to load market data, using mock data:', error);
      
      // Create mock market data
      const mockMarketData: MarketData = {
        cropId: 'wheat',
        currentPrice: 2500,
        priceHistory: [
          { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), price: 2400, volume: 1000 },
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), price: 2450, volume: 1200 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), price: 2480, volume: 950 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), price: 2520, volume: 1100 },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), price: 2500, volume: 1050 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), price: 2490, volume: 1300 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), price: 2510, volume: 980 },
          { date: new Date(), price: 2500, volume: 1150 }
        ],
        lastUpdated: new Date(),
        source: 'demo-market-data'
      };
      
      setState(prev => ({ ...prev, marketData: mockMarketData }));
    }
  };

  // Event handlers
  const handleCropSelect = useCallback(async (crop: CropType) => {
    setState(prev => ({ ...prev, selectedCrop: crop }));
    
    try {
      const marketData = await marketService.getMarketData(crop.id);
      setState(prev => ({ ...prev, marketData }));
    } catch (error) {
      console.warn('Failed to load market data for crop, using mock data:', error);
      
      // Create mock market data for the selected crop
      const mockMarketData: MarketData = {
        cropId: crop.id,
        currentPrice: crop.averageMarketPrice,
        priceHistory: [
          { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), price: crop.averageMarketPrice * 0.95, volume: 1000 },
          { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), price: crop.averageMarketPrice * 0.97, volume: 1200 },
          { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), price: crop.averageMarketPrice * 0.99, volume: 950 },
          { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), price: crop.averageMarketPrice * 1.02, volume: 1100 },
          { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), price: crop.averageMarketPrice * 1.01, volume: 1050 },
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), price: crop.averageMarketPrice * 0.98, volume: 1300 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), price: crop.averageMarketPrice * 1.03, volume: 980 },
          { date: new Date(), price: crop.averageMarketPrice, volume: 1150 }
        ],
        lastUpdated: new Date(),
        source: 'demo-market-data'
      };
      
      setState(prev => ({ ...prev, marketData: mockMarketData }));
    }
  }, [marketService]);

  const handleDistanceChange = useCallback((distance: number) => {
    setState(prev => ({ ...prev, distance }));
  }, []);

  const handleVolumeChange = useCallback((volume: number) => {
    setState(prev => ({ ...prev, volume }));
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!state.selectedCrop || !state.marketData || state.environmentalData.length === 0) {
      alert('Please ensure all inputs are provided and sensors are connected.');
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isAnalyzing: true, 
      currentStep: 'analysis' 
    }));

    try {
      // Create farmer inputs
      const farmerInputs: FarmerInputs = {
        cropType: state.selectedCrop,
        distanceFromHub: state.distance,
        cropVolume: state.volume,
        urgencyLevel: state.urgencyLevel
      };

      // Create decision context
      const context = new DecisionContext(
        farmerInputs,
        state.environmentalData[0], // Use latest environmental data
        state.marketData
      );

      // Generate recommendation
      const verdict = context.generateRecommendation();

      // Simulate analysis delay for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      setState(prev => ({
        ...prev,
        verdict,
        isAnalyzing: false,
        currentStep: 'results'
      }));
    } catch (error) {
      console.error('Analysis failed:', error);
      setState(prev => ({ ...prev, isAnalyzing: false }));
      alert('Analysis failed. Please try again.');
    }
  }, [state.selectedCrop, state.marketData, state.environmentalData, state.distance, state.volume, state.urgencyLevel]);

  const handleReset = useCallback(() => {
    setState(prev => ({
      ...prev,
      verdict: null,
      currentStep: 'inputs',
      showComparison: false
    }));
  }, []);

  const handleToggleComparison = useCallback(() => {
    setState(prev => ({ ...prev, showComparison: !prev.showComparison }));
  }, []);

  const handleIoTRetry = useCallback(() => {
    iotService.connect();
  }, [iotService]);

  const toggleMobileMenu = useCallback(() => {
    setState(prev => ({ ...prev, isMobileMenuOpen: !prev.isMobileMenuOpen }));
  }, []);

  // Check if inputs are complete
  const isInputsComplete = state.selectedCrop && state.volume > 0 && state.distance > 0;
  const canAnalyze = isInputsComplete && state.environmentalData.length > 0 && state.marketData;

  return (
    <div className="smart-silo-app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <h1 className="app-title">
              <span className="title-icon">🌾</span>
              Smart-Silo Storage Referee
            </h1>
            <p className="app-subtitle">
              AI-powered storage decisions for optimal crop preservation
            </p>
          </div>
          
          <button 
            className="mobile-menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span className={`hamburger ${state.isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="progress-indicator">
          <div className={`progress-step ${state.currentStep === 'inputs' ? 'active' : (state.currentStep === 'analysis' || state.currentStep === 'results') ? 'completed' : ''}`}>
            <span className="step-number">1</span>
            <span className="step-label">Input Data</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${state.currentStep === 'analysis' ? 'active' : state.currentStep === 'results' ? 'completed' : ''}`}>
            <span className="step-number">2</span>
            <span className="step-label">Analysis</span>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${state.currentStep === 'results' ? 'active' : ''}`}>
            <span className="step-number">3</span>
            <span className="step-label">Results</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        <div className="main-content">
          {/* Input Section */}
          {(state.currentStep === 'inputs' || state.isMobileMenuOpen) && (
            <section className={`input-section ${state.isMobileMenuOpen ? 'mobile-open' : ''}`}>
              <div className="section-header">
                <h2 className="section-title">
                  <span className="section-icon">📝</span>
                  Farmer's Context
                </h2>
                <p className="section-description">
                  Provide your crop details and location information
                </p>
              </div>

              <div className="input-grid">
                <div className="input-card">
                  <CropSelector
                    selectedCrop={state.selectedCrop}
                    onCropSelect={handleCropSelect}
                    showDetails={true}
                  />
                </div>

                <div className="input-card">
                  <DistanceSlider
                    distance={state.distance}
                    onDistanceChange={handleDistanceChange}
                    cropVolume={state.volume}
                    showLogisticsCost={true}
                  />
                </div>

                <div className="input-card">
                  <VolumeInput
                    volume={state.volume}
                    onVolumeChange={handleVolumeChange}
                    marketPrice={state.marketData?.currentPrice || 0}
                    showValueCalculation={true}
                  />
                </div>
              </div>

              <div className="input-summary">
                <h3 className="summary-title">Input Summary</h3>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Crop:</span>
                    <span className="summary-value">
                      {state.selectedCrop ? `${state.selectedCrop.icon} ${state.selectedCrop.name}` : 'Not selected'}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Distance:</span>
                    <span className="summary-value">{state.distance}km</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Volume:</span>
                    <span className="summary-value">{state.volume} quintals</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Market Price:</span>
                    <span className="summary-value">
                      ₹{state.marketData?.currentPrice.toLocaleString('en-IN') || 'Loading...'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Environmental Monitor */}
          {state.currentStep !== 'inputs' && (
            <section className="environmental-section">
              <EnvironmentalMonitor
                environmentalData={state.environmentalData}
                isConnected={state.isIoTConnected}
                onConnectionRetry={handleIoTRetry}
                showWarnings={true}
                compactView={state.currentStep === 'results'}
              />
            </section>
          )}

          {/* Analysis Section */}
          {state.currentStep === 'analysis' && (
            <section className="analysis-section">
              <VerdictCard
                verdict={state.verdict!}
                isLoading={state.isAnalyzing}
                showActions={false}
                animated={true}
              />
            </section>
          )}

          {/* Results Section */}
          {state.currentStep === 'results' && state.verdict && (
            <section className="results-section">
              <VerdictCard
                verdict={state.verdict}
                isLoading={false}
                onAcceptRecommendation={() => alert('Recommendation accepted!')}
                onViewAlternative={handleToggleComparison}
                showActions={true}
                animated={false}
              />

              {state.showComparison && (
                <StorageComparison
                  options={[state.verdict.recommendedOption, state.verdict.alternativeOption]}
                  recommendedOption={state.verdict.recommendedOption}
                  showDetails={true}
                  compactView={false}
                />
              )}
            </section>
          )}
        </div>

        {/* Analyze Button */}
        {state.currentStep === 'inputs' && (
          <div className="analyze-button-container">
            <button 
              className={`analyze-button ${canAnalyze ? 'enabled' : 'disabled'}`}
              onClick={handleAnalyze}
              disabled={!canAnalyze}
              title={canAnalyze ? 'Start Analysis' : 'Complete inputs first'}
            >
              <span className="analyze-icon">🔍</span>
              <span className="analyze-text">Analyze Storage Options</span>
            </button>
          </div>
        )}

        {/* Reset Button */}
        {state.currentStep === 'results' && (
          <div className="analyze-button-container">
            <button 
              className="analyze-button reset"
              onClick={handleReset}
              title="Start New Analysis"
            >
              <span className="analyze-icon">🔄</span>
              <span className="analyze-text">Start New Analysis</span>
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-info">
            <p className="footer-text">
              Smart-Silo Storage Referee - Empowering farmers with data-driven storage decisions
            </p>
            <p className="footer-credits">
              Built with ❤️ for Indian agriculture
            </p>
          </div>
          
          <div className="footer-status">
            <div className="status-item">
              <span className="status-label">IoT Status:</span>
              <span className={`status-indicator ${state.isIoTConnected ? 'connected' : 'disconnected'}`}>
                {state.isIoTConnected ? '🟢 Connected' : '🔴 Disconnected'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Market Data:</span>
              <span className={`status-indicator ${state.marketData ? 'loaded' : 'loading'}`}>
                {state.marketData ? '🟢 Updated' : '🟡 Loading'}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SmartSiloApp;
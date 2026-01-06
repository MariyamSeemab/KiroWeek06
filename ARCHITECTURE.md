# Smart-Silo Storage Referee - Architecture Documentation

## Overview

The Smart-Silo Storage Referee is a React-based Progressive Web Application (PWA) designed to help farmers make data-driven storage decisions for their crops. The application uses AI-powered analysis to recommend optimal storage strategies based on environmental conditions, market data, and farmer inputs.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React PWA)                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Components  │  │   Services  │  │      Models         │  │
│  │             │  │             │  │                     │  │
│  │ - UI Layer  │  │ - Data      │  │ - Business Logic    │  │
│  │ - Forms     │  │ - IoT       │  │ - Decision Engine   │  │
│  │ - Charts    │  │ - Market    │  │ - Storage Strategy  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ IoT Sensors │  │ Market APIs │  │   Weather APIs      │  │
│  │             │  │             │  │                     │  │
│  │ - Temp/Hum  │  │ - Pricing   │  │ - Conditions        │  │
│  │ - Storage   │  │ - Trends    │  │ - Forecasts         │  │
│  │ - Quality   │  │ - Volume    │  │ - Alerts            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Grid and Flexbox
- **PWA**: Workbox for service worker management
- **State Management**: React Hooks (useState, useEffect, useCallback)
- **Testing**: Jest + React Testing Library

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Bundling**: Vite with Rollup

### Deployment
- **Platform**: Vercel (Primary), Docker (Alternative)
- **CI/CD**: GitHub Actions
- **Domain**: Custom domain support
- **CDN**: Vercel Edge Network

## Project Structure

```
smart-silo-storage-referee/
├── public/                     # Static assets
│   ├── manifest.json          # PWA manifest
│   └── sw.js                  # Service worker
├── src/
│   ├── components/            # React components
│   │   ├── SmartSiloApp.tsx   # Main application component
│   │   ├── CropSelector.tsx   # Crop selection interface
│   │   ├── DistanceSlider.tsx # Distance input component
│   │   ├── VolumeInput.tsx    # Volume input component
│   │   ├── EnvironmentalMonitor.tsx # IoT data display
│   │   ├── VerdictCard.tsx    # Decision results
│   │   ├── StorageComparison.tsx # Options comparison
│   │   ├── WeatherWidget.tsx  # Weather information
│   │   ├── GaugeChart.tsx     # Data visualization
│   │   └── ErrorBoundary.tsx  # Error handling
│   ├── services/              # Business logic services
│   │   ├── MarketDataService.ts # Market data integration
│   │   ├── IoTDataService.ts   # IoT sensor integration
│   │   ├── WeatherService.ts   # Weather API integration
│   │   ├── RiskAssessmentEngine.ts # Risk analysis
│   │   ├── SustainabilityService.ts # Environmental impact
│   │   ├── VoiceService.ts     # Voice interface
│   │   └── CacheManager.ts     # Data caching
│   ├── models/                # Data models and business logic
│   │   ├── DecisionContext.ts  # Decision-making engine
│   │   ├── StorageStrategy.ts  # Storage options model
│   │   └── Crop.ts            # Crop data model
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts           # Shared type definitions
│   ├── utils/                 # Utility functions
│   │   ├── CurrencyFormatter.ts # Currency formatting
│   │   ├── CSVParser.ts       # Data parsing
│   │   └── PWAUtils.ts        # PWA utilities
│   ├── i18n/                  # Internationalization
│   │   └── index.ts           # Language support
│   └── tests/                 # Test files
├── scripts/                   # Build and deployment scripts
├── .kiro/                     # Kiro AI specifications
└── dist/                      # Build output
```

## Component Architecture

### Core Components

#### 1. SmartSiloApp (Main Container)
- **Purpose**: Root application component managing global state
- **Responsibilities**:
  - Application state management
  - Service initialization
  - Navigation flow control
  - Error boundary integration

#### 2. Input Components
- **CropSelector**: Crop type selection with market data
- **DistanceSlider**: Transportation distance input
- **VolumeInput**: Crop volume specification
- **Features**:
  - Real-time validation
  - Progressive enhancement
  - Accessibility compliance

#### 3. Analysis Components
- **EnvironmentalMonitor**: IoT sensor data display
- **VerdictCard**: Decision results presentation
- **StorageComparison**: Options comparison matrix
- **Features**:
  - Real-time data updates
  - Interactive visualizations
  - Mobile-responsive design

#### 4. Utility Components
- **WeatherWidget**: Weather information display
- **GaugeChart**: Data visualization component
- **ErrorBoundary**: Error handling and recovery

## Service Layer Architecture

### 1. Data Services

#### MarketDataService
```typescript
class MarketDataService {
  // Market price retrieval
  async getMarketData(cropId: string): Promise<MarketData>
  
  // Price trend analysis
  async getPriceTrends(cropId: string, period: string): Promise<PriceTrend[]>
  
  // Market volatility assessment
  calculateVolatility(priceHistory: PricePoint[]): number
}
```

#### IoTDataService
```typescript
class IoTDataService {
  // Real-time sensor data
  subscribe(callbacks: IoTCallbacks): UnsubscribeFunction
  
  // Sensor simulation for demo
  startSimulation(interval: number): StopFunction
  
  // Connection management
  connect(): Promise<void>
  disconnect(): void
}
```

#### WeatherService
```typescript
class WeatherService {
  // Current weather conditions
  async getCurrentWeather(location: string): Promise<WeatherData>
  
  // Weather forecasts
  async getForecast(location: string, days: number): Promise<Forecast[]>
  
  // Weather alerts
  async getWeatherAlerts(location: string): Promise<WeatherAlert[]>
}
```

### 2. Business Logic Services

#### RiskAssessmentEngine
```typescript
class RiskAssessmentEngine {
  // Storage risk calculation
  calculateStorageRisk(context: DecisionContext): RiskAssessment
  
  // Market risk analysis
  assessMarketRisk(marketData: MarketData): MarketRisk
  
  // Environmental risk evaluation
  evaluateEnvironmentalRisk(conditions: EnvironmentalData): EnvironmentalRisk
}
```

#### SustainabilityService
```typescript
class SustainabilityService {
  // Carbon footprint calculation
  calculateCarbonFootprint(strategy: StorageStrategy): CarbonFootprint
  
  // Sustainability scoring
  calculateSustainabilityScore(options: StorageOption[]): SustainabilityScore
}
```

## Data Models

### Core Data Types

```typescript
// Farmer input data
interface FarmerInputs {
  cropType: CropType;
  distanceFromHub: number;
  cropVolume: number;
  urgencyLevel: UrgencyLevel;
}

// Environmental sensor data
interface EnvironmentalData {
  timestamp: Date;
  sensorId: string;
  temperature: number;
  humidity: number;
  riskLevel: RiskLevel;
}

// Market data structure
interface MarketData {
  cropId: string;
  currentPrice: number;
  priceHistory: PricePoint[];
  lastUpdated: Date;
  source: string;
}

// Decision output
interface EconomicVerdict {
  recommendedOption: StorageOption;
  alternativeOption: StorageOption;
  confidenceScore: number;
  reasoning: string[];
  riskFactors: RiskFactor[];
}
```

## Decision Engine Architecture

### DecisionContext Class
The core decision-making engine that processes all inputs and generates recommendations:

```typescript
class DecisionContext {
  constructor(
    private farmerInputs: FarmerInputs,
    private environmentalData: EnvironmentalData,
    private marketData: MarketData
  ) {}

  generateRecommendation(): EconomicVerdict {
    // 1. Analyze storage options
    const options = this.analyzeStorageOptions();
    
    // 2. Calculate costs and risks
    const analysis = this.performCostBenefitAnalysis(options);
    
    // 3. Apply decision algorithms
    const recommendation = this.selectOptimalStrategy(analysis);
    
    // 4. Generate verdict with reasoning
    return this.createVerdict(recommendation);
  }
}
```

## State Management

### Application State Structure
```typescript
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
```

## Performance Optimizations

### 1. Code Splitting
- Lazy loading of non-critical components
- Dynamic imports for heavy libraries
- Route-based code splitting

### 2. Caching Strategy
- Service worker for offline functionality
- Local storage for user preferences
- Memory caching for API responses

### 3. Bundle Optimization
- Tree shaking for unused code elimination
- Asset optimization and compression
- Critical CSS inlining

## Security Considerations

### 1. Data Protection
- Input validation and sanitization
- XSS prevention measures
- CSRF protection

### 2. API Security
- Rate limiting for external API calls
- Error handling without information leakage
- Secure credential management

### 3. Privacy
- No sensitive data storage in localStorage
- Minimal data collection
- GDPR compliance considerations

## Accessibility Features

### 1. WCAG 2.1 Compliance
- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support

### 2. Mobile Accessibility
- Touch-friendly interface elements
- Screen reader compatibility
- High contrast mode support

### 3. Progressive Enhancement
- Works without JavaScript (basic functionality)
- Graceful degradation for older browsers
- Offline functionality

## Deployment Architecture

### 1. Vercel Deployment
```yaml
# vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### 2. Docker Deployment
```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

## Monitoring and Analytics

### 1. Performance Monitoring
- Core Web Vitals tracking
- Bundle size monitoring
- API response time tracking

### 2. Error Tracking
- JavaScript error logging
- User interaction tracking
- Performance bottleneck identification

### 3. Usage Analytics
- Feature usage statistics
- User journey analysis
- Conversion funnel tracking

## Future Architecture Considerations

### 1. Scalability
- Microservices architecture for backend
- CDN integration for global distribution
- Database optimization for large datasets

### 2. Advanced Features
- Machine learning model integration
- Real-time collaboration features
- Advanced data visualization

### 3. Platform Expansion
- Native mobile app development
- Desktop application support
- API platform for third-party integrations

## Development Workflow

### 1. Local Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Preview production build
npm run preview
```

### 2. Code Quality
- ESLint for code linting
- Prettier for code formatting
- Husky for pre-commit hooks
- TypeScript for type safety

### 3. Testing Strategy
- Unit tests for utility functions
- Component tests for UI elements
- Integration tests for user workflows
- E2E tests for critical paths

## Conclusion

The Smart-Silo Storage Referee architecture is designed for scalability, maintainability, and user experience. The modular component structure, comprehensive service layer, and robust state management provide a solid foundation for current functionality while allowing for future enhancements and platform expansion.

The architecture emphasizes:
- **Separation of Concerns**: Clear boundaries between UI, business logic, and data layers
- **Reusability**: Modular components and services that can be easily extended
- **Performance**: Optimized bundle size and efficient data handling
- **Accessibility**: Inclusive design for all users
- **Maintainability**: Clean code structure with comprehensive documentation

This architecture supports the application's goal of providing farmers with reliable, data-driven storage decisions while maintaining high performance and user experience standards.
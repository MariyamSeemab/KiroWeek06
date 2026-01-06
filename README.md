# 🌾 Smart-Silo Storage Referee

An AI-powered economic decision-making system that helps farmers optimize their post-harvest storage strategy by analyzing the trade-off between cold storage costs and solar drying spoilage risks.

## 🎯 Overview

The Smart-Silo Storage Referee acts as an intelligent economic referee, weighing trade-offs between cold storage costs and solar drying spoilage risks to maximize farmer profitability. The system considers:

- **Distance from market hubs** - Affects logistics costs
- **Crop perishability** - Different crops have different spoilage risks  
- **Real-time environmental conditions** - IoT sensor data for temperature and humidity
- **Market prices** - Current crop pricing from S3-hosted data

## ✨ Key Features

### 🧠 Core "Referee" Philosophy
- Economic decision engine that weighs capital expenditure vs operational risk
- Distance-based logistics cost calculations
- Crop-specific perishability scoring

### 📈 Decision Logic  
- Environmental risk multipliers based on IoT sensor data
- Real-time calculation updates as inputs change
- Defensive data handling for robust operation

### 🎨 UI/UX Infrastructure
- Mobile-first responsive design with PWA capabilities
- Visual crop selection with icons (wheat 🌾, chili 🌶️, tomato 🍅)
- Color-coded gauge charts for environmental monitoring
- Prominent verdict card with clear reasoning

### 🛠️ Integration Logic
- S3 market data integration with CSV parsing
- WebSocket connections for real-time IoT data
- Comprehensive error handling and fallback mechanisms

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 8+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-silo-referee
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.development
   # Edit .env.development with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Build & Deployment

### Production Build
```bash
npm run build:prod
```

### Deploy to Staging
```bash
npm run deploy:staging
```

### Deploy to Production  
```bash
npm run deploy:prod
```

### 🚀 Deploy to Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/smart-silo-referee)

**Quick Deployment:**
```bash
# Install Vercel CLI
npm install -g vercel

# Login and deploy
vercel login
vercel --prod
```

**Your app will be live at**: `https://smart-silo-referee.vercel.app`

**Features included:**
- ✅ Global CDN for fast loading
- ✅ Automatic HTTPS
- ✅ PWA support with service workers
- ✅ Mobile-optimized for farmers
- ✅ Works on 2G/3G networks

For detailed deployment guide, see [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build Docker image manually
docker build -t smart-silo-referee .
docker run -p 80:80 smart-silo-referee
```

## 📱 Progressive Web App (PWA)

The application is built as a PWA with:
- **Offline functionality** - Works without internet connection
- **Installable** - Can be installed on mobile devices and desktops
- **Background sync** - Syncs data when connection is restored
- **Push notifications** - Alerts for critical environmental conditions

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Property-Based Testing
The application includes property-based tests using fast-check to verify:
- Crop data loading consistency
- Proportional volume scaling  
- CSV parsing round trip
- Environmental risk calculations
- Real-time calculation updates
- Input validation completeness
- Visual feedback consistency
- Recommendation completeness
- Defensive data handling
- Responsive interface consistency

## 🏗️ Architecture

### Frontend Layer
- **React + TypeScript** - Type-safe component development
- **Vite** - Fast build tool and dev server
- **PWA** - Offline-first architecture

### Services Layer  
- **IoT Data Service** - Real-time sensor data via WebSocket
- **Market Data Service** - S3-based CSV data with caching
- **Risk Assessment Engine** - Environmental risk calculations
- **Decision Context** - Economic recommendation logic

### Data Models
- **Crop Model** - Perishability calculations and market values
- **Storage Strategy** - Cost calculations and risk assessments
- **Decision Context** - Recommendation generation

## 🌐 API Integration

### IoT Sensors
- WebSocket connection for real-time data
- Temperature and humidity monitoring
- Automatic reconnection and error handling

### Market Data
- S3-hosted CSV files with current crop prices
- Defensive data handling with fallbacks
- Caching for improved performance

## 📊 Monitoring & Analytics

### Performance Monitoring
- Build size analysis
- Bundle optimization
- Cache performance metrics

### Error Tracking
- Error boundaries for graceful failure handling
- Service worker error reporting
- Offline data synchronization

## 🔧 Configuration

### Environment Variables
See `.env.example` for all available configuration options:

- **API Configuration** - Backend service URLs
- **AWS S3** - Market data bucket configuration  
- **Feature Flags** - Enable/disable features
- **Analytics** - Optional tracking integration

### Deployment Targets
- **Netlify** - Serverless deployment
- **Vercel** - Edge deployment
- **AWS S3 + CloudFront** - Static hosting with CDN
- **Docker** - Containerized deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ for Indian agriculture
- Designed to empower farmers with data-driven storage decisions
- Implements formal correctness properties through property-based testing

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `/docs` folder
- Review the spec files in `.kiro/specs/smart-silo-referee/`

---

**Smart-Silo Storage Referee** - Empowering farmers with intelligent storage decisions 🌾
# 🚀 Smart Silo Referee - Vercel Deployment Guide

This guide covers deploying the Smart Silo Referee application to Vercel for production use.

## 📋 Prerequisites

- Node.js 18+ installed
- Git repository set up
- Vercel account (free tier available)
- Vercel CLI installed globally

## 🛠️ Quick Setup

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from Repository

#### Option A: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Vercel will auto-detect Vite configuration
5. Click "Deploy"

#### Option B: Deploy via CLI
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

#### Option C: Use Custom Script
```bash
# Make script executable (Linux/Mac)
chmod +x scripts/vercel-deploy.sh

# Deploy preview
./scripts/vercel-deploy.sh preview

# Deploy production
./scripts/vercel-deploy.sh production
```

## ⚙️ Configuration Files

### `vercel.json`
- Configures build settings
- Sets up routing for SPA
- Optimizes caching headers
- Configures PWA service worker

### Environment Variables
Set these in Vercel Dashboard → Project → Settings → Environment Variables:

#### Required Variables
```bash
VITE_APP_NAME=Smart Silo Referee
VITE_APP_ENVIRONMENT=production
VITE_ENABLE_PWA=true
```

#### Optional Variables
```bash
# Analytics
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Error Reporting
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project

# API Endpoints (when available)
VITE_API_BASE_URL=https://api.smart-silo.com
VITE_IOT_WEBSOCKET_URL=wss://iot.smart-silo.com/ws
```

## 🌐 Domain Configuration

### Custom Domain Setup
1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Enable HTTPS (automatic with Vercel)

### Recommended Domains
- `smart-silo-referee.com`
- `silo-referee.in` (for Indian market)
- `krishi-storage.com` (vernacular appeal)

## 📱 PWA Configuration

The app is configured as a Progressive Web App (PWA):

- **Offline Support**: Works without internet
- **Install Prompt**: Can be installed on mobile devices
- **Service Worker**: Caches resources for performance
- **Manifest**: Configured for Indian farmers

### PWA Features
- 📱 Mobile app-like experience
- 🔄 Background sync for IoT data
- 💾 Offline data storage
- 🚀 Fast loading with caching
- 🌐 Works on 2G/3G networks

## 🎯 Performance Optimization

### Vercel Optimizations
- **Edge Network**: Global CDN for fast loading
- **Image Optimization**: Automatic image compression
- **Code Splitting**: Lazy loading for better performance
- **Compression**: Gzip/Brotli compression enabled

### Farmer-Focused Optimizations
- **Lightweight Bundle**: < 500KB initial load
- **Progressive Enhancement**: Works on older browsers
- **Offline-First**: Critical features work offline
- **Low-Data Mode**: Optimized for slow connections

## 🔒 Security Configuration

### Headers Configuration
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ]
}
```

### Content Security Policy
- Prevents XSS attacks
- Restricts resource loading
- Protects farmer data

## 📊 Monitoring & Analytics

### Built-in Vercel Analytics
- Page views and performance
- Core Web Vitals
- User demographics
- Device and browser stats

### Custom Analytics
- Farmer interaction tracking
- Crop selection patterns
- Storage decision outcomes
- Regional usage statistics

## 🚨 Error Handling

### Error Boundaries
- Graceful error handling
- Fallback UI for failures
- Error reporting to Sentry

### Offline Handling
- Cached data when offline
- Manual entry mode for IoT failures
- Sync when connection restored

## 🔄 Continuous Deployment

### Automatic Deployments
- **Main Branch**: Auto-deploys to production
- **Feature Branches**: Auto-deploys to preview URLs
- **Pull Requests**: Preview deployments for testing

### Deployment Workflow
1. Push code to repository
2. Vercel detects changes
3. Runs build process
4. Deploys to edge network
5. Updates live site

## 🌍 Global Distribution

### Edge Locations
Vercel's global CDN ensures fast loading for farmers across India:
- Mumbai, India
- Singapore (Asia-Pacific)
- Frankfurt, Germany (Europe)
- Washington D.C., USA (Americas)

### Regional Optimization
- **India-specific**: Optimized for Indian internet infrastructure
- **Mobile-first**: Designed for smartphone usage
- **Low-bandwidth**: Works on 2G/3G networks
- **Vernacular**: Supports local languages

## 📈 Scaling Considerations

### Traffic Handling
- **Serverless**: Auto-scales with demand
- **Edge Caching**: Reduces server load
- **CDN**: Distributes traffic globally

### Cost Optimization
- **Free Tier**: 100GB bandwidth/month
- **Pro Plan**: $20/month for higher limits
- **Enterprise**: Custom pricing for large scale

## 🛠️ Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build locally
npm run build

# Check TypeScript errors
npm run type-check

# Check linting
npm run lint
```

#### Environment Variables
- Ensure all required variables are set
- Check variable names (must start with VITE_)
- Verify values in Vercel dashboard

#### PWA Issues
- Check service worker registration
- Verify manifest.json validity
- Test offline functionality

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [PWA Best Practices](https://web.dev/pwa/)

## 🎉 Post-Deployment Checklist

- [ ] Site loads correctly on mobile devices
- [ ] PWA install prompt appears
- [ ] Offline functionality works
- [ ] High-contrast mode functions
- [ ] Touch targets are appropriately sized
- [ ] Performance scores > 90 on Lighthouse
- [ ] Accessibility score > 95
- [ ] Works on 2G/3G networks
- [ ] Vernacular labels display correctly
- [ ] Error boundaries handle failures gracefully

## 📞 Support

For deployment issues or questions:
- Create an issue in the repository
- Contact the Smart Silo team
- Check Vercel status page
- Review deployment logs in Vercel dashboard

---

**🌾 Built for Indian Farmers | 📱 Mobile-First | ☀️ Sunlight-Optimized**
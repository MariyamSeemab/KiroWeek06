# 🚀 Quick Vercel Deployment Guide

## 🎯 One-Click Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/smart-silo-referee)

## 📋 Step-by-Step Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy the Project
```bash
# Navigate to project directory
cd smart-silo-referee

# Deploy (first time will ask for configuration)
vercel

# For production deployment
vercel --prod
```

### 4. Configuration During First Deploy
When prompted, choose:
- **Set up and deploy**: Yes
- **Which scope**: Your personal account or team
- **Link to existing project**: No (for new deployment)
- **Project name**: smart-silo-referee
- **Directory**: ./ (current directory)
- **Override settings**: No (use detected settings)

## ⚙️ Environment Variables (Optional)

Set these in Vercel Dashboard for enhanced features:

```bash
VITE_APP_NAME=Smart Silo Referee
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
```

## 🌐 Your App Will Be Available At:
- **Preview**: `https://smart-silo-referee-xxx.vercel.app`
- **Production**: `https://smart-silo-referee.vercel.app`

## 📱 Features Included:
- ✅ Mobile-optimized for farmers
- ✅ PWA (installable on phones)
- ✅ Offline functionality
- ✅ High-contrast sunlight mode
- ✅ Vernacular-friendly interface
- ✅ IoT sensor integration ready
- ✅ Global CDN for fast loading

## 🔄 Automatic Deployments:
Once connected to Git:
- **Push to main branch** → Auto-deploy to production
- **Push to other branches** → Auto-deploy to preview URLs
- **Pull requests** → Get preview deployments

## 📊 Monitor Your Deployment:
- Visit [Vercel Dashboard](https://vercel.com/dashboard)
- View analytics, performance, and logs
- Monitor Core Web Vitals
- Track user engagement

---
**🌾 Ready to help Indian farmers make better storage decisions!**
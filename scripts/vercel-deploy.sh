#!/bin/bash

# Smart Silo Referee - Vercel Deployment Script
# This script prepares and deploys the application to Vercel

set -e

echo "🌾 Smart Silo Referee - Vercel Deployment"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Environment setup
ENVIRONMENT=${1:-preview}
print_status "Deploying to environment: $ENVIRONMENT"

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    exit 1
fi

# Check if build script exists
if ! npm run build --dry-run &> /dev/null; then
    print_error "Build script not found in package.json!"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm ci

# Run type checking
print_status "Running TypeScript type checking..."
npm run type-check

# Run linting
print_status "Running ESLint..."
npm run lint

# Run tests
print_status "Running tests..."
npm run test:ci

# Build the application
print_status "Building application for production..."
npm run build

# Check if dist directory exists
if [ ! -d "dist" ]; then
    print_error "Build failed - dist directory not found!"
    exit 1
fi

# Deploy based on environment
case $ENVIRONMENT in
    "production")
        print_status "Deploying to production..."
        vercel --prod --yes
        ;;
    "preview")
        print_status "Deploying preview..."
        vercel --yes
        ;;
    *)
        print_error "Invalid environment: $ENVIRONMENT"
        print_error "Use 'production' or 'preview'"
        exit 1
        ;;
esac

print_success "Deployment completed successfully!"
print_status "Your Smart Silo Referee app is now live on Vercel!"

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls smart-silo-referee --limit 1 | grep -o 'https://[^ ]*' | head -1)
if [ ! -z "$DEPLOYMENT_URL" ]; then
    print_success "Deployment URL: $DEPLOYMENT_URL"
fi

echo ""
echo "🎉 Deployment Summary:"
echo "   Environment: $ENVIRONMENT"
echo "   Framework: Vite + React + TypeScript"
echo "   Features: PWA, Farmer-focused UI/UX, IoT Integration"
echo "   Target Users: Indian farmers and FPO leads"
echo ""
echo "📱 Mobile-optimized for budget smartphones"
echo "☀️  High-contrast design for sunlight visibility"
echo "🌾 Vernacular-friendly interface"
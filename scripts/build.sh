#!/bin/bash

# Smart-Silo Storage Referee Build Script

set -e

echo "🌾 Building Smart-Silo Storage Referee..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is not supported. Please use Node.js 18+ and try again."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run type checking
echo "🔍 Running type checks..."
npm run type-check

# Run linting
echo "🧹 Running linter..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test:ci

# Build for production
echo "🏗️  Building for production..."
npm run build

# Check build size
echo "📊 Analyzing build size..."
BUILD_SIZE=$(du -sh dist | cut -f1)
echo "✅ Build completed successfully! Size: $BUILD_SIZE"

# Generate build report
echo "📋 Generating build report..."
echo "Build Date: $(date)" > dist/build-info.txt
echo "Node Version: $NODE_VERSION" >> dist/build-info.txt
echo "Build Size: $BUILD_SIZE" >> dist/build-info.txt
echo "Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')" >> dist/build-info.txt

echo "🎉 Build process completed successfully!"
echo "📁 Build files are available in the 'dist' directory"
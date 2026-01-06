#!/bin/bash

# Smart-Silo Storage Referee Deployment Script

set -e

# Configuration
ENVIRONMENT=${1:-production}
BUILD_DIR="dist"
BACKUP_DIR="backups"

echo "🚀 Deploying Smart-Silo Storage Referee to $ENVIRONMENT..."

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    echo "❌ Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check if build exists
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ Build directory not found. Please run 'npm run build' first."
    exit 1
fi

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    echo "📋 Loading environment variables for $ENVIRONMENT..."
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo "⚠️  No environment file found for $ENVIRONMENT"
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to deploy to different platforms
deploy_to_netlify() {
    echo "🌐 Deploying to Netlify..."
    
    if ! command -v netlify &> /dev/null; then
        echo "❌ Netlify CLI not found. Installing..."
        npm install -g netlify-cli
    fi
    
    if [ "$ENVIRONMENT" = "production" ]; then
        netlify deploy --prod --dir="$BUILD_DIR"
    else
        netlify deploy --dir="$BUILD_DIR"
    fi
}

deploy_to_vercel() {
    echo "▲ Deploying to Vercel..."
    
    if ! command -v vercel &> /dev/null; then
        echo "❌ Vercel CLI not found. Installing..."
        npm install -g vercel
    fi
    
    if [ "$ENVIRONMENT" = "production" ]; then
        vercel --prod
    else
        vercel
    fi
}

deploy_to_aws_s3() {
    echo "☁️  Deploying to AWS S3..."
    
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI not found. Please install AWS CLI and configure credentials."
        exit 1
    fi
    
    # Set bucket name based on environment
    if [ "$ENVIRONMENT" = "production" ]; then
        S3_BUCKET="smart-silo-referee-prod"
        CLOUDFRONT_ID="$PROD_CLOUDFRONT_ID"
    else
        S3_BUCKET="smart-silo-referee-staging"
        CLOUDFRONT_ID="$STAGING_CLOUDFRONT_ID"
    fi
    
    # Create backup of current deployment
    echo "💾 Creating backup..."
    aws s3 sync s3://$S3_BUCKET "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)" --delete
    
    # Upload new build
    echo "📤 Uploading files to S3..."
    aws s3 sync "$BUILD_DIR" s3://$S3_BUCKET --delete
    
    # Set cache headers
    aws s3 cp s3://$S3_BUCKET s3://$S3_BUCKET --recursive \
        --metadata-directive REPLACE \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "service-worker.js" \
        --exclude "manifest.json"
    
    # Set no-cache for HTML files
    aws s3 cp s3://$S3_BUCKET s3://$S3_BUCKET --recursive \
        --metadata-directive REPLACE \
        --cache-control "no-cache, no-store, must-revalidate" \
        --include "*.html" \
        --include "service-worker.js"
    
    # Invalidate CloudFront cache
    if [ -n "$CLOUDFRONT_ID" ]; then
        echo "🔄 Invalidating CloudFront cache..."
        aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ID" --paths "/*"
    fi
}

# Deploy based on configuration
DEPLOY_TARGET=${DEPLOY_TARGET:-netlify}

case $DEPLOY_TARGET in
    "netlify")
        deploy_to_netlify
        ;;
    "vercel")
        deploy_to_vercel
        ;;
    "aws")
        deploy_to_aws_s3
        ;;
    *)
        echo "❌ Unknown deployment target: $DEPLOY_TARGET"
        echo "Supported targets: netlify, vercel, aws"
        exit 1
        ;;
esac

# Health check
echo "🏥 Running health check..."
if [ -n "$VITE_PROD_BASE_URL" ]; then
    sleep 10  # Wait for deployment to propagate
    
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$VITE_PROD_BASE_URL" || echo "000")
    
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Health check passed! Application is live at $VITE_PROD_BASE_URL"
    else
        echo "⚠️  Health check failed. HTTP Status: $HTTP_STATUS"
        echo "Please check the deployment manually."
    fi
fi

# Send notification (optional)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    echo "📢 Sending deployment notification..."
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🌾 Smart-Silo Storage Referee deployed to $ENVIRONMENT successfully!\"}" \
        "$SLACK_WEBHOOK_URL"
fi

echo "🎉 Deployment to $ENVIRONMENT completed successfully!"
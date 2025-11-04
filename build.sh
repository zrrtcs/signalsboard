#!/bin/bash
set -e

# Build and Deploy Script for Hospital Dashboard
# Single source of truth: SIGNALSBOARD_ENVIRONMENT

ENVIRONMENT=${1:-development}

echo "=========================================="
echo "Hospital Dashboard Build Script"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Determine which .env file to use
if [ "$ENVIRONMENT" == "production" ]; then
    ENV_FILE=".env.production"
else
    ENV_FILE=".env.local"
fi

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found"
    exit 1
fi

# Load environment variables from .env file
export $(cat "$ENV_FILE" | grep -v '^#' | xargs)

# Derive BUILD_CONFIGURATION and ASPNETCORE_ENVIRONMENT from SIGNALSBOARD_ENVIRONMENT
# SIGNALSBOARD_ENVIRONMENT is the single source of truth in .env files
# build.sh maps it to Docker build arguments for Dockerfile
if [ "$SIGNALSBOARD_ENVIRONMENT" == "production" ]; then
    BUILD_CONFIGURATION="Release"
    ASPNETCORE_ENVIRONMENT="Production"
else
    BUILD_CONFIGURATION="Debug"
    ASPNETCORE_ENVIRONMENT="Development"
fi

echo "✅ Loaded configuration from: $ENV_FILE"
echo "   SIGNALSBOARD_ENVIRONMENT=$SIGNALSBOARD_ENVIRONMENT"
echo "   BUILD_CONFIGURATION=$BUILD_CONFIGURATION (derived)"
echo "   ASPNETCORE_ENVIRONMENT=$ASPNETCORE_ENVIRONMENT (derived)"

# Build Docker image
echo ""
echo "🔨 Building Docker image..."
docker build \
    --build-arg BUILD_CONFIGURATION="$BUILD_CONFIGURATION" \
    --build-arg ASPNETCORE_ENVIRONMENT="$ASPNETCORE_ENVIRONMENT" \
    -t hospital-dashboard:$ENVIRONMENT \
    -f Hospital.Api/Dockerfile \
    .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully: hospital-dashboard:$ENVIRONMENT"
else
    echo "❌ Docker build failed"
    exit 1
fi

# For development, optionally start containers
if [ "$ENVIRONMENT" == "development" ]; then
    echo ""
    read -p "Start containers? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Starting containers (detached)..."
        docker compose up -d
        echo "✅ Containers started in background"
        echo "   View logs: docker compose logs -f"
        echo "   Stop containers: docker compose down"
    fi
fi

echo ""
echo "=========================================="
echo "Build complete!"
echo "=========================================="

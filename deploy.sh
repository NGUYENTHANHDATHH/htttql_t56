#!/bin/bash

# Deployment script for Olympia Game Show
echo "🚀 Starting deployment process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd server && npm install && cd ..

# Build the frontend
echo "🔨 Building frontend..."
npm run build:prod

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "✅ Build completed successfully!"
echo "🎯 To start the production server, run:"
echo "   cd server && npm start"
echo ""
echo "🌐 The app will be available at:"
echo "   - Frontend: http://localhost:3000 (if using npm start from root)"
echo "   - Backend: http://localhost:3001 (if using server directly)"
echo ""
echo "📝 Don't forget to set environment variables:"
echo "   - VITE_SERVER_URL for frontend"
echo "   - PORT for backend (optional, defaults to 3001)"

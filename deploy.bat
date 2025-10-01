@echo off
echo 🚀 Starting deployment process...

echo 📦 Installing dependencies...
call npm install
cd server
call npm install
cd ..

echo 🔨 Building frontend...
call npm run build:prod

if not exist "dist" (
    echo ❌ Build failed - dist directory not found
    exit /b 1
)

echo ✅ Build completed successfully!
echo 🎯 To start the production server, run:
echo    cd server ^&^& npm start
echo.
echo 🌐 The app will be available at:
echo    - Frontend: http://localhost:3000 (if using npm start from root)
echo    - Backend: http://localhost:3001 (if using server directly)
echo.
echo 📝 Don't forget to set environment variables:
echo    - VITE_SERVER_URL for frontend
echo    - PORT for backend (optional, defaults to 3001)

#!/bin/bash

# Clearo Production Startup Script
# Domain: clearo.dev

set -e

echo "🚀 Clearo Production Startup"
echo "================================"
echo "Domain: clearo.dev"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please do not run as root. Use a regular user with sudo privileges."
   exit 1
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env not found!"
    echo "   Please create backend/.env with production configuration."
    echo "   See PRODUCTION_SETUP.md for details."
    exit 1
fi

if [ ! -f "frontend/.env.production" ]; then
    echo "⚠️  Warning: frontend/.env.production not found!"
    echo "   Creating from template..."
    cat > frontend/.env.production << EOF
# Clearo Frontend - Production Configuration
NEXT_PUBLIC_API_URL=https://clearo.dev/api
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
NODE_ENV=production
EOF
    echo "✅ Created frontend/.env.production"
    echo "   Please review and update with actual values!"
    echo ""
fi

# Verify production environment variables
echo "📋 Checking configuration..."
if ! grep -q "FRONTEND_URL=https://clearo.dev" backend/.env 2>/dev/null; then
    echo "⚠️  Warning: FRONTEND_URL in backend/.env may not be set to https://clearo.dev"
fi

if ! grep -q "NEXT_PUBLIC_API_URL=https://clearo.dev/api" frontend/.env.production 2>/dev/null; then
    echo "⚠️  Warning: NEXT_PUBLIC_API_URL in frontend/.env.production may not be set correctly"
fi

echo ""

# Check if builds exist
if [ ! -d "backend/dist" ]; then
    echo "📦 Building backend..."
    cd backend
    npm install
    npm run build
    cd ..
fi

if [ ! -d "frontend/.next" ]; then
    echo "📦 Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..
fi

echo ""
echo "🔧 Starting services..."
echo ""

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 detected. Using PM2 to manage processes."
    echo ""
    
    # Create logs directory if it doesn't exist
    mkdir -p logs
    
    # Check if ecosystem.config.js exists
    if [ -f "ecosystem.config.js" ]; then
        echo "📋 Using ecosystem.config.js for PM2 configuration..."
        pm2 start ecosystem.config.js || pm2 restart ecosystem.config.js
    else
        echo "📋 Starting services individually..."
        # Start backend with PM2
        cd backend
        pm2 start dist/index.js --name clearo-backend --env production --update-env || pm2 restart clearo-backend --update-env
        cd ..
        
        # Start frontend with PM2
        cd frontend
        pm2 start npm --name clearo-frontend -- start --update-env || pm2 restart clearo-frontend --update-env
        cd ..
    fi
    
    echo ""
    echo "✅ Services started with PM2!"
    echo ""
    echo "💡 To enable auto-start on server reboot, run:"
    echo "   pm2 save"
    echo "   pm2 startup"
    echo ""
    echo "📊 Useful PM2 commands:"
    echo "   pm2 status              - View status"
    echo "   pm2 logs                - View logs"
    echo "   pm2 logs clearo-backend - Backend logs only"
    echo "   pm2 logs clearo-frontend - Frontend logs only"
    echo "   pm2 restart all        - Restart all services"
    echo "   pm2 stop all           - Stop all services"
    echo "   pm2 monit              - Real-time monitoring"
    echo ""
    
else
    echo "⚠️  PM2 not found. Starting services in background..."
    echo "   Consider installing PM2: npm install -g pm2"
    echo ""
    
    # Start backend
    echo "🔧 Starting backend server..."
    cd backend
    NODE_ENV=production nohup node dist/index.js > ../backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend PID: $BACKEND_PID"
    cd ..
    
    # Wait a bit
    sleep 2
    
    # Start frontend
    echo "🎨 Starting frontend server..."
    cd frontend
    NODE_ENV=production nohup npm start > ../frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "   Frontend PID: $FRONTEND_PID"
    cd ..
    
    echo ""
    echo "✅ Services started!"
    echo ""
    echo "📊 Logs:"
    echo "   Backend:  tail -f backend.log"
    echo "   Frontend: tail -f frontend.log"
    echo ""
    echo "🛑 To stop services:"
    echo "   kill $BACKEND_PID $FRONTEND_PID"
    echo ""
    
    # Save PIDs
    echo "$BACKEND_PID $FRONTEND_PID" > .pids
fi

echo "🌐 Application should be accessible at:"
echo "   https://clearo.dev"
echo ""
echo "🔍 Verify deployment:"
echo "   curl https://clearo.dev/health"
echo ""


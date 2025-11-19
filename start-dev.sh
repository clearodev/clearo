#!/bin/bash

# Clearo Development Startup Script
# This script helps you start the application on your server IP

echo "🚀 Clearo Development Startup"
echo "================================"
echo ""

# Get server IP
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "Detected server IP: $SERVER_IP"
echo ""

# Check if .env files exist and create them if needed
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Backend .env file not found. Creating..."
    cat > backend/.env << EOF
PORT=3003
HOST=0.0.0.0
DB_HOST=localhost
DB_PORT=5432
DB_NAME=clearo
DB_USER=postgres
DB_PASSWORD=postgres

# Frontend URL for CORS
FRONTEND_URL=http://$SERVER_IP:3002

# Solana
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_NETWORK=mainnet-beta

# JWT Secret (generate a random string)
JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || echo "change-this-secret-key-in-production-$(date +%s)")

# File Upload
UPLOAD_DIR=uploads/
MAX_FILE_SIZE=10485760
EOF
    echo "✅ Created backend/.env with FRONTEND_URL=http://$SERVER_IP:3002"
    echo ""
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "⚠️  Frontend .env.local file not found. Creating..."
    cat > frontend/.env.local << EOF
# Backend API URL
NEXT_PUBLIC_API_URL=http://$SERVER_IP:3003

# Solana Network
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RPC_URL=https://api.mainnet-beta.solana.com
EOF
    echo "✅ Created frontend/.env.local with NEXT_PUBLIC_API_URL=http://$SERVER_IP:3003"
    echo ""
fi

# Update .env files with server IP if they contain localhost
if grep -q "localhost" backend/.env 2>/dev/null; then
    echo "📝 Updating backend/.env with server IP..."
    sed -i "s|FRONTEND_URL=http://localhost:3002|FRONTEND_URL=http://$SERVER_IP:3002|g" backend/.env
    sed -i "s|FRONTEND_URL=http://localhost:3000|FRONTEND_URL=http://$SERVER_IP:3002|g" backend/.env
    echo "✅ Updated FRONTEND_URL in backend/.env"
fi

if grep -q "localhost" frontend/.env.local 2>/dev/null; then
    echo "📝 Updating frontend/.env.local with server IP..."
    sed -i "s|NEXT_PUBLIC_API_URL=http://localhost:3003|NEXT_PUBLIC_API_URL=http://$SERVER_IP:3003|g" frontend/.env.local
    echo "✅ Updated NEXT_PUBLIC_API_URL in frontend/.env.local"
fi

echo ""
echo "📋 Configuration Summary:"
echo "   Backend will run on: http://$SERVER_IP:3003"
echo "   Frontend will run on: http://$SERVER_IP:3002 (port 3000 is used by FORJ)"
echo ""
echo "⚠️  Make sure:"
echo "   1. PostgreSQL is running and database 'clearo' exists"
echo "   2. Firewall allows ports 3003 and 3002"
echo "   3. Dependencies are installed (npm install)"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

echo ""
echo "Starting services..."
echo ""

# Start backend in background
echo "🔧 Starting backend server..."
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services started!"
echo ""
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "📊 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🌐 Access the application at:"
echo "   http://$SERVER_IP:3002"
echo ""
echo "   Note: Port 3000 is used by FORJ, so Clearo uses port 3002"
echo ""
echo "To stop services, run:"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""

# Save PIDs to file for easy stopping
echo "$BACKEND_PID $FRONTEND_PID" > .pids

echo "Press Ctrl+C to stop all services..."
wait


#!/bin/bash
# Stop Clearo Backend processes

echo "Stopping Clearo Backend..."

# Kill all tsx watch processes
pkill -9 -f "tsx watch.*backend" 2>/dev/null
pkill -9 -f "tsx watch src/index.ts" 2>/dev/null

# Kill processes on port 3003
lsof -ti :3003 | xargs kill -9 2>/dev/null

sleep 2

# Check if port is free
if netstat -tlnp | grep -q ":3003"; then
    echo "⚠️  Port 3003 still in use. Force killing..."
    lsof -ti :3003 | xargs kill -9 2>/dev/null
    sleep 1
fi

if netstat -tlnp | grep -q ":3003"; then
    echo "❌ Failed to free port 3003"
    echo "Processes still using port 3003:"
    lsof -i :3003
else
    echo "✅ Backend stopped. Port 3003 is free."
fi



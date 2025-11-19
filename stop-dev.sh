#!/bin/bash

# Stop Clearo Development Services

if [ -f ".pids" ]; then
    PIDS=$(cat .pids)
    echo "Stopping services (PIDs: $PIDS)..."
    kill $PIDS 2>/dev/null
    rm .pids
    echo "✅ Services stopped"
else
    echo "No running services found (no .pids file)"
    echo "You can manually kill processes:"
    echo "  pkill -f 'node.*backend'"
    echo "  pkill -f 'next dev'"
fi



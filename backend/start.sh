#!/bin/bash

# Add local bin to PATH for installed Python packages
export PATH="/home/appuser/.local/bin:$PATH"

# Change to backend directory
cd "$(dirname "$0")"

# Load environment variables (prefer backend/.env, fall back to root .env)
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
elif [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

echo "🚀 Starting 4Ms Backend API on port ${PORT:-8001}..."
echo "📝 API Documentation: http://localhost:${PORT:-8001}/docs"
echo ""

# Start the server
python3 main.py

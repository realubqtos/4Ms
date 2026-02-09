#!/bin/bash

# Add local bin to PATH for installed Python packages
export PATH="/home/appuser/.local/bin:$PATH"

# Change to backend directory
cd "$(dirname "$0")"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if GEMINI_API_KEY is set
if [ "$GEMINI_API_KEY" = "your_gemini_api_key_here" ]; then
    echo "⚠️  WARNING: GEMINI_API_KEY is not configured!"
    echo "Please edit backend/.env and add your actual Gemini API key"
    echo ""
fi

echo "🚀 Starting 4Ms Backend API on port ${PORT:-8001}..."
echo "📝 API Documentation: http://localhost:${PORT:-8001}/docs"
echo ""

# Start the server
python3 main.py

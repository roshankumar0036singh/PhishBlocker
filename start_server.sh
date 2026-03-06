#!/bin/bash

echo "🚀 Starting PhishBlocker API Server"
echo "=================================="

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install numpy==2.3.2

# Start the FastAPI server
echo "Starting server on http://localhost:8000"
cd src/api
python main.py

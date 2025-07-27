#!/bin/bash

# Install Node.js dependencies and build frontend
cd frontend
npm install
npm run build
cd ..

# Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..

echo "Build completed successfully!" 
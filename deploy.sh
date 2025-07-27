#!/bin/bash

echo "🚀 Starting Rizz deployment..."

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "Installing ngrok..."
    curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
    echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
    sudo apt update && sudo apt install ngrok
fi

# Build frontend
echo "Building React frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi
npm run build
if [ $? -ne 0 ]; then
    echo "Failed to build frontend"
    exit 1
fi
cd ..

# Start backend
echo "Starting Flask backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
python app.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to start..."
sleep 5

# Start ngrok
echo "Starting ngrok tunnel..."
ngrok http 5000 &
NGROK_PID=$!

echo ""
echo "🎉 Deployment complete!"
echo "Your app should now be accessible via the ngrok URL shown above."
echo "Share this URL with your friends to let them try your app!"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user to stop
trap "echo 'Stopping services...'; kill $BACKEND_PID $NGROK_PID 2>/dev/null; exit" INT
wait 
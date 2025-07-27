# 🌐 Global Deployment Guide

This guide will help you deploy your Rizz application so it can be accessed from anywhere in the world using ngrok.

## 🚀 Quick Start

### For Windows Users:
1. Double-click `deploy.bat` or run it from Command Prompt
2. Wait for the setup to complete
3. Share the ngrok URL with your friends!

### For Linux/Mac Users:
1. Make the script executable: `chmod +x deploy.sh`
2. Run: `./deploy.sh`
3. Share the ngrok URL with your friends!

### For Python Users:
1. Run: `python build_and_deploy.py`
2. Share the ngrok URL with your friends!

## 📋 Prerequisites

- **Node.js** (for React frontend)
- **Python 3.7+** (for Flask backend)
- **ngrok** (will be installed automatically)

## 🔧 How It Works

1. **Frontend Build**: The React app is built into static files
2. **Backend Server**: Flask serves both the API and the React app
3. **ngrok Tunnel**: Creates a public URL that tunnels to your local server
4. **Single URL**: Both frontend and backend are accessible through the same ngrok URL

## 🌍 What You Get

After running the deployment script, you'll get:
- A public URL like `https://abc123.ngrok.io`
- Your entire app accessible from anywhere in the world
- Both frontend and backend working together seamlessly

## 📱 Sharing with Friends

1. Copy the ngrok URL (e.g., `https://abc123.ngrok.io`)
2. Send it to your friends via:
   - WhatsApp
   - Email
   - Discord
   - Any messaging app
3. They can open it in any web browser!

## ⚠️ Important Notes

- **One Tunnel Only**: You can only have one ngrok tunnel running at a time
- **Temporary URLs**: ngrok URLs change each time you restart (unless you have a paid account)
- **Local Development**: The app still works locally at `http://localhost:5000`
- **Security**: This is for testing/demo purposes. For production, use proper hosting

## 🛠️ Manual Setup (if scripts don't work)

### Step 1: Build Frontend
```bash
cd frontend
npm install
npm run build
cd ..
```

### Step 2: Start Backend
```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```

### Step 3: Start ngrok
```bash
ngrok http 5000
```

## 🔍 Troubleshooting

### ngrok not found
- Windows: `winget install ngrok.ngrok`
- Linux: Follow instructions at https://ngrok.com/download

### Port 5000 already in use
- Kill the process using port 5000
- Or change the port in `backend/app.py` and update ngrok command

### Frontend build fails
- Make sure Node.js is installed
- Try: `npm cache clean --force`
- Delete `node_modules` and run `npm install` again

### Backend fails to start
- Make sure Python 3.7+ is installed
- Check that all requirements are installed
- Look for error messages in the terminal

## 🎯 Next Steps

Once your app is running globally:
1. Test all features work correctly
2. Share the URL with friends
3. Monitor the ngrok dashboard for traffic
4. Consider upgrading to a paid ngrok account for permanent URLs

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Make sure all prerequisites are installed
3. Try restarting the deployment process
4. Check that your firewall isn't blocking the connections

Happy sharing! 🎉 
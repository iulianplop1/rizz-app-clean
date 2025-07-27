# 🚀 Instagram AI Wingman

An advanced AI-powered messaging assistant for Instagram conversations with intelligent reply suggestions, conversation analysis, and relationship tracking.

## ✨ Features

### 🤖 AI-Powered Messaging
- **Smart Reply Generation** - Get 3 AI-generated replies for any conversation
- **Message Polish** - Improve your messages with AI enhancement
- **Nuclear Flirt Mode** - Bold, high-impact flirty messages
- **Auto AI Replies** - Automatic AI response generation
- **Custom Tone Control** - Set conversation tone (flirty, playful, serious, etc.)

### 📊 Advanced Analytics
- **Relationship Progress Tracking** - Visual progress bars for each conversation
- **Per-Girl Analytics** - Detailed metrics for each profile:
  - Message counts (hers vs yours)
  - Average response times in seconds
  - Top words and emojis used
  - Compliment counts
  - Green/red flag examples
- **Mood Analysis** - Real-time sentiment tracking
- **Engagement Metrics** - Conversation depth and consistency

### 🔍 Smart Features
- **Message Search** - Find specific words/phrases in conversations
- **Conversation Goals** - Set and track relationship objectives
- **Profile Management** - Store and manage girl profiles
- **AI Assistant** - Ask questions about specific girls with conversation context
- **Real-time Updates** - Live conversation monitoring

### ⚙️ Configuration
- **API Key Management** - Secure Gemini API key storage
- **Instagram Integration** - Business account webhook setup
- **Telegram Notifications** - Optional notification system
- **Custom Preferences** - Personalized AI behavior settings

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python app.py
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

### Initial Configuration
1. Open the app in your browser (http://localhost:3000)
2. Go to **Settings** page
3. Enter your **Gemini API Key** from Google AI Studio
4. Configure your **Instagram Business Account ID** (optional)
5. Set your **preferences** and **user profile**
6. Test your API key using the test button
7. Save settings

## 📱 Usage Guide

### Getting Started
1. **Configure Settings** - Set up your API keys and preferences
2. **Add Profiles** - Create profiles for the girls you're talking to
3. **Start Conversations** - Use the inbox to view and manage conversations
4. **Get AI Help** - Use AI replies and message polish for better conversations

### Key Features

#### 🤖 AI Replies
- Type your message in the conversation view
- Click "Get AI Replies" for 3 smart suggestions
- Enable "Nuclear Flirt Mode" for bold messages
- Use "Auto AI" for automatic suggestions

#### 📊 Analytics
- View relationship progress for each conversation
- Check detailed per-girl analytics
- Monitor response times and engagement
- Track conversation goals and achievements

#### 🔍 Message Search
- Search for specific words in conversations
- Navigate between search results
- Find important moments quickly

#### ⚙️ Settings
- Manage API keys securely
- Configure AI behavior preferences
- Set default conversation tones
- Enable/disable features

## 🔧 API Endpoints

### Profiles
- `GET /api/profiles` - Get all profiles
- `GET /api/profiles/<id>` - Get specific profile
- `PUT /api/profiles/<id>` - Update profile
- `POST /api/profiles` - Create new profile

### AI Features
- `POST /api/polish` - Polish a message
- `POST /api/ai-reply` - Generate AI replies
- `POST /api/extract-profile` - Extract profile data from messages

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update settings
- `POST /api/test-gemini` - Test API key

### Instagram Webhook
- `POST /webhook/instagram` - Receive Instagram messages

## 📁 Project Structure

```
rizz/
├── backend/
│   ├── app.py                 # Main Flask application
│   ├── requirements.txt       # Python dependencies
│   ├── settings.json         # User settings storage
│   ├── profiles.json         # Girl profiles data
│   └── user_profile.json     # User profile data
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Inbox.js      # Main inbox view
│   │   │   ├── ConversationView.js  # Chat interface
│   │   │   ├── Analytics.js  # Analytics dashboard
│   │   │   ├── Settings.js   # Settings page
│   │   │   ├── AIAssistant.js # AI chat interface
│   │   │   └── Profiles.js   # Profile management
│   │   └── App.js           # Main app component
│   └── package.json         # Node.js dependencies
└── README.md               # This file
```

## 🔒 Security & Privacy

- **API Keys** - Stored locally in settings.json
- **Data Storage** - All data stored locally in JSON files
- **No External Sharing** - Conversations stay on your device
- **Secure Communication** - HTTPS for API calls

## 🚀 Deployment

### Local Development
- Backend runs on `http://localhost:5000`
- Frontend runs on `http://localhost:3000`
- Both servers must be running simultaneously

### Production Deployment
1. Set up a production server
2. Configure environment variables
3. Use a production database (PostgreSQL recommended)
4. Set up SSL certificates
5. Configure Instagram webhook URLs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is for educational and personal use only. Please respect Instagram's terms of service and use responsibly.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify your API key is valid
3. Ensure both servers are running
4. Check the network tab for failed requests

## 🎯 Roadmap

- [ ] Instagram Business API integration
- [ ] Advanced sentiment analysis
- [ ] Conversation scheduling
- [ ] Multi-language support
- [ ] Mobile app version
- [ ] Advanced analytics dashboard
- [ ] Integration with other platforms

---

**Built with ❤️ using React, Flask, and Google Gemini AI** 
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Container,
  Chip,
  Divider,
  Alert,
  Snackbar,
  Alert as MuiAlert
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AIAssistant = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKeyError, setShowApiKeyError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
    fetchSettings();
  }, []);

  // 1. When changing selectedProfile, clear the chat
  useEffect(() => {
    setMessages([]);
  }, [selectedProfile]);

  const fetchProfiles = async () => {
    try {
      const response = await axios.get('https://3e79a6ace678.ngrok-free.app/api/profiles');
      // Convert object to array with id field for easier handling
      const profilesArray = Object.entries(response.data).map(([id, profile]) => ({
        id,
        ...profile
      }));
      setProfiles(profilesArray);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('https://3e79a6ace678.ngrok-free.app/api/settings');
      setGeminiApiKey(response.data.gemini_api_key || '');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    if (!geminiApiKey) {
      setShowApiKeyError(true);
      return;
    }

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      // Get selected profile data
      const profileData = selectedProfile ? profiles.find(p => p.id === selectedProfile) : null;
      
      let aiResponse;
      
      if (profileData) {
        // Create a custom prompt with profile data for context-aware responses
        const recentMessages = messages.slice(-6).map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n');
        const contextPrompt = `You are an AI assistant helping with dating and conversation management. 

Context about the girl you're asking about:
Name: ${profileData.name || 'Unknown'}
Username: ${profileData.username || 'Unknown'}
Tone Preference: ${profileData.tone_preference || 'Not specified'}
Likes: ${profileData.likes?.join(', ') || 'None specified'}
Personality Tags: ${profileData.personality_tags?.join(', ') || 'None specified'}
Inside Jokes: ${profileData.inside_jokes?.join(', ') || 'None specified'}
Details: ${JSON.stringify(profileData.details || {})}
Conversation Goals: ${profileData.conversation_goals?.join(', ') || 'None specified'}
Recent Messages: ${profileData.previous_messages?.slice(-20).map(m => `${m.from}: ${m.text}`).join('\n') || 'No recent messages'}

Recent Conversation:
${recentMessages}

Based on this information, please answer the following question: ${userMessage}

Keep your answer concise and actionable unless I specifically ask for a detailed breakdown. Avoid markdown formatting, bullet lists, or section headers unless requested.`;

        // Call Gemini directly with the context-aware prompt
        if (geminiApiKey) {
          const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBJYFwycbxfwTal-Dfoh-wdb3kN_PhsEJo', {
            contents: [{ parts: [{ text: contextPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
        } else {
          aiResponse = 'Sorry, AI functionality is currently unavailable. API key not set.';
        }
      } else {
        // For general questions, we need to create a custom prompt and call Gemini directly
        const recentMessages = messages.slice(-6).map(m => `${m.role === 'user' ? 'You' : 'AI'}: ${m.content}`).join('\n');
        const generalPrompt = `You are an AI assistant helping with dating and conversation management. 

Recent Conversation:
${recentMessages}

Please answer this general question about dating and conversation strategies: ${userMessage}

Keep your answer concise and actionable unless I specifically ask for a detailed breakdown. Avoid markdown formatting, bullet lists, or section headers unless requested.`;

        // Call Gemini directly for general questions
        if (geminiApiKey) {
          const response = await axios.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=AIzaSyBJYFwycbxfwTal-Dfoh-wdb3kN_PhsEJo', {
            contents: [{ parts: [{ text: generalPrompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          aiResponse = response.data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I couldn\'t generate a response.';
        } else {
          aiResponse = 'Sorry, AI functionality is currently unavailable. API key not set.';
        }
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error while processing your request.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSelectedProfileInfo = () => {
    if (!selectedProfile) return null;
    return profiles.find(p => p.id === selectedProfile);
  };

  const selectedProfileData = getSelectedProfileInfo();

  return (
    <>
      <Box
        sx={{
          minHeight: '100vh',
          width: '100%',
          background: 'none',
          fontFamily: 'Inter, Poppins, system-ui, sans-serif',
          color: 'var(--text-primary)',
          transition: 'color 0.3s',
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 8 }, maxWidth: 1200 }}>
          {/* Main Hero Section */}
          <Box
            className="glass-element"
            sx={{
              textAlign: { xs: 'center', md: 'left' },
              mb: { xs: 6, md: 10 },
              background: { xs: undefined, md: undefined },
              color: 'var(--text-primary)',
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
              borderRadius: 3,
              p: { xs: 2, md: 4 },
              transition: 'background 0.3s, color 0.3s',
            }}
          >
            <Typography variant="h1" sx={{ fontSize: { xs: 40, md: 56 }, fontWeight: 800, letterSpacing: '-0.02em', mb: 2, color: 'var(--text-primary)' }}>
              Get Better at Dating with AI
            </Typography>
            <Typography variant="h5" sx={{ fontSize: { xs: 20, md: 28 }, fontWeight: 500, color: 'var(--text-secondary)', mb: 4, maxWidth: 700 }}>
              Your smart, modern AI wingman. Start a conversation, get advice, or ask about anyone in your database.
            </Typography>
            <Button
              variant="contained"
              size="large"
              sx={{
                fontSize: 18,
                fontWeight: 600,
                borderRadius: 2,
                px: 5,
                py: 1.5,
                boxShadow: '0 4px 12px 0 rgba(108,99,255,0.08)',
                background: 'linear-gradient(90deg, #6c63ff 0%, #ff6b6b 100%)',
                color: 'white',
                mb: { xs: 4, md: 0 },
                transition: 'all 0.2s',
                '&:hover': { filter: 'brightness(1.08)' },
                outline: 'none',
              }}
              onClick={() => {
                const el = document.getElementById('ai-chat-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Start Conversation
            </Button>
          </Box>

          {/* Profile Selection - horizontal card pills */}
          <Box sx={{ mb: { xs: 6, md: 10 }, display: 'flex', flexDirection: 'column', alignItems: { xs: 'center', md: 'flex-start' } }}>
            <Typography variant="h6" sx={{ fontSize: 24, fontWeight: 600, mb: 2, color: 'var(--text-primary)' }}>
              Choose a Profile
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', width: '100%', justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <Button
                variant={selectedProfile === '' ? 'contained' : 'outlined'}
                onClick={() => setSelectedProfile('')}
                sx={{
                  borderRadius: 3,
                  px: 3,
                  py: 1.2,
                  fontWeight: 500,
                  fontSize: 16,
                  background: selectedProfile === '' ? 'linear-gradient(90deg, #6c63ff 0%, #ff6b6b 100%)' : 'var(--card-bg)',
                  color: selectedProfile === '' ? 'white' : 'var(--text-primary)',
                  boxShadow: selectedProfile === '' ? '0 4px 12px 0 rgba(108,99,255,0.08)' : 'none',
                  border: '1.5px solid #e2e8f0',
                  transition: 'all 0.2s',
                  '&:hover': { transform: 'scale(1.02)', filter: 'brightness(1.08)' },
                  outline: 'none',
                }}
              >
                General (No Profile)
              </Button>
              {profiles.map((profile) => (
                <Button
                  key={profile.id}
                  variant={selectedProfile === profile.id ? 'contained' : 'outlined'}
                  onClick={() => setSelectedProfile(profile.id)}
                  sx={{
                    borderRadius: 3,
                    px: 3,
                    py: 1.2,
                    fontWeight: 500,
                    fontSize: 16,
                    background: selectedProfile === profile.id ? 'linear-gradient(90deg, #6c63ff 0%, #ff6b6b 100%)' : 'var(--card-bg)',
                    color: selectedProfile === profile.id ? 'white' : 'var(--text-primary)',
                    boxShadow: selectedProfile === profile.id ? '0 4px 12px 0 rgba(108,99,255,0.08)' : 'none',
                    border: '1.5px solid #e2e8f0',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.02)', filter: 'brightness(1.08)' },
                    outline: 'none',
                  }}
                >
                  {profile.name || profile.username || profile.id}
                </Button>
              ))}
            </Box>
          </Box>

          {/* AI Chat Section */}
          <Box id="ai-chat-section" sx={{ mb: { xs: 6, md: 10 }, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, alignItems: 'flex-start', justifyContent: 'center' }}>
            {/* Profile Info Card (secondary) */}
            {selectedProfileData && (
              <Paper elevation={2} className="glass-element" sx={{ p: 3, minWidth: 260, maxWidth: 320, mb: { xs: 4, md: 0 }, borderRadius: 3, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', background: 'var(--gradient-card)', color: 'var(--text-primary)', transition: 'background 0.3s, color 0.3s' }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 20, mb: 2, color: 'var(--text-primary)' }}>Profile Info</Typography>
                {selectedProfileData.likes?.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: 'var(--text-primary)', fontWeight: 500 }}>Likes:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {selectedProfileData.likes.map((like, index) => (
                        <Chip
                          key={index}
                          label={like}
                          size="small"
                          variant="filled"
                          sx={{
                            color: 'var(--text-primary)',
                            background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : '#e3e8f0',
                            border: (theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.25)' : '1px solid #cbd5e1',
                            fontWeight: 500,
                            fontSize: 15,
                            letterSpacing: 0.1,
                            mb: 0.5,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                {selectedProfileData.personality_tags?.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="var(--text-secondary)">Personality:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {selectedProfileData.personality_tags.map((tag, index) => (
                        <Chip key={index} label={tag} size="small" color="primary" />
                      ))}
                    </Box>
                  </Box>
                )}
                {selectedProfileData.inside_jokes?.length > 0 && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="var(--text-secondary)">Inside Jokes:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {selectedProfileData.inside_jokes.map((joke, index) => (
                        <Chip key={index} label={joke} size="small" color="secondary" />
                      ))}
                    </Box>
                  </Box>
                )}
                {selectedProfileData.conversation_goals?.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="var(--text-secondary)">Goals:</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {selectedProfileData.conversation_goals.map((goal, index) => (
                        <Chip key={index} label={goal} size="small" color="success" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            )}
            {/* Group Chat Card and Quick Questions in a vertical flex container */}
            <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 320, gap: 3 }}>
            {/* Chat Card */}
              <Paper elevation={3} className="card" sx={{ flex: 1, borderRadius: 3, boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', minHeight: 420, background: 'var(--card-bg)', color: 'var(--text-primary)', transition: 'background 0.3s, color 0.3s' }}>
              <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                {messages.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="h6" color="var(--text-secondary)" gutterBottom>
                      Start a conversation with your AI assistant
                    </Typography>
                      <Typography variant="body2" color="var(--text-secondary)">
                      {selectedProfileData 
                        ? `Ask me anything about ${selectedProfileData.name || selectedProfileData.username}!`
                        : 'Ask me about dating strategies, conversation tips, or select a profile to ask specific questions.'
                      }
                    </Typography>
                  </Box>
                ) : (
                  messages.map((message, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: 2,
                        display: 'flex',
                        justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Paper
                        sx={{
                          p: 2,
                          maxWidth: '70%',
                          backgroundColor: message.role === 'user' ? 'primary.main' : 'grey.100',
                            color: message.role === 'user' ? 'white' : 'var(--text-primary)',
                          borderRadius: 2,
                          boxShadow: message.role === 'user' ? '0 2px 8px 0 rgba(108,99,255,0.08)' : '0 2px 8px 0 rgba(0,0,0,0.04)',
                          fontSize: 16,
                          fontWeight: 400,
                          letterSpacing: '-0.01em',
                          transition: 'all 0.2s',
                        }}
                      >
                        <Typography variant="body1" sx={{ fontSize: 16, lineHeight: 1.6 }}>{message.content}</Typography>
                      </Paper>
                    </Box>
                  ))
                )}
                {loading && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                    <Paper sx={{ p: 2, backgroundColor: 'grey.100', borderRadius: 2 }}>
                        <Typography variant="body1" color="var(--text-secondary)">
                        <span className="typing-indicator" style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c63ff', display: 'inline-block', marginRight: 2, animation: 'blink 1s infinite alternate' }}></span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c63ff', display: 'inline-block', marginRight: 2, animation: 'blink 1s 0.2s infinite alternate' }}></span>
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6c63ff', display: 'inline-block', animation: 'blink 1s 0.4s infinite alternate' }}></span>
                        </span>
                        Thinking...
                      </Typography>
                    </Paper>
                  </Box>
                )}
              </Box>
              <Divider />
              {/* Input */}
                <Box sx={{ p: 3, bgcolor: 'transparent', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      selectedProfileData 
                        ? `Ask me about ${selectedProfileData.name || selectedProfileData.username}...`
                        : "Ask me anything about dating, conversation strategies..."
                    }
                    disabled={loading}
                    sx={{
                      fontSize: 16,
                      borderRadius: 2,
                        background: 'var(--card-bg)',
                        color: 'var(--text-primary)',
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                          background: 'var(--card-bg)',
                          color: 'var(--text-primary)',
                      },
                      '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#6c63ff',
                        boxShadow: '0 0 0 2px #6c63ff33',
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    sx={{
                      height: '56px',
                      minWidth: '56px',
                      borderRadius: 2,
                      fontWeight: 600,
                      fontSize: 20,
                      background: 'linear-gradient(90deg, #6c63ff 0%, #ff6b6b 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px 0 rgba(108,99,255,0.08)',
                      transition: 'all 0.2s',
                      '&:hover': { filter: 'brightness(1.08)' },
                      outline: 'none',
                    }}
                  >
                    <SendIcon />
                  </Button>
                </Box>
              </Box>
            </Paper>
              {/* Quick Questions Section - now always directly beneath the chat card */}
              <Box className="card" sx={{ mt: 0, background: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: 3, boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)', transition: 'background 0.3s, color 0.3s', pb: 4 }}>
                <Typography variant="h6" sx={{ fontSize: 24, fontWeight: 600, mb: 2, color: 'var(--text-primary)', ml: 2 }}>
            Quick Questions
          </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 4, maxWidth: 700, mx: 'auto', mb: 0, pb: 0 }}>
              {[
                "What's her favorite pet?",
                "What should I talk about next?",
                "How can I make her laugh?",
                "What's the best time to ask her out?"
              ].map((question, index) => (
                <Paper
                  key={index}
                  elevation={1}
                      className="glass-element"
                  sx={{
                    p: 3,
                    borderRadius: 3,
                        fontSize: 18,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        background: 'var(--gradient-card)',
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 16px 0 rgba(108,99,255,0.10)' },
                    outline: 'none',
                    textAlign: 'center',
                        minHeight: 80,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Ask: ${question}`}
                  onClick={() => setInput(question)}
                >
                  {question}
                </Paper>
              ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
      <Snackbar
        open={showApiKeyError}
        autoHideDuration={6000}
        onClose={() => setShowApiKeyError(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          severity="error"
          sx={{ fontSize: 18, alignItems: 'center' }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/settings')}>Go to Settings</Button>
          }
        >
          AI features are unavailable. Please enter your Gemini API key in Settings.
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default AIAssistant; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Refresh,
  Psychology,
  School,
  Settings,
  Chat,
  EmojiEmotions,
  Speed,
  TrendingUp,
  Help,
  ExpandMore,
  Add,
  Send
} from '@mui/icons-material';
import axios from 'axios';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';

const ConversationSimulator = () => {
  const [profiles, setProfiles] = useState([]);
  const [selectedPersonality, setSelectedPersonality] = useState(null);
  const [customPersonality, setCustomPersonality] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationMode, setSimulationMode] = useState('practice'); // practice, training, advanced
  const [difficulty, setDifficulty] = useState('medium'); // easy, medium, hard
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [personalityDialog, setPersonalityDialog] = useState(false);
  const [customPersonalityDialog, setCustomPersonalityDialog] = useState(false);
  const [stats, setStats] = useState({
    messagesSent: 0,
    responsesReceived: 0,
    practiceTime: 0,
    successRate: 0
  });
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKeyError, setShowApiKeyError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('ConversationSimulator useEffect - fetching profiles and loading stats');
    fetchProfiles();
    loadStats();
    fetchSettings();
  }, []);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('State changed - isSimulating:', isSimulating, 'selectedPersonality:', selectedPersonality?.name);
  }, [isSimulating, selectedPersonality]);

  const fetchProfiles = async () => {
    try {
      console.log('Fetching profiles...');
      const response = await axios.get('https://3e79a6ace678.ngrok-free.app/api/profiles');
      console.log('Profiles fetched:', response.data.length, 'profiles');
      setProfiles(response.data);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const loadStats = () => {
    const savedStats = localStorage.getItem('simulatorStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  };

  const saveStats = (newStats) => {
    setStats(newStats);
    localStorage.setItem('simulatorStats', JSON.stringify(newStats));
  };

  const generatePersonalityFromProfiles = () => {
    console.log('Generating personality from profiles. Profiles count:', profiles.length);
    if (profiles.length === 0) {
      console.log('No profiles found, returning null');
      return null;
    }

    // Analyze all profiles to create a composite personality
    const allLikes = [];
    const allPersonality = [];
    const allDetails = {};

    profiles.forEach(profile => {
      if (profile.likes) allLikes.push(...profile.likes);
      if (profile.personality_tags) allPersonality.push(...profile.personality_tags);
      if (profile.details) Object.assign(allDetails, profile.details);
    });

    // Get most common traits
    const likeCounts = {};
    const personalityCounts = {};

    allLikes.forEach(like => {
      likeCounts[like] = (likeCounts[like] || 0) + 1;
    });

    allPersonality.forEach(trait => {
      personalityCounts[trait] = (personalityCounts[trait] || 0) + 1;
    });

    const topLikes = Object.entries(likeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([like]) => like);

    const topPersonality = Object.entries(personalityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 6)
      .map(([trait]) => trait);

    return {
      name: "Composite Girl",
      likes: topLikes,
      personality: topPersonality,
      details: allDetails,
      difficulty: 'medium',
      description: "AI-generated personality based on your real conversations"
    };
  };

  const startSimulation = async (personality) => {
    console.log('Starting simulation with personality:', personality);
    if (!personality) {
      console.log('Cannot start simulation - no personality provided');
      return;
    }
    setSelectedPersonality(personality);
    setMessages([]);
    setIsSimulating(true);
    setAiResponse('');
    
    // Add initial greeting
    const greeting = generateGreeting(personality);
    setMessages([{
      from: 'AI',
      text: greeting,
      timestamp: new Date().toLocaleTimeString()
    }]);
    console.log('Simulation started - isSimulating should be true');
  };

  const generateGreeting = (personality) => {
    const greetings = [
      "Hey! How are you doing? 😊",
      "Hi there! What's up?",
      "Hey! Nice to hear from you",
      "Hello! How's your day going?",
      "Hi! What are you up to? 😄"
    ];
    
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('https://3e79a6ace678.ngrok-free.app/api/settings');
      setGeminiApiKey(response.data.gemini_api_key || '');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !selectedPersonality) return;
    if (!geminiApiKey) {
      setShowApiKeyError(true);
      return;
    }

    const userMessage = input;
    setInput('');
    setLoading(true);

    // Add user message
    const newMessages = [...messages, {
      from: 'You',
      text: userMessage,
      timestamp: new Date().toLocaleTimeString()
    }];
    setMessages(newMessages);

    try {
      // Generate AI response based on personality
      // Use personality's difficulty if it exists, otherwise use global difficulty
      const effectiveDifficulty = selectedPersonality.difficulty || difficulty;
      console.log('Using difficulty:', effectiveDifficulty, '(personality difficulty:', selectedPersonality.difficulty, ', global difficulty:', difficulty, ')');
      
      const requestData = {
        personality: selectedPersonality,
        userMessage: userMessage,
        conversationHistory: newMessages,
        difficulty: effectiveDifficulty,
        mode: simulationMode
      };
      console.log('Sending request to backend:', requestData);
      const response = await axios.post('https://3e79a6ace678.ngrok-free.app/api/simulate-conversation', requestData);

      console.log('AI Response:', response.data);
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      const aiResponse = response.data.response;
      console.log('Extracted AI Response:', aiResponse);
      console.log('AI Response type:', typeof aiResponse);
      console.log('AI Response length:', aiResponse ? aiResponse.length : 'null');
      setAiResponse(aiResponse);

      // Add AI response to conversation
      const aiMessage = {
        from: 'AI',
        text: aiResponse,
        timestamp: new Date().toLocaleTimeString()
      };
      console.log('AI message object:', aiMessage);
      const updatedMessages = [...newMessages, aiMessage];
      console.log('Updated messages array:', updatedMessages);
      console.log('Messages array length:', updatedMessages.length);
      setMessages(updatedMessages);
      console.log('setMessages called with:', updatedMessages.length, 'messages');

      // Update stats
      const newStats = {
        ...stats,
        messagesSent: stats.messagesSent + 1,
        responsesReceived: stats.responsesReceived + 1
      };
      saveStats(newStats);
      
      console.log('After successful AI response - isSimulating:', isSimulating);
      console.log('After successful AI response - selectedPersonality:', selectedPersonality);
      console.log('After successful AI response - messages count:', messages.length);
      
      // Force a re-render check
      setTimeout(() => {
        console.log('After 100ms - isSimulating:', isSimulating);
        console.log('After 100ms - selectedPersonality:', selectedPersonality);
        console.log('After 100ms - messages count:', messages.length);
      }, 100);

    } catch (error) {
      console.error('Error generating AI response:', error);
      console.log('Current isSimulating state:', isSimulating);
      console.log('Current selectedPersonality:', selectedPersonality);
      setAiResponse('Sorry, I encountered an error. Please try again.');
    } finally {
      setLoading(false);
      console.log('After finally - isSimulating:', isSimulating);
      console.log('After finally - selectedPersonality:', selectedPersonality);
    }
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    setSelectedPersonality(null);
    setMessages([]);
    setAiResponse('');
  };

  const resetSimulation = () => {
    setMessages([]);
    setAiResponse('');
    if (selectedPersonality) {
      const greeting = generateGreeting(selectedPersonality);
      setMessages([{
        from: 'AI',
        text: greeting,
        timestamp: new Date().toLocaleTimeString()
      }]);
    }
  };

  const createCustomPersonality = () => {
    setCustomPersonalityDialog(true);
  };

  const saveCustomPersonality = (personality) => {
    setCustomPersonality(personality);
    setCustomPersonalityDialog(false);
  };

  const getDifficultyColor = (level) => {
    switch (level) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'error';
      default: return 'default';
    }
  };

  const getModeDescription = (mode) => {
    switch (mode) {
      case 'practice': return 'Free practice with AI responses';
      case 'training': return 'Guided training with tips and feedback';
      case 'advanced': return 'Advanced scenarios and challenges';
      default: return '';
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif' }}>
      {/* Header with Practice Stats widget */}
      <Box sx={{ display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 4, gap: 2, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <School sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="h3" component="h1" sx={{ fontWeight: 800, fontSize: { xs: 28, md: 32 }, color: 'var(--text-primary)' }}>
              Conversation Simulator
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1, fontSize: 16, fontWeight: 400 }}>
            Practice conversations with AI-generated personalities based on your real conversations. Perfect for testing different approaches in a safe environment!
          </Typography>
        </Box>
        {/* Minimalist Practice Stats Widget */}
        <Paper className="card" sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 1.5, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', background: 'var(--card-bg)', color: 'var(--text-primary)', minWidth: 0, mt: { xs: 2, sm: 0 }, width: 'auto', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TrendingUp sx={{ color: '#2563EB', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: 14 }}>Stats</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, borderColor: '#e5e7eb' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Sent</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 15 }}>{stats.messagesSent}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, borderColor: '#e5e7eb' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Resp</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 15 }}>{stats.responsesReceived}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, borderColor: '#e5e7eb' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Time</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 15 }}>{Math.floor(stats.practiceTime / 60)}m {stats.practiceTime % 60}s</Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ mx: 1, height: 24, borderColor: '#e5e7eb' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)' }}>Success</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 15 }}>{stats.successRate}%</Typography>
          </Box>
        </Paper>
      </Box>
      {/* Main Two-Column Layout */}
      <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', minHeight: '70vh' }}>
        {/* Left Column (Personality & Settings) */}
        <Box sx={{ flex: '0 0 40%', minWidth: 320, maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Personality Selection Grid */}
          <Paper className="card" sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', mb: 0, transition: 'box-shadow 0.2s', background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 20, mb: 2, color: 'var(--text-primary)' }}>
              Choose Personality
            </Typography>
            <Grid container spacing={2}>
              {/* Custom Personality Card */}
              <Grid item xs={6}>
                <Card
                  className="card"
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 16px rgba(108,99,255,0.10)' },
                    border: selectedPersonality?.name === 'Composite Girl' ? '2px solid #2563EB' : '1px solid #e5e7eb',
                    background: 'var(--card-bg)',
                    color: 'var(--text-primary)',
                  }}
                  onClick={() => {
                    const personality = generatePersonalityFromProfiles();
                    if (personality) startSimulation(personality);
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2563EB' }}>🎯 Custom Personality</Typography>
                    <Typography variant="body2" sx={{ mb: 1, color: 'var(--text-secondary)' }}>
                      AI-generated from your real conversations
                    </Typography>
                    <Chip size="small" label="Based on your girls" color="primary" />
                  </CardContent>
                </Card>
              </Grid>
              {/* Predefined Personalities (2x2 grid) */}
              {[
                {
                  name: "Emma - The Adventurous One",
                  likes: ["travel", "hiking", "photography", "coffee", "books"],
                  personality: ["adventurous", "independent", "creative", "curious"],
                  difficulty: "easy",
                  description: "Loves exploring new places and sharing experiences"
                },
                {
                  name: "Sophia - The Intellectual",
                  likes: ["reading", "philosophy", "art", "wine", "museums"],
                  personality: ["intellectual", "thoughtful", "sophisticated", "deep"],
                  difficulty: "medium",
                  description: "Enjoys deep conversations and intellectual topics"
                },
                {
                  name: "Isabella - The Social Butterfly",
                  likes: ["parties", "dancing", "fashion", "makeup", "friends"],
                  personality: ["social", "energetic", "fashionable", "fun-loving"],
                  difficulty: "medium",
                  description: "Very social and loves having fun with friends"
                },
                {
                  name: "Olivia - The Shy One",
                  likes: ["movies", "music", "anime", "gaming", "quiet time"],
                  personality: ["shy", "introverted", "thoughtful", "loyal"],
                  difficulty: "hard",
                  description: "Shy but very loyal once you get to know her"
                }
              ].map((personality, idx) => (
                <Grid item xs={6} key={idx}>
                  <Card
                    className="card"
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': { transform: 'scale(1.02)', boxShadow: '0 4px 16px rgba(108,99,255,0.10)' },
                      border: selectedPersonality?.name === personality.name ? '2px solid #2563EB' : '1px solid #e5e7eb',
                      background: 'var(--card-bg)',
                      color: 'var(--text-primary)',
                    }}
                    onClick={() => startSimulation(personality)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>{personality.name}</Typography>
                        <Chip size="small" label={personality.difficulty} color={getDifficultyColor(personality.difficulty)} sx={{ fontWeight: 500, fontSize: 13 }} />
                      </Box>
                      <Typography variant="body2" sx={{ mb: 1, color: 'var(--text-secondary)' }}>
                        {personality.description}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {personality.likes.slice(0, 3).map((like, i) => (
                          <Chip
                            key={i}
                            size="small"
                            label={like}
                            variant="outlined"
                            sx={{
                              borderRadius: 2,
                              fontWeight: 500,
                              color: 'var(--text-primary)',
                              borderColor: 'rgba(255,255,255,0.25)',
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Add />}
              onClick={createCustomPersonality}
              sx={{ mt: 3, borderRadius: 2, fontWeight: 600, fontSize: 16 }}
            >
              Create Custom Personality
            </Button>
          </Paper>
          {/* Settings Card */}
          <Paper className="card" sx={{ p: 3, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', mt: 0, background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 18, mb: 2, color: 'var(--text-primary)' }}>
              Simulation Settings
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: 'var(--text-primary)' }}>Mode</InputLabel>
              <Select
                value={simulationMode}
                label="Mode"
                onChange={(e) => setSimulationMode(e.target.value)}
                sx={{
                  borderRadius: 2,
                  color: 'var(--text-primary)',
                  '& .MuiSelect-icon': { color: 'var(--text-primary)' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { background: 'var(--card-bg)', color: 'var(--text-primary)' }
                  }
                }}
              >
                <MenuItem value="practice">Practice Mode</MenuItem>
                <MenuItem value="training">Training Mode</MenuItem>
                <MenuItem value="advanced">Advanced Mode</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel sx={{ color: 'var(--text-primary)' }}>Difficulty</InputLabel>
              <Select
                value={difficulty}
                label="Difficulty"
                onChange={(e) => setDifficulty(e.target.value)}
                sx={{
                  borderRadius: 2,
                  color: 'var(--text-primary)',
                  '& .MuiSelect-icon': { color: 'var(--text-primary)' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.18)' },
                }}
                MenuProps={{
                  PaperProps: {
                    sx: { background: 'var(--card-bg)', color: 'var(--text-primary)' }
                  }
                }}
              >
                <MenuItem value="easy">Easy</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="hard">Hard</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" sx={{ fontSize: 15, color: 'var(--text-secondary)' }}>
              {getModeDescription(simulationMode)}
            </Typography>
          </Paper>
        </Box>
        {/* Right Column (Chat Area) */}
        <Box sx={{ flex: '0 0 60%', minWidth: 340, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper className="card" sx={{ p: 0, borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', height: '70vh', display: 'flex', flexDirection: 'column', background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
            {/* Chat Header */}
            <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)' }}>
                  {selectedPersonality ? selectedPersonality.name : 'No Simulation Active'}
                </Typography>
                {selectedPersonality && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: 15 }}>
                    {selectedPersonality.description}
                  </Typography>
                )}
              </Box>
              <Box>
                {isSimulating ? (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<Stop />}
                      onClick={stopSimulation}
                      sx={{ mr: 1, borderRadius: 2, fontWeight: 600 }}
                    >
                      Stop
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Refresh />}
                      onClick={resetSimulation}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      Reset
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<PlayArrow />}
                    disabled={!selectedPersonality}
                    sx={{ borderRadius: 2, fontWeight: 700, fontSize: 16, background: 'linear-gradient(90deg, #6c63ff 0%, #ff6b6b 100%)', color: 'white', boxShadow: '0 4px 12px 0 rgba(108,99,255,0.08)', '&:hover': { filter: 'brightness(1.08)' } }}
                  >
                    Start Simulation
                  </Button>
                )}
              </Box>
            </Box>
            {/* Messages Area */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3, background: 'none' }}>
              {messages.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Chat sx={{ fontSize: 60, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    Select a personality to start practicing
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                    Choose from predefined personalities or create a custom one
                  </Typography>
                </Box>
              ) : (
                messages.map((message, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      display: 'flex',
                      justifyContent: message.from === 'You' ? 'flex-end' : 'flex-start',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Paper
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor: message.from === 'You' ? '#2563EB' : 'rgba(255,255,255,0.08)',
                        color: message.from === 'You' ? 'white' : 'var(--text-primary)',
                        borderRadius: 2,
                        boxShadow: '0 2px 8px 0 rgba(0,0,0,0.18)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: 16,
                        fontWeight: 400,
                        letterSpacing: '-0.01em',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Typography variant="body1" sx={{ fontSize: 16, lineHeight: 1.6 }}>{message.text}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {message.timestamp}
                      </Typography>
                    </Paper>
                  </Box>
                ))
              )}
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                  <Paper sx={{ p: 2, backgroundColor: '#f3f4f6', borderRadius: 2 }}>
                    <Typography variant="body2" color="#6B7280">
                      AI is typing...
                    </Typography>
                    <LinearProgress sx={{ mt: 1 }} />
                  </Paper>
                </Box>
              )}
            </Box>
            {/* Input Area */}
            <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider', background: 'none' }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={!isSimulating}
                    sx={{
                      borderRadius: 2,
                      background: 'var(--gradient-card)',
                      color: 'var(--text-primary)',
                      fontSize: 16,
                      border: '1.5px solid rgba(255,255,255,0.18)',
                      boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        background: 'var(--gradient-card)',
                        color: 'var(--text-primary)',
                        border: 'none',
                        boxShadow: 'none',
                        '& input::placeholder, & textarea::placeholder': {
                          color: '#bdbdbd',
                          opacity: 1,
                        },
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#2563EB',
                        boxShadow: '0 0 0 2px #2563EB33',
                      },
                    }}
                  />
                </Grid>
                <Grid item>
                  <Button
                    variant="contained"
                    onClick={handleSendMessage}
                    disabled={!isSimulating || !input.trim() || loading}
                    startIcon={<Send />}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: 16,
                      background: 'linear-gradient(90deg, #6c63ff 0%, #ff6b6b 100%)',
                      color: 'white',
                      boxShadow: '0 4px 12px 0 rgba(108,99,255,0.08)',
                      transition: 'all 0.2s',
                      '&:hover': { filter: 'brightness(1.08)' },
                    }}
                  >
                    Send
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Box>
      </Box>
      {/* Custom Personality Dialog */}
      <Dialog open={customPersonalityDialog} onClose={() => setCustomPersonalityDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Custom Personality</DialogTitle>
        <DialogContent>
          <CustomPersonalityForm onSave={saveCustomPersonality} />
        </DialogContent>
      </Dialog>
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
    </Container>
  );
};

// Custom Personality Form Component
const CustomPersonalityForm = ({ onSave }) => {
  const [personality, setPersonality] = useState({
    name: '',
    likes: [],
    personality: [],
    details: {},
    difficulty: 'medium',
    description: ''
  });
  const [newLike, setNewLike] = useState('');
  const [newTrait, setNewTrait] = useState('');

  const addLike = () => {
    if (newLike.trim() && !personality.likes.includes(newLike.trim())) {
      setPersonality({
        ...personality,
        likes: [...personality.likes, newLike.trim()]
      });
      setNewLike('');
    }
  };

  const removeLike = (like) => {
    setPersonality({
      ...personality,
      likes: personality.likes.filter(l => l !== like)
    });
  };

  const addTrait = () => {
    if (newTrait.trim() && !personality.personality.includes(newTrait.trim())) {
      setPersonality({
        ...personality,
        personality: [...personality.personality, newTrait.trim()]
      });
      setNewTrait('');
    }
  };

  const removeTrait = (trait) => {
    setPersonality({
      ...personality,
      personality: personality.personality.filter(t => t !== trait)
    });
  };

  return (
    <Box sx={{ pt: 1 }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Personality Name"
            value={personality.name}
            onChange={(e) => setPersonality({ ...personality, name: e.target.value })}
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Description"
            value={personality.description}
            onChange={(e) => setPersonality({ ...personality, description: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Likes & Interests</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Add interest..."
              value={newLike}
              onChange={(e) => setNewLike(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addLike()}
            />
            <Button size="small" onClick={addLike}>Add</Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {personality.likes.map((like, index) => (
              <Chip
                key={index}
                label={like}
                onDelete={() => removeLike(like)}
                color="primary"
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="subtitle2" gutterBottom>Personality Traits</Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Add trait..."
              value={newTrait}
              onChange={(e) => setNewTrait(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTrait()}
            />
            <Button size="small" onClick={addTrait}>Add</Button>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {personality.personality.map((trait, index) => (
              <Chip
                key={index}
                label={trait}
                onDelete={() => removeTrait(trait)}
                color="secondary"
              />
            ))}
          </Box>
        </Grid>

        <Grid item xs={12}>
          <FormControl fullWidth>
            <InputLabel>Difficulty</InputLabel>
            <Select
              value={personality.difficulty}
              label="Difficulty"
              onChange={(e) => setPersonality({ ...personality, difficulty: e.target.value })}
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button variant="outlined" onClick={() => onSave(null)}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={() => onSave(personality)}
          disabled={!personality.name.trim()}
        >
          Create Personality
        </Button>
      </Box>
    </Box>
  );
};

export default ConversationSimulator; 
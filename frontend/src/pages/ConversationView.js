import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Container,
  Switch,
  FormControlLabel,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
} from '@mui/material';
import {
  AutoAwesome as AutoAwesomeIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const LANGUAGE_OPTIONS = [
  { code: 'ro', label: 'Romanian' },
  { code: 'en', label: 'English' },
  { code: 'ru', label: 'Russian' },
  { code: 'other', label: 'Other...' },
];

const LANGUAGE_LABELS = {
  ro: 'Romanian',
  en: 'English',
  ru: 'Russian',
  other: 'Other...'
};

const ConversationView = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [polishedMessage, setPolishedMessage] = useState('');
  const [aiReplies, setAiReplies] = useState({ reply_1: '', reply_2: '', reply_3: '' });
  const [autoAI, setAutoAI] = useState(false);
  const [nuclearFlirt, setNuclearFlirt] = useState(false);
  const [conversationGoal, setConversationGoal] = useState('');
  const [tonePreference, setTonePreference] = useState('');
  const [customTone, setCustomTone] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const messagesEndRef = useRef(null);
  const lastMsgId = useRef('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [customLanguage, setCustomLanguage] = useState('');
  const controlsRef = useRef(null);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const theme = useTheme();
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showApiKeyError, setShowApiKeyError] = useState(false);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    // Don't auto-scroll if user is actively searching
    if (!isSearching) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Only scroll to bottom if there are new messages (not on initial load)
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]); // Only trigger when message count changes, not on every message update

  useEffect(() => {
    fetchData();
    fetchSettings();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (!autoAI || messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.from !== 'Me' && lastMsg.text && lastMsgId.current !== lastMsg.text) {
      handleAIReply();
      lastMsgId.current = lastMsg.text;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, autoAI]);

  useEffect(() => {
    const checkScroll = () => {
      const el = controlsRef.current;
      if (!el) return;
      const isScrollable = el.scrollHeight > el.clientHeight;
      const notAtBottom = el.scrollTop + el.clientHeight < el.scrollHeight - 24;
      setShowScrollHint(isScrollable && notAtBottom);
    };
    checkScroll();
    const el = controlsRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
    }
    // Also check when content changes
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [profile, autoAI, nuclearFlirt, conversationGoal, tonePreference, customTone, selectedLanguage, customLanguage]);

  const fetchData = async () => {
    try {
      const [profileRes, messagesRes] = await Promise.all([
        axios.get(`https://3e79a6ace678.ngrok-free.app/api/profiles/${id}`),
        axios.get(`https://3e79a6ace678.ngrok-free.app/api/conversations/${id}`)
      ]);
      setProfile(profileRes.data);
      setMessages(messagesRes.data);
      setConversationGoal(profileRes.data.conversation_goals?.[0] || '');
      setTonePreference(profileRes.data.tone_preference || '');
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get('https://3e79a6ace678.ngrok-free.app/api/settings');
      setGeminiApiKey(response.data.apiKeys?.geminiApiKey || '');
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      setShowSearchResults(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = [];
    const searchLower = searchTerm.toLowerCase();
    
    messages.forEach((message, index) => {
      if (message.text && message.text.toLowerCase().includes(searchLower)) {
        results.push({
          index,
          message,
          text: message.text,
          timestamp: message.timestamp
        });
      }
    });

    setSearchResults(results);
    setCurrentSearchIndex(results.length > 0 ? 0 : -1);
    setShowSearchResults(results.length > 0);
  };



  const handlePolish = async () => {
    if (!input.trim() || !profile) return;
    if (!geminiApiKey) {
      setShowApiKeyError(true);
      return;
    }
    setLoading(true);
    try {
      const language = selectedLanguage === 'other' ? customLanguage : LANGUAGE_LABELS[selectedLanguage];
      const response = await axios.post('https://3e79a6ace678.ngrok-free.app/api/ai/polish', {
        user_id: profile.user_id || id,
        message: input,
        tone: nuclearFlirt ? 'nuclear flirt' : (customTone || tonePreference),
        language,
      });
      setPolishedMessage(response.data.polished || 'Could not polish message');
      setInput(response.data.polished || input); // Insert polished message into input
    } catch (error) {
      console.error('Error polishing message:', error);
      setPolishedMessage('Error polishing message');
    } finally {
      setLoading(false);
    }
  };

  const handleAIReply = async () => {
    if (messages.length === 0 || !profile) return;
    if (!geminiApiKey) {
      setShowApiKeyError(true);
      return;
    }
    const lastMessage = messages[messages.length - 1];
    setLoading(true);
    try {
      const language = selectedLanguage === 'other' ? customLanguage : LANGUAGE_LABELS[selectedLanguage];
      const response = await axios.post('https://3e79a6ace678.ngrok-free.app/api/ai/reply', {
        user_id: profile.user_id || id, // Use profile.user_id if available, fallback to URL id
        last_message: lastMessage.text,
        goal: conversationGoal,
        tone: nuclearFlirt ? 'nuclear flirt' : (customTone || tonePreference),
        language,
      });
      setAiReplies(response.data);
    } catch (error) {
      console.error('Error getting AI replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !profile) return;
    
    const messageText = input;
    setInput('');
    setLoading(true);
    
    try {
      // Add message to conversation
      await axios.post(`https://3e79a6ace678.ngrok-free.app/api/conversations/${id}`, {
        from: 'Me',
        text: messageText,
        timestamp: new Date().toLocaleString()
      });
      
      // Clear polished message after sending
      setPolishedMessage('');
      
      // Refresh data to show new message
      fetchData();
      
      setSuccessMessage('Message sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      setSuccessMessage('Error sending message');
      setTimeout(() => setSuccessMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateConversationGoal = async () => {
    if (!profile) return;
    try {
      const updatedProfile = { ...profile };
      updatedProfile.conversation_goals = [conversationGoal];
      await axios.put(`https://3e79a6ace678.ngrok-free.app/api/profiles/${id}`, updatedProfile);
      setSuccessMessage('Conversation goal updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating conversation goal:', error);
    }
  };

  const updateTonePreference = async () => {
    if (!profile) return;
    try {
      const updatedProfile = { ...profile };
      updatedProfile.tone_preference = customTone || tonePreference;
      await axios.put(`https://3e79a6ace678.ngrok-free.app/api/profiles/${id}`, updatedProfile);
      setSuccessMessage('Tone preference updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating tone preference:', error);
    }
  };

  if (!profile) {
    return (
      <Container>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  return (
    <>
    <Box sx={{
      width: '100vw',
      height: 'calc(100vh - 80px)',
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', md: '1fr 380px', sm: '1fr 300px' },
      gap: 2,
      padding: '8px',
      maxWidth: '100vw',
      boxSizing: 'border-box',
      background: 'none',
      fontFamily: 'Inter, SF Pro Display, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      color: '#1f2937',
    }}>
      {/* Chat Section */}
      <Box className="chat-section glass-element" sx={{
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
        p: 2,
        overflow: 'hidden',
      }}>
        <Typography variant="h4" sx={{ fontWeight: 700, fontSize: { xs: 20, md: 24 }, mb: 1, letterSpacing: '-0.01em', color: '#1f2937' }}>
        {profile.name || profile.username || 'Conversation'}
      </Typography>
        <Box className="messages-area" sx={{ flex: 1, overflowY: 'auto', p: '0 8px 8px 8px', minHeight: 0 }}>
              {messages.map((message, index) => (
                <Box
                  key={index}
                  id={`message-${index}`}
                  sx={{
                mb: 1.5,
                    display: 'flex',
                flexDirection: message.from === 'Me' ? 'row-reverse' : 'row',
                alignItems: 'flex-end',
                gap: 1,
                position: 'relative',
                transition: 'all 0.3s',
              }}
            >
              {/* Avatar/Initials */}
              <Box sx={{ minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Paper elevation={1} sx={{ width: 32, height: 32, borderRadius: '50%', background: message.from === 'Me' ? '#2563eb' : '#e2e8f0', color: message.from === 'Me' ? 'white' : '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
                  {message.from === 'Me' ? '🧑' : (profile.name ? profile.name[0] : '🤖')}
                </Paper>
              </Box>
              {/* Message Bubble */}
              <Box
                    sx={{
                  maxWidth: 520,
                  minWidth: 60,
                  px: 2,
                  py: 1,
                  borderRadius: message.from === 'Me' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: message.from === 'Me' ? '#2563eb' : '#fff',
                  color: message.from === 'Me' ? 'white' : '#1f2937',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                  position: 'relative',
                  fontSize: 16,
                  fontWeight: 400,
                  lineHeight: 1.6,
                  transition: 'all 0.2s',
                  '&:hover .msg-actions': { opacity: 1, pointerEvents: 'auto' },
                }}
              >
                <Typography variant="body1" sx={{ fontSize: 16, lineHeight: 1.6, wordBreak: 'break-word' }}>{message.text}</Typography>
                <Typography variant="caption" sx={{ color: message.from === 'Me' ? 'rgba(255,255,255,0.7)' : '#6b7280', fontWeight: 500, mt: 0.5, display: 'block', textAlign: message.from === 'Me' ? 'right' : 'left', fontSize: 12 }}>{message.timestamp}</Typography>
                {/* Quick Actions (copy, edit, regenerate) */}
                <Box className="msg-actions" sx={{ position: 'absolute', top: 8, right: message.from === 'Me' ? 8 : 'auto', left: message.from === 'Me' ? 'auto' : 8, display: 'flex', gap: 1, opacity: 0, pointerEvents: 'none', transition: 'opacity 0.2s' }}>
                  <Tooltip title="Copy" arrow><IconButton size="small" tabIndex={-1} aria-label="Copy message" onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(message.text); }}><span role="img" aria-label="Copy">📋</span></IconButton></Tooltip>
                </Box>
              </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>
        {/* Message Input */}
        <Box className="message-input-area glass-element" sx={{
          flexShrink: 0,
          p: 2,
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          borderRadius: 2,
        }}>
            <TextField
            className="message-input"
              fullWidth
              multiline
            minRows={1}
            maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePolish();
              }
            }}
            placeholder="Type your message here... (Press Enter to polish)"
            sx={{
              fontSize: 16,
              borderRadius: 1.5,
              background: 'white',
              minHeight: 40,
              padding: '8px 12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)',
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#8b5cf6',
                boxShadow: '0 0 0 2px #8b5cf633',
              },
            }}
            inputProps={{ 'aria-label': 'Type your message' }}
            />
            <Button
            className="send-button"
            variant="contained"
              onClick={handlePolish}
              disabled={loading || !input.trim()}
            sx={{
              fontSize: 14,
              fontWeight: 500,
              height: 40,
              padding: '8px 16px',
              background: '#8b5cf6',
              borderRadius: 1.5,
              letterSpacing: '0.025em',
              minWidth: 40,
              boxShadow: '0 4px 12px 0 rgba(108,99,255,0.08)',
              transition: 'all 0.2s',
              '&:hover': { filter: 'brightness(1.08)', transform: 'scale(1.02)' },
              outline: 'none',
            }}
            aria-label="Polish message"
            tabIndex={0}
            startIcon={<EditIcon />}
          >
            Polish
            </Button>
        </Box>
        {/* Show polished message below input if available */}
            {polishedMessage && (
          <Box sx={{ mt: 1, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Paper sx={{ p: 1.5, background: '#f3f4f6', borderRadius: 2, flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#1f2937' }}>{polishedMessage}</Typography>
              </Paper>
            <Tooltip title="Copy" arrow>
              <IconButton size="small" aria-label="Copy polished message" onClick={() => navigator.clipboard.writeText(polishedMessage)}>
                <span role="img" aria-label="Copy">📋</span>
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
      {/* Controls Section */}
      <Box className="controls-sidebar glass-element" ref={controlsRef} sx={{
        position: 'relative',
        overflowY: 'auto',
        height: '100%',
        minWidth: { xs: '100%', md: 380, sm: 300 },
        p: 2,
        pr: 3,
        mr: 2,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        borderRadius: 2,
        ...{
          // Custom scrollbar
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-track': { background: '#f1f5f9', borderRadius: 3 },
          '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 3 },
          '&::-webkit-scrollbar-thumb:hover': { background: '#94a3b8' },
        }
      }}>
        {/* Fade gradient at bottom for scroll indicator */}
        <Box sx={{
          content: '""',
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 40,
          background: 'linear-gradient(transparent, rgba(255,255,255,0.9))',
          pointerEvents: 'none',
          zIndex: 1,
        }} />
        {/* Collapsible sections (Message Settings, Conversation Controls, Advanced Options) */}
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: 20, mb: 2, color: '#1f2937' }}>Controls</Typography>
        <Divider sx={{ mb: 2 }} />
        {/* Message Settings */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: 16, mb: 1 }}>Message Settings</Typography>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAIReply}
              disabled={loading}
            sx={{ mb: 1, borderRadius: 2, fontWeight: 500, fontSize: 15, py: 1, background: '#2563eb', color: 'white', transition: 'all 0.2s', '&:hover': { filter: 'brightness(1.08)', transform: 'scale(1.02)' } }}
            startIcon={<AutoAwesomeIcon />}
            >
              Get AI Replies
            </Button>
          {/* Show AI replies if available */}
          {(aiReplies.reply_1 || aiReplies.reply_2 || aiReplies.reply_3) && (
            <Box sx={{ mt: 1, mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {[aiReplies.reply_1, aiReplies.reply_2, aiReplies.reply_3].filter(Boolean).map((reply, idx) => (
                <Paper key={idx} sx={{ p: 1.5, background: '#f3f4f6', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: '#1f2937', flex: 1 }}>{reply}</Typography>
                  <Tooltip title="Copy" arrow>
                    <IconButton size="small" aria-label={`Copy AI reply ${idx + 1}`} onClick={() => navigator.clipboard.writeText(reply)}>
                      <span role="img" aria-label="Copy">📋</span>
                    </IconButton>
                  </Tooltip>
                </Paper>
              ))}
              </Box>
            )}
          <FormControlLabel
            control={<Switch checked={autoAI} onChange={(e) => setAutoAI(e.target.checked)} />}
            label="Auto AI Replies"
            sx={{ mt: 1 }}
          />
          <FormControlLabel
            control={<Switch checked={nuclearFlirt} onChange={(e) => setNuclearFlirt(e.target.checked)} />}
            label="Nuclear Flirt Mode"
            sx={{ mt: 1 }}
          />
          <Typography variant="caption" color="#6b7280" sx={{ mt: 1, display: 'block' }}>
            Nuclear Flirt: Generates bold, high-risk flirty messages with maximum impact
          </Typography>
              </Box>
        <Divider sx={{ mb: 2 }} />
        {/* Conversation Controls */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: 16, mb: 1 }}>Conversation Controls</Typography>
            <TextField
              fullWidth
              value={conversationGoal}
              onChange={(e) => setConversationGoal(e.target.value)}
              placeholder="Set conversation goal..."
            sx={{ mb: 1, borderRadius: 2 }}
            size="small"
            />
            <Button
              fullWidth
              size="small"
              onClick={updateConversationGoal}
              disabled={!conversationGoal.trim()}
            sx={{ mb: 2, borderRadius: 2, fontWeight: 500, fontSize: 15, py: 1, border: '2px solid #2563eb', color: '#2563eb', transition: 'all 0.2s', '&:hover': { background: '#e2e8f0', transform: 'scale(1.02)' } }}
            >
              Update Goal
            </Button>
            <TextField
              fullWidth
              select
              value={tonePreference}
              onChange={(e) => setTonePreference(e.target.value)}
            sx={{ mb: 1, borderRadius: 2 }}
            size="small"
            SelectProps={{
              displayEmpty: true,
              renderValue: (selected) => selected ? selected.charAt(0).toUpperCase() + selected.slice(1) : 'Select tone',
            }}
              MenuProps={{
              PaperProps: { style: { maxHeight: 200, overflow: 'auto' } },
              anchorOrigin: { vertical: 'bottom', horizontal: 'left' },
              transformOrigin: { vertical: 'top', horizontal: 'left' }
            }}
          >
            <MenuItem value=""><em>Select tone</em></MenuItem>
            <MenuItem value="flirty">Flirty</MenuItem>
            <MenuItem value="playful">Playful</MenuItem>
            <MenuItem value="serious">Serious</MenuItem>
            <MenuItem value="witty">Witty</MenuItem>
            <MenuItem value="romantic">Romantic</MenuItem>
            <MenuItem value="casual">Casual</MenuItem>
            <MenuItem value="professional">Professional</MenuItem>
            </TextField>
            <TextField
              fullWidth
              value={customTone}
              onChange={(e) => setCustomTone(e.target.value)}
              placeholder="Or type custom tone..."
            sx={{ mb: 1, borderRadius: 2 }}
            size="small"
            />
            <Button
              fullWidth
              size="small"
              onClick={updateTonePreference}
              disabled={!tonePreference.trim() && !customTone.trim()}
            sx={{ mb: 1, borderRadius: 2, fontWeight: 500, fontSize: 15, py: 1, border: '2px solid #2563eb', color: '#2563eb', transition: 'all 0.2s', '&:hover': { background: '#e2e8f0', transform: 'scale(1.02)' } }}
            >
              Update Tone
            </Button>
            {(profile.tone_preference || customTone || tonePreference) && (
            <Paper sx={{ p: 1.5, backgroundColor: '#2563eb', color: 'white', mb: 2, borderRadius: 2 }}>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  Current Tone:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                  {profile.tone_preference || customTone || tonePreference}
                </Typography>
              </Paper>
            )}
        </Box>
        <Divider sx={{ mb: 2 }} />
        {/* Advanced Options */}
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 500, fontSize: 16, mb: 1 }}>Advanced Options</Typography>
          <FormControl size="small" sx={{ minWidth: 180, mb: 2 }}>
            <InputLabel id="language-select-label">Reply Language</InputLabel>
            <Select
              labelId="language-select-label"
              value={selectedLanguage}
              label="Reply Language"
              onChange={e => setSelectedLanguage(e.target.value)}
            >
              {LANGUAGE_OPTIONS.map(opt => (
                <MenuItem key={opt.code} value={opt.code}>{opt.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedLanguage === 'other' && (
            <TextField
              size="small"
              label="Custom Language"
              value={customLanguage}
              onChange={e => setCustomLanguage(e.target.value)}
              sx={{ minWidth: 160, mb: 2 }}
            />
          )}
        </Box>
      </Box>
      {/* Show scroll hint if needed, anchored to controls sidebar */}
      {showScrollHint && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 24,
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              background: 'rgba(37, 99, 235, 0.9)',
              color: 'white',
              px: 2,
              py: 0.5,
              borderRadius: 2,
              fontSize: 12,
              fontWeight: 500,
              animation: 'bounce 2s infinite',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              pointerEvents: 'auto',
            }}
          >
            ⬇️ More options below
          </Box>
        </Box>
      )}
      {/* Snackbar for success messages */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
    <Snackbar
      open={showApiKeyError}
      autoHideDuration={6000}
      onClose={() => setShowApiKeyError(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        elevation={6}
        variant="filled"
        severity="error"
        sx={{ fontSize: 18, alignItems: 'center' }}
        action={
          <Button color="inherit" size="small" onClick={() => navigate('/settings')}>Go to Settings</Button>
        }
      >
        AI features are unavailable. Please enter your Gemini API key in Settings (or check that your key is valid).
      </Alert>
    </Snackbar>
    </>
  );
};

export default ConversationView; 
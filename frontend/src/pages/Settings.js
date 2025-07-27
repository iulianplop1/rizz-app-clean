import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  InputAdornment,
  Tooltip,
  Avatar
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Save,
  Refresh,
  Key,
  Person,
  Notifications
} from '@mui/icons-material';
import axios from 'axios';
import Breadcrumbs from '@mui/material/Breadcrumbs';

const Settings = () => {
  const [userProfile, setUserProfile] = useState({
    name: '',
    gender: '',
    age: '',
    interests: [],
    personality: [],
    bio: ''
  });
  const [apiKeys, setApiKeys] = useState({
    geminiApiKey: '',
    instagramBusinessId: '',
    telegramBotToken: '',
    telegramChatId: ''
  });
  const [preferences, setPreferences] = useState({
    autoExtractPreferences: true,
    autoGenerateReplies: false,
    sendTelegramNotifications: true,
    enableWebhook: true,
    maxMessagesPerProfile: 50,
    aiTemperature: 0.7,
    defaultTone: 'flirty'
  });
    const [showApiKeys, setShowApiKeys] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ type: '', message: '' });
  const [sidebarSection, setSidebarSection] = useState('profile');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Fetch user profile
      const profileResponse = await axios.get('https://3e79a6ace678.ngrok-free.app/api/user');
      setUserProfile(profileResponse.data);

      // Fetch API keys and preferences (you'll need to create these endpoints)
      const settingsResponse = await axios.get('https://3e79a6ace678.ngrok-free.app/api/settings');
      if (settingsResponse.data) {
        setApiKeys(settingsResponse.data.apiKeys || {});
        setPreferences(settingsResponse.data.preferences || {});
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setSaveStatus({ type: '', message: '' });

    try {
      // Save user profile
      await axios.put('https://3e79a6ace678.ngrok-free.app/api/user', userProfile);

      // Save API keys and preferences
      await axios.put('https://3e79a6ace678.ngrok-free.app/api/settings', {
        apiKeys,
        preferences
      });

      setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save settings. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKeys.geminiApiKey) {
      setSaveStatus({ type: 'error', message: 'Please enter your Gemini API key first.' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('https://3e79a6ace678.ngrok-free.app/api/test-gemini', {
        apiKey: apiKeys.geminiApiKey
      });
      setSaveStatus({ type: 'success', message: 'API key is valid! Gemini connection successful.' });
    } catch (error) {
      setSaveStatus({ type: 'error', message: 'Invalid API key or connection failed. Please check your key.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInterestChange = (index, value) => {
    const newInterests = [...userProfile.interests];
    newInterests[index] = value;
    setUserProfile({ ...userProfile, interests: newInterests });
  };

  const addInterest = () => {
    setUserProfile({
      ...userProfile,
      interests: [...userProfile.interests, '']
    });
  };

  const removeInterest = (index) => {
    const newInterests = userProfile.interests.filter((_, i) => i !== index);
    setUserProfile({ ...userProfile, interests: newInterests });
  };

  const handlePersonalityChange = (index, value) => {
    const newPersonality = [...userProfile.personality];
    newPersonality[index] = value;
    setUserProfile({ ...userProfile, personality: newPersonality });
  };

  const addPersonality = () => {
    setUserProfile({
      ...userProfile,
      personality: [...userProfile.personality, '']
    });
  };

  const removePersonality = (index) => {
    const newPersonality = userProfile.personality.filter((_, i) => i !== index);
    setUserProfile({ ...userProfile, personality: newPersonality });
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'none', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', color: 'var(--text-primary)' }}>
      {/* Header Section */}
      <Container maxWidth="xl" sx={{ pt: 4, pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4, gap: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 56, height: 56, fontWeight: 600, fontSize: 28, bgcolor: 'var(--accent-blue)' }}>{userProfile.name?.[0] || '?'}</Avatar>
            <Box>
              <Typography variant="h3" sx={{ fontWeight: 700, fontSize: 32, letterSpacing: '-0.025em', color: 'var(--text-primary)' }}>Settings</Typography>
              <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                <span>Home</span>
                <span>Settings</span>
                <span sx={{ color: 'var(--accent-blue)' }}>{sidebarSection === 'profile' ? 'Profile & Account' : sidebarSection === 'integrations' ? 'Integrations & APIs' : 'Preferences & Notifications'}</span>
              </Breadcrumbs>
            </Box>
          </Box>
        </Box>
      </Container>
      {/* Main Layout: Sidebar + Content */}
      <Container maxWidth="xl" sx={{ display: 'flex', gap: 4, minHeight: '70vh' }}>
        {/* Sidebar Navigation */}
        <Box sx={{
          width: 280,
          flexShrink: 0,
          bgcolor: 'rgba(255,255,255,0.95)',
          borderRadius: 3,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          p: 3,
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          gap: 2,
          height: 'fit-content',
          mt: 2,
        }}>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2,
              cursor: 'pointer',
              bgcolor: sidebarSection === 'profile' ? 'var(--background-secondary)' : 'transparent',
              fontWeight: sidebarSection === 'profile' ? 600 : 500,
              color: sidebarSection === 'profile' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'var(--background-secondary)', color: 'var(--accent-blue)', transform: 'scale(1.02)' },
            }}
            onClick={() => setSidebarSection('profile')}
          >
            <Person fontSize="medium" /> Profile & Account
          </Box>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2,
              cursor: 'pointer',
              bgcolor: sidebarSection === 'integrations' ? 'var(--background-secondary)' : 'transparent',
              fontWeight: sidebarSection === 'integrations' ? 600 : 500,
              color: sidebarSection === 'integrations' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'var(--background-secondary)', color: 'var(--accent-blue)', transform: 'scale(1.02)' },
            }}
            onClick={() => setSidebarSection('integrations')}
          >
            <Key fontSize="medium" /> Integrations & APIs
          </Box>
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 2, p: 2, borderRadius: 2,
              cursor: 'pointer',
              bgcolor: sidebarSection === 'preferences' ? 'var(--background-secondary)' : 'transparent',
              fontWeight: sidebarSection === 'preferences' ? 600 : 500,
              color: sidebarSection === 'preferences' ? 'var(--accent-blue)' : 'var(--text-secondary)',
              transition: 'all 0.2s',
              '&:hover': { bgcolor: 'var(--background-secondary)', color: 'var(--accent-blue)', transform: 'scale(1.02)' },
            }}
            onClick={() => setSidebarSection('preferences')}
          >
            <Notifications fontSize="medium" /> Preferences & Notifications
          </Box>
        </Box>
        {/* Main Content Area */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: '1fr', gap: 4, pb: 8 }}>
          {/* Render sections based on sidebarSection */}
          {sidebarSection === 'profile' && (
            <Card sx={{ borderRadius: 3, p: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
              <CardHeader title="User Profile" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Name"
                      value={userProfile.name}
                      onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Gender"
                      value={userProfile.gender}
                      onChange={(e) => setUserProfile({ ...userProfile, gender: e.target.value })}
                      placeholder="male/female"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Age"
                      type="number"
                      value={userProfile.age}
                      onChange={(e) => setUserProfile({ ...userProfile, age: e.target.value })}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Bio"
                      value={userProfile.bio}
                      onChange={(e) => setUserProfile({ ...userProfile, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                    />
                  </Grid>
                </Grid>

                {/* Interests */}
                {(userProfile.interests || []).map((interest, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={interest}
                      onChange={(e) => handleInterestChange(index, e.target.value)}
                      placeholder="e.g., fitness, travel, music"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => removeInterest(index)}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}

                {/* Personality Traits */}
                {(userProfile.personality || []).map((trait, index) => (
                  <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      value={trait}
                      onChange={(e) => handlePersonalityChange(index, e.target.value)}
                      placeholder="e.g., funny, confident, adventurous"
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => removePersonality(index)}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSaveSettings}
                    disabled={loading}
                    startIcon={<Save />}
                  >
                    {loading ? 'Saving...' : 'Save All Settings'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {sidebarSection === 'integrations' && (
            <Card sx={{ borderRadius: 3, p: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
              <CardHeader
                title="API Keys & Preferences"
                action={
                  <IconButton onClick={() => setShowApiKeys(!showApiKeys)}>
                    {showApiKeys ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                }
              />
              <CardContent>
                <Grid container spacing={2}>
                  {/* Gemini API Key */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Gemini API Key"
                      type={showApiKeys ? 'text' : 'password'}
                      value={apiKeys.geminiApiKey}
                      onChange={(e) => setApiKeys({ ...apiKeys, geminiApiKey: e.target.value })}
                      placeholder="AIzaSy..."
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Test API Key">
                              <IconButton onClick={handleTestApiKey} disabled={loading}>
                                <Refresh />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        )
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener">Google AI Studio</a>
                    </Typography>
                  </Grid>

                  {/* Instagram Business Account ID */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Instagram Business Account ID"
                      value={apiKeys.instagramBusinessId}
                      onChange={(e) => setApiKeys({ ...apiKeys, instagramBusinessId: e.target.value })}
                      placeholder="17841409306000875"
                    />
                    <Typography variant="caption" color="text.secondary">
                      Your Instagram Business Account ID for webhook integration
                    </Typography>
                  </Grid>



                  {/* Save Button for Integrations & APIs */}
                  <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSaveSettings}
                      disabled={loading}
                      startIcon={<Save />}
                    >
                      {loading ? 'Saving...' : 'Save API Settings'}
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {sidebarSection === 'preferences' && (
            <Card sx={{ borderRadius: 3, p: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}>
              <CardHeader title="Preferences & Notifications" />
              <CardContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Preferences</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.autoExtractPreferences}
                          onChange={(e) => setPreferences({ ...preferences, autoExtractPreferences: e.target.checked })}
                        />
                      }
                      label="Auto-extract preferences from messages"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.autoGenerateReplies}
                          onChange={(e) => setPreferences({ ...preferences, autoGenerateReplies: e.target.checked })}
                        />
                      }
                      label="Auto-generate AI replies"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.sendTelegramNotifications}
                          onChange={(e) => setPreferences({ ...preferences, sendTelegramNotifications: e.target.checked })}
                        />
                      }
                      label="Send Telegram notifications"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={preferences.enableWebhook}
                          onChange={(e) => setPreferences({ ...preferences, enableWebhook: e.target.checked })}
                        />
                      }
                      label="Enable Instagram webhook"
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="Max Messages per Profile"
                      type="number"
                      value={preferences.maxMessagesPerProfile}
                      onChange={(e) => setPreferences({ ...preferences, maxMessagesPerProfile: parseInt(e.target.value) })}
                    />
                  </Grid>

                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      label="AI Temperature"
                      type="number"
                      inputProps={{ step: 0.1, min: 0, max: 1 }}
                      value={preferences.aiTemperature}
                      onChange={(e) => setPreferences({ ...preferences, aiTemperature: parseFloat(e.target.value) })}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Default Tone"
                      value={preferences.defaultTone}
                      onChange={(e) => setPreferences({ ...preferences, defaultTone: e.target.value })}
                    >
                      <option value="flirty">Flirty</option>
                      <option value="playful">Playful</option>
                      <option value="serious">Serious</option>
                      <option value="witty">Witty</option>
                      <option value="romantic">Romantic</option>
                      <option value="casual">Casual</option>
                    </TextField>
                  </Grid>
                </Grid>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleSaveSettings}
                    disabled={loading}
                    startIcon={<Save />}
                  >
                    {loading ? 'Saving...' : 'Save All Settings'}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default Settings; 
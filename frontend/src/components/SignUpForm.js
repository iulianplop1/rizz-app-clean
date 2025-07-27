import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormControlLabel,
  Switch,
  Alert,
  IconButton,
  InputAdornment
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  FitnessCenter,
  MusicNote,
  Flight,
  Restaurant,
  SportsEsports,
  Book,
  Movie,
  Camera,
  Palette,
  Code,
  Sports,
  Pets
} from '@mui/icons-material';

const SignUpForm = ({ onSignUp }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Basic Info
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    
    // Profile Info
    age: 18,
    gender: '',
    bio: '',
    interests: [],
    personality: [],
    goals: [],
    
    // Preferences
    defaultTone: 'flirty',
    enableNotifications: true,
    autoGenerate: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [skipProfile, setSkipProfile] = useState(false);

  const interests = [
    { label: 'Fitness', icon: <FitnessCenter />, value: 'fitness' },
    { label: 'Music', icon: <MusicNote />, value: 'music' },
    { label: 'Travel', icon: <Flight />, value: 'travel' },
    { label: 'Food', icon: <Restaurant />, value: 'food' },
    { label: 'Gaming', icon: <SportsEsports />, value: 'gaming' },
    { label: 'Reading', icon: <Book />, value: 'reading' },
    { label: 'Movies', icon: <Movie />, value: 'movies' },
    { label: 'Photography', icon: <Camera />, value: 'photography' },
    { label: 'Art', icon: <Palette />, value: 'art' },
    { label: 'Technology', icon: <Code />, value: 'technology' },
    { label: 'Sports', icon: <Sports />, value: 'sports' },
    { label: 'Pets', icon: <Pets />, value: 'pets' }
  ];

  const personalityTraits = [
    'Funny', 'Confident', 'Adventurous', 'Romantic', 'Intellectual',
    'Creative', 'Spontaneous', 'Ambitious', 'Caring', 'Mysterious',
    'Outgoing', 'Laid-back', 'Passionate', 'Charming', 'Honest'
  ];

  const conversationGoals = [
    'Get dates', 'Make friends', 'Network professionally', 
    'Have fun conversations', 'Learn about people', 'Practice social skills'
  ];

  const steps = [
    'Account Setup',
    'Personal Info',
    'Interests & Personality',
    'Preferences'
  ];

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!formData.username) newErrors.username = 'Username is required';
        if (!formData.email) newErrors.email = 'Email is required';
        if (!formData.email.includes('@')) newErrors.email = 'Invalid email format';
        if (!formData.password) newErrors.password = 'Password is required';
        if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
        if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
        if (!formData.name) newErrors.name = 'Name is required';
        break;
      case 1:
        if (!formData.gender && !skipProfile) newErrors.gender = 'Gender is required';
        break;
      // Steps 2 and 3 are optional
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSkipProfile = () => {
    setSkipProfile(true);
    setActiveStep(3); // Skip to preferences
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handlePersonalityToggle = (trait) => {
    setFormData(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(p => p !== trait)
        : [...prev.personality, trait]
    }));
  };

  const handleGoalToggle = (goal) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleSubmit = async () => {
    if (validateStep(0)) {
      try {
        const userData = {
          username: formData.username,
          password: formData.password,
          name: formData.name,
          email: formData.email,
          hasCompletedProfile: !skipProfile && activeStep >= 2,
          profile: {
            name: formData.name,
            age: formData.age,
            gender: formData.gender,
            bio: formData.bio,
            interests: formData.interests,
            personality: formData.personality,
            goals: formData.goals,
            preferences: {
              defaultTone: formData.defaultTone,
              enableNotifications: formData.enableNotifications,
              autoGenerate: formData.autoGenerate
            }
          }
        };

        const response = await fetch('https://3e79a6ace678.ngrok-free.app/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (data.success) {
          onSignUp(data.user);
        } else {
          setErrors({ submit: data.error || 'Registration failed' });
        }
      } catch (error) {
        console.error('Registration error:', error);
        setErrors({ submit: 'Network error. Please try again.' });
      }
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              error={!!errors.username}
              helperText={errors.username}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person sx={{ color: '#2d3748' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  color: '#2d3748',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#E4405F' },
                  '&.Mui-focused fieldset': { borderColor: '#E4405F' }
                },
                '& .MuiInputLabel-root': { color: '#2d3748' },
                '& .MuiFormHelperText-root': { color: '#dc2626' }
              }}
            />

            <TextField
              fullWidth
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              error={!!errors.name}
              helperText={errors.name}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  color: '#2d3748',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#E4405F' },
                  '&.Mui-focused fieldset': { borderColor: '#E4405F' }
                },
                '& .MuiInputLabel-root': { color: '#2d3748' },
                '& .MuiFormHelperText-root': { color: '#dc2626' }
              }}
            />

            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#2d3748' }} />
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  color: '#2d3748',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#E4405F' },
                  '&.Mui-focused fieldset': { borderColor: '#E4405F' }
                },
                '& .MuiInputLabel-root': { color: '#2d3748' },
                '& .MuiFormHelperText-root': { color: '#dc2626' }
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#2d3748' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      sx={{ color: '#2d3748' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  color: '#2d3748',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#E4405F' },
                  '&.Mui-focused fieldset': { borderColor: '#E4405F' }
                },
                '& .MuiInputLabel-root': { color: '#2d3748' },
                '& .MuiFormHelperText-root': { color: '#dc2626' }
              }}
            />

            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      sx={{ color: '#2d3748' }}
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  color: '#2d3748',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#E4405F' },
                  '&.Mui-focused fieldset': { borderColor: '#E4405F' }
                },
                '& .MuiInputLabel-root': { color: '#2d3748' },
                '& .MuiFormHelperText-root': { color: '#dc2626' }
              }}
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 2, color: '#2d3748' }}>
                Tell us about yourself (optional)
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: '#2d3748' }}>Gender</InputLabel>
                  <Select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    error={!!errors.gender}
                    sx={{
                      color: '#2d3748',
                      backgroundColor: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E4405F' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E4405F' }
                    }}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                    <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ minWidth: 120 }}>
                  <Typography variant="body2" sx={{ mb: 1, color: '#2d3748' }}>
                    Age: {formData.age}
                  </Typography>
                  <Slider
                    value={formData.age}
                    onChange={(e, value) => setFormData(prev => ({ ...prev, age: value }))}
                    min={18}
                    max={65}
                    sx={{
                      color: '#E4405F',
                      '& .MuiSlider-thumb': { backgroundColor: '#E4405F' },
                      '& .MuiSlider-track': { backgroundColor: '#E4405F' }
                    }}
                  />
                </Box>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Bio (optional)"
              multiline
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell people about yourself..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#ffffff',
                  color: '#2d3748',
                  '& fieldset': { borderColor: '#e2e8f0' },
                  '&:hover fieldset': { borderColor: '#E4405F' },
                  '&.Mui-focused fieldset': { borderColor: '#E4405F' }
                },
                '& .MuiInputLabel-root': { color: '#2d3748' }
              }}
            />

            <Button
              variant="outlined"
              onClick={handleSkipProfile}
              sx={{
                color: '#2d3748',
                borderColor: '#e2e8f0',
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#E4405F',
                  backgroundColor: 'rgba(228, 64, 95, 0.05)'
                }
              }}
            >
              Skip Profile Setup
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#2d3748' }}>
                What are you interested in?
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {interests.map((interest) => (
                  <Chip
                    key={interest.value}
                    icon={interest.icon}
                    label={interest.label}
                    onClick={() => handleInterestToggle(interest.value)}
                    variant={formData.interests.includes(interest.value) ? 'filled' : 'outlined'}
                    sx={{
                      color: formData.interests.includes(interest.value) ? 'white' : '#2d3748',
                      backgroundColor: formData.interests.includes(interest.value) ? '#E4405F' : 'transparent',
                      borderColor: '#e2e8f0',
                      '&:hover': {
                        backgroundColor: formData.interests.includes(interest.value) ? '#d63384' : 'rgba(228, 64, 95, 0.1)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#2d3748' }}>
                How would you describe your personality?
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {personalityTraits.map((trait) => (
                  <Chip
                    key={trait}
                    label={trait}
                    onClick={() => handlePersonalityToggle(trait)}
                    variant={formData.personality.includes(trait) ? 'filled' : 'outlined'}
                    sx={{
                      color: formData.personality.includes(trait) ? 'white' : '#2d3748',
                      backgroundColor: formData.personality.includes(trait) ? '#E4405F' : 'transparent',
                      borderColor: '#e2e8f0',
                      '&:hover': {
                        backgroundColor: formData.personality.includes(trait) ? '#d63384' : 'rgba(228, 64, 95, 0.1)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box>
              <Typography variant="h6" sx={{ mb: 2, color: '#2d3748' }}>
                What are your conversation goals?
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {conversationGoals.map((goal) => (
                  <Chip
                    key={goal}
                    label={goal}
                    onClick={() => handleGoalToggle(goal)}
                    variant={formData.goals.includes(goal) ? 'filled' : 'outlined'}
                    sx={{
                      color: formData.goals.includes(goal) ? 'white' : '#2d3748',
                      backgroundColor: formData.goals.includes(goal) ? '#E4405F' : 'transparent',
                      borderColor: '#e2e8f0',
                      '&:hover': {
                        backgroundColor: formData.goals.includes(goal) ? '#d63384' : 'rgba(228, 64, 95, 0.1)'
                      }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Typography variant="h6" sx={{ color: '#2d3748' }}>
              Set your preferences
            </Typography>

            <FormControl fullWidth>
              <InputLabel sx={{ color: '#2d3748' }}>Default Conversation Tone</InputLabel>
              <Select
                value={formData.defaultTone}
                onChange={(e) => setFormData(prev => ({ ...prev, defaultTone: e.target.value }))}
                sx={{
                  color: '#2d3748',
                  backgroundColor: '#ffffff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E4405F' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E4405F' }
                }}
              >
                <MenuItem value="flirty">Flirty</MenuItem>
                <MenuItem value="friendly">Friendly</MenuItem>
                <MenuItem value="playful">Playful</MenuItem>
                <MenuItem value="serious">Serious</MenuItem>
                <MenuItem value="casual">Casual</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enableNotifications}
                    onChange={(e) => setFormData(prev => ({ ...prev, enableNotifications: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#E4405F' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E4405F' }
                    }}
                  />
                }
                label="Enable notifications"
                sx={{ color: '#2d3748' }}
              />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.autoGenerate}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoGenerate: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#E4405F' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E4405F' }
                    }}
                  />
                }
                label="Auto-generate AI replies"
                sx={{ color: '#2d3748' }}
              />
            </Box>

            <Alert 
              severity="info"
              sx={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                '& .MuiAlert-icon': { color: '#3b82f6' }
              }}
            >
              You can change these preferences anytime in the Settings page.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Typography variant="body1" sx={{ mb: 3, color: '#2d3748' }}>
        Create your account and set up your AI conversation assistant
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel sx={{
              '& .MuiStepLabel-label': { color: '#2d3748' },
              '& .MuiStepLabel-label.Mui-active': { color: '#E4405F' },
              '& .MuiStepLabel-label.Mui-completed': { color: '#2d3748' },
              '& .MuiStepIcon-root': { color: '#e2e8f0' },
              '& .MuiStepIcon-root.Mui-active': { color: '#E4405F' },
              '& .MuiStepIcon-root.Mui-completed': { color: '#10b981' }
            }}>
              {label}
            </StepLabel>
            <StepContent>
              {renderStepContent(index)}
              
              <Box sx={{ mb: 2, mt: 2 }}>
                {errors.submit && (
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 2,
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#dc2626',
                      '& .MuiAlert-icon': {
                        color: '#dc2626'
                      }
                    }}
                  >
                    {errors.submit}
                  </Alert>
                )}
                
                <Button
                  variant="contained"
                  onClick={index === steps.length - 1 || (skipProfile && index === 3) ? handleSubmit : handleNext}
                  sx={{
                    mr: 1,
                    background: 'linear-gradient(135deg, #E4405F 0%, #FCAF45 100%)',
                    textTransform: 'none'
                  }}
                >
                  {index === steps.length - 1 || (skipProfile && index === 3) ? 'Create Account' : 'Continue'}
                </Button>
                
                {index > 0 && !skipProfile && (
                  <Button
                    onClick={handleBack}
                    sx={{
                      textTransform: 'none',
                      color: '#2d3748'
                    }}
                  >
                    Back
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
};

export default SignUpForm; 
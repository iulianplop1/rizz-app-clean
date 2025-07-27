import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  Tabs,
  Tab,
  Fade,
  InputAdornment
} from '@mui/material';
import {
  Close,
  Person,
  Lock,
  Visibility,
  VisibilityOff
} from '@mui/icons-material';
import SignUpForm from './SignUpForm';

const LoginDialog = ({ open, onClose, onLogin }) => {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://3e79a6ace678.ngrok-free.app/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password
        })
      });

      const data = await response.json();

      if (data.success) {
        onLogin(data.user);
        onClose();
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = (userData) => {
    // Handle new user signup
    onLogin({
      username: userData.username,
      isAuthenticated: true,
      profile: {
        name: userData.name,
        email: userData.email,
        hasCompletedProfile: userData.hasCompletedProfile,
        ...userData.profile
      }
    });
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && tab === 0) {
      handleLogin();
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setError('');
    setLoading(false);
    setShowPassword(false);
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
    resetForm();
  };

  const handleClose = () => {
    resetForm();
    setTab(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        'data-testid': 'login-dialog',
        sx: {
          background: '#ffffff',
          borderRadius: '16px',
          color: '#2d3748',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #E4405F 0%, #FCAF45 100%)',
        borderRadius: '16px 16px 0 0',
        color: 'white'
      }}>
        <Typography variant="h5" fontWeight={600}>
          Welcome to AI Wingman
        </Typography>
        <IconButton onClick={handleClose} sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Tabs
          value={tab}
          onChange={handleTabChange}
          centered
          sx={{
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTab-root': {
              color: '#2d3748',
              textTransform: 'none',
              fontSize: '1rem',
              '&.Mui-selected': {
                color: '#E4405F'
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#E4405F'
            }
          }}
        >
          <Tab label="Sign In" />
          <Tab label="Sign Up" />
        </Tabs>

        <Box sx={{ p: 3 }}>
          {tab === 0 ? (
            <Fade in={tab === 0} timeout={300}>
              <Box>
                <Typography variant="body1" sx={{ mb: 3, color: '#2d3748' }}>
                  Sign in to access your AI-powered conversation assistant
                </Typography>

                {error && (
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
                    {error}
                  </Alert>
                )}

                <TextField
                  fullWidth
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{ 
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                      color: '#2d3748',
                      '& fieldset': {
                        borderColor: '#e2e8f0'
                      },
                      '&:hover fieldset': {
                        borderColor: '#E4405F'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E4405F'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#2d3748',
                      '&.Mui-focused': {
                        color: '#E4405F'
                      }
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person sx={{ color: '#2d3748' }} />
                      </InputAdornment>
                    )
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  sx={{ 
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: '#ffffff',
                      color: '#2d3748',
                      '& fieldset': {
                        borderColor: '#e2e8f0'
                      },
                      '&:hover fieldset': {
                        borderColor: '#E4405F'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#E4405F'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#2d3748',
                      '&.Mui-focused': {
                        color: '#E4405F'
                      }
                    }
                  }}
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
                />

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleLogin}
                  disabled={loading}
                  sx={{
                    background: 'linear-gradient(135deg, #E4405F 0%, #FCAF45 100%)',
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: '8px',
                    textTransform: 'none',
                    boxShadow: '0 4px 16px rgba(228, 64, 95, 0.3)',
                    '&:hover': {
                      boxShadow: '0 6px 20px rgba(228, 64, 95, 0.4)',
                    },
                    '&:disabled': {
                      opacity: 0.7
                    }
                  }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </Button>

                <Typography 
                  variant="body2" 
                  sx={{ 
                    mt: 2, 
                    textAlign: 'center', 
                    color: '#6b7280' 
                  }}
                >
                  Demo credentials: iulian_plop / Iulian2006.
                </Typography>
              </Box>
            </Fade>
          ) : (
            <Fade in={tab === 1} timeout={300}>
              <Box>
                <SignUpForm onSignUp={handleSignUp} />
              </Box>
            </Fade>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog; 
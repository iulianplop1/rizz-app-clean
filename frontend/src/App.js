import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, IconButton, CssBaseline, Box, Tooltip, useTheme, useMediaQuery, Avatar, CircularProgress, GlobalStyles } from '@mui/material';
import { 
  Inbox as InboxIcon, People as PeopleIcon, Chat as ChatIcon, 
  BarChart as BarChartIcon, Settings as SettingsIcon, 
  School as SchoolIcon, Logout as LogoutIcon 
} from '@mui/icons-material';
import Inbox from './pages/Inbox';
import ConversationView from './pages/ConversationView';
import { 
  ProfilesWithSuspense, 
  AIAssistantWithSuspense, 
  AnalyticsWithSuspense, 
  SettingsWithSuspense, 
  ConversationSimulatorWithSuspense, 
  PhotoAIResponseWithSuspense 
} from './components/LazyComponents';
import WelcomePage from './components/WelcomePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { WbSunny as WbSunnyIcon, Nightlight as NightlightIcon } from '@mui/icons-material';

const navItems = [
  { label: 'Inbox', icon: <InboxIcon />, path: '/inbox', aria: 'Inbox' },
  { label: 'Photo AI', icon: <ChatIcon />, path: '/photo-ai-response', aria: 'Photo AI Response' },
  { label: 'Profiles', icon: <PeopleIcon />, path: '/profiles', aria: 'Profiles' },
  { label: 'AI Assistant', icon: <ChatIcon />, path: '/ai-assistant', aria: 'AI Assistant' },
  { label: 'Conversation Simulator', icon: <SchoolIcon />, path: '/simulator', aria: 'Conversation Simulator' },
  { label: 'Analytics', icon: <BarChartIcon />, path: '/analytics', aria: 'Analytics' },
  { label: 'Settings', icon: <SettingsIcon />, path: '/settings', aria: 'Settings' },
];

function TopNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const [darkMode, setDarkMode] = React.useState(false);
  const { user, logout } = useAuth();
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : '');
  }, [darkMode]);
  return (
    <nav aria-label="Main navigation">
      <AppBar position="fixed" elevation={0} sx={{
        bgcolor: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        zIndex: 1201,
        px: { xs: 0.5, md: 2 },
      }}>
        <Toolbar sx={{ minHeight: 64, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              onClick={() => navigate('/inbox')}
              aria-label="Go to Inbox"
              style={{
                background: 'none',
                border: 'none',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 1,
                color: theme.palette.primary.main,
                marginRight: 16,
                cursor: 'pointer',
                outline: 'none',
                transition: 'color 0.2s',
              }}
              onMouseOver={e => (e.currentTarget.style.color = theme.palette.secondary.main)}
              onMouseOut={e => (e.currentTarget.style.color = theme.palette.primary.main)}
            >
              AI Wingman
            </button>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 2 }}>
              {navItems.map(item => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.label}
                    className="nav-item"
                    aria-label={item.aria}
                    aria-current={active ? 'page' : undefined}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                      fontWeight: active ? 700 : 400,
                      borderBottom: active ? '2.5px solid' : '2.5px solid transparent',
                      borderColor: active ? theme.palette.primary.main : 'transparent',
                      transition: 'color 0.2s, border-color 0.2s',
                      minWidth: 56,
                      padding: '8px 12px',
                      cursor: 'pointer',
                      outline: 'none',
                      fontSize: 14,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      backgroundColor: 'transparent',
                    }}
                    onClick={() => navigate(item.path)}
                  >
                    <Tooltip title={item.label} arrow placement="bottom">
                      <span>{item.icon}</span>
                    </Tooltip>
                    <span style={{ fontSize: 12, marginTop: 2 }}>{item.label}</span>
                  </button>
                );
              })}
            </Box>
          </Box>
          {/* User profile avatar and name on the right, and dark mode toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
            <IconButton aria-label="Toggle dark mode" onClick={() => setDarkMode(d => !d)} sx={{ color: 'primary.main', mr: 1 }}>
              {darkMode ? <WbSunnyIcon /> : <NightlightIcon />}
            </IconButton>
            <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main', mr: 1 }}>
              {user?.profile?.name || user?.username}
            </Typography>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'var(--accent-blue)', color: 'white', fontWeight: 700, fontSize: 18, border: '2px solid var(--white)' }}>
              {user?.profile?.name?.charAt(0) || user?.username?.charAt(0) || 'Y'}
            </Avatar>
            <Tooltip title="Logout" enterDelay={500}>
              <IconButton
                onClick={logout}
                sx={{ 
                  ml: 1,
                  color: 'primary.main',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.1)' }
                }}
                aria-label="Logout"
              >
                <LogoutIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
    </nav>
  );
}

function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const navItemsMobile = navItems.slice(0, 4); // Show only main pages on mobile
  return (
    <Paper elevation={8} sx={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1300,
      bgcolor: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid #eee',
      display: { xs: 'flex', md: 'none' },
    }}>
      <BottomNavigation
        showLabels
        value={navItemsMobile.findIndex(item => location.pathname.startsWith(item.path))}
        onChange={(_, idx) => navigate(navItemsMobile[idx].path)}
        sx={{ width: '100%', bgcolor: 'transparent' }}
      >
        {navItemsMobile.map((item, idx) => (
          <BottomNavigationAction
            key={item.label}
            label={item.label}
            icon={item.icon}
            aria-label={item.aria}
            sx={{ minWidth: 44, minHeight: 44 }}
          />
        ))}
        {/* Hamburger for secondary features */}
        <BottomNavigationAction
          label="More"
          icon={<span style={{ fontSize: 24 }}>☰</span>}
          aria-label="More options"
          sx={{ minWidth: 44, minHeight: 44 }}
        />
      </BottomNavigation>
    </Paper>
  );
}



function AuthenticatedApp() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  return (
    <Router>
      <CssBaseline />
      {!isMobile && <TopNav />}
      <Box sx={{
        minHeight: '100vh',
        width: '100vw',
        pt: !isMobile ? '64px' : 0,
        pb: isMobile ? '64px' : 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box component="main" sx={{ flexGrow: 1, bgcolor: 'transparent', p: 3 }}>
          <Routes>
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/inbox/:id" element={<ConversationView />} />
            <Route path="/profiles" element={<ProfilesWithSuspense />} />
            <Route path="/ai-assistant" element={<AIAssistantWithSuspense />} />
            <Route path="/simulator" element={<ConversationSimulatorWithSuspense />} />
            <Route path="/analytics" element={<AnalyticsWithSuspense />} />
            <Route path="/analytics/:user_id" element={<AnalyticsWithSuspense />} />
            <Route path="/settings" element={<SettingsWithSuspense />} />
            <Route path="/photo-ai-response" element={<PhotoAIResponseWithSuspense />} />
            <Route path="*" element={<Inbox />} />
          </Routes>
        </Box>
        {isMobile && <MobileBottomNav />}
      </Box>
    </Router>
  );
}

function AppContent() {
  const { isAuthenticated, loading, login } = useAuth();

  if (loading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <WelcomePage onLogin={login} />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <AuthProvider>
      <GlobalStyles
        styles={{
          // Fix Material-UI dark hover effects
          '.MuiMenuItem-root:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
            color: 'inherit !important',
          },
          '.MuiIconButton-root:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
            color: 'inherit !important',
          },
          '.MuiListItem-root:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
            color: 'inherit !important',
          },
          '.MuiTableRow-root:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
          },
          '.MuiButton-root:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
          },
          '.MuiButtonBase-root:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
          },
          '.MuiCard-root:hover': {
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.1) !important',
          },
          // Fix any generic black overlays and ripple effects
          '.MuiTouchRipple-root': {
            color: 'rgba(102, 126, 234, 0.3) !important',
          },
          '.MuiTouchRipple-child': {
            backgroundColor: 'rgba(102, 126, 234, 0.3) !important',
          },
          // Fix dialog backdrop to be lighter
          '.MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.2) !important',
          },
          '.MuiDialog-container': {
            backgroundColor: 'transparent !important',
          },
          // Apply white dialog styles to specific dialogs, not the login dialog
          '.MuiDialog-paper:not([data-testid="login-dialog"])': {
            backgroundColor: 'white !important',
            color: 'black !important',
          },
          '.MuiDialogTitle-root:not([data-testid="login-dialog"] *)': {
            backgroundColor: 'white !important',
            color: 'black !important',
          },
          '.MuiDialogContent-root:not([data-testid="login-dialog"] *)': {
            backgroundColor: 'white !important',
            color: 'black !important',
          },
          '.MuiDialogActions-root:not([data-testid="login-dialog"] *)': {
            backgroundColor: 'white !important',
            color: 'black !important',
          },
          // Fix select dropdown hover
          '.MuiSelect-root:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(102, 126, 234, 0.5) !important',
          },
        }}
      />
      <AppContent />
    </AuthProvider>
  );
}

export default App; 
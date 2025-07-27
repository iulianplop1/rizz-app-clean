import React, { useEffect, useState, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, Box, Typography, CircularProgress, Tooltip, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import BarChartIcon from '@mui/icons-material/BarChart';
import ReplyIcon from '@mui/icons-material/Reply';
import { profilesAPI } from '../utils/api';
import { Tooltip as MuiTooltip } from '@mui/material';

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="typing-indicator" aria-label="AI is typing" style={{ display: 'flex', gap: 2, alignItems: 'center', marginTop: 8 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', display: 'inline-block', marginRight: 2 }}></span>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', display: 'inline-block', marginRight: 2 }}></span>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', display: 'inline-block' }}></span>
    </div>
  );
}

// Suggestion card (structure only)
function SuggestionCard({ text, onClick }) {
  return (
    <div className="suggestion-card card glass-element" tabIndex={0} role="button" aria-label={`Suggest: ${text}`} onClick={onClick} style={{ padding: 16, margin: 8, cursor: 'pointer', transition: 'box-shadow 0.3s, transform 0.3s', willChange: 'transform' }}>
      <p style={{ margin: 0 }}>{text}</p>
    </div>
  );
}

function analyzeMood(messages) {
  const lastMsgs = messages.slice(-5).map(m => m.text.toLowerCase()).join(' ');
  if (/love|amazing|great|happy|fun|😍|😄|😊|😘|flirt|kiss|cute|hot|babe|sweet/.test(lastMsgs)) return '😏';
  if (/angry|mad|annoy|hate|😠|😡|wtf|ugh/.test(lastMsgs)) return '😠';
  if (/sad|cry|miss|lonely|😢|😭/.test(lastMsgs)) return '😢';
  if (/ok|fine|alright|neutral|meh|😐/.test(lastMsgs)) return '😐';
  return '😄';
}

function computeCompatibility(profile) {
  const likes = profile.likes?.length || 0;
  const personality = profile.personality_tags?.length || 0;
  const jokes = profile.inside_jokes?.length || 0;
  const msgs = profile.previous_messages?.length || 0;
  let score = likes * 2 + personality * 2 + jokes * 3 + Math.min(msgs, 20);
  score = Math.min(100, Math.round(score));
  return score;
}

function getLastMessage(profile) {
  const msgs = profile.previous_messages || [];
  return msgs.length > 0 ? msgs[msgs.length - 1].text : '';
}

function getLastMessageTime(profile) {
  const msgs = profile.previous_messages || [];
  if (msgs.length === 0) return '';
  const lastMsg = msgs[msgs.length - 1];
  if (!lastMsg.timestamp) return '';
  // Parse timestamp (handle 'YYYY-MM-DD HH:mm' or ISO)
  let msgTime;
  if (lastMsg.timestamp.includes('T')) {
    msgTime = new Date(lastMsg.timestamp);
  } else {
    // Replace dashes with slashes for Safari compatibility
    msgTime = new Date(lastMsg.timestamp.replace(/-/g, '/'));
  }
  const now = new Date();
  const diffMs = now - msgTime;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function Inbox() {
  const [profiles, setProfiles] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [aiThinking, setAiThinking] = useState(false);
  const [suggestions] = useState([
    'Ask about their weekend',
    'Send a compliment',
    'Share a funny meme',
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const data = await profilesAPI.getAll();
        if (Array.isArray(data)) {
          setProfiles(data.filter(p => !p.is_me && p.user_id !== 'me'));
          setUserProfile(data.find(p => p.is_me || p.user_id === 'me'));
        } else {
          console.error('API returned non-array data:', data);
          setProfiles([]);
        }
      } catch (error) {
        console.error('Failed to fetch profiles:', error);
        setProfiles([]);
      }
    };
    fetchProfiles();
    const interval = setInterval(fetchProfiles, 3000);
    return () => clearInterval(interval);
  }, []);

  // Placeholder for swipe gestures and live activity indicators
  // (To be implemented in a future phase)

  const moodNames = {
    '😏': 'Flirty',
    '😠': 'Angry',
    '😢': 'Sad',
    '😐': 'Neutral',
    '😄': 'Happy',
  };

  return (
    <main className="container" style={{ maxWidth: 1200, margin: '0 auto', paddingTop: 24 }}>
      {/* Hero Banner */}
      <section className="glass-element" style={{ margin: '0 auto 32px auto', padding: '32px 24px', borderRadius: 16, textAlign: 'center', maxWidth: 700, boxShadow: '0 2px 12px 0 rgba(0,0,0,0.04)' }}>
        <h1 style={{ marginBottom: 8 }}>AI Wingman</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 18, margin: 0 }}>
          Your smart dating assistant. Start a conversation or dive back in.
        </p>
      </section>

      {/* Conversation Grid */}
      <section className="conversation-grid">
        <Suspense fallback={<CircularProgress />}> {/* Lazy loading placeholder */}
          {profiles.map(profile => {
            const emoji = analyzeMood(profile.previous_messages || []);
            const compatibility = computeCompatibility(profile);
            const lastMsg = getLastMessage(profile);
            const lastMsgTime = getLastMessageTime(profile);
            return (
              <article
                className="conversation-card card glass-element"
                tabIndex={0}
                aria-label={`Conversation with ${profile.name}`}
                key={profile.user_id}
                style={{
                  position: 'relative',
                  minHeight: 220,
                  maxHeight: 260,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 24,
                  transition: 'box-shadow 0.3s, transform 0.3s, background 0.3s',
                  zIndex: 1,
                  willChange: 'transform',
                }}
                onClick={() => navigate(`/inbox/${profile.user_id}`)}
                onKeyDown={e => { if (e.key === 'Enter') navigate(`/inbox/${profile.user_id}`); }}
                role="button"
              >
                <header style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <Avatar sx={{ width: 44, height: 44, fontSize: 22, bgcolor: 'var(--accent-blue)', color: 'white', mr: 2 }}>
                    {profile.name ? profile.name[0] : '?'}
                  </Avatar>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: 0 }}>{profile.name || profile.username || profile.user_id}</h3>
                    <span className="compatibility-score" style={{ color: 'var(--primary-coral)', fontWeight: 600, fontSize: 16 }}>{compatibility}% match</span>
                  </div>
                  <MuiTooltip title={moodNames[emoji] || 'Mood'} arrow placement="top">
                    <span style={{ fontSize: 28, marginLeft: 8 }}>{emoji}</span>
                  </MuiTooltip>
                </header>
                <div className="card-body" style={{ flex: 1, minHeight: 32, maxHeight: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: 15, marginBottom: 8 }}>
                  {lastMsg}
                </div>
                <div className="progress-indicator" aria-label="Relationship progress">
                  <div className="progress-bar" style={{ width: `${compatibility}%`, background: compatibility > 70 ? 'var(--primary-coral)' : 'var(--accent-blue)' }}></div>
                </div>
                <footer style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <span className="time-ago" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{lastMsgTime}</span>
                  <div className="quick-actions" style={{ display: 'flex', gap: 8 }}>
                    <Tooltip title="Reply" arrow><IconButton aria-label="Reply" size="small" tabIndex={-1}><ReplyIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Analytics" arrow>
                      <IconButton
                        aria-label="Analytics"
                        size="small"
                        tabIndex={-1}
                        onClick={e => { e.stopPropagation(); navigate(`/analytics/${profile.user_id}`); }}
                      >
                        <BarChartIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </div>
                </footer>
                {/* Typing indicator (example, show if aiThinking) */}
                {aiThinking && <TypingIndicator />}
              </article>
            );
          })}
        </Suspense>
      </section>
    </main>
  );
}

export default Inbox; 
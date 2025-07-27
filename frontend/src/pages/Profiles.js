import React, { useEffect, useState, useRef, memo, useCallback, useMemo } from 'react';
import { 
  Box, Typography, Card, CardContent, Button, TextField, Chip, Stack, 
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Avatar, 
  CircularProgress, Fab, Menu, MenuItem, IconButton, Alert, Skeleton 
} from '@mui/material';
import { 
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, FilterList as FilterListIcon, 
  Star as StarIcon, Message as MessageIcon, CompareArrows as CompareArrowsIcon, 
  MoreVert as MoreVertIcon, CloudUpload as CloudUploadIcon, 
  ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon 
} from '@mui/icons-material';
import { profilesAPI } from '../utils/api';
import { debounce, memoize, performanceMonitor } from '../utils/performance';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import axios from 'axios';

const moodEmojis = {
  happy: '😄',
  flirty: '😏',
  neutral: '😐',
  sad: '😢',
  angry: '😠',
};

// Memoized mood analysis for better performance
const analyzeMood = memoize((messages) => {
  const lastMsgs = (messages || []).slice(-5).map(m => m.text?.toLowerCase() || '').join(' ');
  if (/love|amazing|great|happy|fun|😍|😄|😊|😘|flirt|kiss|cute|hot|babe|sweet/.test(lastMsgs)) return '😏';
  if (/angry|mad|annoy|hate|😠|😡|wtf|ugh/.test(lastMsgs)) return '😠';
  if (/sad|cry|miss|lonely|😢|😭/.test(lastMsgs)) return '😢';
  if (/ok|fine|alright|neutral|meh|😐/.test(lastMsgs)) return '😐';
  return '😄';
});

// Memoized compatibility calculation
const computeCompatibility = memoize((profile) => {
  const likes = profile.likes?.length || 0;
  const personality = profile.personality_tags?.length || 0;
  const jokes = profile.inside_jokes?.length || 0;
  const msgs = profile.previous_messages?.length || 0;
  let score = likes * 2 + personality * 2 + jokes * 3 + Math.min(msgs, 20);
  score = Math.min(100, Math.round(score));
  return score;
});

// Memoized progress calculation
const computeProgress = memoize((profile) => {
  // Advanced scoring
  const msgs = profile.previous_messages || [];
  const goal = (profile.conversation_goals && profile.conversation_goals[0]) || '';
  // 1. Goal proximity (40%)
  let goalScore = 0;
  if (goal) {
    const goalKeywords = goal.toLowerCase().split(/\s+/).concat(['call','date','meet','agree','yes','sure','let\'s','hang','see you','video','voice']);
    const lastMsgs = msgs.slice(-10).map(m => m.text.toLowerCase()).join(' ');
    goalScore = goalKeywords.some(word => lastMsgs.includes(word)) ? 40 : 0;
  }
  // 2. Sentiment/friendliness (30%)
  const herMsgs = msgs.filter(m => m.from !== 'Me').slice(-10);
  const positiveWords = /love|great|happy|fun|😍|😄|😊|😘|flirt|kiss|cute|hot|babe|sweet|yes|sure|haha|lol|amazing|awesome|excited|enjoy|like|good|nice|thanks|thank you|see you|call|date|meet|voice|video/gi;
  let sentimentScore = 0;
  if (herMsgs.length) {
    const positives = herMsgs.map(m => (m.text.match(positiveWords) || []).length).reduce((a, b) => a + b, 0);
    sentimentScore = Math.min(positives * 3, 30); // up to 30
  }
  // 3. Engagement (20%)
  let engagementScore = 0;
  const emojiCount = (msgs.map(m => (m.text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || []).length).reduce((a, b) => a + b, 0));
  const jokes = profile.inside_jokes?.length || 0;
  engagementScore = Math.min(msgs.length, 20) + Math.min(jokes * 5, 10) + Math.min(emojiCount, 10);
  engagementScore = Math.min(engagementScore, 20);
  // 4. Consistency (10%)
  let consistencyScore = 0;
  if (msgs.length > 1) {
    const days = new Set(msgs.map(m => m.timestamp && m.timestamp.split(' ')[0])).size;
    consistencyScore = Math.min(days, 10);
  }
  let score = goalScore + sentimentScore + engagementScore + consistencyScore;
  if (score > 100) score = 100;
  return score;
});

function EditableChips({ label, values, onChange }) {
  const [input, setInput] = useState('');
  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2">{label}</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
        {values.map((v, i) => (
          <Chip key={i} label={v} onDelete={() => onChange(values.filter((_, idx) => idx !== i))} />
        ))}
      </Stack>
      <TextField size="small" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => {
        if (e.key === 'Enter' && input.trim()) {
          onChange([...values, input.trim()]);
          setInput('');
        }
      }} placeholder={`Add ${label.toLowerCase()}`} />
    </Box>
  );
}

// 1. In ProfileEditor, always show fields for bio, age, and gender for all profiles
// 2. In compact mode (or in the main card if only detailed mode), instead of inside joke, show top emoji and top word from the person's messages
// 3. Ensure Edit/Delete are visible in the MoreVert menu (already handled)

// Helper to get top emoji and top word from messages
function getTopEmojiAndWord(messages) {
  const text = (messages || []).filter(m => m.from !== 'Me').map(m => m.text).join(' ');
  // Emoji regex
  const emojiRegex = /[\p{Emoji}]/gu;
  const emojis = text.match(emojiRegex) || [];
  const emojiCounts = {};
  emojis.forEach(e => { emojiCounts[e] = (emojiCounts[e] || 0) + 1; });
  const topEmoji = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  // Top word
  const words = text.toLowerCase().match(/\b\w{3,}\b/g) || [];
  const wordCounts = {};
  words.forEach(w => { wordCounts[w] = (wordCounts[w] || 0) + 1; });
  const topWord = Object.entries(wordCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  return { topEmoji, topWord };
}

function ProfileEditor({ profile, open, onClose, onSave }) {
  const [edit, setEdit] = useState(profile);
  useEffect(() => { setEdit(profile); }, [profile]);
  if (!edit) return null;
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'white',
          color: 'black',
          '& .MuiDialogTitle-root': {
            backgroundColor: 'white',
            color: 'black',
          },
          '& .MuiDialogContent-root': {
            backgroundColor: 'white',
            color: 'black',
          },
          '& .MuiDialogActions-root': {
            backgroundColor: 'white',
            color: 'black',
          }
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.2) !important',
        }
      }}
    >
      <DialogTitle sx={{ backgroundColor: 'white', color: 'black' }}>
        Edit Profile: {edit.name || edit.username || edit.user_id}
      </DialogTitle>
      <DialogContent sx={{ overflowY: 'auto', maxHeight: '70vh', pt: 3, backgroundColor: 'white', color: 'black' }}>
        <TextField 
          fullWidth 
          size="small" 
          label="Name" 
          value={edit.name || ''} 
          onChange={e => setEdit({ ...edit, name: e.target.value })} 
          sx={{ 
            mt: 2, 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              color: 'black',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(0, 0, 0, 0.6)',
            }
          }} 
          InputLabelProps={{ shrink: true }} 
        />
        <TextField 
          fullWidth 
          label="Bio" 
          value={edit.bio || ''} 
          onChange={e => setEdit({ ...edit, bio: e.target.value })} 
          multiline 
          rows={2} 
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              color: 'black',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(0, 0, 0, 0.6)',
            }
          }} 
        />
        <TextField 
          fullWidth 
          label="Age" 
          value={edit.age || ''} 
          onChange={e => setEdit({ ...edit, age: e.target.value })} 
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              color: 'black',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(0, 0, 0, 0.6)',
            }
          }} 
        />
        <TextField 
          fullWidth 
          label="Gender" 
          value={edit.gender || ''} 
          onChange={e => setEdit({ ...edit, gender: e.target.value })} 
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              color: 'black',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(0, 0, 0, 0.6)',
            }
          }} 
        />
        <EditableChips label="Likes" values={edit.likes || []} onChange={v => setEdit({ ...edit, likes: v })} />
        <EditableChips label="Personality Tags" values={edit.personality_tags || []} onChange={v => setEdit({ ...edit, personality_tags: v })} />
        <EditableChips label="Inside Jokes" values={edit.inside_jokes || []} onChange={v => setEdit({ ...edit, inside_jokes: v })} />
        <EditableChips label="Conversation Goals" values={edit.conversation_goals || []} onChange={v => setEdit({ ...edit, conversation_goals: v })} />
        <TextField 
          fullWidth 
          label="Details (JSON)" 
          value={JSON.stringify(edit.details || {}, null, 2)} 
          onChange={e => {
            try {
              setEdit({ ...edit, details: JSON.parse(e.target.value) });
            } catch { }
          }} 
          multiline 
          minRows={2} 
          sx={{ 
            mt: 2,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'white',
              color: 'black',
            },
            '& .MuiInputLabel-root': {
              color: 'rgba(0, 0, 0, 0.6)',
            }
          }} 
        />
      </DialogContent>
      <DialogActions sx={{ backgroundColor: 'white', color: 'black' }}>
        <Button 
          onClick={onClose}
          sx={{
            color: 'black',
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={() => onSave(edit)}
          sx={{
            backgroundColor: '#1976d2',
            color: 'white',
            '&:hover': {
              backgroundColor: '#115293',
            }
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ImportConversationDialog({ open, onClose, onImport }) {
  const [file, setFile] = useState(null);
  const [profileName, setProfileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be less than 10MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          setFile(selectedFile);
          setPreview(data);
          setError('');
          
          // Auto-generate profile name from file name
          const fileName = selectedFile.name.replace('.json', '').replace(/[_-]/g, ' ');
          setProfileName(fileName.charAt(0).toUpperCase() + fileName.slice(1));
        } catch (err) {
          setError('Invalid JSON file');
          setFile(null);
          setPreview(null);
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file || !profileName.trim()) {
      setError('Please select a file and enter a profile name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('profile_name', profileName);

      const response = await axios.post('http://localhost:5000/api/import-conversation', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onImport(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Import Conversation from JSON</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Upload a JSON file containing conversation messages. The AI will analyze the conversation and extract personality traits, likes, and other preferences.
        </Typography>
        
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>File Requirements:</strong>
          <br />• Maximum size: 10MB
          <br />• Format: JSON with messages array
          <br />• Each message should have: from, text, timestamp
          <br />• Example: {`[{"from": "Girl", "text": "Hello!", "timestamp": "2024-01-01 12:00"}]`}
        </Alert>

        <Box sx={{ mb: 2 }}>
          <input
            accept=".json"
            style={{ display: 'none' }}
            id="conversation-file"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="conversation-file">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              {file ? file.name : 'Choose JSON File'}
            </Button>
          </label>
        </Box>

        <TextField
          fullWidth
          label="Profile Name"
          value={profileName}
          onChange={(e) => setProfileName(e.target.value)}
          sx={{ mb: 2 }}
          placeholder="Enter a name for this profile"
        />

        {preview && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Preview:</Typography>
            <Box sx={{ 
              maxHeight: 200, 
              overflow: 'auto', 
              border: '1px solid #e0e0e0', 
              borderRadius: 1, 
              p: 1,
              bgcolor: '#f5f5f5'
            }}>
              <Typography variant="body2" color="text.secondary">
                {preview.messages ? `${preview.messages.length} messages found` : 'No messages array found'}
              </Typography>
              {preview.messages && preview.messages.slice(0, 3).map((msg, idx) => (
                <Typography key={idx} variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                  {msg.from}: {msg.text}
                </Typography>
              ))}
              {preview.messages && preview.messages.length > 3 && (
                <Typography variant="body2" color="text.secondary">
                  ... and {preview.messages.length - 3} more messages
                </Typography>
              )}
            </Box>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button 
          variant="contained" 
          onClick={handleImport} 
          disabled={loading || !file || !profileName.trim()}
          startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
        >
          {loading ? 'Analyzing...' : 'Import & Analyze'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteConfirmDialog({ open, onClose, onConfirm, profileName }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete Profile</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Are you sure you want to delete the profile "{profileName}"?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This action cannot be undone. All conversation history and profile data will be permanently removed.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete Profile
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function CircularProgressWithLabel({ value }) {
  return (
    <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <CircularProgress variant="determinate" value={value} size={48} thickness={5} sx={{ color: value > 70 ? 'var(--primary-coral)' : 'var(--accent-blue)' }} />
      <Box sx={{
        top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography variant="caption" component="div" color="text.primary" sx={{ fontWeight: 700 }}>{`${Math.round(value)}%`}</Typography>
      </Box>
    </Box>
  );
}

function Profiles() {
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState(null);
  const [filterAnchor, setFilterAnchor] = useState(null);
  const [sort, setSort] = useState('compatibility');
  const [search, setSearch] = useState('');
  
  // Debounced search for better performance
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value);
    }, 300),
    []
  );
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [filterInterest, setFilterInterest] = useState('all');
  const searchInputRef = useRef();
  const [selectedProfiles, setSelectedProfiles] = useState([]); // for comparison
  const [compareOpen, setCompareOpen] = useState(false);
  const [starred, setStarred] = useState(() => JSON.parse(localStorage.getItem('starredProfiles') || '[]'));
  const [loading, setLoading] = useState(true);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuProfile, setMenuProfile] = useState(null);
  const [error, setError] = useState(null);

  // Star/prioritize logic
  const toggleStar = (user_id) => {
    let newStarred;
    if (starred.includes(user_id)) {
      newStarred = starred.filter(id => id !== user_id);
    } else {
      newStarred = [...starred, user_id];
    }
    setStarred(newStarred);
    localStorage.setItem('starredProfiles', JSON.stringify(newStarred));
  };

  // Add to comparison
  const toggleCompare = (user_id) => {
    setSelectedProfiles(prev => prev.includes(user_id) ? prev.filter(id => id !== user_id) : [...prev, user_id]);
  };
  const openCompareModal = () => setCompareOpen(true);
  const closeCompareModal = () => setCompareOpen(false);

  // Optimized data fetching with error handling
  useEffect(() => {
      const fetchProfiles = async () => {
    try {
      performanceMonitor.start('fetchProfiles');
      setLoading(true);
      const data = await profilesAPI.getAll();
      
      // Debug: Log what we received
      console.log('API response:', data);
      console.log('Data type:', typeof data);
      console.log('Is array:', Array.isArray(data));
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error('API returned non-array data:', data);
        setError('Invalid data format received from server.');
        setProfiles([]);
        return;
      }
      
      setProfiles(data);
      performanceMonitor.end('fetchProfiles');
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
      setError('Failed to load profiles. Please try again.');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

    fetchProfiles();
  }, []);

  // Memoized filtering and sorting for better performance
  const filteredAndSortedProfiles = useMemo(() => {
    // Ensure profiles is an array
    if (!Array.isArray(profiles)) {
      console.warn('Profiles is not an array:', profiles);
      return [];
    }
    
    let filtered = [...profiles];
    
    // Search filter
    if (search.trim()) {
      filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(search.toLowerCase()));
    }
    
    // Interest filter
    if (filterInterest && filterInterest !== 'all') {
      filtered = filtered.filter(p => (p.likes || []).some(like => like.toLowerCase().includes(filterInterest.toLowerCase())));
    }
    
    // Sort starred first
    if (starred.length > 0) {
      filtered = [
        ...filtered.filter(p => starred.includes(p.user_id)),
        ...filtered.filter(p => !starred.includes(p.user_id)),
      ];
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      if (sort === 'compatibility') return computeCompatibility(b) - computeCompatibility(a);
      if (sort === 'recent') return (b.previous_messages?.length || 0) - (a.previous_messages?.length || 0);
      if (sort === 'name') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });
  }, [profiles, search, filterInterest, starred, sort]);

  // Memoized profile separation
  const { mainUser, otherProfiles } = useMemo(() => {
    const main = filteredAndSortedProfiles.find(p => p.is_me || p.user_id === 'me');
    const others = filteredAndSortedProfiles.filter(p => !(p.is_me || p.user_id === 'me'));
    return { mainUser: main, otherProfiles: others };
  }, [filteredAndSortedProfiles]);

  // Floating Add Profile button
  const handleAddProfile = () => setImportDialogOpen(true);

  // Floating filter bar
  const handleFilterClick = (e) => setFilterAnchor(e.currentTarget);
  const handleFilterClose = () => setFilterAnchor(null);
  const handleSortChange = (val) => { setSort(val); setFilterAnchor(null); };

  // Card quick actions
  const [quickActionAnchor, setQuickActionAnchor] = useState(null);
  const [quickActionProfile, setQuickActionProfile] = useState(null);
  const openQuickActions = (e, profile) => { setQuickActionAnchor(e.currentTarget); setQuickActionProfile(profile); };
  const closeQuickActions = () => { setQuickActionAnchor(null); setQuickActionProfile(null); };

  // Expand/collapse profile card
  const handleExpand = (user_id) => setExpandedProfile(expandedProfile === user_id ? null : user_id);

  // Accessibility: focus search on mount
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.setAttribute('aria-label', 'Search profiles by name');
  }, []);

  // Swipe gesture support (archive, message, view full profile)
  // Only for touch devices
  const touchStartX = useRef(null);
  const touchProfile = useRef(null);
  const handleTouchStart = (e, profile) => {
    touchStartX.current = e.touches[0].clientX;
    touchProfile.current = profile;
  };
  const handleTouchEnd = (e) => {
    if (!touchStartX.current || !touchProfile.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 80) {
      // Swipe right: Quick Message
      setQuickActionProfile(touchProfile.current);
      setQuickActionAnchor(document.body); // open menu at body
    } else if (dx < -80) {
      // Swipe left: Archive (not implemented)
      // TODO: Archive action
    }
    touchStartX.current = null;
    touchProfile.current = null;
  };

  // Card header gradient by personality
  function getCardGradient(profile) {
    if (profile.is_me || profile.user_id === 'me') return 'linear-gradient(135deg, #6c63ff 0%, #ff6b6b 100%)';
    if (computeCompatibility(profile) > 70) return 'linear-gradient(135deg, #ffb6b9 0%, #ff6b6b 100%)';
    if (computeCompatibility(profile) < 30) return 'linear-gradient(135deg, #b2ebf2 0%, #6c63ff 100%)';
    return 'linear-gradient(135deg, #f8bbd0 0%, #b2ebf2 100%)';
  }

  // 1. Make all cards the same fixed width and height in the grid (e.g., minWidth: 340, maxWidth: 340, minHeight: 260, maxHeight: 260)
  // 2. When expanded, allow height to grow (maxHeight: none, minHeight: 260)
  // 3. Use ellipsis for text overflow, wrap where appropriate
  // 4. Keep all buttons in their correct, visually appealing places
  // 5. Polish layout for beauty and alignment
  function getCardSize(profile, isExpanded) {
    if (isExpanded) {
      return { minWidth: 380, maxWidth: 380, minHeight: 260, maxHeight: 'none' };
    }
    return { minWidth: 380, maxWidth: 380, minHeight: 260, maxHeight: 260 };
  }

  // Collect all unique interests for filter dropdown
  const allInterests = Array.from(new Set(profiles.flatMap(p => p.likes || []))).filter(Boolean);

  // Restore handleSave, handleImportSuccess, handleDeleteConfirm
  const handleEdit = (profile) => {
    setSelected(profile);
    setEditorOpen(true);
  };
  const handleSave = async (profile) => {
    if (profile.is_me || profile.user_id === 'me') {
      // Update user profile instead of regular profile
      await axios.put('http://localhost:5000/api/user', profile);
    } else {
      // Update regular profile
    await axios.put(`http://localhost:5000/api/profiles/${profile.user_id}`, profile);
    }
    // Refresh profiles to get updated data
    const response = await axios.get('http://localhost:5000/api/profiles');
    setProfiles(response.data);
    setEditorOpen(false);
  };
  const handleImportSuccess = async (newProfile) => {
    // Refresh profiles to include the new imported profile
    const response = await axios.get('http://localhost:5000/api/profiles');
    setProfiles(response.data);
  };
  const handleDeleteClick = (profile) => {
    setProfileToDelete(profile);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;
    try {
      if (profileToDelete.is_me || profileToDelete.user_id === 'me') {
        // Don't allow deleting user profile
        alert('Cannot delete your own profile');
        return;
      }
      // Delete the profile
      await axios.delete(`http://localhost:5000/api/profiles/${profileToDelete.user_id}`);
      // Refresh profiles
      const response = await axios.get('http://localhost:5000/api/profiles');
      setProfiles(response.data);
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete profile');
    }
  };

  // Profile analytics helpers
  function getAnalytics(profile) {
    const msgs = profile.previous_messages || [];
    const days = {};
    msgs.forEach(m => {
      if (m.timestamp) {
        const day = m.timestamp.split(' ')[0];
        days[day] = (days[day] || 0) + 1;
      }
    });
    const responseTimes = [];
    let lastMe = null;
    msgs.forEach(m => {
      if (m.from === 'Me') lastMe = m;
      else if (lastMe && m.timestamp && lastMe.timestamp) {
        const t1 = new Date(lastMe.timestamp).getTime();
        const t2 = new Date(m.timestamp).getTime();
        if (!isNaN(t1) && !isNaN(t2)) responseTimes.push(Math.abs(t2 - t1) / 60000); // in minutes
        lastMe = null;
      }
    });
    return {
      days,
      avgResponse: responseTimes.length ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : null,
      total: msgs.length,
    };
  }

  // Export/share profile
  const handleExportProfile = (profile) => {
    // Export as JSON (placeholder)
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(profile, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `${profile.name || profile.user_id}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  // Memoized ProfileCard for performance
  const ProfileCard = memo(({ profile, isExpanded, onExpand, onStar, onCompare, starred, selectedForCompare, loading, openMenu }) => {
    if (loading) {
  return (
        <Box sx={{ breakInside: 'avoid', mb: 3, width: '100%', display: 'inline-block' }}>
          <Card sx={{ minHeight: 180, mb: 2, boxShadow: 3, borderRadius: 3 }}>
            <CardContent>
              <Skeleton variant="circular" width={44} height={44} />
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="rectangular" width="100%" height={24} sx={{ my: 1 }} />
              <Skeleton variant="rectangular" width="100%" height={16} />
            </CardContent>
          </Card>
        </Box>
      );
    }
          const mood = analyzeMood(profile.previous_messages || []);
    const compatibility = computeCompatibility(profile);
    const cardSize = getCardSize(profile, isExpanded);
    const analytics = getAnalytics(profile);
    const { topEmoji, topWord } = getTopEmojiAndWord(profile.previous_messages);
    // Compact mode: minimal info
    // Grid mode: avatar and name only, very small
    // Detailed mode (default)
          return (
      <Box sx={{ breakInside: 'avoid', mb: 3, width: '100%', display: 'inline-block', transition: 'box-shadow 0.3s, transform 0.3s, opacity 0.5s', opacity: loading ? 0.5 : 1, position: 'relative' }}>
        <Card
          sx={{
            ...cardSize,
            height: isExpanded ? 'auto' : 260,
            mb: 2,
            boxShadow: 3,
            background: getCardGradient(profile),
            color: compatibility > 70 ? 'white' : 'var(--text-primary)',
            border: compatibility > 70 ? '2px solid var(--primary-coral)' : '1px solid #e0e0e0',
            position: 'relative',
            overflow: 'visible',
            transition: 'box-shadow 0.3s, transform 0.3s',
            '&:hover, &:focus': { boxShadow: 8, transform: 'translateY(-4px) scale(1.03)', outline: '2px solid var(--accent-blue)' },
          }}
          tabIndex={0}
          aria-label={`Profile: ${profile.name}`}
        >
          <CardContent sx={{ pb: 6, position: 'relative', minHeight: 180 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <IconButton 
                aria-label={starred ? 'Unstar profile' : 'Star profile'} 
                onClick={() => onStar(profile.user_id)} 
                color={starred ? 'warning' : 'default'}
                sx={{
                  '&:hover': {
                    backgroundColor: 'rgba(102, 126, 234, 0.08)',
                    color: starred ? 'warning.main' : 'inherit'
                  }
                }}
              >
                <StarIcon />
              </IconButton>
              <Avatar sx={{ mr: 2, width: 44, height: 44, fontSize: 22, bgcolor: compatibility > 70 ? 'white' : 'var(--accent-blue)', color: compatibility > 70 ? 'var(--accent-blue)' : 'white', boxShadow: 2, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.1)' } }}>{profile.name ? profile.name[0] : '?'}</Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{profile.name || profile.username || profile.user_id}</Typography>
              {/* Mood emoji only */}
              <Tooltip title="Mood"><span style={{ fontSize: 24, marginLeft: 8 }}>{analyzeMood(profile.previous_messages || [])}</span></Tooltip>
              {/* Compare checkbox and MoreVert menu grouped */}
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                <Tooltip title={selectedForCompare ? 'Remove from comparison' : 'Select for comparison'}>
                                  <IconButton 
                  aria-label="Select for comparison" 
                  onClick={() => onCompare(profile.user_id)} 
                  size="small" 
                  sx={{ 
                    color: selectedForCompare ? 'primary.main' : 'inherit',
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                      color: selectedForCompare ? 'primary.main' : 'inherit'
                    }
                  }}
                >
                  <input type="checkbox" checked={selectedForCompare} readOnly style={{ display: 'none' }} />
                  <CompareArrowsIcon fontSize="small" />
                </IconButton>
                </Tooltip>
                <IconButton 
                  aria-label="More actions" 
                  onClick={e => openMenu(e.currentTarget, profile)} 
                  size="small"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.08)',
                      color: 'inherit'
                    }
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>
            <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
              {(profile.likes && profile.likes[0]) && <Chip label={profile.likes[0]} color="secondary" size="small" />}
              {(profile.personality_tags && profile.personality_tags[0]) && <Chip label={profile.personality_tags[0]} color="primary" size="small" />}
            </Stack>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.bio || 'No bio set.'}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <CircularProgressWithLabel value={compatibility} />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Compatibility</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {(profile.conversation_goals && profile.conversation_goals[0]) && <Chip label={profile.conversation_goals[0]} color="success" size="small" />}
            </Box>
            <Typography variant="caption" sx={{ color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', display: 'block' }}>Relationship Status: {compatibility > 70 ? 'Strong' : compatibility > 30 ? 'Developing' : 'New'}</Typography>
            {/* Show Details Button - bottom right */}
            <IconButton
              onClick={() => onExpand(profile.user_id)}
              aria-expanded={isExpanded}
              aria-controls={`profile-details-${profile.user_id}`}
              sx={{ position: 'absolute', right: 8, bottom: 8, zIndex: 2, bgcolor: 'rgba(255,255,255,0.7)', boxShadow: 1, transition: 'bgcolor 0.2s', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}
              size="small"
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            {/* Expandable Section */}
            <Box
              id={`profile-details-${profile.user_id}`}
              sx={{
                maxHeight: isExpanded ? 320 : 0,
                overflowY: isExpanded ? 'auto' : 'hidden',
                overflowX: 'hidden',
                transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1)',
                opacity: isExpanded ? 1 : 0,
                pointerEvents: isExpanded ? 'auto' : 'none',
                mt: isExpanded ? 2 : 0,
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Quick Facts</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>Age: {profile.age || 'N/A'} | Gender: {profile.gender || 'N/A'}</Typography>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Interests</Typography>
              {(profile.likes && profile.likes[0]) && <Chip label={profile.likes[0]} color="secondary" size="small" sx={{ mb: 1 }} />}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Personality</Typography>
              {(profile.personality_tags && profile.personality_tags[0]) && <Chip label={profile.personality_tags[0]} color="primary" size="small" sx={{ mb: 1 }} />}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Inside Joke</Typography>
              {(profile.inside_jokes && profile.inside_jokes[0]) && <Chip label={profile.inside_jokes[0]} color="info" size="small" sx={{ mb: 1 }} />}
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Goal</Typography>
              {(profile.conversation_goals && profile.conversation_goals[0]) && <Chip label={profile.conversation_goals[0]} color="success" size="small" sx={{ mb: 1 }} />}
              {/* Export only */}
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <Button variant="outlined" size="small" onClick={() => handleExportProfile(profile)} aria-label="Export profile">Export</Button>
                </Box>
                </Box>
              </CardContent>
            </Card>
      </Box>
    );
  });

  const openMenu = (anchor, profile) => { setMenuAnchor(anchor); setMenuProfile(profile); };
  const closeMenu = () => { setMenuAnchor(null); setMenuProfile(null); };
  const handleMenuEdit = () => { handleEdit(menuProfile); closeMenu(); };
  const handleMenuDelete = () => { handleDeleteClick(menuProfile); closeMenu(); };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1400, mx: 'auto', position: 'relative' }}>
      {/* Floating Filter/Sort/Search Bar with Compare Button */}
      <Box sx={{ position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: 2, mb: 3, bgcolor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', borderRadius: 2, px: 2, py: 1, boxShadow: 1 }}>
        <Typography variant="h4" sx={{ flex: 1 }}>Profiles</Typography>
        <TextField
          inputRef={searchInputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name"
          size="small"
          sx={{ minWidth: 180 }}
          inputProps={{ 'aria-label': 'Search profiles by name' }}
        />
        <TextField
          select
          value={filterInterest}
          onChange={e => setFilterInterest(e.target.value)}
          size="small"
          sx={{ minWidth: 160 }}
          displayEmpty
          inputProps={{ 'aria-label': 'Filter by interest' }}
        >
          <MenuItem value="all">All Interests</MenuItem>
          {allInterests.map((interest, i) => (
            <MenuItem key={i} value={interest}>{interest}</MenuItem>
          ))}
        </TextField>
        <Button startIcon={<FilterListIcon />} onClick={handleFilterClick} variant="outlined" sx={{ fontWeight: 600 }}>Sort</Button>
        <Button variant="outlined" color="secondary" disabled={selectedProfiles.length < 2} onClick={openCompareModal} sx={{ ml: 1 }}>Compare ({selectedProfiles.length})</Button>
        <Menu 
          anchorEl={filterAnchor} 
          open={Boolean(filterAnchor)} 
          onClose={handleFilterClose}
          PaperProps={{
            sx: {
              '& .MuiMenuItem-root': {
                '&:hover': {
                  backgroundColor: 'rgba(102, 126, 234, 0.08)',
                  color: 'inherit'
                }
              }
            }
          }}
        >
          <MenuItem 
            onClick={() => handleSortChange('compatibility')}
            sx={{ 
              '&:hover': { 
                backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
                color: 'inherit !important'
              }
            }}
          >
            Most Compatible
          </MenuItem>
          <MenuItem 
            onClick={() => handleSortChange('recent')}
            sx={{ 
              '&:hover': { 
                backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
                color: 'inherit !important'
              }
            }}
          >
            Most Recent
          </MenuItem>
          <MenuItem 
            onClick={() => handleSortChange('name')}
            sx={{ 
              '&:hover': { 
                backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
                color: 'inherit !important'
              }
            }}
          >
            A-Z Name
          </MenuItem>
        </Menu>
      </Box>
      {/* Main User Profile Card */}
      {mainUser && (
        <Box sx={{ mb: 4 }}>
          <ProfileCard
            profile={mainUser}
            isExpanded={expandedProfile === mainUser.user_id}
            onExpand={handleExpand}
            onStar={toggleStar}
            onCompare={toggleCompare}
            starred={starred.includes(mainUser.user_id)}
            selectedForCompare={selectedProfiles.includes(mainUser.user_id)}
            loading={false}
            openMenu={openMenu}
          />
        </Box>
      )}
      {/* Masonry Grid Layout with only detailed ProfileCard */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
        gap: 3,
        width: '100%',
        pb: 8,
      }}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <ProfileCard key={i} loading />)
          : otherProfiles.map(profile => (
              <ProfileCard
                key={profile.user_id}
                profile={profile}
                isExpanded={expandedProfile === profile.user_id}
                onExpand={handleExpand}
                onStar={toggleStar}
                onCompare={toggleCompare}
                starred={starred.includes(profile.user_id)}
                selectedForCompare={selectedProfiles.includes(profile.user_id)}
                loading={false}
                openMenu={openMenu}
              />
            ))}
      </Box>

      {/* Floating Add Profile Button */}
      <Fab color="primary" aria-label="Add New Profile" onClick={handleAddProfile} sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1202, boxShadow: 6, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.08)' } }}>
        <AddIcon />
      </Fab>

      {/* Quick Actions Menu */}
      <Menu 
        anchorEl={quickActionAnchor} 
        open={Boolean(quickActionAnchor)} 
        onClose={closeQuickActions}
        PaperProps={{
          sx: {
            '& .MuiMenuItem-root': {
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                color: 'inherit'
              }
            }
          }
        }}
      >
        <MenuItem 
          onClick={() => { setEditorOpen(true); closeQuickActions(); }}
          sx={{ 
            '&:hover': { 
              backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
              color: 'inherit !important'
            }
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />Edit Profile
        </MenuItem>
        <MenuItem 
          onClick={() => { /* TODO: Quick Message */ closeQuickActions(); }}
          sx={{ 
            '&:hover': { 
              backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
              color: 'inherit !important'
            }
          }}
        >
          <MessageIcon fontSize="small" sx={{ mr: 1 }} />Quick Message
        </MenuItem>
        <MenuItem 
          onClick={() => { /* TODO: Compare */ closeQuickActions(); }}
          sx={{ 
            '&:hover': { 
              backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
              color: 'inherit !important'
            }
          }}
        >
          <CompareArrowsIcon fontSize="small" sx={{ mr: 1 }} />Compare
        </MenuItem>
        <MenuItem 
          onClick={() => { setDeleteDialogOpen(true); closeQuickActions(); }} 
          sx={{ 
            color: 'error.main',
            '&:hover': { 
              backgroundColor: 'rgba(244, 67, 54, 0.08) !important',
              color: 'error.main !important'
            }
          }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />Delete
        </MenuItem>
      </Menu>

      {/* Profile Editor, Import, Delete Dialogs (unchanged) */}
      <ProfileEditor profile={selected} open={editorOpen} onClose={() => setEditorOpen(false)} onSave={handleSave} />
      <ImportConversationDialog 
        open={importDialogOpen} 
        onClose={() => setImportDialogOpen(false)} 
        onImport={handleImportSuccess} 
      />
      <DeleteConfirmDialog 
        open={deleteDialogOpen} 
        onClose={() => setDeleteDialogOpen(false)} 
        onConfirm={handleDeleteConfirm}
        profileName={profileToDelete?.name || profileToDelete?.username || profileToDelete?.user_id || 'Unknown'}
      />

      {/* Profile Comparison Modal */}
      <Dialog open={compareOpen} onClose={closeCompareModal} maxWidth="md" fullWidth>
        <DialogTitle>Profile Comparison</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {selectedProfiles.map(user_id => {
              const p = profiles.find(x => x.user_id === user_id);
              if (!p) return null;
              const analytics = getAnalytics(p);
              return (
                <Card key={user_id} sx={{ minWidth: 220, flex: 1, p: 2 }}>
                  <Typography variant="h6">{p.name}</Typography>
                  <Typography variant="body2">Compatibility: {computeCompatibility(p)}%</Typography>
                  <Typography variant="body2">Total Messages: {analytics.total}</Typography>
                  <Typography variant="body2">Avg. Response: {analytics.avgResponse ? `${analytics.avgResponse} min` : 'N/A'}</Typography>
                </Card>
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCompareModal}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* MoreVert Menu */}
      <Menu 
        anchorEl={menuAnchor} 
        open={Boolean(menuAnchor)} 
        onClose={closeMenu}
        PaperProps={{
          sx: {
            '& .MuiMenuItem-root': {
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
                color: 'inherit'
              }
            }
          }
        }}
      >
        <MenuItem 
          onClick={handleMenuEdit}
          sx={{ 
            '&:hover': { 
              backgroundColor: 'rgba(102, 126, 234, 0.08) !important',
              color: 'inherit !important'
            }
          }}
        >
          Edit
        </MenuItem>
        {menuProfile && !menuProfile.is_me && menuProfile.user_id !== 'me' && (
          <MenuItem 
            onClick={handleMenuDelete} 
            sx={{ 
              color: 'error.main',
              '&:hover': { 
                backgroundColor: 'rgba(244, 67, 54, 0.08) !important',
                color: 'error.main !important'
              }
            }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}

export default Profiles; 
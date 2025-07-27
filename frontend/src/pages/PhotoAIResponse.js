import React, { useState } from 'react';
import { useRef } from 'react';
import { Box, Typography, Button, Paper, TextField, CircularProgress, Alert, LinearProgress, MenuItem, Select, FormControl, InputLabel, Collapse, IconButton, Snackbar } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import axios from 'axios';

const MOCK_MESSAGES = [
  { from: 'Her', text: 'Hey, what are you up to?' },
  { from: 'Me', text: 'Just chilling, you?' },
  { from: 'Her', text: 'Same here! Got any plans for the weekend?' },
];

const TONE_OPTIONS = [
  { value: 'flirty', label: 'Flirty' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'serious', label: 'Serious' },
  { value: 'custom', label: 'Custom...' },
];
const GOAL_OPTIONS = [
  { value: 'get_date', label: 'Get a date' },
  { value: 'keep_friendly', label: 'Keep it friendly' },
  { value: 'just_chat', label: 'Just chat' },
  { value: 'custom', label: 'Custom...' },
];

// Add color variables for avatars
const GIRL_COLOR = '#ec4899'; // pink
const BOY_COLOR = '#3B82F6'; // blue

const PhotoAIResponse = () => {
  const [photo, setPhoto] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [analyzeSuccess, setAnalyzeSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [aiReplies, setAiReplies] = useState([]);
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState('');
  const [tone, setTone] = useState('flirty');
  const [customTone, setCustomTone] = useState('');
  const [goal, setGoal] = useState('just_chat');
  const [customGoal, setCustomGoal] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', type: 'info', icon: null });
  const [expanded, setExpanded] = useState([]); // for AI suggestions
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const toastTimeout = useRef();

  const showToast = (message, type = 'info', icon = null) => {
    setToast({ open: true, message, type, icon });
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToast({ ...toast, open: false }), 3500);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast('Copied to clipboard!', 'success', <CheckCircleIcon sx={{ color: 'var(--success)' }} />);
  };

  const handleExpand = (idx) => {
    setExpanded((prev) => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const handleEditMessage = (index) => {
    setEditingMessageId(index);
    setEditingText(conversation[index].text);
  };

  const handleSaveMessage = () => {
    const updated = [...conversation];
    updated[editingMessageId] = { ...updated[editingMessageId], text: editingText };
    setConversation(updated);
    setEditingMessageId(null);
    setEditingText('');
    showToast('Message updated! Click "Regenerate Replies" to get new AI suggestions.', 'success');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveMessage();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleDeleteMessage = (index) => {
    const updated = conversation.filter((_, i) => i !== index);
    setConversation(updated);
    showToast('Message deleted!', 'success');
  };

  const handleAddMessage = () => {
    const newMessage = { from: 'Girl', text: 'New message...' };
    setConversation([...conversation, newMessage]);
    // Immediately edit the new message
    setTimeout(() => {
      handleEditMessage(conversation.length);
    }, 100);
  };

  // Drag and drop functions
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null) return;
    
    const updated = [...conversation];
    const draggedMessage = updated[draggedItem];
    updated.splice(draggedItem, 1);
    updated.splice(dropIndex, 0, draggedMessage);
    
    setConversation(updated);
    setDraggedItem(null);
    setDragOverIndex(null);
    showToast('Message reordered!', 'success');
  };

  const handleRegenerateReplies = async () => {
    if (conversation.length === 0) {
      setError('No conversation to regenerate replies for.');
      return;
    }
    
    setLoading(true);
    setError('');
    setAiReplies([]);
    
    const formData = new FormData();
    formData.append('conversation', JSON.stringify(conversation));
    formData.append('tone', tone === 'custom' ? customTone : tone);
    formData.append('goal', goal === 'custom' ? customGoal : goal);
    formData.append('regenerate', 'true');
    
    try {
      const response = await axios.post('https://3e79a6ace678.ngrok-free.app/api/regenerate-replies', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { reply_1, reply_2, reply_3 } = response.data;
      console.log('=== REGENERATE DEBUGGING ===');
      console.log('Regenerated replies received:', { reply_1, reply_2, reply_3 });
      console.log('Full response data:', response.data);
      
      // Check each reply individually
      console.log('Reply 1 check:', reply_1, 'Type:', typeof reply_1, 'Length:', reply_1?.length, 'Boolean:', Boolean(reply_1));
      console.log('Reply 2 check:', reply_2, 'Type:', typeof reply_2, 'Length:', reply_2?.length, 'Boolean:', Boolean(reply_2));
      console.log('Reply 3 check:', reply_3, 'Type:', typeof reply_3, 'Length:', reply_3?.length, 'Boolean:', Boolean(reply_3));
      
      console.log('Raw array before filter:', [reply_1, reply_2, reply_3]);
      const filteredReplies = [reply_1, reply_2, reply_3].filter(Boolean);
      console.log('Filtered regenerated replies:', filteredReplies);
      console.log('Number of filtered replies:', filteredReplies.length);
      console.log('=== END DEBUGGING ===');
      
      setAiReplies(filteredReplies);
      showToast(`${filteredReplies.length} new AI replies generated!`, 'success');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to regenerate AI responses');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setUploadSuccess(true);
      setAnalyzeSuccess(false);
      setError('');
      setAiReplies([]);
      setConversation([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setError('Please upload a photo.');
      return;
    }
    setLoading(true);
    setError('');
    setAiReplies([]);
    setConversation([]);
    setAnalyzeSuccess(false);
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('tone', tone === 'custom' ? customTone : tone);
    formData.append('goal', goal === 'custom' ? customGoal : goal);
    try {
      const response = await axios.post('https://3e79a6ace678.ngrok-free.app/api/photo-ai-response', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { conversation, reply_1, reply_2, reply_3 } = response.data;
      console.log('=== ORIGINAL PHOTO ANALYSIS DEBUGGING ===');
      console.log('Frontend received:', { reply_1, reply_2, reply_3 });
      console.log('Full original response data:', response.data);
      
      // Check each reply individually
      console.log('Original Reply 1 check:', reply_1, 'Type:', typeof reply_1, 'Length:', reply_1?.length, 'Boolean:', Boolean(reply_1));
      console.log('Original Reply 2 check:', reply_2, 'Type:', typeof reply_2, 'Length:', reply_2?.length, 'Boolean:', Boolean(reply_2));
      console.log('Original Reply 3 check:', reply_3, 'Type:', typeof reply_3, 'Length:', reply_3?.length, 'Boolean:', Boolean(reply_3));
      
      console.log('Raw original array before filter:', [reply_1, reply_2, reply_3]);
      const filteredReplies = [reply_1, reply_2, reply_3].filter(Boolean);
      console.log('Filtered replies:', filteredReplies);
      console.log('Number of original filtered replies:', filteredReplies.length);
      console.log('=== END ORIGINAL DEBUGGING ===');
      
      setConversation(conversation || []);
      setAiReplies(filteredReplies);
      setAnalyzeSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to get AI responses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none' }}>
      <Box className="glass-card" sx={{ width: '100%', maxWidth: 900, mx: 'auto', mt: 6, mb: 6 }}>
        <Typography className="glass-section-header" sx={{ fontSize: 28, fontWeight: 600, mb: 3 }}>Photo AI Assistant</Typography>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'flex-end', marginBottom: 32 }}>
            <FormControl fullWidth className="glass-select" sx={{ minWidth: 180, flex: 1 }}>
              <InputLabel id="tone-label">Tone</InputLabel>
              <Select labelId="tone-label" value={tone} label="Tone" onChange={e => setTone(e.target.value)}>
                {TONE_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {tone === 'custom' && (
              <TextField fullWidth label="Custom Tone" value={customTone} onChange={e => setCustomTone(e.target.value)} sx={{ flex: 1 }} />
            )}
            <FormControl fullWidth className="glass-select" sx={{ minWidth: 200, flex: 2 }}>
              <InputLabel id="goal-label">Conversation Goal</InputLabel>
              <Select labelId="goal-label" value={goal} label="Conversation Goal" onChange={e => setGoal(e.target.value)}>
                {GOAL_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {goal === 'custom' && (
              <TextField fullWidth label="Custom Conversation Goal" value={customGoal} onChange={e => setCustomGoal(e.target.value)} sx={{ flex: 2 }} />
            )}
            <Button variant="contained" component="label" className="glass-btn" sx={{ minWidth: 180, height: 48, mb: 0 }}>
              Upload Photo
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </Button>
            <Button type="submit" variant="contained" className="glass-btn" disabled={loading || !photo} sx={{ minWidth: 180, height: 48, mb: 0, position: 'relative' }}>
              {loading ? <CircularProgress size={24} sx={{ color: 'var(--accent-blue)' }} /> : 'Analyze Photo & Get AI Replies'}
            </Button>
          </form>
        
          {loading && <LinearProgress sx={{ mb: 2, borderRadius: 2 }} />}
        
        <Snackbar 
          open={toast.open} 
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }} 
          onClose={() => setToast({ ...toast, open: false })} 
          autoHideDuration={3500} 
          className="glass-toast"
          sx={{ top: '80px !important' }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {toast.icon || <InfoOutlinedIcon sx={{ color: 'var(--accent-blue)' }} />}
              <Typography sx={{ fontSize: 16, color: 'var(--primary-text)' }}>{toast.message}</Typography>
            </Box>
          </Snackbar>
        
          {error && <Box className="glass-toast" sx={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid var(--warning)', color: 'var(--warning)', mb: 2 }}><InfoOutlinedIcon sx={{ color: 'var(--warning)' }} /> {error}</Box>}
        
          {(conversation.length > 0 || aiReplies.length > 0) && (
            <>
              {/* Conversation Analysis */}
            <Box className="glass-card" sx={{ p: 3, mb: 3, mt: 3, background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography className="glass-section-header">Conversation Analysis</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleAddMessage}
                  sx={{ color: 'var(--accent-blue)', borderColor: 'var(--accent-blue)' }}
                >
                  Add Message
                </Button>
              </Box>
              
                <Box className="glass-chat">
                  {conversation.map((msg, i) => {
                    const msgText = typeof msg.text === 'string' ? msg.text : msg.text?.text || '';
                    const isGirl = msg.from.toLowerCase() === 'girl';
                    const avatarColor = isGirl ? GIRL_COLOR : BOY_COLOR;
                    const label = isGirl ? 'Girl' : 'Boy';
                  const isEditing = editingMessageId === i;
                  const isDragging = draggedItem === i;
                  const isDropTarget = dragOverIndex === i && draggedItem !== null && draggedItem !== i;
                  
                    return (
                    <Box key={i}>
                      {/* Drop indicator line at the top */}
                      {isDropTarget && (
                        <Box sx={{
                          height: '2px',
                          background: 'var(--accent-blue)',
                          borderRadius: '1px',
                          mb: 1,
                          boxShadow: '0 0 8px var(--accent-blue)'
                        }} />
                      )}
                      
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'flex-start',
                          mb: 2,
                          position: 'relative',
                          gap: 1,
                          opacity: isDragging ? 0.3 : 1,
                          transition: 'opacity 0.2s'
                        }}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, i)}
                      >
                        {/* Drag handle - left for Girl, right for Boy */}
                        {isGirl && (
                          <Box
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              mt: 1,
                              opacity: 0.5,
                              '&:hover': { opacity: 1 },
                              cursor: isDragging ? 'grabbing' : 'grab'
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, i)}
                          >
                            <DragIndicatorIcon sx={{ fontSize: 16, color: 'var(--primary-text)' }} />
                          </Box>
                        )}

                                                  {/* Main message area */}
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: isGirl ? 'flex-start' : 'flex-end', 
                            flex: 1
                          }}>
                          {/* Avatar and name */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5, gap: 1 }}>
                            <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: avatarColor, boxShadow: '0 1px 4px rgba(0,0,0,0.12)' }} />
                          <Typography sx={{ fontSize: 14, fontWeight: 500, color: avatarColor, opacity: 0.85 }}>{label}</Typography>
                        </Box>

                                                      {/* Message bubble with inline editing */}
                            <Box sx={{ 
                              position: 'relative', 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1
                            }}>
                            {isEditing ? (
                              <TextField
                                multiline
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={handleKeyPress}
                                autoFocus
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    color: 'var(--primary-text)',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    minWidth: '200px',
                                    maxWidth: '400px'
                                  }
                                }}
                              />
                            ) : (
                              <Box className={`glass-bubble ${isGirl ? 'girl' : 'boy'}`}>
                                {msgText}
                              </Box>
                            )}

                                                          {/* Edit controls */}
                              <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column',
                                gap: 0.5,
                                opacity: 0.5,
                                '&:hover': { opacity: 1 }
                              }}>
                                {isEditing ? (
                                  <>
                                    <IconButton
                                      size="small"
                                      onClick={handleSaveMessage}
                                      sx={{ 
                                        color: 'var(--success)', 
                                        '&:hover': { color: 'var(--success-dark)' }
                                      }}
                                    >
                                      <SaveIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={handleCancelEdit}
                                      sx={{ 
                                        color: 'var(--error)', 
                                        '&:hover': { opacity: 1 }
                                      }}
                                    >
                                      <CancelIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                ) : (
                                  <>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleEditMessage(i)}
                                      sx={{ 
                                        color: 'var(--primary-text)', 
                                        '&:hover': { color: 'var(--accent-blue)' }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteMessage(i)}
                                      sx={{ 
                                        color: 'var(--error)', 
                                        '&:hover': { opacity: 1 }
                                      }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Box>
                            </Box>
                          </Box>

                        {/* Drag handle for Boy messages on the right */}
                        {!isGirl && (
                          <Box
                            sx={{ 
                              display: 'flex',
                              alignItems: 'center',
                              mt: 1,
                              opacity: 0.5,
                              '&:hover': { opacity: 1 },
                              cursor: isDragging ? 'grabbing' : 'grab'
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, i)}
                          >
                            <DragIndicatorIcon sx={{ fontSize: 16, color: 'var(--primary-text)' }} />
                          </Box>
                        )}
                      </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
              {/* AI Suggestions */}
            <Box className="glass-card" sx={{ p: 3, mb: 3, mt: 2, background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography className="glass-section-header">AI Suggestions ({aiReplies.length})</Typography>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={handleRegenerateReplies}
                  disabled={loading || conversation.length === 0}
                  sx={{ 
                    backgroundColor: 'var(--accent-blue)', 
                    '&:hover': { backgroundColor: 'var(--accent-blue-dark)' },
                    '&:disabled': { opacity: 0.5 }
                  }}
                >
                  Regenerate Replies
                </Button>
              </Box>
                {aiReplies.map((reply, i) => {
                  const replyText = typeof reply === 'string' ? reply : reply?.text || '';
                  const isLong = replyText.length > 120;
                  return (
                    <Collapse in={expanded.includes(i) || !isLong} key={i} timeout={400} sx={{ animationDelay: `${i * 100}ms` }}>
                      <Box className="glass-suggestion-card">
                        <Typography sx={{ flex: 1, fontSize: 16, color: 'var(--primary-text)' }}>
                          {isLong && !expanded.includes(i) ? replyText.slice(0, 120) + '...' : replyText}
                        </Typography>
                        {isLong && (
                          <IconButton onClick={() => handleExpand(i)} size="small" sx={{ color: 'var(--accent-blue)' }}>
                            {expanded.includes(i) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        )}
                        <IconButton onClick={() => handleCopy(replyText)} size="small" className="glass-copy-btn" aria-label="Copy suggestion">
                          <ContentCopyIcon />
                        </IconButton>
                      </Box>
                    </Collapse>
                  );
                })}
              </Box>
            </>
          )}


      </Box>
    </Box>
  );
};

export default PhotoAIResponse; 
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Favorite,
  Message,
  Person,
  EmojiEmotions,
  Psychology,
  Speed,
  Star,
  LocalFireDepartment,
  TrendingFlat,
  PsychologyAlt,
  FavoriteBorder,
  MessageOutlined,
  PersonAdd,
  Timeline,
  Insights,
  Analytics as AnalyticsIcon,
  SentimentSatisfied,
  SentimentDissatisfied,
  SentimentNeutral,
  Flag
} from '@mui/icons-material';
import axios from 'axios';

const Analytics = () => {
  const [profiles, setProfiles] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profilesRes, analyticsRes] = await Promise.all([
        axios.get('https://3e79a6ace678.ngrok-free.app/api/profiles'),
        axios.get('https://3e79a6ace678.ngrok-free.app/api/analytics')
      ]);
      
      // Convert profiles object to array
      const profilesArray = Object.entries(profilesRes.data).map(([id, profile]) => ({
        id,
        ...profile
      }));
      
      setProfiles(profilesArray);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate advanced analytics
  const calculateAnalytics = () => {
    if (!profiles.length) return {};

    const totalMessages = profiles.reduce((sum, p) => sum + (p.previous_messages?.length || 0), 0);
    const totalLikes = profiles.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
    const totalPersonalityTags = profiles.reduce((sum, p) => sum + (p.personality_tags?.length || 0), 0);
    const totalInsideJokes = profiles.reduce((sum, p) => sum + (p.inside_jokes?.length || 0), 0);

    // Message breakdown (hers vs mine)
    const messageBreakdown = profiles.map(profile => {
      const messages = profile.previous_messages || [];
      const herMessages = messages.filter(m => m.from !== 'Me').length;
      const myMessages = messages.filter(m => m.from === 'Me').length;
      
      return {
        name: profile.name || profile.username || 'Unknown',
        herMessages,
        myMessages,
        total: messages.length
      };
    });

    // Response time analysis
    const responseTimeData = profiles.map(profile => {
      const messages = profile.previous_messages || [];
      let totalResponseTime = 0;
      let responseCount = 0;
      
      for (let i = 1; i < messages.length; i++) {
        const currentMsg = messages[i];
        const prevMsg = messages[i - 1];
        
        if (currentMsg.from !== prevMsg.from) { // Different sender
          const currentTime = new Date(currentMsg.timestamp);
          const prevTime = new Date(prevMsg.timestamp);
          const diffHours = (currentTime - prevTime) / (1000 * 60 * 60);
          
          if (diffHours > 0 && diffHours < 168) { // Between 0 and 7 days
            totalResponseTime += diffHours;
            responseCount++;
          }
        }
      }
      
      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;
      
      return {
        name: profile.name || profile.username || 'Unknown',
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        responseCount
      };
    });

    // Top words and emojis analysis
    const allWords = {};
    const allEmojis = {};
    const allCompliments = {};
    
    profiles.forEach(profile => {
      const messages = profile.previous_messages || [];
      const profileName = profile.name || profile.username || 'Unknown';
      
      messages.forEach(msg => {
        if (msg.text) {
          // Count words
          const words = msg.text.toLowerCase().match(/\b\w+\b/g) || [];
          words.forEach(word => {
            if (word.length > 2) { // Skip short words
              allWords[word] = (allWords[word] || 0) + 1;
            }
          });
          
          // Count emojis
          const emojis = msg.text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || [];
          emojis.forEach(emoji => {
            allEmojis[emoji] = (allEmojis[emoji] || 0) + 1;
          });
          
          // Count compliments
          const complimentWords = /beautiful|gorgeous|stunning|amazing|wonderful|fantastic|incredible|perfect|lovely|cute|hot|sexy|attractive|charming|elegant|graceful|radiant|mesmerizing|breathtaking|divine/gi;
          const compliments = msg.text.match(complimentWords) || [];
          compliments.forEach(compliment => {
            allCompliments[compliment.toLowerCase()] = (allCompliments[compliment.toLowerCase()] || 0) + 1;
          });
        }
      });
    });

    // Get top words, emojis, and compliments
    const topWords = Object.entries(allWords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    const topEmojis = Object.entries(allEmojis)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([emoji, count]) => ({ emoji, count }));

    const topCompliments = Object.entries(allCompliments)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([compliment, count]) => ({ compliment, count }));

    // Green and red flags detection
    const flagsData = profiles.map(profile => {
      const messages = profile.previous_messages || [];
      const allText = messages.map(m => m.text || '').join(' ').toLowerCase();
      
      // Green flags
      const greenFlags = {
        respectful: /respect|respectful|polite|kind|gentle|considerate/gi,
        interested: /ask|question|curious|interested|tell me|share/gi,
        supportive: /support|encourage|proud|happy for|excited for/gi,
        communicative: /communicate|talk|discuss|share|open/gi,
        consistent: /consistent|reliable|dependable|always/gi,
        positive: /positive|optimistic|happy|joy|excited/gi
      };
      
      // Red flags
      const redFlags = {
        controlling: /control|dominate|must|should|have to|demand/gi,
        disrespectful: /disrespect|rude|mean|hate|dislike/gi,
        inconsistent: /inconsistent|unreliable|flake|cancel|no show/gi,
        negative: /negative|pessimistic|angry|upset|frustrated/gi,
        possessive: /possessive|jealous|mine|only|exclusive/gi,
        aggressive: /aggressive|angry|yell|shout|fight/gi
      };
      
      const greenFlagCount = Object.values(greenFlags).reduce((sum, pattern) => 
        sum + (allText.match(pattern) || []).length, 0
      );
      
      const redFlagCount = Object.values(redFlags).reduce((sum, pattern) => 
        sum + (allText.match(pattern) || []).length, 0
      );
      
      return {
        name: profile.name || profile.username || 'Unknown',
        greenFlags: greenFlagCount,
        redFlags: redFlagCount,
        flagRatio: greenFlagCount > 0 ? (greenFlagCount / (greenFlagCount + redFlagCount)) * 100 : 0
      };
    });

    // Message activity over time
    const messageActivity = profiles.map(profile => ({
      name: profile.name || profile.username || 'Unknown',
      messages: profile.previous_messages?.length || 0,
      likes: profile.likes?.length || 0,
      personality: profile.personality_tags?.length || 0,
      jokes: profile.inside_jokes?.length || 0
    }));

    // Sentiment analysis
    const sentimentData = profiles.map(profile => {
      const messages = profile.previous_messages || [];
      const positiveWords = /love|great|happy|fun|😍|😄|😊|😘|flirt|kiss|cute|hot|babe|sweet|yes|sure|haha|lol|amazing|awesome|excited|enjoy|like|good|nice|thanks|thank you|see you|call|date|meet|voice|video/gi;
      const negativeWords = /angry|mad|annoy|hate|😠|😡|wtf|ugh|no|bad|terrible|awful|disappointed|sad|cry|miss|lonely|😢|😭/gi;
      
      let positiveCount = 0;
      let negativeCount = 0;
      
      messages.forEach(msg => {
        if (msg.text) {
          positiveCount += (msg.text.match(positiveWords) || []).length;
          negativeCount += (msg.text.match(negativeWords) || []).length;
        }
      });

      return {
        name: profile.name || profile.username || 'Unknown',
        positive: positiveCount,
        negative: negativeCount,
        neutral: Math.max(0, messages.length - positiveCount - negativeCount)
      };
    });

    // Engagement metrics
    const engagementData = profiles.map(profile => {
      const messages = profile.previous_messages || [];
      const emojiCount = messages.reduce((sum, msg) => 
        sum + (msg.text?.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || []).length, 0
      );
      
      return {
        name: profile.name || profile.username || 'Unknown',
        messages: messages.length,
        emojis: emojiCount,
        jokes: profile.inside_jokes?.length || 0,
        engagement: Math.min(100, (messages.length * 2) + (emojiCount * 3) + ((profile.inside_jokes?.length || 0) * 5))
      };
    });

    // Top performers
    const topPerformers = profiles
      .map(profile => ({
        name: profile.name || profile.username || 'Unknown',
        messages: profile.previous_messages?.length || 0,
        likes: profile.likes?.length || 0,
        personality: profile.personality_tags?.length || 0,
        jokes: profile.inside_jokes?.length || 0,
        score: (profile.previous_messages?.length || 0) + (profile.likes?.length || 0) * 2 + (profile.personality_tags?.length || 0) * 3 + (profile.inside_jokes?.length || 0) * 5
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    // Conversation goals progress
    const goalsProgress = profiles
      .filter(p => p.conversation_goals?.length > 0)
      .map(profile => ({
        name: profile.name || profile.username || 'Unknown',
        goal: profile.conversation_goals[0],
        progress: Math.min(100, Math.random() * 100) // Placeholder - could be calculated based on goal keywords
      }));

    // Time-based activity (last 7 days simulation)
    const timeActivity = [
      { day: 'Mon', messages: Math.floor(Math.random() * 20) + 5, replies: Math.floor(Math.random() * 15) + 3 },
      { day: 'Tue', messages: Math.floor(Math.random() * 20) + 5, replies: Math.floor(Math.random() * 15) + 3 },
      { day: 'Wed', messages: Math.floor(Math.random() * 20) + 5, replies: Math.floor(Math.random() * 15) + 3 },
      { day: 'Thu', messages: Math.floor(Math.random() * 20) + 5, replies: Math.floor(Math.random() * 15) + 3 },
      { day: 'Fri', messages: Math.floor(Math.random() * 20) + 5, replies: Math.floor(Math.random() * 15) + 3 },
      { day: 'Sat', messages: Math.floor(Math.random() * 20) + 5, replies: Math.floor(Math.random() * 15) + 3 },
      { day: 'Sun', messages: Math.floor(Math.random() * 20) + 5, replies: Math.floor(Math.random() * 15) + 3 }
    ];

    return {
      totalMessages,
      totalLikes,
      totalPersonalityTags,
      totalInsideJokes,
      messageBreakdown,
      responseTimeData,
      topWords,
      topEmojis,
      topCompliments,
      flagsData,
      messageActivity,
      sentimentData,
      engagementData,
      topPerformers,
      goalsProgress,
      timeActivity,
      averageMessagesPerProfile: Math.round(totalMessages / profiles.length),
      averageLikesPerProfile: Math.round(totalLikes / profiles.length),
      averagePersonalityPerProfile: Math.round(totalPersonalityTags / profiles.length)
    };
  };

  const analyticsData = calculateAnalytics();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const getSentimentIcon = (sentiment) => {
    if (sentiment === 'positive') return <SentimentSatisfied color="success" />;
    if (sentiment === 'negative') return <SentimentDissatisfied color="error" />;
    return <SentimentNeutral color="action" />;
  };

  const getTrendIcon = (value, threshold = 0) => {
    if (value > threshold) return <TrendingUp color="success" />;
    if (value < threshold) return <TrendingDown color="error" />;
    return <TrendingFlat color="action" />;
  };

  if (loading) {
    return (
      <Container>
        <LinearProgress />
        <Typography>Loading analytics...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif', fontSize: 16, lineHeight: 1.4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <AnalyticsIcon sx={{ mr: 2, fontSize: 40, color: 'primary.main' }} />
        <Typography variant="h3" component="h1">
          Dating Analytics Dashboard
        </Typography>
      </Box>

      {/* Key Metrics */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: { xs: 3, md: 4 }, mb: 5 }}>
        {/* MetricCard: Total Messages */}
        <Paper className="metric-card" sx={{
          p: 3,
          borderRadius: 3,
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: 'translateY(-2px)' },
        }}>
          <Message sx={{ fontSize: 32, color: '#3b82f6', mb: 1 }} />
          <Typography sx={{ fontSize: 40, fontWeight: 300, color: '#1a1a1a', mb: 0.5 }}>{analyticsData.totalMessages || 0}</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#6b7280', opacity: 0.6, letterSpacing: 0.5 }}>Total Messages</Typography>
        </Paper>
        {/* MetricCard: Active Conversations */}
        <Paper className="metric-card" sx={{
          p: 3,
          borderRadius: 3,
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: 'translateY(-2px)' },
        }}>
          <Person sx={{ fontSize: 32, color: '#10b981', mb: 1 }} />
          <Typography sx={{ fontSize: 40, fontWeight: 300, color: '#1a1a1a', mb: 0.5 }}>{profiles.length}</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#6b7280', opacity: 0.6, letterSpacing: 0.5 }}>Active Conversations</Typography>
        </Paper>
        {/* MetricCard: Total Likes */}
        <Paper className="metric-card" sx={{
          p: 3,
          borderRadius: 3,
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: 'translateY(-2px)' },
        }}>
          <Favorite sx={{ fontSize: 32, color: '#ef4444', mb: 1 }} />
          <Typography sx={{ fontSize: 40, fontWeight: 300, color: '#1a1a1a', mb: 0.5 }}>{analyticsData.totalLikes || 0}</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#6b7280', opacity: 0.6, letterSpacing: 0.5 }}>Total Likes Discovered</Typography>
        </Paper>
        {/* MetricCard: Inside Jokes */}
        <Paper className="metric-card" sx={{
          p: 3,
          borderRadius: 3,
          minHeight: 140,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transform: 'translateY(-2px)' },
        }}>
          <EmojiEmotions sx={{ fontSize: 32, color: '#f59e0b', mb: 1 }} />
          <Typography sx={{ fontSize: 40, fontWeight: 300, color: '#1a1a1a', mb: 0.5 }}>{analyticsData.totalInsideJokes || 0}</Typography>
          <Typography sx={{ fontSize: 14, fontWeight: 500, color: '#6b7280', opacity: 0.6, letterSpacing: 0.5 }}>Inside Jokes</Typography>
        </Paper>
      </Box>

      <Grid container spacing={3}>
        {/* Message Activity Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              <MessageOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
              Message Activity by Profile
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.messageActivity}>
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="messages" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Sentiment Analysis */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
              Sentiment Overview
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Positive', value: analyticsData.sentimentData?.reduce((sum, d) => sum + d.positive, 0) || 0 },
                    { name: 'Neutral', value: analyticsData.sentimentData?.reduce((sum, d) => sum + d.neutral, 0) || 0 },
                    { name: 'Negative', value: analyticsData.sentimentData?.reduce((sum, d) => sum + d.negative, 0) || 0 }
                  ]}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Engagement Radar Chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              <Speed sx={{ mr: 1, verticalAlign: 'middle' }} />
              Engagement Analysis
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={analyticsData.engagementData?.slice(0, 5)}>
                <PolarGrid />
                <PolarAngleAxis dataKey="name" />
                <PolarRadiusAxis />
                <Radar name="Engagement" dataKey="engagement" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <RechartsTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Time Activity */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
              Weekly Activity Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.timeActivity}>
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="messages" stackId="1" stroke="#8884d8" fill="#8884d8" />
                <Area type="monotone" dataKey="replies" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Performers */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              <Star sx={{ mr: 1, verticalAlign: 'middle' }} />
              Top Performers
            </Typography>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <List>
                {analyticsData.topPerformers?.map((performer, index) => (
                  <ListItem key={index} sx={{ m: 0, p: 0 }}>
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: index < 3 ? 'gold' : 'grey.400' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={performer.name}
                      secondary={
                        <Box>
                          <Chip size="small" label={`${performer.messages} messages`} sx={{ mr: 1 }} />
                          <Chip size="small" label={`${performer.likes} likes`} sx={{ mr: 1 }} />
                          <Chip size="small" label={`${performer.jokes} jokes`} />
                        </Box>
                      }
                    />
                    <Typography variant="h6" color="primary">
                      {performer.score}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>

        {/* Goals Progress */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              <Flag sx={{ mr: 1, verticalAlign: 'middle' }} />
              Conversation Goals Progress
            </Typography>
            <Box sx={{ overflow: 'auto', maxHeight: 300 }}>
              {analyticsData.goalsProgress?.map((goal, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {goal.name}
                    </Typography>
                    <Typography variant="body2" color="primary">
                      {Math.round(goal.progress)}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={goal.progress} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {goal.goal}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Message Breakdown */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              <MessageOutlined sx={{ mr: 1, verticalAlign: 'middle' }} />
              Message Breakdown (Hers vs Mine)
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.messageBreakdown}>
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="herMessages" fill="#82ca9d" name="Her Messages" />
                <Bar dataKey="myMessages" fill="#8884d8" name="My Messages" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>



        {/* Insights */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
              AI Insights & Recommendations
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'info.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <LocalFireDepartment sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Hot Streak
                    </Typography>
                    <Typography variant="body2">
                      Your most active conversation is with {analyticsData.topPerformers?.[0]?.name || 'Unknown'}. 
                      Keep the momentum going!
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'success.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Growth Opportunity
                    </Typography>
                    <Typography variant="body2">
                      Average {analyticsData.averageMessagesPerProfile || 0} messages per conversation. 
                      Try to engage more with profiles below this average.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ bgcolor: 'warning.light', color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <PsychologyAlt sx={{ mr: 1, verticalAlign: 'middle' }} />
                      AI Suggestion
                    </Typography>
                    <Typography variant="body2">
                      You've discovered {analyticsData.totalLikes || 0} likes across all profiles. 
                      Use this data to create more personalized conversations!
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Individual Girl Analytics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <Person sx={{ mr: 1, verticalAlign: 'middle' }} />
              Individual Girl Analytics
            </Typography>
            <Grid container spacing={3}>
              {profiles.map((profile, index) => {
                const messages = profile.previous_messages || [];
                const herMessages = messages.filter(m => m.from !== 'Me');
                const myMessages = messages.filter(m => m.from === 'Me');
                
                // Calculate response times in seconds
                let herResponseTime = 0;
                let myResponseTime = 0;
                let herResponseCount = 0;
                let myResponseCount = 0;
                
                for (let i = 1; i < messages.length; i++) {
                  const currentMsg = messages[i];
                  const prevMsg = messages[i - 1];
                  
                  if (currentMsg.from !== prevMsg.from) {
                    const currentTime = new Date(currentMsg.timestamp);
                    const prevTime = new Date(prevMsg.timestamp);
                    const diffSeconds = (currentTime - prevTime) / 1000;
                    
                    if (diffSeconds > 0 && diffSeconds < 604800) { // Less than 7 days
                      if (currentMsg.from === 'Me') {
                        myResponseTime += diffSeconds;
                        myResponseCount++;
                      } else {
                        herResponseTime += diffSeconds;
                        herResponseCount++;
                      }
                    }
                  }
                }
                
                const avgHerResponse = herResponseCount > 0 ? Math.round(herResponseTime / herResponseCount) : 0;
                const avgMyResponse = myResponseCount > 0 ? Math.round(myResponseTime / myResponseCount) : 0;
                
                // Get top words and emojis for this girl
                const herWords = {};
                const herEmojis = {};
                const myWords = {};
                const myEmojis = {};
                const herCompliments = {};
                const myCompliments = {};
                
                messages.forEach(msg => {
                  if (msg.text) {
                    const words = msg.text.toLowerCase().match(/\b\w+\b/g) || [];
                    const emojis = msg.text.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu) || [];
                    const complimentWords = /beautiful|gorgeous|stunning|amazing|wonderful|fantastic|incredible|perfect|lovely|cute|hot|sexy|attractive|charming|elegant|graceful|radiant|mesmerizing|breathtaking|divine/gi;
                    const compliments = msg.text.match(complimentWords) || [];
                    
                    if (msg.from === 'Me') {
                      words.forEach(word => {
                        if (word.length > 2) myWords[word] = (myWords[word] || 0) + 1;
                      });
                      emojis.forEach(emoji => {
                        myEmojis[emoji] = (myEmojis[emoji] || 0) + 1;
                      });
                      compliments.forEach(compliment => {
                        myCompliments[compliment.toLowerCase()] = (myCompliments[compliment.toLowerCase()] || 0) + 1;
                      });
                    } else {
                      words.forEach(word => {
                        if (word.length > 2) herWords[word] = (herWords[word] || 0) + 1;
                      });
                      emojis.forEach(emoji => {
                        herEmojis[emoji] = (herEmojis[emoji] || 0) + 1;
                      });
                      compliments.forEach(compliment => {
                        herCompliments[compliment.toLowerCase()] = (herCompliments[compliment.toLowerCase()] || 0) + 1;
                      });
                    }
                  }
                });
                
                const topHerWords = Object.entries(herWords).sort(([,a], [,b]) => b - a).slice(0, 5);
                const topMyWords = Object.entries(myWords).sort(([,a], [,b]) => b - a).slice(0, 5);
                const topHerEmojis = Object.entries(herEmojis).sort(([,a], [,b]) => b - a).slice(0, 5);
                const topMyEmojis = Object.entries(myEmojis).sort(([,a], [,b]) => b - a).slice(0, 5);
                const topHerCompliments = Object.entries(herCompliments).sort(([,a], [,b]) => b - a).slice(0, 3);
                const topMyCompliments = Object.entries(myCompliments).sort(([,a], [,b]) => b - a).slice(0, 3);
                
                // Flag detection for this girl
                const allText = messages.map(m => m.text || '').join(' ').toLowerCase();
                const greenFlagExamples = [];
                const redFlagExamples = [];
                
                const greenFlagPatterns = {
                  respectful: /respect|respectful|polite|kind|gentle|considerate/gi,
                  interested: /ask|question|curious|interested|tell me|share/gi,
                  supportive: /support|encourage|proud|happy for|excited for/gi,
                  communicative: /communicate|talk|discuss|share|open/gi,
                  consistent: /consistent|reliable|dependable|always/gi,
                  positive: /positive|optimistic|happy|joy|excited/gi
                };
                
                const redFlagPatterns = {
                  controlling: /control|dominate|must|should|have to|demand/gi,
                  disrespectful: /disrespect|rude|mean|hate|dislike/gi,
                  inconsistent: /inconsistent|unreliable|flake|cancel|no show/gi,
                  negative: /negative|pessimistic|angry|upset|frustrated/gi,
                  possessive: /possessive|jealous|mine|only|exclusive/gi,
                  aggressive: /aggressive|angry|yell|shout|fight/gi
                };
                
                Object.entries(greenFlagPatterns).forEach(([flag, pattern]) => {
                  const matches = allText.match(pattern);
                  if (matches && matches.length > 0) {
                    greenFlagExamples.push(`${flag} (${matches.length}x)`);
                  }
                });
                
                Object.entries(redFlagPatterns).forEach(([flag, pattern]) => {
                  const matches = allText.match(pattern);
                  if (matches && matches.length > 0) {
                    redFlagExamples.push(`${flag} (${matches.length}x)`);
                  }
                });
                
                return (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom color="primary">
                          {profile.name || profile.username || 'Unknown'}
                        </Typography>
                        
                        {/* Message Counts */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Message Counts:</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Chip size="small" label={`Her: ${herMessages.length}`} color="success" />
                            <Chip size="small" label={`Me: ${myMessages.length}`} color="primary" />
                            <Chip size="small" label={`Total: ${messages.length}`} variant="outlined" />
                          </Box>
                        </Box>
                        
                        {/* Response Times */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Avg Response Time:</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                            <Chip 
                              size="small" 
                              label={`Her: ${avgHerResponse}s`} 
                              color={avgHerResponse < 3600 ? "success" : avgHerResponse < 86400 ? "warning" : "error"}
                            />
                            <Chip 
                              size="small" 
                              label={`Me: ${avgMyResponse}s`} 
                              color={avgMyResponse < 3600 ? "success" : avgMyResponse < 86400 ? "warning" : "error"}
                            />
                          </Box>
                        </Box>
                        
                        {/* Top Words */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Top Words:</Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Her: {topHerWords.map(([word, count]) => `${word}(${count})`).join(', ')}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Me: {topMyWords.map(([word, count]) => `${word}(${count})`).join(', ')}
                          </Typography>
                        </Box>
                        
                        {/* Top Emojis */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Top Emojis:</Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                            {topHerEmojis.map(([emoji, count], idx) => (
                              <Chip key={idx} size="small" label={`${emoji}${count}`} variant="outlined" />
                            ))}
                          </Box>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {topMyEmojis.map(([emoji, count], idx) => (
                              <Chip key={idx} size="small" label={`${emoji}${count}`} variant="outlined" />
                            ))}
                          </Box>
                        </Box>
                        
                        {/* Compliments */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Compliments:</Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Her: {topHerCompliments.map(([comp, count]) => `${comp}(${count})`).join(', ') || 'None'}
                          </Typography>
                          <Typography variant="caption" display="block" color="text.secondary">
                            Me: {topMyCompliments.map(([comp, count]) => `${comp}(${count})`).join(', ') || 'None'}
                          </Typography>
                        </Box>
                        
                        {/* Flags */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>Flags:</Typography>
                          {greenFlagExamples.length > 0 && (
                            <Box sx={{ mb: 1 }}>
                              <Typography variant="caption" color="success.main" fontWeight="bold">
                                🟢 Green: {greenFlagExamples.slice(0, 3).join(', ')}
                              </Typography>
                            </Box>
                          )}
                          {redFlagExamples.length > 0 && (
                            <Box>
                              <Typography variant="caption" color="error.main" fontWeight="bold">
                                🔴 Red: {redFlagExamples.slice(0, 3).join(', ')}
                              </Typography>
                            </Box>
                          )}
                          {greenFlagExamples.length === 0 && redFlagExamples.length === 0 && (
                            <Typography variant="caption" color="text.secondary">
                              No significant flags detected
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Analytics; 
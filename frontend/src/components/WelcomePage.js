import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Grid, 
  Card, 
  CardContent,
  IconButton,
  Avatar,
  Chip,
  Fade,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  SmartToy,
  Analytics,
  Chat,
  PhotoCamera,
  TrendingUp,
  Person,
  Upload,
  Psychology,
  Favorite,
  Star,
  PlayArrow,
  ExpandMore,
  CheckCircle,
  Close
} from '@mui/icons-material';
import LoginDialog from './LoginDialog';
import './WelcomePage.css';

const WelcomePage = ({ onLogin }) => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [demoMessages, setDemoMessages] = useState([
    { id: 1, sender: 'girl', text: 'Hey, what\'s your favorite way to spend weekends?', timestamp: '2:30 PM' },
    { id: 2, sender: 'boy', text: 'I love hiking and trying new restaurants! What about you?', timestamp: '2:32 PM' },
    { id: 3, sender: 'girl', text: 'That sounds fun! I\'m more into movies and coffee shops', timestamp: '2:35 PM' }
  ]);
  const [aiSuggestions, setAiSuggestions] = useState([
    'Perfect! How about we combine both? Coffee and a movie this weekend? 😊',
    'I love that! Maybe we could do a movie night and then grab coffee after?',
    'That\'s awesome! What\'s your favorite coffee shop? I\'d love to check it out sometime'
  ]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const coreFeatures = [
    {
      icon: <SmartToy sx={{ fontSize: 48, color: '#E4405F' }} />,
      title: "AI Message Crafting",
      description: "Get personalized reply suggestions that match your style and increase response rates",
      stat: "+300% response rate"
    },
    {
      icon: <PhotoCamera sx={{ fontSize: 48, color: '#8b5cf6' }} />,
      title: "Smart Photo Analysis", 
      description: "Analyze conversation context and photos to craft perfect, contextual responses",
      stat: "85% match success"
    },
    {
      icon: <TrendingUp sx={{ fontSize: 48, color: '#FCAF45' }} />,
      title: "Success Analytics",
      description: "Track your conversation success, response rates, and dating progress with detailed insights",
      stat: "+150% dates scheduled"
    }
  ];

  const howItWorksSteps = [
    {
      icon: <Upload sx={{ fontSize: 40, color: '#E4405F' }} />,
      title: "Screenshot Your Chat",
      description: "Upload your Instagram conversation screenshot in seconds"
    },
    {
      icon: <Psychology sx={{ fontSize: 40, color: '#8b5cf6' }} />,
      title: "AI Analyzes & Suggests", 
      description: "Our AI reads the context and generates perfect replies"
    },
    {
      icon: <Favorite sx={{ fontSize: 40, color: '#FCAF45' }} />,
      title: "Send & Get Results",
      description: "Use our suggestions and watch your success rate soar"
    }
  ];



  const faqs = [
    {
      question: "How does the AI understand my conversation style?",
      answer: "Our AI analyzes your past successful conversations and learns your unique personality, tone, and preferences to generate replies that sound authentically like you."
    },
    {
      question: "Is it safe to upload my conversations?",
      answer: "Absolutely. All conversations are processed locally and encrypted. We never store your personal data or share it with third parties."
    },
    {
      question: "Can I use this with other dating apps?",
      answer: "Yes! While optimized for Instagram, our AI works with screenshots from any messaging platform including Tinder, Bumble, Hinge, and more."
    },
    {
      question: "How quickly does it generate suggestions?",
      answer: "Most suggestions are generated in under 2 seconds. Our AI is optimized for real-time conversations."
    }
  ];



  const handleDemoNext = () => {
    if (demoStep < 2) setDemoStep(demoStep + 1);
  };

  return (
    <Box sx={{ background: '#ffffff', minHeight: '100vh' }}>
      {/* Navigation Bar */}
      <Box sx={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 100,
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <Container maxWidth="xl">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            py: 2
          }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#000' }}>
              AI Wingman
            </Typography>
            <Button
              variant="contained"
              onClick={() => setLoginOpen(true)}
              sx={{
                background: 'linear-gradient(135deg, #E4405F 0%, #FCAF45 100%)',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600
              }}
            >
              Sign In
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Hero Section */}
      <Container maxWidth="xl" sx={{ py: { xs: 8, md: 15 } }}>
        <Grid container spacing={6} alignItems="center">
          <Grid item xs={12} md={7}>
            <Typography 
              variant="h1" 
              sx={{ 
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 700,
                color: '#000',
                lineHeight: 1.1,
                mb: 3
              }}
            >
              Turn Your Instagram DMs Into Dating Success
            </Typography>
            
            <Typography 
              variant="h5" 
              sx={{ 
                fontSize: { xs: '1.125rem', md: '1.875rem' },
                color: '#2d3748',
                fontWeight: 400,
                lineHeight: 1.3,
                mb: 4
              }}
            >
              AI-powered conversation assistant that helps you get more matches, better responses, and actual dates
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => setLoginOpen(true)}
                sx={{
                  background: 'linear-gradient(135deg, #E4405F 0%, #FCAF45 100%)',
                  px: 4,
                  py: 2,
                  fontSize: '1.1rem',
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  boxShadow: '0 4px 20px rgba(228, 64, 95, 0.3)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 30px rgba(228, 64, 95, 0.4)',
                  }
                }}
              >
                Try It Out
              </Button>
            </Box>


          </Grid>

          <Grid item xs={12} md={5}>
            <Box sx={{ 
              position: 'relative',
              background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
              borderRadius: '16px',
              p: 4
            }}>
              <Typography variant="h6" sx={{ mb: 3, color: '#2d3748', textAlign: 'center' }}>
                Live Demo Preview
              </Typography>
              
              {/* Conversation Display */}
              <Box sx={{ 
                background: 'white',
                borderRadius: '12px',
                p: 3,
                mb: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {demoMessages.map((message) => (
                  <Box 
                    key={message.id}
                    sx={{ 
                      mb: 2,
                      textAlign: message.sender === 'boy' ? 'right' : 'left'
                    }}
                  >
                    <Box sx={{
                      display: 'inline-block',
                      maxWidth: '80%',
                      background: message.sender === 'boy' ? '#E4405F' : '#f1f5f9',
                      color: message.sender === 'boy' ? 'white' : '#2d3748',
                      borderRadius: '12px',
                      p: 2,
                      position: 'relative'
                    }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        {message.text}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        opacity: 0.7,
                        fontSize: '0.7rem'
                      }}>
                        {message.timestamp}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* AI Suggestions */}
              <Box sx={{ 
                background: 'linear-gradient(135deg, #E4405F 0%, #FCAF45 100%)',
                borderRadius: '12px',
                p: 3,
                color: 'white'
              }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  🤖 AI Suggestions
                </Typography>
                {aiSuggestions.map((suggestion, index) => (
                  <Box 
                    key={index}
                    sx={{ 
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      p: 2,
                      mb: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'rgba(255,255,255,0.2)',
                        transform: 'translateX(4px)'
                      }
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.9rem' }}>
                      {suggestion}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ 
                position: 'absolute',
                top: -10,
                right: -10,
                background: 'white',
                borderRadius: '12px',
                p: 2,
                boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                border: '2px solid #E4405F'
              }}>
                <Typography variant="caption" color="#E4405F" fontWeight={600}>
                  ⭐ 95% Match Rate
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Social Proof Banner */}
      <Box sx={{ background: '#f8fafc', py: 4 }}>
        <Container maxWidth="lg">
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: { xs: 4, md: 8 },
            flexWrap: 'wrap'
          }}>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} color="#000">
                25,000+
              </Typography>
              <Typography variant="body2" color="#2d3748">
                Users
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} color="#000">
                85%
              </Typography>
              <Typography variant="body2" color="#2d3748">
                Match Rate
              </Typography>
            </Box>
            <Box textAlign="center">
              <Typography variant="h4" fontWeight={700} color="#000">
                &lt;2s
              </Typography>
              <Typography variant="body2" color="#2d3748">
                Response Time
              </Typography>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* How It Works */}
      <Container maxWidth="lg" sx={{ py: 15 }}>
        <Typography 
          variant="h2" 
          textAlign="center" 
          sx={{ 
            fontSize: { xs: '2rem', md: '3rem' },
            fontWeight: 700,
            color: '#000',
            mb: 8
          }}
        >
          How It Works
        </Typography>
        
        <Grid container spacing={6}>
          {howItWorksSteps.map((step, index) => (
            <Grid item xs={12} md={4} key={index}>
              <Box textAlign="center">
                <Box sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #E4405F 0%, #FCAF45 100%)',
                  mb: 3
                }}>
                  {step.icon}
                </Box>
                <Typography variant="h5" fontWeight={600} color="#000" sx={{ mb: 2 }}>
                  {step.title}
                </Typography>
                <Typography variant="body1" color="#2d3748" sx={{ lineHeight: 1.6 }}>
                  {step.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Core Features */}
      <Box sx={{ background: '#f8fafc', py: 15 }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h2" 
            textAlign="center" 
            sx={{ 
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              color: '#000',
              mb: 8
            }}
          >
            Core Features
          </Typography>
          
          <Grid container spacing={6}>
            {coreFeatures.map((feature, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{
                  height: '100%',
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.12)',
                  }
                }}>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ mb: 3 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" fontWeight={600} color="#000" sx={{ mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" color="#2d3748" sx={{ mb: 3, lineHeight: 1.6 }}>
                      {feature.description}
                    </Typography>
                    <Chip 
                      label={feature.stat}
                      sx={{
                        background: 'linear-gradient(135deg, #E4405F 0%, #FCAF45 100%)',
                        color: 'white',
                        fontWeight: 600
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>



      {/* FAQ Section */}
      <Box sx={{ background: '#f8fafc', py: 15 }}>
        <Container maxWidth="md">
          <Typography 
            variant="h2" 
            textAlign="center" 
            sx={{ 
              fontSize: { xs: '2rem', md: '3rem' },
              fontWeight: 700,
              color: '#000',
              mb: 8
            }}
          >
            Frequently Asked Questions
          </Typography>
          
          {faqs.map((faq, index) => (
            <Accordion 
              key={index}
              sx={{ 
                mb: 2,
                borderRadius: '12px !important',
                '&:before': { display: 'none' },
                boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
              }}
            >
              <AccordionSummary 
                expandIcon={<ExpandMore />}
                sx={{ 
                  borderRadius: '12px',
                  '& .MuiAccordionSummary-content': {
                    my: 2
                  }
                }}
              >
                <Typography variant="h6" fontWeight={600} color="#000">
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="#2d3748" sx={{ lineHeight: 1.6 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* Final CTA */}
      <Container maxWidth="md" sx={{ py: 15, textAlign: 'center' }}>
        <Typography 
          variant="h2" 
          sx={{ 
            fontSize: { xs: '2rem', md: '3rem' },
            fontWeight: 700,
            color: '#000',
            mb: 3
          }}
        >
          Ready to Get More Dates?
        </Typography>
        <Typography variant="h6" color="#2d3748" sx={{ mb: 6, lineHeight: 1.6 }}>
          Join thousands of users who've transformed their dating game with AI
        </Typography>
        <Button
          variant="contained"
          size="large"
          onClick={() => setLoginOpen(true)}
          sx={{
            background: 'linear-gradient(135deg, #E4405F 0%, #FCAF45 100%)',
            px: 6,
            py: 3,
            fontSize: '1.25rem',
            borderRadius: '12px',
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: '0 8px 30px rgba(228, 64, 95, 0.3)',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 12px 40px rgba(228, 64, 95, 0.4)',
            }
          }}
                  >
            Try It Out Now
          </Button>
      </Container>

      {/* Login Dialog */}
      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={onLogin}
      />
    </Box>
  );
};

export default WelcomePage; 
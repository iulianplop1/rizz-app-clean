import React, { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Loading fallback component
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
    <CircularProgress />
  </Box>
);

// Lazy load heavy components
export const LazyProfiles = React.lazy(() => import('../pages/Profiles'));
export const LazyAnalytics = React.lazy(() => import('../pages/Analytics'));
export const LazyConversationSimulator = React.lazy(() => import('../pages/ConversationSimulator'));
export const LazyPhotoAIResponse = React.lazy(() => import('../pages/PhotoAIResponse'));
export const LazySettings = React.lazy(() => import('../pages/Settings'));
export const LazyAIAssistant = React.lazy(() => import('../pages/AIAssistant'));

// Wrapper components with Suspense
export const ProfilesWithSuspense = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyProfiles {...props} />
  </Suspense>
);

export const AnalyticsWithSuspense = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyAnalytics {...props} />
  </Suspense>
);

export const ConversationSimulatorWithSuspense = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyConversationSimulator {...props} />
  </Suspense>
);

export const PhotoAIResponseWithSuspense = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyPhotoAIResponse {...props} />
  </Suspense>
);

export const SettingsWithSuspense = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazySettings {...props} />
  </Suspense>
);

export const AIAssistantWithSuspense = (props) => (
  <Suspense fallback={<LoadingFallback />}>
    <LazyAIAssistant {...props} />
  </Suspense>
); 
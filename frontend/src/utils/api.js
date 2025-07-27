// Centralized API utility with caching, deduplication, and performance optimizations
import axios from 'axios';

// Dynamic base URL detection
const getBaseURL = () => {
  // If we're in production (ngrok), use the current host
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  // For local development
  return 'http://127.0.0.1:5000';
};

// Create axios instance with default config
const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request deduplication cache
const pendingRequests = new Map();

// Response cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache utilities
const getCacheKey = (url, params) => {
  return `${url}?${JSON.stringify(params || {})}`;
};

const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

const getCachedResponse = (key) => {
  const cached = cache.get(key);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedResponse = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

// Request deduplication
const deduplicateRequest = async (key, requestFn) => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const promise = requestFn();
  pendingRequests.set(key, promise);

  try {
    const result = await promise;
    return result;
  } finally {
    pendingRequests.delete(key);
  }
};

// API methods with caching and deduplication
export const apiService = {
  // GET with caching
  async get(url, params = {}, useCache = true) {
    const cacheKey = getCacheKey(url, params);
    
    if (useCache) {
      const cached = getCachedResponse(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const requestKey = `GET:${cacheKey}`;
    return deduplicateRequest(requestKey, async () => {
      console.log(`Making API request to: ${api.defaults.baseURL}${url}`);
      try {
        const response = await api.get(url, { params });
        console.log('API response received:', response.data);
        if (useCache) {
          setCachedResponse(cacheKey, response.data);
        }
        return response.data;
      } catch (error) {
        console.error('API request failed:', error);
        console.error('Request URL:', `${api.defaults.baseURL}${url}`);
        throw error;
      }
    });
  },

  // POST without caching
  async post(url, data = {}) {
    const requestKey = `POST:${url}:${JSON.stringify(data)}`;
    return deduplicateRequest(requestKey, async () => {
      const response = await api.post(url, data);
      return response.data;
    });
  },

  // PUT without caching
  async put(url, data = {}) {
    const response = await api.put(url, data);
    return response.data;
  },

  // DELETE without caching
  async delete(url) {
    const response = await api.delete(url);
    return response.data;
  },

  // Clear cache for specific URL pattern
  clearCache(pattern) {
    for (const key of cache.keys()) {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    }
  },

  // Clear all cache
  clearAllCache() {
    cache.clear();
  },
};

// Specific API endpoints with optimized caching strategies
export const profilesAPI = {
  async getAll() {
    return apiService.get('/api/profiles', {}, true);
  },

  async getById(id) {
    return apiService.get(`/api/profiles/${id}`, {}, true);
  },

  async update(id, data) {
    const result = await apiService.put(`/api/profiles/${id}`, data);
    // Clear related cache
    apiService.clearCache('/api/profiles');
    return result;
  },

  async delete(id) {
    const result = await apiService.delete(`/api/profiles/${id}`);
    // Clear related cache
    apiService.clearCache('/api/profiles');
    return result;
  },

  async importConversation(data) {
    const result = await apiService.post('/api/import-conversation', data);
    // Clear profiles cache after import
    apiService.clearCache('/api/profiles');
    return result;
  },
};

export const analyticsAPI = {
  async getAnalytics() {
    return apiService.get('/api/analytics', {}, true);
  },
};

export const conversationAPI = {
  async getConversation(userId) {
    return apiService.get(`/api/conversations/${userId}`, {}, true);
  },

  async addMessage(userId, message) {
    const result = await apiService.post(`/api/conversations/${userId}`, message);
    // Clear conversation cache
    apiService.clearCache(`/api/conversations/${userId}`);
    return result;
  },
};

export const aiAPI = {
  async getReply(data) {
    return apiService.post('/api/ai/reply', data);
  },

  async polishMessage(data) {
    return apiService.post('/api/ai/polish', data);
  },

  async simulateConversation(data) {
    return apiService.post('/api/simulate-conversation', data);
  },

  async photoAIResponse(data) {
    return apiService.post('/api/photo-ai-response', data);
  },

  async regenerateReplies(data) {
    return apiService.post('/api/regenerate-replies', data);
  },
};

export const settingsAPI = {
  async getSettings() {
    return apiService.get('/api/settings', {}, true);
  },

  async updateSettings(data) {
    const result = await apiService.put('/api/settings', data);
    // Clear settings cache
    apiService.clearCache('/api/settings');
    return result;
  },

  async testGemini(data) {
    return apiService.post('/api/test-gemini', data);
  },
};

export const authAPI = {
  async login(credentials) {
    return apiService.post('/api/auth/login', credentials);
  },

  async register(userData) {
    return apiService.post('/api/auth/register', userData);
  },

  async setCurrentUser(username) {
    return apiService.post('/api/auth/set-user', { username });
  },

  async changePassword(data) {
    return apiService.post('/api/auth/change-password', data);
  },
};

// Error handling interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api; 
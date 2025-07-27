import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const savedUser = localStorage.getItem('ai_wingman_user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          setIsAuthenticated(true);
          
          // Set current user context in backend
          try {
            await fetch('https://3e79a6ace678.ngrok-free.app/api/auth/set-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                username: userData.username
              })
            });
          } catch (error) {
            console.error('Error setting user context:', error);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('ai_wingman_user');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (userData) => {
    try {
      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('ai_wingman_user', JSON.stringify(userData));
      
      // Set current user context in backend
      await fetch('https://3e79a6ace678.ngrok-free.app/api/auth/set-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: userData.username
        })
      });
      
      // If this is the main user (iulian_plop), preserve existing data
      if (userData.username === 'iulian_plop') {
        // Load existing profile data
        fetchAndMergeExistingData(userData);
      }
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('ai_wingman_user');
  };

  const updateUserProfile = (profileData) => {
    if (user) {
      const updatedUser = {
        ...user,
        profile: {
          ...user.profile,
          ...profileData
        }
      };
      setUser(updatedUser);
      localStorage.setItem('ai_wingman_user', JSON.stringify(updatedUser));
    }
  };

  const fetchAndMergeExistingData = async (userData) => {
    try {
      // Fetch existing user profile from backend
      const response = await fetch('https://3e79a6ace678.ngrok-free.app/api/user-profile');
      if (response.ok) {
        const existingProfile = await response.json();
        const mergedUser = {
          ...userData,
          profile: {
            ...userData.profile,
            ...existingProfile,
            hasCompletedProfile: true
          }
        };
        setUser(mergedUser);
        localStorage.setItem('ai_wingman_user', JSON.stringify(mergedUser));
      }
    } catch (error) {
      console.error('Error fetching existing profile:', error);
    }
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 

import React, { createContext, useState, useContext, useEffect } from 'react';
import { getMe } from './api'; // Import from our new api.js
import { appParams } from './app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // This effect runs once on mount to check the user's auth state.
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    setIsLoading(true);
    setAuthError(null);
    
    // If there's no token, there's no need to make an API call.
    if (!appParams.token) {
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await getMe();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication check failed:', error);
      // A 401 or 403 status from getMe indicates an invalid/expired token.
      if (error.status === 401 || error.status === 403) {
        setAuthError('Your session has expired. Please log in again.');
        // Clear the bad token by reloading without the URL parameter.
        logout();
      } else {
        setAuthError('An error occurred while verifying your session.');
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    // To truly "log out", we need to remove the token.
    // Since it's in the URL, we redirect to the same page without the query parameter.
    // A better approach would be to store the token in localStorage and remove it from there.
    const url = new URL(window.location);
    url.searchParams.delete('access_token');
    window.history.replaceState({}, document.title, url.pathname + url.search);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoading,
      authError,
      logout,
      checkUserAuth
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

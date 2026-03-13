import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';
import { setAccessToken, ApiError } from '../services/api';
import { message } from 'antd';

const AuthContext = createContext(undefined);

const AUTH_KEY = '6ixgo_auth_tool';

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    isAuthenticated: false,
    isLoading: true,
    error: undefined,
    userName: undefined,
    userRoles: undefined,
  });

  const persistSession = (session) => {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    setAccessToken(session.accessToken);
  };

  const clearSession = () => {
    localStorage.removeItem(AUTH_KEY);
    setAccessToken(null);
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (!stored) {
        setState({ isAuthenticated: false, isLoading: false });
        return;
      }
      const session = JSON.parse(stored);
      setAccessToken(session.accessToken);
      setState({
        isAuthenticated: Boolean(session.accessToken),
        isLoading: false,
        userName: session.userName,
        userRoles: session.userRoles,
      });
    } catch {
      clearSession();
      setState({ isAuthenticated: false, isLoading: false });
    }
  }, []);

  const login = useCallback(async (credentials) => {
    setState((prev) => ({ ...prev, isLoading: true, error: undefined }));
    try {
      const response = await authService.login(credentials);
      const payload = response.data;

      const session = {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        userName: payload.userName,
        userRoles: payload.userRoles,
        accessTokenExpiration: payload.accessTokenExpiration,
        refreshTokenExpiration: payload.refreshTokenExpiration,
      };

      persistSession(session);

      setState({
        isAuthenticated: true,
        isLoading: false,
        userName: payload.userName,
        userRoles: payload.userRoles,
      });

      message.success('Login successful!');
      return true;
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error instanceof ApiError) {
        errorMessage = error.message;
      } else if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('CORS')) {
          errorMessage = 'Unable to connect to server. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
      }

      setState({
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      });

      message.error(errorMessage);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      message.success('Logged out successfully');
    } catch {
      message.info('Logged out locally');
    } finally {
      clearSession();
      setState({
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
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

export default AuthContext;

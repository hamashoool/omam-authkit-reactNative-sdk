import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { AuthKitClient } from '../client';
import { User, AuthKitConfig, AuthState, TokenResponse, RegistrationData, UpdateProfileData, SocialProvider } from '../types';
import { EVENTS } from '../utils/constants';

interface AuthContextValue extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<User>;
  refreshToken: () => Promise<TokenResponse>;
  loginWithSocial: (provider: SocialProvider) => Promise<void>;
  client: AuthKitClient;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
  config: AuthKitConfig;
}

/**
 * AuthProvider component - wraps your app to provide authentication context
 */
export function AuthProvider({ children, config }: AuthProviderProps) {
  const [client] = useState(() => new AuthKitClient(config));
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    error: null,
    tokens: null,
  });

  // Initialize auth state on mount
  useEffect(() => {
    initializeAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Setup event listeners
  useEffect(() => {
    const handleUserLoggedIn = (user: User) => {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        user,
        error: null,
      }));
    };

    const handleUserLoggedOut = () => {
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: null,
        tokens: null,
      });
    };

    const handleUserUpdated = (user: User) => {
      setState(prev => ({
        ...prev,
        user,
      }));
    };

    const handleAuthError = (error: Error) => {
      setState(prev => ({
        ...prev,
        error,
        isLoading: false,
      }));
    };

    const handleTokenRefreshed = (tokens: TokenResponse) => {
      setState(prev => ({
        ...prev,
        tokens: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenType: tokens.token_type,
          expiresAt: Date.now() + tokens.expires_in * 1000,
          scopes: tokens.scope.split(' '),
        },
      }));
    };

    const handleTokenExpired = () => {
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: new Error('Session expired'),
        tokens: null,
      });
    };

    // Register listeners
    client.on(EVENTS.USER_LOGGED_IN, handleUserLoggedIn);
    client.on(EVENTS.USER_LOGGED_OUT, handleUserLoggedOut);
    client.on(EVENTS.USER_UPDATED, handleUserUpdated);
    client.on(EVENTS.AUTH_ERROR, handleAuthError);
    client.on(EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);
    client.on(EVENTS.TOKEN_EXPIRED, handleTokenExpired);

    // Cleanup
    return () => {
      client.off(EVENTS.USER_LOGGED_IN, handleUserLoggedIn);
      client.off(EVENTS.USER_LOGGED_OUT, handleUserLoggedOut);
      client.off(EVENTS.USER_UPDATED, handleUserUpdated);
      client.off(EVENTS.AUTH_ERROR, handleAuthError);
      client.off(EVENTS.TOKEN_REFRESHED, handleTokenRefreshed);
      client.off(EVENTS.TOKEN_EXPIRED, handleTokenExpired);
    };
  }, [client]);

  /**
   * Initialize authentication state
   */
  const initializeAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      const isAuthenticated = await client.isAuthenticated();

      if (isAuthenticated) {
        const user = await client.getCurrentUser();
        setState({
          isAuthenticated: true,
          user,
          isLoading: false,
          error: null,
          tokens: null,
        });
      } else {
        setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
          error: null,
          tokens: null,
        });
      }
    } catch (error) {
      setState({
        isAuthenticated: false,
        user: null,
        isLoading: false,
        error: error as Error,
        tokens: null,
      });
    }
  }, [client]);

  /**
   * Login user
   */
  const login = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await client.login();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [client]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await client.logout();
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [client]);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegistrationData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await client.register(data);
      // After registration, user needs to login
      setState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [client]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: UpdateProfileData): Promise<User> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const user = await client.updateProfile(data);
      setState(prev => ({
        ...prev,
        user,
        isLoading: false,
      }));
      return user;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [client]);

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async (): Promise<TokenResponse> => {
    try {
      return await client.refreshAccessToken();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error as Error,
      }));
      throw error;
    }
  }, [client]);

  /**
   * Login with social provider
   */
  const loginWithSocial = useCallback(async (provider: SocialProvider) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await client.loginWithSocial(provider);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
      throw error;
    }
  }, [client]);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    register,
    updateProfile,
    refreshToken,
    loginWithSocial,
    client,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuthContext hook - access auth context
 * @throws Error if used outside AuthProvider
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

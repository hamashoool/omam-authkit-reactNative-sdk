/**
 * User profile data returned from the AuthKit API
 */
export interface User {
  /** Unique user identifier (UUID) */
  id: string;
  /** User's email address */
  email: string;
  /** User's first name */
  first_name: string;
  /** User's last name */
  last_name: string;
  /** URL to user's avatar image */
  avatar_url?: string;
  /** Whether the user's email has been verified */
  email_verified: boolean;
  /** ISO 8601 timestamp of when the user was created */
  created_at: string;
  /** ISO 8601 timestamp of when the user was last updated */
  updated_at?: string;
}

/**
 * OAuth 2.0 token response
 */
export interface TokenResponse {
  /** OAuth 2.0 access token */
  access_token: string;
  /** OAuth 2.0 refresh token (optional) */
  refresh_token?: string;
  /** Token type (typically "Bearer") */
  token_type: string;
  /** Token expiry time in seconds */
  expires_in: number;
  /** Space-separated list of granted scopes */
  scope: string;
}

/**
 * User registration data
 */
export interface RegistrationData {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
  /** Password confirmation (must match password) */
  password_confirm: string;
  /** User's first name (optional) */
  first_name?: string;
  /** User's last name (optional) */
  last_name?: string;
}

/**
 * Registration response from the API
 */
export interface RegistrationResponse {
  /** Unique user identifier (UUID) */
  id: string;
  /** User's email address */
  email: string;
  /** User's first name */
  first_name: string;
  /** User's last name */
  last_name: string;
  /** Whether the user's email has been verified */
  email_verified: boolean;
  /** ISO 8601 timestamp of when the user was created */
  created_at: string;
}

/**
 * Supported social authentication providers
 */
export type SocialProvider = 'google' | 'facebook' | 'tiktok';

/**
 * Social authentication configuration
 */
export interface SocialAuthConfig {
  /** The social provider to use */
  provider: SocialProvider;
  /** Redirect URI after social authentication */
  redirectUri: string;
  /** Optional state parameter for CSRF protection */
  state?: string;
  /** Additional provider-specific parameters */
  additionalParams?: Record<string, string>;
}

/**
 * OAuth 2.0 grant types
 */
export type GrantType = 'authorization_code' | 'refresh_token' | 'client_credentials';

/**
 * OAuth 2.0 scopes
 */
export type Scope = 'read' | 'write' | 'profile' | 'email';

/**
 * Storage adapter interface for token persistence
 */
export interface StorageAdapter {
  /** Get a value from storage */
  getItem(key: string): string | null | Promise<string | null>;
  /** Set a value in storage */
  setItem(key: string, value: string): void | Promise<void>;
  /** Remove a value from storage */
  removeItem(key: string): void | Promise<void>;
  /** Clear all values from storage */
  clear(): void | Promise<void>;
}

/**
 * AuthKit React Native configuration options
 */
export interface AuthKitConfig {
  /** Base URL of the AuthKit server */
  authKitUrl: string;
  /** OAuth 2.0 client ID */
  clientId: string;
  /** OAuth 2.0 client secret (optional, for confidential clients) */
  clientSecret?: string;
  /** OAuth 2.0 redirect URI (deep link scheme) */
  redirectUri: string;
  /** OAuth 2.0 scopes to request */
  scopes?: Scope[];
  /** Storage adapter for token persistence (defaults to AsyncStorage) */
  storage?: StorageAdapter;
  /** Enable PKCE (Proof Key for Code Exchange) - recommended for mobile */
  pkce?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom HTTP headers to include in all requests */
  headers?: Record<string, string>;
  /** Timeout for HTTP requests in milliseconds */
  timeout?: number;
  /** Enable automatic token refresh */
  autoRefresh?: boolean;
  /** Time in seconds before token expiry to trigger auto-refresh */
  refreshThreshold?: number;
  /** Enable secure storage for tokens (uses SecureStore if available) */
  secureStorage?: boolean;
}

/**
 * Event types emitted by the AuthKit client
 */
export type AuthEvent =
  | 'token_refreshed'
  | 'token_expired'
  | 'auth_error'
  | 'user_logged_in'
  | 'user_logged_out'
  | 'user_registered'
  | 'user_updated'
  | 'network_error'
  | 'biometric_auth_success'
  | 'biometric_auth_failed';

/**
 * Event listener callback function
 */
export type EventListener<T = unknown> = (data: T) => void;

/**
 * HTTP request options
 */
export interface RequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: unknown;
  /** Query parameters */
  params?: Record<string, string>;
  /** Include access token in Authorization header */
  withAuth?: boolean;
}

/**
 * Error response from the AuthKit API
 */
export interface AuthKitErrorResponse {
  /** Error code or type */
  error: string;
  /** Human-readable error description */
  error_description?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

/**
 * PKCE code challenge method
 */
export type CodeChallengeMethod = 'S256' | 'plain';

/**
 * PKCE parameters
 */
export interface PKCEParams {
  /** Code verifier (random string) */
  codeVerifier: string;
  /** Code challenge (hashed verifier) */
  codeChallenge: string;
  /** Code challenge method */
  codeChallengeMethod: CodeChallengeMethod;
}

/**
 * Token metadata
 */
export interface TokenMetadata {
  /** Access token */
  accessToken: string;
  /** Refresh token (optional) */
  refreshToken?: string;
  /** Token type */
  tokenType: string;
  /** Token expiry timestamp (Unix timestamp in seconds) */
  expiresAt: number;
  /** Granted scopes */
  scopes: string[];
}

/**
 * Biometric authentication types
 */
export type BiometricType = 'fingerprint' | 'facial_recognition' | 'iris';

/**
 * Biometric authentication result
 */
export interface BiometricResult {
  /** Whether authentication was successful */
  success: boolean;
  /** Error message if authentication failed */
  error?: string;
  /** Type of biometric authentication used */
  biometricType?: BiometricType;
}

/**
 * Biometric authentication options
 */
export interface BiometricOptions {
  /** Prompt message to show to user */
  promptMessage?: string;
  /** Cancel button text */
  cancelLabel?: string;
  /** Fallback button text (for PIN/pattern fallback) */
  fallbackLabel?: string;
  /** Disable fallback to device credential */
  disableDeviceFallback?: boolean;
}

/**
 * Network status
 */
export interface NetworkStatus {
  /** Whether device is connected to internet */
  isConnected: boolean;
  /** Type of network connection */
  type?: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  /** Whether connection is expensive (e.g., cellular data) */
  isExpensive?: boolean;
}

/**
 * Auth state
 */
export interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Current user (if authenticated) */
  user: User | null;
  /** Whether auth state is loading */
  isLoading: boolean;
  /** Authentication error (if any) */
  error: Error | null;
  /** Token metadata */
  tokens: TokenMetadata | null;
}

/**
 * Deep link URL parameters
 */
export interface DeepLinkParams {
  /** Authorization code */
  code?: string;
  /** State parameter for CSRF protection */
  state?: string;
  /** Error code (if OAuth failed) */
  error?: string;
  /** Error description */
  error_description?: string;
}

/**
 * Update profile data
 */
export interface UpdateProfileData {
  /** User's first name */
  first_name?: string;
  /** User's last name */
  last_name?: string;
  /** URL to user's avatar image */
  avatar_url?: string;
}

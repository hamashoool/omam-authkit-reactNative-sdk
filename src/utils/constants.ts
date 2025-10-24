/**
 * Storage keys for persisting auth data
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  TOKEN_TYPE: 'token_type',
  EXPIRES_AT: 'expires_at',
  USER: 'user',
  USER_CACHED_AT: 'user_cached_at',
  PKCE_VERIFIER: 'pkce_verifier',
  OAUTH_STATE: 'oauth_state',
} as const;

/**
 * API endpoints
 */
export const ENDPOINTS = {
  AUTHORIZE: '/oauth/authorize/',
  TOKEN: '/oauth/token/',
  USERINFO: '/api/auth/userinfo/',
  REGISTER: '/api/auth/register/',
  PROFILE: '/api/auth/me/',
  INTROSPECT: '/oauth/introspect/',
  REVOKE: '/oauth/revoke_token/',
  SOCIAL_LOGIN: (provider: string) => `/accounts/${provider}/login/`,
} as const;

/**
 * OAuth 2.0 grant types
 */
export const GRANT_TYPES = {
  AUTHORIZATION_CODE: 'authorization_code',
  REFRESH_TOKEN: 'refresh_token',
  CLIENT_CREDENTIALS: 'client_credentials',
} as const;

/**
 * Event names
 */
export const EVENTS = {
  TOKEN_REFRESHED: 'token_refreshed',
  TOKEN_EXPIRED: 'token_expired',
  AUTH_ERROR: 'auth_error',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_REGISTERED: 'user_registered',
  USER_UPDATED: 'user_updated',
  NETWORK_ERROR: 'network_error',
  BIOMETRIC_AUTH_SUCCESS: 'biometric_auth_success',
  BIOMETRIC_AUTH_FAILED: 'biometric_auth_failed',
} as const;

/**
 * Default configuration values
 */
export const DEFAULTS = {
  SCOPES: ['read', 'write', 'profile', 'email'] as const,
  PKCE: true as boolean,
  AUTO_REFRESH: true as boolean,
  REFRESH_THRESHOLD: 300 as number, // 5 minutes
  TIMEOUT: 30000 as number, // 30 seconds
  DEBUG: false as boolean,
  SECURE_STORAGE: true as boolean,
};

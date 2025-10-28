// Main client
export { AuthKitClient } from "./client";

// Context and Provider
export { AuthProvider, useAuthContext } from "./context/AuthContext";

// High-level hooks (original API)
export { useAuth, useUser, useBiometric, useNetwork } from "./hooks";

// Headless/Custom UI hooks (new API)
export {
  useAuthActions,
  useAuthState,
  useTokenManager,
  useAuthClient,
} from "./hooks";

// Types
export type {
  User,
  TokenResponse,
  RegistrationData,
  RegistrationResponse,
  SocialProvider,
  SocialAuthConfig,
  AuthKitConfig,
  StorageAdapter,
  TokenMetadata,
  AuthEvent,
  EventListener,
  BiometricResult,
  BiometricOptions,
  BiometricType,
  NetworkStatus,
  AuthState,
  DeepLinkParams,
  UpdateProfileData,
  Scope,
  GrantType,
} from "./types";

// Errors
export {
  AuthKitError,
  AuthenticationError,
  NetworkError,
  TokenError,
  ValidationError,
  ConfigurationError,
  StorageError,
  BiometricError,
  DeepLinkError,
} from "./errors";

// Storage adapters
export { AsyncStorageAdapter, SecureStoreAdapter } from "./storage";

// Utilities
export {
  generatePKCEParams,
  generateCodeChallenge,
  generateCodeVerifier,
  generateState,
} from "./utils/pkce";
export {
  parseDeepLinkUrl,
  buildAuthorizationUrl,
  getInitialUrl,
  addEventListener as addDeepLinkListener,
} from "./utils/deepLink";

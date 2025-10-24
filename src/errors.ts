/**
 * Base error class for all AuthKit errors
 */
export class AuthKitError extends Error {
  constructor(message: string, public code?: string, public details?: unknown) {
    super(message);
    this.name = 'AuthKitError';
    Object.setPrototypeOf(this, AuthKitError.prototype);
  }
}

/**
 * Authentication error (login failed, invalid credentials, etc.)
 */
export class AuthenticationError extends AuthKitError {
  constructor(message: string, code?: string, details?: unknown) {
    super(message, code, details);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Network error (connection failed, timeout, etc.)
 */
export class NetworkError extends AuthKitError {
  constructor(message: string, public statusCode?: number, details?: unknown) {
    super(message, statusCode?.toString(), details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Token error (expired, invalid, revoked, etc.)
 */
export class TokenError extends AuthKitError {
  constructor(message: string, code?: string, details?: unknown) {
    super(message, code, details);
    this.name = 'TokenError';
    Object.setPrototypeOf(this, TokenError.prototype);
  }
}

/**
 * Validation error (invalid input, missing required fields, etc.)
 */
export class ValidationError extends AuthKitError {
  constructor(
    message: string,
    public field?: string,
    details?: unknown
  ) {
    super(message, field, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Configuration error (invalid config, missing required options, etc.)
 */
export class ConfigurationError extends AuthKitError {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Storage error (failed to read/write to storage)
 */
export class StorageError extends AuthKitError {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details);
    this.name = 'StorageError';
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

/**
 * Biometric error (biometric authentication failed)
 */
export class BiometricError extends AuthKitError {
  constructor(message: string, public reason?: string, details?: unknown) {
    super(message, reason, details);
    this.name = 'BiometricError';
    Object.setPrototypeOf(this, BiometricError.prototype);
  }
}

/**
 * Deep link error (failed to parse deep link, invalid state, etc.)
 */
export class DeepLinkError extends AuthKitError {
  constructor(message: string, details?: unknown) {
    super(message, undefined, details);
    this.name = 'DeepLinkError';
    Object.setPrototypeOf(this, DeepLinkError.prototype);
  }
}

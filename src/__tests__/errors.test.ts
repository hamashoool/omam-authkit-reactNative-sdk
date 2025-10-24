import {
  AuthKitError,
  AuthenticationError,
  NetworkError,
  TokenError,
  ValidationError,
  ConfigurationError,
  StorageError,
  BiometricError,
  DeepLinkError,
} from '../errors';

describe('Error Classes', () => {
  describe('AuthKitError', () => {
    it('should create error with message', () => {
      const error = new AuthKitError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.name).toBe('AuthKitError');
      expect(error).toBeInstanceOf(Error);
    });

    it('should create error with code and details', () => {
      const error = new AuthKitError('Test error', 'TEST_CODE', { foo: 'bar' });
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ foo: 'bar' });
    });
  });

  describe('AuthenticationError', () => {
    it('should create authentication error', () => {
      const error = new AuthenticationError('Login failed');
      expect(error.message).toBe('Login failed');
      expect(error.name).toBe('AuthenticationError');
      expect(error).toBeInstanceOf(AuthKitError);
    });
  });

  describe('NetworkError', () => {
    it('should create network error with status code', () => {
      const error = new NetworkError('Request failed', 500);
      expect(error.message).toBe('Request failed');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('NetworkError');
    });
  });

  describe('TokenError', () => {
    it('should create token error', () => {
      const error = new TokenError('Token expired');
      expect(error.message).toBe('Token expired');
      expect(error.name).toBe('TokenError');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError('Invalid email', 'email');
      expect(error.message).toBe('Invalid email');
      expect(error.field).toBe('email');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError('Missing config');
      expect(error.message).toBe('Missing config');
      expect(error.name).toBe('ConfigurationError');
    });
  });

  describe('StorageError', () => {
    it('should create storage error', () => {
      const error = new StorageError('Storage failed');
      expect(error.message).toBe('Storage failed');
      expect(error.name).toBe('StorageError');
    });
  });

  describe('BiometricError', () => {
    it('should create biometric error with reason', () => {
      const error = new BiometricError('Biometric failed', 'user_cancel');
      expect(error.message).toBe('Biometric failed');
      expect(error.reason).toBe('user_cancel');
      expect(error.name).toBe('BiometricError');
    });
  });

  describe('DeepLinkError', () => {
    it('should create deep link error', () => {
      const error = new DeepLinkError('Invalid deep link');
      expect(error.message).toBe('Invalid deep link');
      expect(error.name).toBe('DeepLinkError');
    });
  });
});

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-01-28

### 🎨 Added - Headless UI Support

#### New Hooks for Custom UI
- **`useAuthActions()`** - Low-level authentication operations for custom flows
- **`useAuthState()`** - Read-only access to authentication state
- **`useTokenManager()`** - Token management operations
- **`useAuthClient()`** - Direct access to AuthKitClient instance

#### New AuthKitClient Methods
- `getAuthorizationUrl()` - Generate OAuth URL without opening browser
- `exchangeAuthorizationCode()` - Manual code-to-token exchange
- `getTokens()` - Retrieve current token metadata
- `revokeToken()` - Revoke specific tokens
- `getSocialLoginUrl()` - Get social provider URL
- `clearStorage()` - Clear all auth data

### 🔒 Security Improvements

#### New Security Features
- **URL Validation** - Prevent open redirect vulnerabilities
- **SECURITY.md** - Comprehensive security documentation
- Input sanitization utilities
- Email and password validation

#### Bug Fixes
- Fixed repository URL typo in package.json (hhttps → https)

### 📚 Documentation

- Added comprehensive "Custom UI & Headless Hooks" section
- Added 3 real-world examples with code
- Updated Quick Start guide

### 🔄 Backward Compatibility

✅ **No breaking changes** - All existing APIs remain unchanged

---

## [1.0.0] - 2025-01-15

### Initial Release

#### Features
- OAuth 2.0 Authorization Code flow with PKCE support
- Social authentication (Google, Facebook, TikTok)
- Biometric authentication support
- Secure token storage
- Automatic token refresh
- TypeScript support

#### Hooks
- `useAuth()` - Authentication methods and state
- `useUser()` - User profile access and updates
- `useBiometric()` - Biometric authentication
- `useNetwork()` - Network status monitoring

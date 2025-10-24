# @omam/authkit-react-native

Official React Native SDK for OmamAuthKit OAuth Provider. Build secure mobile apps with OAuth 2.0 authentication, biometric support, and offline capabilities.

## Features

- ✅ **OAuth 2.0 with PKCE** - Secure authorization code flow optimized for mobile
- ✅ **React Hooks** - Easy-to-use hooks: `useAuth`, `useUser`, `useBiometric`, `useNetwork`
- ✅ **Biometric Authentication** - Fingerprint, Face ID, Touch ID support
- ✅ **Offline Support** - Persistent token storage with AsyncStorage or SecureStore
- ✅ **Deep Linking** - Handle OAuth callbacks via deep links
- ✅ **Social Login** - Google, Facebook, TikTok integration
- ✅ **TypeScript** - Full type safety and IntelliSense support
- ✅ **Expo Compatible** - Works with Expo and bare React Native

## Installation

```bash
# Using npm
npm install @omam/authkit-react-native

# Using yarn
yarn add @omam/authkit-react-native

# Using pnpm
pnpm add @omam/authkit-react-native
```

### Peer Dependencies

```bash
# Required dependencies
npm install @react-native-async-storage/async-storage
npm install @react-native-community/netinfo
npm install expo-auth-session expo-crypto expo-linking expo-web-browser

# Optional dependencies (for enhanced features)
npm install expo-local-authentication  # Biometric auth
npm install expo-secure-store          # Secure token storage
```

## Quick Start

### 1. Configure Deep Linking

**iOS (Info.plist)**

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>yourapp</string>
    </array>
  </dict>
</array>
```

**Android (AndroidManifest.xml)**

```xml
<activity
  android:launchMode="singleTop">
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="yourapp" />
  </intent-filter>
</activity>
```

**Expo (app.json)**

```json
{
  "expo": {
    "scheme": "yourapp"
  }
}
```

### 2. Wrap App with AuthProvider

```tsx
import { AuthProvider } from '@omam/authkit-react-native';

function App() {
  return (
    <AuthProvider
      config={{
        authKitUrl: 'https://auth.yourdomain.com',
        clientId: 'your-client-id',
        redirectUri: 'yourapp://auth/callback',
        scopes: ['read', 'write', 'profile', 'email'],
        pkce: true, // REQUIRED for mobile apps
        secureStorage: true,
        // clientSecret: 'xxx', // ⚠️ DO NOT USE IN PRODUCTION - See security warning below
      }}
    >
      <YourApp />
    </AuthProvider>
  );
}
```

> **⚠️ SECURITY WARNING: Client Secrets in Mobile Apps**
>
> **NEVER use `clientSecret` in production mobile applications.** Client secrets cannot be kept secure in mobile environments as they can be extracted through reverse engineering, decompilation, or memory inspection.
>
> **Instead:**
> - ✅ **Always use PKCE** (`pkce: true`) - This is the OAuth 2.0 standard for mobile apps
> - ✅ Use `secureStorage: true` to encrypt tokens on the device
> - ✅ Register your mobile app as a "public client" in your OAuth provider
>
> The `clientSecret` option exists only for backend-to-backend communication or special server-side use cases.

### 3. Use Authentication Hooks

```tsx
import { useAuth, useUser } from '@omam/authkit-react-native';
import { View, Button, Text } from 'react-native';

function LoginScreen() {
  const { login, logout, isAuthenticated, isLoading } = useAuth();
  const { user } = useUser();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      {isAuthenticated ? (
        <>
          <Text>Welcome, {user?.first_name}!</Text>
          <Button title="Logout" onPress={logout} />
        </>
      ) : (
        <Button title="Login" onPress={login} />
      )}
    </View>
  );
}
```

## API Reference

### Hooks

#### `useAuth()`

Provides authentication methods and state.

```tsx
const {
  isAuthenticated,  // boolean - Whether user is authenticated
  isLoading,        // boolean - Whether auth state is loading
  error,            // Error | null - Authentication error
  login,            // () => Promise<void> - Start OAuth login
  logout,           // () => Promise<void> - Logout user
  refreshToken,     // () => Promise<TokenResponse> - Refresh access token
  loginWithSocial,  // (provider) => Promise<void> - Social login
} = useAuth();
```

#### `useUser()`

Provides user data and profile management.

```tsx
const {
  user,            // User | null - Current user
  isLoading,       // boolean - Whether user data is loading
  updateProfile,   // (data) => Promise<User> - Update profile
  register,        // (data) => Promise<void> - Register new user
} = useUser();
```

#### `useBiometric()`

Provides biometric authentication.

```tsx
const {
  isAvailable,     // boolean - Biometric hardware available
  isEnrolled,      // boolean - Biometric credentials enrolled
  supportedTypes,  // BiometricType[] - Supported biometric types
  authenticate,    // (options?) => Promise<BiometricResult>
  refresh,         // () => Promise<void> - Re-check availability
} = useBiometric();

// Authenticate with biometrics
const result = await authenticate({
  promptMessage: 'Authenticate to continue',
  cancelLabel: 'Cancel',
  fallbackLabel: 'Use Passcode',
});
```

#### `useNetwork()`

Provides network connectivity status.

```tsx
const {
  isConnected,     // boolean - Device is connected
  isOffline,       // boolean - Device is offline
  connectionType,  // 'wifi' | 'cellular' | 'ethernet' | 'unknown'
  isExpensive,     // boolean - Connection is expensive (cellular)
  refresh,         // () => Promise<void> - Refresh network status
} = useNetwork();
```

### Configuration Options

```tsx
interface AuthKitConfig {
  authKitUrl: string;           // Required - Base URL of AuthKit server
  clientId: string;             // Required - OAuth client ID
  redirectUri: string;          // Required - Deep link redirect URI
  clientSecret?: string;        // Optional - Client secret
  scopes?: Scope[];             // Optional - OAuth scopes (default: ['read', 'write', 'profile', 'email'])
  storage?: StorageAdapter;     // Optional - Custom storage adapter
  pkce?: boolean;               // Optional - Enable PKCE (default: true)
  autoRefresh?: boolean;        // Optional - Auto-refresh tokens (default: true)
  refreshThreshold?: number;    // Optional - Refresh threshold in seconds (default: 300)
  timeout?: number;             // Optional - Request timeout (default: 30000ms)
  debug?: boolean;              // Optional - Enable debug logging (default: false)
  secureStorage?: boolean;      // Optional - Use SecureStore (default: true)
  headers?: Record<string, string>;  // Optional - Custom headers
}
```

### AuthKitClient

For advanced use cases, you can use the client directly:

```tsx
import { AuthKitClient } from '@omam/authkit-react-native';

const client = new AuthKitClient({
  authKitUrl: 'https://auth.yourdomain.com',
  clientId: 'your-client-id',
  redirectUri: 'yourapp://auth/callback',
});

// Methods
await client.login();
await client.logout();
const user = await client.getCurrentUser();
const tokens = await client.refreshAccessToken();
await client.loginWithSocial('google');
```

## Examples

### User Registration

```tsx
import { useUser } from '@omam/authkit-react-native';

function RegisterScreen() {
  const { register } = useUser();

  const handleRegister = async () => {
    try {
      await register({
        email: 'user@example.com',
        password: 'securepassword',
        password_confirm: 'securepassword',
        first_name: 'John',
        last_name: 'Doe',
      });
      // Redirect to login
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return <Button title="Register" onPress={handleRegister} />;
}
```

### Biometric Login

```tsx
import { useBiometric, useAuth } from '@omam/authkit-react-native';

function BiometricLoginButton() {
  const { isAvailable, isEnrolled, authenticate } = useBiometric();
  const { login } = useAuth();

  const handleBiometricLogin = async () => {
    const result = await authenticate({
      promptMessage: 'Authenticate to login',
    });

    if (result.success) {
      await login();
    }
  };

  if (!isAvailable || !isEnrolled) {
    return null;
  }

  return <Button title="Login with Biometrics" onPress={handleBiometricLogin} />;
}
```

### Social Login

```tsx
import { useAuth } from '@omam/authkit-react-native';

function SocialLoginButtons() {
  const { loginWithSocial } = useAuth();

  return (
    <>
      <Button
        title="Login with Google"
        onPress={() => loginWithSocial('google')}
      />
      <Button
        title="Login with Facebook"
        onPress={() => loginWithSocial('facebook')}
      />
    </>
  );
}
```

### Offline Support

```tsx
import { useNetwork } from '@omam/authkit-react-native';

function OfflineIndicator() {
  const { isOffline } = useNetwork();

  if (isOffline) {
    return <Text>You are offline</Text>;
  }

  return null;
}
```

## License

MIT

## Support

- Documentation: https://auth.yourdomain.com/docs/react-native
- Issues: https://github.com/hamashoool/omam-authkit-react-native/issues
- Email: osman@hamashool.com

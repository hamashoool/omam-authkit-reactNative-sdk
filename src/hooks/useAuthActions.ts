import { useAuthContext } from "../context/AuthContext";
import { SocialProvider } from "../types";

/**
 * useAuthActions hook - provides low-level authentication actions for custom UI
 *
 * This hook exposes primitive authentication operations without any built-in UI,
 * allowing developers to build completely custom authentication experiences.
 *
 * @example
 * ```tsx
 * function CustomLoginButton() {
 *   const { getAuthorizationUrl, handleAuthCallback } = useAuthActions();
 *
 *   const handleCustomLogin = async () => {
 *     const authUrl = await getAuthorizationUrl();
 *     // Open authUrl in custom WebView or browser
 *     // Then handle the callback with handleAuthCallback
 *   };
 *
 *   return <CustomButton onPress={handleCustomLogin} />;
 * }
 * ```
 */
export function useAuthActions() {
  const { client } = useAuthContext();

  return {
    /**
     * Get the OAuth authorization URL without opening a browser
     * Use this to implement custom browser/WebView flows
     */
    getAuthorizationUrl: async () => {
      return await client.getAuthorizationUrl();
    },

    /**
     * Handle OAuth callback manually
     * Call this after the user is redirected back with an authorization code
     * @param code - The authorization code from the OAuth callback
     * @param state - The state parameter for CSRF validation
     */
    handleAuthCallback: async (code: string, state: string) => {
      return await client.handleCallback(code, state);
    },

    /**
     * Exchange authorization code for tokens manually
     * @param code - The authorization code
     * @param codeVerifier - The PKCE code verifier (if using PKCE)
     */
    exchangeCodeForToken: async (code: string, codeVerifier?: string) => {
      return await client.exchangeAuthorizationCode(code, codeVerifier);
    },

    /**
     * Revoke the current access token
     * Use this for custom logout flows
     */
    revokeToken: async () => {
      const tokens = await client.getTokens();
      if (tokens?.accessToken) {
        return await client.revokeToken(tokens.accessToken);
      }
    },

    /**
     * Get social login URL without automatically opening browser
     * @param provider - The social provider ('google' | 'facebook' | 'tiktok')
     */
    getSocialLoginUrl: (provider: SocialProvider) => {
      return client.getSocialLoginUrl(provider);
    },

    /**
     * Trigger standard OAuth login (opens browser)
     * This is the same as the high-level useAuth().login()
     */
    startOAuthLogin: async () => {
      return await client.login();
    },

    /**
     * Trigger social login (opens browser)
     * This is the same as the high-level useAuth().loginWithSocial()
     */
    startSocialLogin: async (provider: SocialProvider) => {
      return await client.loginWithSocial(provider);
    },

    /**
     * Clear all authentication data
     * Use this for custom logout flows
     */
    clearAuth: async () => {
      return await client.logout();
    },
  };
}

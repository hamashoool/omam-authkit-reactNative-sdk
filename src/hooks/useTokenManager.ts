import { useAuthContext } from "../context/AuthContext";
import { useState, useCallback } from "react";

/**
 * useTokenManager hook - provides token management operations for custom UI
 *
 * This hook exposes token-related operations like refresh, validation, and inspection.
 * Useful for building custom token expiry warnings, manual refresh buttons, etc.
 *
 * @example
 * ```tsx
 * function TokenExpiryWarning() {
 *   const { tokens, isTokenExpiringSoon, refreshTokens } = useTokenManager();
 *
 *   if (isTokenExpiringSoon) {
 *     return (
 *       <Banner>
 *         Your session is expiring soon.
 *         <Button onPress={refreshTokens}>Extend Session</Button>
 *       </Banner>
 *     );
 *   }
 *
 *   return null;
 * }
 * ```
 */
export function useTokenManager() {
  const { client, refreshToken, tokens } = useAuthContext();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<Error | null>(null);

  /**
   * Get current tokens from storage
   */
  const getTokens = useCallback(async () => {
    return await client.getTokens();
  }, [client]);

  /**
   * Refresh the access token using the refresh token
   */
  const refreshTokens = useCallback(async () => {
    try {
      setIsRefreshing(true);
      setRefreshError(null);
      const result = await refreshToken();
      return result;
    } catch (error) {
      setRefreshError(error as Error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken]);

  /**
   * Check if the current token is valid (not expired)
   */
  const isTokenValid = useCallback(async () => {
    return await client.isAuthenticated();
  }, [client]);

  /**
   * Revoke the current token
   */
  const revokeCurrentToken = useCallback(async () => {
    const currentTokens = await client.getTokens();
    if (currentTokens?.accessToken) {
      return await client.revokeToken(currentTokens.accessToken);
    }
  }, [client]);

  /**
   * Clear all tokens from storage
   */
  const clearTokens = useCallback(async () => {
    return await client.clearStorage();
  }, [client]);

  /**
   * Check if token is expiring soon (within 5 minutes by default)
   */
  const isTokenExpiringSoon = useCallback(
    (thresholdMinutes: number = 5) => {
      if (!tokens) return false;
      const thresholdMs = thresholdMinutes * 60 * 1000;
      const timeUntilExpiry = tokens.expiresAt - Date.now();
      return timeUntilExpiry > 0 && timeUntilExpiry < thresholdMs;
    },
    [tokens],
  );

  /**
   * Get time remaining until token expiry in seconds
   */
  const getTimeUntilExpiry = useCallback(() => {
    if (!tokens) return 0;
    const remaining = Math.floor((tokens.expiresAt - Date.now()) / 1000);
    return Math.max(0, remaining);
  }, [tokens]);

  /**
   * Get token expiry date
   */
  const getExpiryDate = useCallback(() => {
    if (!tokens) return null;
    return new Date(tokens.expiresAt);
  }, [tokens]);

  return {
    /**
     * Current token metadata
     */
    tokens,

    /**
     * Whether a token refresh is in progress
     */
    isRefreshing,

    /**
     * Error from last refresh attempt
     */
    refreshError,

    /**
     * Get current tokens from storage
     */
    getTokens,

    /**
     * Refresh the access token
     */
    refreshTokens,

    /**
     * Check if current token is valid
     */
    isTokenValid,

    /**
     * Revoke the current token
     */
    revokeCurrentToken,

    /**
     * Clear all tokens from storage
     */
    clearTokens,

    /**
     * Check if token is expiring soon
     * @param thresholdMinutes - Minutes before expiry to trigger warning (default: 5)
     */
    isTokenExpiringSoon,

    /**
     * Get seconds remaining until token expiry
     */
    getTimeUntilExpiry,

    /**
     * Get token expiry as Date object
     */
    getExpiryDate,

    /**
     * Computed: Whether token is currently expired
     */
    isTokenExpired: tokens ? Date.now() >= tokens.expiresAt : false,

    /**
     * Computed: Whether a refresh token exists
     */
    hasRefreshToken: tokens?.refreshToken !== undefined,

    /**
     * Computed: Access token scopes
     */
    scopes: tokens?.scopes || [],
  };
}

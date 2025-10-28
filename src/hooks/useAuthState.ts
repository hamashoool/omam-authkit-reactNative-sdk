import { useMemo } from "react";
import { useAuthContext } from "../context/AuthContext";

/**
 * useAuthState hook - provides read-only access to authentication state
 *
 * This hook provides only the state without any actions, useful for components
 * that need to react to auth state changes but don't need to trigger auth operations.
 *
 * For custom UI with actions, use useAuthActions() instead.
 *
 * @example
 * ```tsx
 * function UserGreeting() {
 *   const { user, isAuthenticated, isLoading } = useAuthState();
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (!isAuthenticated) return <GuestMessage />;
 *
 *   return <Text>Welcome, {user?.first_name}!</Text>;
 * }
 * ```
 */
export function useAuthState() {
  const { isAuthenticated, user, isLoading, error, tokens } = useAuthContext();

  // Compute token expiry status using useMemo
  // Note: Date.now() is technically impure, but we need it to check expiry.
  // The value is memoized and only recomputed when tokens change.
  const isTokenExpired = useMemo(() => {
    if (!tokens) return false;
    // eslint-disable-next-line react-hooks/purity
    return Date.now() >= tokens.expiresAt;
  }, [tokens]);

  return {
    /**
     * Whether the user is authenticated
     */
    isAuthenticated,

    /**
     * The current authenticated user (null if not authenticated)
     */
    user,

    /**
     * Whether authentication state is currently loading
     */
    isLoading,

    /**
     * Any authentication error that occurred
     */
    error,

    /**
     * Current token metadata (access token, refresh token, expiry, etc.)
     */
    tokens,

    /**
     * Computed: Whether the user is logged out
     */
    isLoggedOut: !isAuthenticated && !isLoading,

    /**
     * Computed: Whether there's an active error
     */
    hasError: error !== null,

    /**
     * Computed: Whether tokens exist (regardless of validity)
     */
    hasTokens: tokens !== null,

    /**
     * Computed: Whether the access token is expired (if tokens exist)
     */
    isTokenExpired,
  };
}

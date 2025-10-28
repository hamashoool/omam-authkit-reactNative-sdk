import { useAuthContext } from "../context/AuthContext";
import { SocialProvider } from "../types";

/**
 * useAuth hook - provides authentication methods
 */
export function useAuth() {
  const {
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    refreshToken,
    loginWithSocial,
  } = useAuthContext();

  return {
    /** Whether user is authenticated */
    isAuthenticated,
    /** Whether auth state is loading */
    isLoading,
    /** Authentication error (if any) */
    error,
    /** Login with OAuth */
    login,
    /** Logout */
    logout,
    /** Refresh access token */
    refreshToken,
    /** Login with social provider */
    loginWithSocial: (provider: SocialProvider) => loginWithSocial(provider),
  };
}

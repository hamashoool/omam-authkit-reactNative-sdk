import { useAuthContext } from "../context/AuthContext";

/**
 * useAuthClient hook - provides direct access to the AuthKitClient instance
 *
 * This hook gives you complete access to the underlying AuthKitClient,
 * allowing you to call any method directly for maximum flexibility.
 *
 * Use this when you need:
 * - Direct access to all client methods
 * - Custom authentication flows
 * - Advanced token management
 * - Event listeners
 * - Low-level OAuth operations
 *
 * @example
 * ```tsx
 * function AdvancedAuthComponent() {
 *   const client = useAuthClient();
 *
 *   // Access any client method
 *   const handleCustomAuth = async () => {
 *     const authUrl = await client.getAuthorizationUrl();
 *     // Custom implementation
 *   };
 *
 *   // Listen to events
 *   useEffect(() => {
 *     const listener = (user) => console.log('User logged in:', user);
 *     client.on('user_logged_in', listener);
 *     return () => client.off('user_logged_in', listener);
 *   }, [client]);
 *
 *   return <View>...</View>;
 * }
 * ```
 */
export function useAuthClient() {
  const { client } = useAuthContext();
  return client;
}

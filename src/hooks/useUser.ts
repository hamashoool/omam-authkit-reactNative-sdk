import { useAuthContext } from '../context/AuthContext';
import { UpdateProfileData } from '../types';

/**
 * useUser hook - provides user data and profile management
 */
export function useUser() {
  const { user, isLoading, updateProfile, register } = useAuthContext();

  return {
    /** Current user (if authenticated) */
    user,
    /** Whether user data is loading */
    isLoading,
    /** Update user profile */
    updateProfile: (data: UpdateProfileData) => updateProfile(data),
    /** Register new user */
    register,
  };
}

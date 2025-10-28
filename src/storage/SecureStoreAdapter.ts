import * as SecureStore from "expo-secure-store";
import { StorageAdapter } from "../types";
import { StorageError } from "../errors";

/**
 * SecureStore adapter for React Native/Expo
 * Provides encrypted token storage using expo-secure-store
 * More secure than AsyncStorage for sensitive data like tokens
 */
export class SecureStoreAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = "omam-authkit:") {
    this.prefix = prefix;
  }

  /**
   * Get prefixed key for storage
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get a value from SecureStore
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await SecureStore.getItemAsync(this.getKey(key));
      return value;
    } catch (error) {
      throw new StorageError(
        `Failed to get item from secure storage: ${key}`,
        error,
      );
    }
  }

  /**
   * Set a value in SecureStore
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.getKey(key), value);
    } catch (error) {
      throw new StorageError(
        `Failed to set item in secure storage: ${key}`,
        error,
      );
    }
  }

  /**
   * Remove a value from SecureStore
   */
  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.getKey(key));
    } catch (error) {
      throw new StorageError(
        `Failed to remove item from secure storage: ${key}`,
        error,
      );
    }
  }

  /**
   * Clear all AuthKit values from SecureStore
   * Note: SecureStore doesn't provide a way to list all keys,
   * so we'll remove known keys individually
   */
  async clear(): Promise<void> {
    try {
      const knownKeys = [
        "access_token",
        "refresh_token",
        "token_type",
        "expires_at",
        "user",
        "user_cached_at",
        "pkce_verifier",
        "oauth_state",
      ];

      // Remove all known keys
      await Promise.all(
        knownKeys.map((key) =>
          this.removeItem(key).catch(() => {
            // Ignore errors for missing keys
          }),
        ),
      );
    } catch (error) {
      throw new StorageError("Failed to clear secure storage", error);
    }
  }
}

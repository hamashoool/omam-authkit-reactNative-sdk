import AsyncStorage from "@react-native-async-storage/async-storage";
import { StorageAdapter } from "../types";
import { StorageError } from "../errors";

/**
 * AsyncStorage adapter for React Native
 * Provides async token storage using @react-native-async-storage/async-storage
 */
export class AsyncStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(prefix: string = "@omam-authkit:") {
    this.prefix = prefix;
  }

  /**
   * Get prefixed key for storage
   */
  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Get a value from AsyncStorage
   */
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(this.getKey(key));
      return value;
    } catch (error) {
      throw new StorageError(`Failed to get item from storage: ${key}`, error);
    }
  }

  /**
   * Set a value in AsyncStorage
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(this.getKey(key), value);
    } catch (error) {
      throw new StorageError(`Failed to set item in storage: ${key}`, error);
    }
  }

  /**
   * Remove a value from AsyncStorage
   */
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getKey(key));
    } catch (error) {
      throw new StorageError(
        `Failed to remove item from storage: ${key}`,
        error,
      );
    }
  }

  /**
   * Clear all AuthKit values from AsyncStorage
   */
  async clear(): Promise<void> {
    try {
      // Get all keys
      const keys = await AsyncStorage.getAllKeys();

      // Filter keys with our prefix
      const authKitKeys = keys.filter((key) => key.startsWith(this.prefix));

      // Remove all AuthKit keys
      await AsyncStorage.multiRemove(authKitKeys);
    } catch (error) {
      throw new StorageError("Failed to clear storage", error);
    }
  }
}

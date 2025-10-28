import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { AsyncStorageAdapter } from "../storage/AsyncStorageAdapter";
import { SecureStoreAdapter } from "../storage/SecureStoreAdapter";
import { StorageError } from "../errors";

describe("Storage Adapters", () => {
  describe("AsyncStorageAdapter", () => {
    let adapter: AsyncStorageAdapter;

    beforeEach(() => {
      adapter = new AsyncStorageAdapter();
      jest.clearAllMocks();
    });

    it("should get item with prefix", async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue("test-value");
      const value = await adapter.getItem("test-key");
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        "@omam-authkit:test-key",
      );
      expect(value).toBe("test-value");
    });

    it("should set item with prefix", async () => {
      await adapter.setItem("test-key", "test-value");
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        "@omam-authkit:test-key",
        "test-value",
      );
    });

    it("should remove item with prefix", async () => {
      await adapter.removeItem("test-key");
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        "@omam-authkit:test-key",
      );
    });

    it("should clear all prefixed items", async () => {
      (AsyncStorage.getAllKeys as jest.Mock).mockResolvedValue([
        "@omam-authkit:key1",
        "@omam-authkit:key2",
        "other-key",
      ]);
      await adapter.clear();
      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        "@omam-authkit:key1",
        "@omam-authkit:key2",
      ]);
    });

    it("should throw StorageError on failure", async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error("Storage error"),
      );
      await expect(adapter.getItem("test-key")).rejects.toThrow(StorageError);
    });
  });

  describe("SecureStoreAdapter", () => {
    let adapter: SecureStoreAdapter;

    beforeEach(() => {
      adapter = new SecureStoreAdapter();
      jest.clearAllMocks();
    });

    it("should get item with prefix", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockResolvedValue("test-value");
      const value = await adapter.getItem("test-key");
      expect(SecureStore.getItemAsync).toHaveBeenCalledWith(
        "omam-authkit:test-key",
      );
      expect(value).toBe("test-value");
    });

    it("should set item with prefix", async () => {
      await adapter.setItem("test-key", "test-value");
      expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
        "omam-authkit:test-key",
        "test-value",
      );
    });

    it("should remove item with prefix", async () => {
      await adapter.removeItem("test-key");
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
        "omam-authkit:test-key",
      );
    });

    it("should clear known keys", async () => {
      await adapter.clear();
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(8); // Number of known keys
    });

    it("should throw StorageError on failure", async () => {
      (SecureStore.getItemAsync as jest.Mock).mockRejectedValue(
        new Error("SecureStore error"),
      );
      await expect(adapter.getItem("test-key")).rejects.toThrow(StorageError);
    });
  });
});

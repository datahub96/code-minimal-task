/**
 * StorageManager - A utility to handle localStorage operations with fallbacks
 * This helps ensure data persistence works across different environments
 */

export class StorageManager {
  // Check if localStorage is available and working
  static isLocalStorageAvailable(): boolean {
    if (typeof window === "undefined") {
      return false; // Not in browser environment
    }

    try {
      // More robust check for localStorage availability
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, testKey);
      const result = localStorage.getItem(testKey) === testKey;
      localStorage.removeItem(testKey);
      return result;
    } catch (e) {
      console.warn("localStorage test failed:", e);
      return false;
    }
  }

  // Get data from localStorage with error handling and memory fallback
  static getItem(key: string): string | null {
    if (typeof window === "undefined") {
      console.warn(
        "Window is not available, cannot get item from localStorage",
      );
      // Return from memory fallback in non-browser environments
      return this.memoryStorage[key] || null;
    }

    try {
      // Try localStorage first if available
      if (this.isLocalStorageAvailable()) {
        const value = localStorage.getItem(key);
        return value;
      } else {
        // Use memory fallback if localStorage is not available
        console.warn(
          `Using memory fallback to get key ${key} as localStorage is unavailable`,
        );
        return this.memoryStorage[key] || null;
      }
    } catch (error) {
      // Import here to avoid circular dependency
      try {
        const { logError, ErrorCodes } = require("@/lib/errorCodes");
        logError(ErrorCodes.STORAGE_READ_FAILED, error, {
          method: "getItem",
          key,
        });
      } catch (importError) {
        console.error("Error importing error codes:", importError);
      }
      console.error(`Error getting item ${key} from localStorage:`, error);

      // Try memory fallback
      console.warn(`Falling back to memory storage for getting key ${key}`);
      return this.memoryStorage[key] || null;
    }
  }

  // Memory fallback storage when localStorage is unavailable
  private static memoryStorage: Record<string, string> = {};

  // Set data in localStorage with error handling, verification, and memory fallback
  static setItem(key: string, value: string): boolean {
    if (typeof window === "undefined") {
      console.warn("Window is not available, cannot set item");
      // Use memory fallback in non-browser environments
      this.memoryStorage[key] = value;
      return true;
    }

    try {
      // Try to use localStorage first
      if (this.isLocalStorageAvailable()) {
        localStorage.setItem(key, value);

        // Verify data was saved correctly
        const savedValue = localStorage.getItem(key);
        if (savedValue !== value) {
          throw new Error("Storage verification failed");
        }
      } else {
        // Use memory fallback if localStorage is not available
        this.memoryStorage[key] = value;
        console.warn(
          `Using memory fallback for key ${key} as localStorage is unavailable`,
        );
      }
      return true;
    } catch (error) {
      // Log the error with error codes if possible
      try {
        const { logError, ErrorCodes } = require("@/lib/errorCodes");

        // Check if it's a quota exceeded error
        if (
          error instanceof DOMException &&
          (error.code === 22 ||
            error.code === 1014 ||
            error.name === "QuotaExceededError")
        ) {
          logError(ErrorCodes.STORAGE_QUOTA_EXCEEDED, error, {
            method: "setItem",
            key,
          });
        } else {
          logError(ErrorCodes.STORAGE_WRITE_FAILED, error, {
            method: "setItem",
            key,
          });
        }
      } catch (importError) {
        console.error("Error importing error codes:", importError);
      }

      console.error(`Error setting item ${key} in localStorage:`, error);

      // Use memory fallback as last resort
      try {
        this.memoryStorage[key] = value;
        console.warn(
          `Falling back to memory storage for key ${key} after localStorage error`,
        );
        return true;
      } catch (memoryError) {
        console.error(
          `Memory fallback also failed for key ${key}:`,
          memoryError,
        );
        return false;
      }
    }
  }

  // Remove data from localStorage with error handling
  static removeItem(key: string): boolean {
    if (typeof window === "undefined") {
      console.warn("Window is not available, cannot remove item");
      return false;
    }

    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage:`, error);
      return false;
    }
  }

  // Get parsed JSON data from localStorage
  static getJSON<T>(key: string, defaultValue: T): T {
    try {
      const data = this.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error parsing JSON for key ${key}:`, error);
      return defaultValue;
    }
  }

  // Set JSON data in localStorage
  static setJSON<T>(key: string, value: T): boolean {
    try {
      // Try direct localStorage first (most reliable)
      const jsonString = JSON.stringify(value);
      localStorage.setItem(key, jsonString);
      return true;
    } catch (error) {
      console.error(`Error saving JSON for key ${key}:`, error);
      return false;
    }
  }
}

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
      // Check if localStorage exists
      if (!window.localStorage) {
        return false;
      }

      const testKey = "__storage_test__";
      localStorage.setItem(testKey, testKey);
      const testValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);

      // Verify the test was successful
      return testValue === testKey;
    } catch (e) {
      // Import here to avoid circular dependency
      const { logError, ErrorCodes } = require("@/lib/errorCodes");
      logError(ErrorCodes.STORAGE_NOT_AVAILABLE, e, {
        method: "isLocalStorageAvailable",
      });
      console.warn("localStorage test failed:", e);
      return false;
    }
  }

  // Get data from localStorage with error handling
  static getItem(key: string): string | null {
    if (!this.isLocalStorageAvailable()) {
      console.warn("localStorage is not available, cannot get item");
      return null;
    }

    try {
      return localStorage.getItem(key);
    } catch (error) {
      // Import here to avoid circular dependency
      const { logError, ErrorCodes } = require("@/lib/errorCodes");
      logError(ErrorCodes.STORAGE_READ_FAILED, error, {
        method: "getItem",
        key,
      });
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  }

  // Set data in localStorage with error handling and verification
  static setItem(key: string, value: string): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn("localStorage is not available, cannot set item");
      return false;
    }

    try {
      localStorage.setItem(key, value);

      // Verify data was saved correctly
      const savedValue = localStorage.getItem(key);
      if (savedValue !== value) {
        // Import here to avoid circular dependency
        const { logError, ErrorCodes } = require("@/lib/errorCodes");
        logError(
          ErrorCodes.STORAGE_VERIFICATION_FAILED,
          new Error("Storage verification failed"),
          { method: "setItem", key },
        );
        console.error(`Storage verification failed for key ${key}`);
        return false;
      }
      return true;
    } catch (error) {
      // Import here to avoid circular dependency
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

      console.error(`Error setting item ${key} in localStorage:`, error);
      return false;
    }
  }

  // Remove data from localStorage with error handling
  static removeItem(key: string): boolean {
    if (!this.isLocalStorageAvailable()) {
      console.warn("localStorage is not available, cannot remove item");
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
      const jsonString = JSON.stringify(value);
      return this.setItem(key, jsonString);
    } catch (error) {
      console.error(`Error stringifying JSON for key ${key}:`, error);
      return false;
    }
  }
}

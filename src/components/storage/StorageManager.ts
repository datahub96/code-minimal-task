/**
 * StorageManager - A utility to handle localStorage operations with fallbacks
 * This helps ensure data persistence works across different environments
 */

export class StorageManager {
  // Check if localStorage is available and working
  static isLocalStorageAvailable(): boolean {
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Get data from localStorage with error handling
  static getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage:`, error);
      return null;
    }
  }

  // Set data in localStorage with error handling and verification
  static setItem(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);

      // Verify data was saved correctly
      const savedValue = localStorage.getItem(key);
      if (savedValue !== value) {
        console.error(`Storage verification failed for key ${key}`);
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage:`, error);
      return false;
    }
  }

  // Remove data from localStorage with error handling
  static removeItem(key: string): boolean {
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

/**
 * StorageManager - Abstraction over localStorage with in-memory caching
 * Handles JSON serialization/deserialization and provides fallback for legacy data.
 */
class StorageManager {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get value from storage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Parsed value or default
   */
  get(key, defaultValue = null) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    if (typeof localStorage === 'undefined') {
      return defaultValue;
    }

    const value = localStorage.getItem(key);
    if (value === null) {
      return defaultValue;
    }

    try {
      const parsed = JSON.parse(value);
      this.cache.set(key, parsed);
      return parsed;
    } catch {
      // Fallback for legacy raw strings that aren't valid JSON
      this.cache.set(key, value);
      return value;
    }
  }

  /**
   * Set value in storage
   * @param {string} key - Storage key
   * @param {*} value - Value to store (will be stringified)
   */
  set(key, value) {
    this.cache.set(key, value);
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage quota exceeded:', e);
    }
  }

  /**
   * Remove item from storage
   * @param {string} key - Storage key
   */
  remove(key) {
    this.cache.delete(key);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(key);
    }
  }

  /**
   * Clear all app-specific storage
   * (Optional helper)
   */
  clear() {
    this.cache.clear();
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  }
}

export const storage = new StorageManager();

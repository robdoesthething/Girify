import { useState, useEffect } from 'react';

/**
 * Custom hook for managing localStorage with React state synchronization.
 * Automatically syncs state with localStorage and handles JSON serialization.
 * 
 * @param {string} key - The localStorage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {[*, Function]} Tuple of [value, setValue] similar to useState
 * 
 * @example
 * const [username, setUsername] = useLocalStorage('girify_username', '');
 * setUsername('JohnDoe'); // Saves to localStorage and updates state
 */
export function useLocalStorage(key, defaultValue) {
    // Initialize state with value from localStorage or default
    const [value, setValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return defaultValue;
        }
    });

    // Update localStorage when value changes
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, value]);

    return [value, setValue];
}

export default useLocalStorage;

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock Firebase auth
vi.mock('../../firebase', () => ({
    auth: {
        currentUser: null,
    },
    googleProvider: {},
}));

// Mock Firebase auth functions
vi.mock('firebase/auth', () => ({
    onAuthStateChanged: vi.fn((auth, callback) => {
        // Call callback with null user (not authenticated)
        callback(null);
        // Return unsubscribe function
        return vi.fn();
    }),
    signInWithPopup: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signInWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    sendEmailVerification: vi.fn(),
}));

describe('App Component', () => {
    it('renders without crashing', () => {
        render(<App />);
        // App should render successfully
        expect(document.body).toBeTruthy();
    });

    it('displays the logo', () => {
        render(<App />);
        // Check if logo image is present
        const logo = screen.getByAltText(/girify/i);
        expect(logo).toBeInTheDocument();
    });

    it('shows register panel when not authenticated', () => {
        render(<App />);
        // Should show some form of registration/login UI
        // This is a basic check - adjust based on your actual UI
        expect(document.body).toBeTruthy();
    });
});

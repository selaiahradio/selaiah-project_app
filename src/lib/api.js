
import { appParams } from './app-params';

const API_BASE_URL = appParams.serverUrl;

// Function to get the token. For now, it reads from appParams,
// which gets it from the URL. A more robust solution might use localStorage.
const getToken = () => appParams.token;

const fetcher = async (path, options = {}) => {
    const url = `${API_BASE_URL}${path}`;
    
    const headers = { 
        'Content-Type': 'application/json', 
        ...options.headers 
    };

    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error on ${path}: ${errorText}`);
        // Create an error object that includes the status
        const error = new Error(`Request failed: ${response.status}`);
        error.status = response.status;
        try {
            error.data = JSON.parse(errorText);
        } catch (e) {
            error.data = { message: errorText };
        }
        throw error;
    }

    if (response.status === 204) return null;
    return response.json();
};

// --- Authentication Endpoints ---

// Gets the current user's profile
export const getMe = () => fetcher('/users/me');

// Sends a magic link to the user's email
export const sendMagicLink = (email, redirectUrl) => {
    return fetcher('/auth/magic-link', {
        method: 'POST',
        body: JSON.stringify({ email, redirect_url: redirectUrl }),
    });
};

// --- Google Auth ---
export const redirectToGoogleLogin = (redirectUrl) => {
    // The backend should handle the rest of the Google OAuth flow
    // and redirect back to the provided `redirect_url` with the access token.
    const googleLoginUrl = `${API_BASE_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUrl)}`;
    window.location.href = googleLoginUrl;
};


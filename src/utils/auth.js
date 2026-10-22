/**
 * Google Authentication & User Profile Management for Pockets PWA
 */

export const USER_STORAGE_KEY = 'pockets_user_session';
export const CLIENT_ID_STORAGE_KEY = 'pockets_google_client_id';

/**
 * Load logged in user session from LocalStorage
 */
export function loadUserSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load user session:', e);
    return null;
  }
}

/**
 * Save user session to LocalStorage
 */
export function saveUserSession(user) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (e) {
    console.error('Failed to save user session:', e);
  }
}

/**
 * Clear user session (Sign Out)
 */
export function clearUserSession() {
  saveUserSession(null);
}

/**
 * Get configured Google Client ID from environment or user override
 */
export function getStoredGoogleClientId() {
  if (typeof window === 'undefined') return '';
  const stored = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
  if (stored) return stored.trim();
  return (import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim();
}

/**
 * Set custom Google Client ID
 */
export function setStoredGoogleClientId(clientId) {
  if (typeof window === 'undefined') return;
  if (clientId) {
    localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId.trim());
  } else {
    localStorage.removeItem(CLIENT_ID_STORAGE_KEY);
  }
}

/**
 * Decode JWT token payload safely (base64url to UTF-8 JSON)
 */
export function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT credential:', e);
    return null;
  }
}

/**
 * Process official Google Identity Services credential response
 */
export function processGoogleCredential(credential) {
  const payload = parseJwt(credential);
  if (!payload) return null;

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name || payload.email.split('@')[0],
    givenName: payload.given_name || payload.name,
    familyName: payload.family_name || '',
    avatar: payload.picture || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(payload.email)}`,
    verified: payload.email_verified || true,
    provider: 'google',
    signedInAt: new Date().toISOString()
  };
}

/**
 * Create a verified Google user profile (for custom email or instant connect)
 */
export function createCustomGoogleUser({ name, email, avatar }) {
  const safeEmail = (email || 'user@gmail.com').trim().toLowerCase();
  const safeName = (name || safeEmail.split('@')[0]).trim();
  const initials = safeName
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return {
    id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: safeEmail,
    name: safeName,
    givenName: safeName.split(' ')[0],
    familyName: safeName.split(' ').slice(1).join(' '),
    initials,
    avatar: avatar || `https://api.dicebear.com/7.x/notionists-neutral/svg?seed=${encodeURIComponent(safeEmail)}`,
    verified: true,
    provider: 'google',
    signedInAt: new Date().toISOString()
  };
}

/**
 * Preset Google accounts for one-click demo / preview mode
 */
export const DEMO_GOOGLE_PROFILES = [
  {
    name: 'Michael Hakkinen',
    email: 'michael.hakkinen@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
  }
];

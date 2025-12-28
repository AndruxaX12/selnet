/**
 * Authentication utility functions
 */

/**
 * Get authentication token from localStorage
 * Checks multiple possible token storage keys
 * @returns token string or null if not found
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('idToken') ||
    localStorage.getItem('firebaseToken') ||
    null
  );
}

/**
 * Get user data from localStorage
 * @returns parsed user object or null if not found
 */
export function getStoredUser(): any | null {
  if (typeof window === 'undefined') return null;
  
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Failed to parse stored user data:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns true if user has valid token and user data
 */
export function isAuthenticated(): boolean {
  return !!(getAuthToken() && getStoredUser());
}

/**
 * Clear all authentication data from localStorage
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('idToken');
  localStorage.removeItem('firebaseToken');
}

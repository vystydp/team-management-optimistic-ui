import type { User, AuthStatus } from '../types/auth';

// In production (Vercel), use relative URLs (same domain as frontend)
// In development, use localhost backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.MODE === 'production' ? '' : 'http://localhost:3001');
const TOKEN_KEY = 'auth_token';

/**
 * Authentication service for frontend
 */
class AuthService {
  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Store auth token
   */
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  }

  /**
   * Clear auth token
   */
  clearToken(): void {
    localStorage.removeItem(TOKEN_KEY);
  }

  /**
   * Check if user has a token (doesn't validate it)
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Initiate GitHub OAuth login flow in popup window
   */
  login(): Promise<string> {
    return new Promise((resolve, reject) => {
      // Open OAuth in popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const popup = window.open(
        `${BACKEND_URL}/auth/login`,
        'GitHub OAuth',
        `width=${width},height=${height},left=${left},top=${top},toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes`
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups for this site.'));
        return;
      }

      let messageReceived = false;

      // Listen for message from popup
      const messageHandler = (event: MessageEvent) => {
        // Verify origin - accept messages from backend (popup runs on backend origin)
        const backendOrigin = new URL(BACKEND_URL).origin;
        if (event.origin !== backendOrigin && event.origin !== window.location.origin) {
          console.log('[Auth] Ignored message from unknown origin:', event.origin);
          return;
        }

        console.log('[Auth] Received message from popup:', event.data, 'from origin:', event.origin);

        if (event.data.type === 'oauth-success' && event.data.token) {
          messageReceived = true;
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          
          this.setToken(event.data.token);
          console.log('[Auth] OAuth successful, token stored');
          
          // Close popup if still open
          if (!popup.closed) {
            popup.close();
          }
          
          resolve(event.data.token);
        } else if (event.data.type === 'oauth-error') {
          messageReceived = true;
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          
          if (!popup.closed) {
            popup.close();
          }
          
          reject(new Error(event.data.error || 'OAuth failed'));
        }
      };

      window.addEventListener('message', messageHandler);

      // Check if popup was closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          
          // Only reject if we didn't receive a success message
          if (!messageReceived) {
            console.log('[Auth] Popup closed without receiving message');
            reject(new Error('OAuth popup closed'));
          }
        }
      }, 1000);
    });
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    const token = this.getToken();
    
    // Call backend logout endpoint
    if (token) {
      try {
        await fetch(`${BACKEND_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error('[Auth] Logout error:', error);
      }
    }

    // Clear local token
    this.clearToken();
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          this.clearToken();
          return null;
        }
        throw new Error(`Failed to fetch user: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.error('[Auth] Get current user error:', error);
      this.clearToken();
      return null;
    }
  }

  /**
   * Check authentication status
   */
  async checkStatus(): Promise<AuthStatus> {
    const token = this.getToken();
    if (!token) {
      return { authenticated: false };
    }

    try {
      const response = await fetch(`${BACKEND_URL}/auth/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const status: AuthStatus = await response.json();
      
      if (!status.authenticated) {
        this.clearToken();
      }

      return status;
    } catch (error) {
      console.error('[Auth] Status check error:', error);
      this.clearToken();
      return { authenticated: false };
    }
  }
}

export const authService = new AuthService();

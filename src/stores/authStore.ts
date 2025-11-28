import { create } from 'zustand';
import type { User } from '../types/auth';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  clearUser: () => void;
  checkAuth: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      loading: false,
      error: null,
    }),

  clearUser: () =>
    set({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
    }),

  checkAuth: async () => {
    set({ loading: true, error: null });
    
    try {
      const user = await authService.getCurrentUser();
      
      if (user) {
        set({
          user,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        });
      }
    } catch (error) {
      console.error('[AuthStore] Check auth error:', error);
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication check failed',
      });
    }
  },

  logout: async () => {
    try {
      await authService.logout();
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error('[AuthStore] Logout error:', error);
      // Clear user anyway on logout error
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: null,
      });
    }
  },
}));

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { tokenManager } from '@/app/api';
import type { User } from '@/lib/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  clearUser: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,

      setUser: (user) => set({ user, isAuthenticated: true }),
      setTokens: (accessToken, refreshToken) => tokenManager.setTokens(accessToken, refreshToken),
      
      logout: () => {
        tokenManager.clearTokens();
        set({ user: null, isAuthenticated: false });
        if (typeof window !== 'undefined') window.location.href = '/login';
      },

      clearUser: () => set({ user: null, isAuthenticated: false }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'xposure-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state?: AuthState) => {
        if (!state) return;
        
        state.setHasHydrated(true);
        
        const token = tokenManager.getAccessToken();
        
        if (state.user && token) {
          // User exists in storage and token exists - restore user
          // Don't call setUser here as it will be set by useAuth hook after fetching
          // Just ensure isAuthenticated matches the user state
          if (!state.isAuthenticated) {
            state.setUser(state.user);
          }
        } else if (state.user && !token) {
          // User in storage but no token - clear user
          state.clearUser();
        } else {
          // No user - ensure isAuthenticated is false
          state.clearUser();
        }
      },
    }
  )
);

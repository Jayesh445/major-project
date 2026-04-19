import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'warehouse_manager' | 'procurement_officer' | 'supplier';
  isActive: boolean;
}

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
  setHasHydrated: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        hasHydrated: false,

        // Actions
        setUser: (user) => set({ user, isAuthenticated: !!user }),

        setTokens: (accessToken, refreshToken) =>
          set({ accessToken, refreshToken }),

        logout: () =>
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
          }),

        updateProfile: (updates) => {
          const currentUser = get().user;
          if (currentUser) {
            set({ user: { ...currentUser, ...updates } });
          }
        },

        setHasHydrated: (v) => set({ hasHydrated: v }),
      }),
      {
        name: 'auth-storage',
        // Only these fields are persisted; hasHydrated intentionally omitted
        // so it stays false on first render after refresh until rehydration completes.
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          // Called after localStorage has been read back into the store.
          // Flip hasHydrated so protected routes can safely evaluate auth state.
          state?.setHasHydrated(true);
        },
      }
    )
  )
);

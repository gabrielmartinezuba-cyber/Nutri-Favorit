import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserProfile {
  id: string;
  first_name?: string;
  email?: string;
  phone?: string | null;
  birth_date?: string;
  metabolism?: string;
  objective?: string;
  role: 'admin' | 'cliente';
  favorit_points: number;
  height?: number | null;
  weight?: number | null;
  activity_days?: number | null;
}

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  updatePhone: (phone: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      loading: true,
      setUser: (user) => set({ user, loading: false }),
      setLoading: (loading) => set({ loading }),
      updatePhone: (phone) => set((state) => ({
        user: state.user ? { ...state.user, phone } : null
      })),
    }),
    {
      name: 'auth-storage',
    }
  )
);

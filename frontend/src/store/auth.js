import { create } from 'zustand';
import { setToken, clearToken, getMe } from '../api/index.js';

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  loading: true,

  setAuth: (user, token) => {
    setToken(token);
    set({ user, token, loading: false });
  },

  logout: () => {
    clearToken();
    set({ user: null, token: null, loading: false });
  },

  loadUser: async () => {
    try {
      const { data } = await getMe();
      set({ user: data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  }
}));

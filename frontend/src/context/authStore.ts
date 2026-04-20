import { create, SetState } from "zustand";
import { User } from "../types";

const getStoredAuth = () => {
  try {
    // Storage recovery is defensive because malformed local data should never break app bootstrap.
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");

    if (!storedUser || !storedToken) {
      return { user: null, token: null, isAuthenticated: false };
    }

    return {
      user: JSON.parse(storedUser) as User,
      token: storedToken,
      isAuthenticated: true,
    };
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");

    return { user: null, token: null, isAuthenticated: false };
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: User) => void;
  clearAuth: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set: SetState<AuthState>) => ({
  ...getStoredAuth(),

  setAuth: (user: User, token: string) => {
    // Persist first, then publish state, so reload behavior matches the in-memory session immediately.
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("authToken", token);
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    set((state) => ({ ...state, user }));
  },

  clearAuth: () => {
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    set(getStoredAuth());
  },
}));

import { create, SetState } from "zustand";
import { User } from "../types";

const LAST_ACTIVITY_KEY = "lastActivityAt";
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;

const getStoredAuth = () => {
  try {
    // Storage recovery is defensive because malformed local data should never break app bootstrap.
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("authToken");
    const storedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

    if (!storedUser || !storedToken) {
      return { user: null, token: null, isAuthenticated: false };
    }

    const now = Date.now();
    const lastActivity = storedLastActivity
      ? Number.parseInt(storedLastActivity, 10)
      : now;

    if (
      !Number.isFinite(lastActivity) ||
      now - lastActivity > IDLE_TIMEOUT_MS
    ) {
      localStorage.removeItem("user");
      localStorage.removeItem("authToken");
      localStorage.removeItem(LAST_ACTIVITY_KEY);
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
    localStorage.removeItem(LAST_ACTIVITY_KEY);

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
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    set({ user, token, isAuthenticated: true });
  },

  updateUser: (user: User) => {
    // Keeps the stored user object in sync when the profile is edited (e.g., name, avatar).
    localStorage.setItem("user", JSON.stringify(user));
    set((state) => ({ ...state, user }));
  },

  clearAuth: () => {
    // Remove all auth-related keys so no stale session survives a page refresh after logout.
    localStorage.removeItem("user");
    localStorage.removeItem("authToken");
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    // Route guards call this during app bootstrap so refreshes restore the previous session before redirects happen.
    set(getStoredAuth());
  },
}));

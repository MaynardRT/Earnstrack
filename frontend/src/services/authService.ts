import api from "./api";
import { AuthResponse, User } from "../types";

// Login request timeout in milliseconds
const LOGIN_TIMEOUT = 10000; // 10 seconds

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LOGIN_TIMEOUT);

      const response = await api.post("/auth/login", { email, password }, {
        signal: controller.signal,
      } as any);

      clearTimeout(timeoutId);
      return response.data;
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Login request timed out. Please try again.");
      }
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    // Client storage is cleared even if the backend logout endpoint is eventually reduced to a no-op for JWT flows.
    try {
      await api.post("/auth/logout");
    } catch (err) {
      // Ignore logout errors - clear storage anyway
      console.warn("Logout request failed, clearing local storage anyway");
    }
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  createUser: async (
    email: string,
    fullName: string,
    password: string,
    role: string,
  ): Promise<User> => {
    const response = await api.post("/auth/admin/create-user", {
      email,
      fullName,
      password,
      role,
    });
    return response.data;
  },
};

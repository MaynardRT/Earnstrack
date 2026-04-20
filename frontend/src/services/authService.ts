import api from "./api";
import { AuthResponse, User } from "../types";

export const authService = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    // Client storage is cleared even if the backend logout endpoint is eventually reduced to a no-op for JWT flows.
    await api.post("/auth/logout");
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

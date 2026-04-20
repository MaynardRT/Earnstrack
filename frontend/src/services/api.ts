import axios from "axios";

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// The request interceptor keeps auth concerns out of individual service calls.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // A 401 means the client session is no longer trustworthy, so clear it before redirecting.
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      window.location.href = `${import.meta.env.BASE_URL}login`;
    }

    return Promise.reject(error);
  },
);

export default api;

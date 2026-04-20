import axios from "axios";

const getDefaultApiBaseUrl = (): string => {
  if (typeof window === "undefined") {
    return "http://localhost:5000/api";
  }

  const { hostname } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return "http://localhost:5000/api";
  }

  // GitHub Pages cannot reach a localhost API, so production falls back to the deployed Render backend.
  return "https://earnstrack.onrender.com/api";
};

const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || getDefaultApiBaseUrl();

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

export const resolveApiAssetUrl = (
  assetPath?: string | null,
): string | null => {
  if (!assetPath) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(assetPath) || assetPath.startsWith("data:")) {
    return assetPath;
  }

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, "");
  const normalizedPath = assetPath.startsWith("/")
    ? assetPath
    : `/${assetPath}`;
  return `${apiOrigin}${normalizedPath}`;
};

export default api;

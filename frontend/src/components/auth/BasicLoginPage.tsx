import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../context/authStore";
import { authService } from "../../services/authService";
import { Card } from "../common/Card";
import { Button } from "../common/Button";
import { Alert } from "../common/Alert";
import { BrandLogo } from "../common/BrandLogo";
import { useThemeStore } from "../../context/themeStore";
import { Moon, Sun } from "lucide-react";

export const BasicLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const { isDarkMode, toggleTheme } = useThemeStore();

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Prevent double submissions
      if (isLoading) return;

      setIsLoading(true);
      setError(null);

      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      if (!trimmedEmail || !trimmedPassword) {
        setError("Please enter both email and password");
        setIsLoading(false);
        return;
      }

      try {
        // Login delegates all credential verification to the API; the page only persists the returned session via Zustand.
        const response = await authService.login(trimmedEmail, trimmedPassword);

        if (response.user && response.token) {
          setAuth(response.user, response.token);
          // Navigate to dashboard after successful auth
          navigate("/dashboard", { replace: true });
        } else {
          setError("Invalid response from server");
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Login error:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Invalid email or password. Please try again.",
        );
        setIsLoading(false);
      }
    },
    [email, password, isLoading, setAuth, navigate],
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <button
            onClick={toggleTheme}
            className="absolute top-4 right-4 p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun size={20} className="text-yellow-500" />
            ) : (
              <Moon size={20} className="text-gray-600" />
            )}
          </button>
          <BrandLogo className="mx-auto mb-4 h-20 w-auto" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Earnstrack
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track and manage your business earnings
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            title="Error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
              required
              autoComplete="email"
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
              required
              autoComplete="current-password"
            />
          </div>

          {/* Login Button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
          >
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuthStore } from "./context/authStore";
import { useThemeStore } from "./context/themeStore";
import { Layout } from "./components/common/Layout";
import { Sidebar } from "./components/common/Sidebar";
import { BasicLoginPage } from "./components/auth/BasicLoginPage";
import { Dashboard } from "./components/dashboard/Dashboard";
import { EWalletForm } from "./components/services/EWalletForm";
import { PrintingForm } from "./components/services/PrintingForm";
import { SettingsPage } from "./components/settings/SettingsPage";

const LAST_ACTIVITY_KEY = "lastActivityAt";
const IDLE_TIMEOUT_MS = 60 * 60 * 1000;

// Main Layout with Sidebar
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    // The shell owns sidebar state so every protected page gets the same mobile/desktop navigation behavior.
    <div className="flex min-h-screen overflow-x-hidden bg-white dark:bg-gray-900 md:h-screen md:overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={handleCloseSidebar} />
      <div className="flex min-w-0 flex-1 flex-col md:min-h-0 md:overflow-hidden">
        <Layout showNavigation={true} onMenuToggle={handleMenuToggle}>
          {children}
        </Layout>
      </div>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated } = useAuthStore();

  // Route guarding stays at the edge so feature pages can assume auth state is already settled.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { isDarkMode } = useThemeStore();
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    // Theme is applied at the document root so Tailwind dark variants work across the entire app shell.
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // Auth hydration happens once on boot to avoid a flash of logged-out routing after refresh.
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const updateLastActivity = () => {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    };

    const enforceIdleTimeout = () => {
      const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActivity = raw ? Number.parseInt(raw, 10) : Date.now();

      if (!Number.isFinite(lastActivity)) {
        updateLastActivity();
        return;
      }

      if (Date.now() - lastActivity > IDLE_TIMEOUT_MS) {
        clearAuth();
      }
    };

    const handleUserActivity = () => {
      updateLastActivity();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        enforceIdleTimeout();
      }
    };

    updateLastActivity();

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "keydown",
      "click",
      "scroll",
      "touchstart",
      "focus",
    ];

    events.forEach((eventName) =>
      window.addEventListener(eventName, handleUserActivity, { passive: true }),
    );
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const intervalId = window.setInterval(enforceIdleTimeout, 60 * 1000);

    return () => {
      events.forEach((eventName) =>
        window.removeEventListener(eventName, handleUserActivity),
      );
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [clearAuth, isAuthenticated]);

  return (
    // The router basename is driven by Vite so localhost and GitHub Pages can share one route tree.
    <Router basename={import.meta.env.BASE_URL}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<BasicLoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/ewallet"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EWalletForm />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/services/printing"
          element={
            <ProtectedRoute>
              <MainLayout>
                <PrintingForm />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SettingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Default route - redirect to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

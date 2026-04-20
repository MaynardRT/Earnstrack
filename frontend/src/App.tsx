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
import { ProductsPage } from "./components/services/ProductsPage";
import { SettingsPage } from "./components/settings/SettingsPage";

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

  useEffect(() => {
    // Theme is applied at the document root so Tailwind dark variants work across the entire app shell.
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    // Auth hydration happens once on boot to avoid a flash of logged-out routing after refresh.
    loadFromStorage();
  }, [loadFromStorage]);

  return (
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
          path="/services/products"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ProductsPage />
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

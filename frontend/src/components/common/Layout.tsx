import React, { ReactNode } from "react";
import { Sun, Moon, Menu } from "lucide-react";
import { useAuthStore } from "../../context/authStore";
import { useThemeStore } from "../../context/themeStore";
import { UserAvatar } from "./UserAvatar";
import { BrandLogo } from "./BrandLogo";

interface LayoutProps {
  children: ReactNode;
  showNavigation?: boolean;
  onMenuToggle?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showNavigation = true,
  onMenuToggle,
}) => {
  const { isDarkMode, toggleTheme } = useThemeStore();
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-white transition-colors duration-200 dark:bg-gray-900 md:min-h-0">
      {showNavigation && (
        <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm shadow-gray-200/70 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none md:border-b-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-4">
                {onMenuToggle && (
                  <button
                    onClick={onMenuToggle}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle menu"
                    title="Toggle menu"
                  >
                    <Menu size={24} className="text-gray-900 dark:text-white" />
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <BrandLogo variant="mark" className="h-9 w-9 rounded-xl" />
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Earnstrack
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <UserAvatar
                  fullName={user?.fullName}
                  profilePicture={user?.profilePicture}
                  size="sm"
                />
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Toggle theme"
                >
                  {isDarkMode ? (
                    <Sun size={20} className="text-yellow-500" />
                  ) : (
                    <Moon size={20} className="text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}
      <main className="flex-1 overflow-visible md:min-h-0 md:overflow-y-auto md:overscroll-y-contain app-scroll">
        {children}
      </main>
    </div>
  );
};

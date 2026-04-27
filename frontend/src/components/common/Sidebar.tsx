import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { X, LogOut, Settings, Home, Briefcase, Printer } from "lucide-react";
import { useAuthStore } from "../../context/authStore";
import { authService } from "../../services/authService";
import { UserAvatar } from "./UserAvatar";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, clearAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      clearAuth();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const menuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: Briefcase, label: "E-Wallet", path: "/services/ewallet" },
    { icon: Printer, label: "Printing", path: "/services/printing" },
    ...(user?.role === "Admin"
      ? [{ icon: Settings, label: "Settings", path: "/settings" }]
      : []),
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-gray-200 bg-white shadow-xl shadow-gray-200/70 transform transition-transform duration-300 ease-in-out dark:border-gray-700 dark:bg-gray-800 dark:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-600 md:border-b-0 md:pb-6">
            <div className="flex justify-between items-center md:hidden">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Menu
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                aria-label="Close menu"
                title="Close menu"
              >
                <X size={24} className="text-gray-900 dark:text-white" />
              </button>
            </div>
            <div className="hidden md:block">
              <div className="flex items-center gap-3 rounded-2xl bg-gray-50 px-3 py-3 dark:bg-gray-700/50">
                <UserAvatar
                  fullName={user?.fullName}
                  profilePicture={user?.profilePicture}
                  size="md"
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">
                    {user?.fullName || "User"}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || ""}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center space-x-3 rounded-xl border px-4 py-3 transition-all ${
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-700 shadow-sm shadow-blue-100 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:shadow-none"
                      : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 hover:text-blue-600 dark:text-gray-200 dark:hover:border-gray-700 dark:hover:bg-gray-700/60 dark:hover:text-blue-400"
                  }`
                }
              >
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Logout */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <LogOut size={20} />
              <span>{isLoading ? "Logging out..." : "Logout"}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

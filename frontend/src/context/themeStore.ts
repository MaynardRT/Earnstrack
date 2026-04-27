import { create, SetState } from "zustand";

interface ThemeState {
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  loadFromStorage: () => void;
}

export const useThemeStore = create<ThemeState>(
  (set: SetState<ThemeState>) => ({
    isDarkMode: false,

    // Flip the current mode, persist the new value, and update the DOM class immediately.
    toggleTheme: () => {
      set((state) => {
        const newDarkMode = !state.isDarkMode;
        localStorage.setItem("theme", newDarkMode ? "dark" : "light");
        updateDOM(newDarkMode);
        return { isDarkMode: newDarkMode };
      });
    },

    // Imperatively set a specific theme — used by the settings toggle when an explicit choice is made.
    setTheme: (isDark: boolean) => {
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateDOM(isDark);
      set({ isDarkMode: isDark });
    },

    // Called once on app boot: restore the saved preference or fall back to the OS preference.
    loadFromStorage: () => {
      const theme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      const isDark = theme ? theme === "dark" : prefersDark;
      updateDOM(isDark);
      set({ isDarkMode: isDark });
    },
  }),
);

// Tailwind dark mode is controlled by the "dark" class on <html>.
// Adding/removing this class is the single authoritative way to switch themes.
function updateDOM(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

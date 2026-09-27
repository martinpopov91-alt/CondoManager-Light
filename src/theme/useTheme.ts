import { create } from 'zustand';

export type Theme = 'light' | 'dark';

export const THEME_KEY = 'condo_theme';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

function applyThemeClass(theme: Theme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useThemeStore = create<ThemeState>((set) => {
  const initial = getInitialTheme();
  applyThemeClass(initial);

  return {
    theme: initial,
    setTheme: (theme: Theme) => {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch {}
      applyThemeClass(theme);
      set({ theme });
    },
    toggleTheme: () => {
      set((state) => {
        const next: Theme = state.theme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem(THEME_KEY, next);
        } catch {}
        applyThemeClass(next);
        return { theme: next };
      });
    },
  };
});

export function useTheme() {
  const { theme, setTheme, toggleTheme } = useThemeStore();
  return {
    theme,
    setTheme,
    toggleTheme,
    isDark: theme === 'dark',
  };
}


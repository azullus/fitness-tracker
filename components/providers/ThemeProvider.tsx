'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

// Light mode color themes
export type LightColorTheme = 'emerald' | 'sky' | 'violet' | 'amber';
// Dark mode color themes
export type DarkColorTheme = 'emerald' | 'indigo' | 'violet' | 'rose';

export interface ColorThemeOption {
  id: string;
  label: string;
  colors: {
    from: string;
    via: string;
    to: string;
  };
}

export const lightColorThemes: ColorThemeOption[] = [
  { id: 'emerald', label: 'Emerald', colors: { from: '#059669', via: '#14b8a6', to: '#06b6d4' } },
  { id: 'sky', label: 'Sky', colors: { from: '#0284c7', via: '#0ea5e9', to: '#38bdf8' } },
  { id: 'violet', label: 'Violet', colors: { from: '#7c3aed', via: '#8b5cf6', to: '#a78bfa' } },
  { id: 'amber', label: 'Amber', colors: { from: '#d97706', via: '#f59e0b', to: '#fbbf24' } },
];

export const darkColorThemes: ColorThemeOption[] = [
  { id: 'emerald', label: 'Emerald', colors: { from: '#065f46', via: '#115e59', to: '#0e7490' } },
  { id: 'indigo', label: 'Indigo', colors: { from: '#3730a3', via: '#4338ca', to: '#4f46e5' } },
  { id: 'violet', label: 'Violet', colors: { from: '#5b21b6', via: '#6d28d9', to: '#7c3aed' } },
  { id: 'rose', label: 'Rose', colors: { from: '#9f1239', via: '#be123c', to: '#e11d48' } },
];

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  colorTheme: LightColorTheme | DarkColorTheme;
  setColorTheme: (colorTheme: LightColorTheme | DarkColorTheme) => void;
  lightColorTheme: LightColorTheme;
  darkColorTheme: DarkColorTheme;
  setLightColorTheme: (colorTheme: LightColorTheme) => void;
  setDarkColorTheme: (colorTheme: DarkColorTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'fitness-tracker-theme';
const LIGHT_COLOR_STORAGE_KEY = 'fitness-tracker-light-color-theme';
const DARK_COLOR_STORAGE_KEY = 'fitness-tracker-dark-color-theme';

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultLightColorTheme?: LightColorTheme;
  defaultDarkColorTheme?: DarkColorTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  defaultLightColorTheme = 'emerald',
  defaultDarkColorTheme = 'emerald',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [lightColorTheme, setLightColorThemeState] = useState<LightColorTheme>(defaultLightColorTheme);
  const [darkColorTheme, setDarkColorThemeState] = useState<DarkColorTheme>(defaultDarkColorTheme);
  const [mounted, setMounted] = useState(false);

  // Get system preference
  const getSystemTheme = useCallback((): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  // Resolve theme based on current setting
  const resolveTheme = useCallback((currentTheme: Theme): ResolvedTheme => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  }, [getSystemTheme]);

  // Apply color theme to document
  const applyColorTheme = useCallback((colorTheme: string) => {
    const root = document.documentElement;
    root.setAttribute('data-color-theme', colorTheme);
  }, []);

  // Apply theme to document
  const applyTheme = useCallback((resolved: ResolvedTheme, lightColor: LightColorTheme, darkColor: DarkColorTheme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);

    // Apply the appropriate color theme based on resolved theme
    const colorTheme = resolved === 'light' ? lightColor : darkColor;
    applyColorTheme(colorTheme);

    // Update meta theme-color for PWA
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#1f2937' : '#3b82f6');
    }
  }, [applyColorTheme]);

  // Set theme and persist
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved, lightColorTheme, darkColorTheme);

    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // Failed to save to localStorage
    }
  }, [resolveTheme, applyTheme, lightColorTheme, darkColorTheme]);

  // Toggle between light and dark
  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Set light color theme
  const setLightColorTheme = useCallback((colorTheme: LightColorTheme) => {
    setLightColorThemeState(colorTheme);
    if (resolvedTheme === 'light') {
      applyColorTheme(colorTheme);
    }
    try {
      localStorage.setItem(LIGHT_COLOR_STORAGE_KEY, colorTheme);
    } catch {
      // Failed to save to localStorage
    }
  }, [resolvedTheme, applyColorTheme]);

  // Set dark color theme
  const setDarkColorTheme = useCallback((colorTheme: DarkColorTheme) => {
    setDarkColorThemeState(colorTheme);
    if (resolvedTheme === 'dark') {
      applyColorTheme(colorTheme);
    }
    try {
      localStorage.setItem(DARK_COLOR_STORAGE_KEY, colorTheme);
    } catch {
      // Failed to save to localStorage
    }
  }, [resolvedTheme, applyColorTheme]);

  // Set color theme (auto-detects light/dark based on resolved theme)
  const setColorTheme = useCallback((colorTheme: LightColorTheme | DarkColorTheme) => {
    if (resolvedTheme === 'light') {
      setLightColorTheme(colorTheme as LightColorTheme);
    } else {
      setDarkColorTheme(colorTheme as DarkColorTheme);
    }
  }, [resolvedTheme, setLightColorTheme, setDarkColorTheme]);

  // Get current color theme based on resolved theme
  const colorTheme = resolvedTheme === 'light' ? lightColorTheme : darkColorTheme;

  // Initialize theme from localStorage or system
  useEffect(() => {
    let savedTheme: Theme = defaultTheme;
    let savedLightColorTheme: LightColorTheme = defaultLightColorTheme;
    let savedDarkColorTheme: DarkColorTheme = defaultDarkColorTheme;

    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        savedTheme = stored;
      }
      const storedLightColor = localStorage.getItem(LIGHT_COLOR_STORAGE_KEY) as LightColorTheme | null;
      if (storedLightColor && ['emerald', 'sky', 'violet', 'amber'].includes(storedLightColor)) {
        savedLightColorTheme = storedLightColor;
      }
      const storedDarkColor = localStorage.getItem(DARK_COLOR_STORAGE_KEY) as DarkColorTheme | null;
      if (storedDarkColor && ['emerald', 'indigo', 'violet', 'rose'].includes(storedDarkColor)) {
        savedDarkColorTheme = storedDarkColor;
      }
    } catch {
      // Failed to read from localStorage
    }

    setThemeState(savedTheme);
    setLightColorThemeState(savedLightColorTheme);
    setDarkColorThemeState(savedDarkColorTheme);
    const resolved = resolveTheme(savedTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved, savedLightColorTheme, savedDarkColorTheme);
    setMounted(true);
  }, [defaultTheme, defaultLightColorTheme, defaultDarkColorTheme, resolveTheme, applyTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? 'dark' : 'light';
      setResolvedTheme(newResolved);
      applyTheme(newResolved, lightColorTheme, darkColorTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme, lightColorTheme, darkColorTheme]);

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      resolvedTheme,
      setTheme,
      toggleTheme,
      colorTheme,
      setColorTheme,
      lightColorTheme,
      darkColorTheme,
      setLightColorTheme,
      setDarkColorTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 * @throws Error if used outside ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeProvider;

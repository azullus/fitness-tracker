'use client';

import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown' | 'buttons' | 'gradient';
  className?: string;
}

export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  // Gradient icon toggle with animation (visually appealing)
  if (variant === 'gradient') {
    return (
      <button
        onClick={toggleTheme}
        className={`
          group relative p-2.5 rounded-xl
          bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500
          dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500
          shadow-lg shadow-orange-500/25 dark:shadow-purple-500/25
          hover:shadow-xl hover:shadow-orange-500/40 dark:hover:shadow-purple-500/40
          hover:scale-105 active:scale-95
          transition-all duration-300 ease-out
          ${className}
        `}
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        {/* Animated glow ring */}
        <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-pink-500 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 opacity-0 group-hover:opacity-75 blur-md transition-opacity duration-300 -z-10" />

        {/* Icon container with smooth transition */}
        <span className="relative block">
          {resolvedTheme === 'light' ? (
            <Moon className="h-5 w-5 text-white drop-shadow-sm transition-transform duration-300 group-hover:rotate-12" />
          ) : (
            <Sun className="h-5 w-5 text-white drop-shadow-sm transition-transform duration-300 group-hover:rotate-45" />
          )}
        </span>

        {/* Subtle pulse animation indicator */}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-sm" />
      </button>
    );
  }

  // Simple icon toggle (light/dark only)
  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${className}`}
        aria-label={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${resolvedTheme === 'light' ? 'dark' : 'light'} mode`}
      >
        {resolvedTheme === 'light' ? (
          <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <Sun className="h-5 w-5 text-yellow-500" />
        )}
      </button>
    );
  }

  // Button group with all three options
  if (variant === 'buttons') {
    return (
      <div className={`flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg ${className}`}>
        <button
          onClick={() => setTheme('light')}
          className={`p-2 rounded-md transition-colors ${
            theme === 'light'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="Light mode"
          title="Light mode"
        >
          <Sun className={`h-4 w-4 ${theme === 'light' ? 'text-yellow-500' : 'text-gray-500 dark:text-gray-400'}`} />
        </button>
        <button
          onClick={() => setTheme('dark')}
          className={`p-2 rounded-md transition-colors ${
            theme === 'dark'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="Dark mode"
          title="Dark mode"
        >
          <Moon className={`h-4 w-4 ${theme === 'dark' ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400'}`} />
        </button>
        <button
          onClick={() => setTheme('system')}
          className={`p-2 rounded-md transition-colors ${
            theme === 'system'
              ? 'bg-white dark:bg-gray-700 shadow-sm'
              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          aria-label="System preference"
          title="System preference"
        >
          <Monitor className={`h-4 w-4 ${theme === 'system' ? 'text-green-500' : 'text-gray-500 dark:text-gray-400'}`} />
        </button>
      </div>
    );
  }

  // Dropdown variant
  return (
    <div className={`relative ${className}`}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
        className="appearance-none bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
      <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        {theme === 'light' && <Sun className="h-4 w-4 text-yellow-500" />}
        {theme === 'dark' && <Moon className="h-4 w-4 text-blue-500" />}
        {theme === 'system' && <Monitor className="h-4 w-4 text-green-500" />}
      </div>
    </div>
  );
}

export default ThemeToggle;

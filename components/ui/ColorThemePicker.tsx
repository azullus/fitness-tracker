'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Check, X, Palette } from 'lucide-react';
import { clsx } from 'clsx';
import {
  useTheme,
  lightColorThemes,
  darkColorThemes,
  type ColorThemeOption,
} from '@/components/providers/ThemeProvider';

interface ColorThemePickerProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement | null>;
}

export function ColorThemePicker({ isOpen, onClose, anchorRef }: ColorThemePickerProps) {
  const {
    resolvedTheme,
    lightColorTheme,
    darkColorTheme,
    setLightColorTheme,
    setDarkColorTheme,
  } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position based on anchor element with viewport boundary check
  useEffect(() => {
    if (!isOpen || !anchorRef?.current) return;

    const updatePosition = () => {
      const anchorRect = anchorRef.current?.getBoundingClientRect();
      if (anchorRect) {
        const dropdownWidth = 280; // min-w-[280px]
        const padding = 16; // 16px from screen edge
        const viewportWidth = window.innerWidth;

        // Calculate left position, ensuring dropdown doesn't overflow right edge
        let left = anchorRect.left;
        if (left + dropdownWidth > viewportWidth - padding) {
          left = Math.max(padding, viewportWidth - dropdownWidth - padding);
        }

        setPosition({
          top: anchorRect.bottom + 8, // 8px gap below button
          left,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [isOpen, anchorRef]);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        anchorRef?.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const currentThemes = resolvedTheme === 'light' ? lightColorThemes : darkColorThemes;
  const currentSelection = resolvedTheme === 'light' ? lightColorTheme : darkColorTheme;
  const setColorTheme = resolvedTheme === 'light' ? setLightColorTheme : setDarkColorTheme;

  const handleSelectTheme = (themeId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setColorTheme(themeId as any);
  };

  return (
    <div
      ref={dropdownRef}
      className={clsx(
        'fixed z-50',
        'bg-white dark:bg-gray-800',
        'rounded-xl shadow-xl',
        'border border-gray-200 dark:border-gray-700',
        'p-4 min-w-[280px]',
        'animate-in fade-in slide-in-from-top-2 duration-200'
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      role="dialog"
      aria-label="Color theme picker"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {resolvedTheme === 'light' ? 'Light' : 'Dark'} Theme Colors
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close color picker"
        >
          <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Color swatches */}
      <div className="grid grid-cols-2 gap-3">
        {currentThemes.map((theme: ColorThemeOption) => (
          <button
            key={theme.id}
            onClick={() => handleSelectTheme(theme.id)}
            className={clsx(
              'relative flex flex-col items-center gap-2 p-3 rounded-xl',
              'transition-all duration-200',
              'hover:scale-105 active:scale-95',
              currentSelection === theme.id
                ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-800 ring-gray-900 dark:ring-white bg-gray-50 dark:bg-gray-700/50'
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
            )}
            aria-label={`Select ${theme.label} theme`}
            aria-pressed={currentSelection === theme.id}
          >
            {/* Gradient preview */}
            <div
              className="w-full h-12 rounded-lg shadow-inner overflow-hidden"
              style={{
                background: `linear-gradient(to right, ${theme.colors.from}, ${theme.colors.via}, ${theme.colors.to})`,
              }}
            >
              {/* Check mark overlay for selected theme */}
              {currentSelection === theme.id && (
                <div className="w-full h-full flex items-center justify-center bg-black/20">
                  <Check className="w-6 h-6 text-white drop-shadow-lg" />
                </div>
              )}
            </div>

            {/* Theme label */}
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {theme.label}
            </span>
          </button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Colors are saved separately for light and dark modes
      </p>
    </div>
  );
}

export default ColorThemePicker;

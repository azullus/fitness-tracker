'use client';

import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';
import { ButtonHTMLAttributes, ReactNode, CSSProperties } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}

// Note: primary variant uses CSS variables for theming - see getButtonStyle()
const variantStyles: Record<ButtonVariant, string> = {
  primary: 'text-white disabled:opacity-50',
  secondary: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600 focus:ring-gray-500 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400 dark:disabled:text-gray-500',
  danger: 'bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-500 focus:ring-red-500 disabled:bg-red-300 dark:disabled:bg-red-800',
  ghost: 'bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-gray-500 disabled:text-gray-400 dark:disabled:text-gray-500',
};

// Get inline styles for primary button (uses CSS variables for theming)
function getPrimaryButtonStyle(): CSSProperties {
  return {
    backgroundColor: 'rgb(var(--theme-button-bg))',
  };
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  type = 'button',
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Combine provided style with primary button theming
  const buttonStyle = variant === 'primary'
    ? { ...getPrimaryButtonStyle(), ...style }
    : style;

  return (
    <button
      type={type}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center font-medium rounded-lg',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
        'disabled:cursor-not-allowed',
        // Active/pressed state with scale and brightness
        'active:scale-[0.98]',
        variant === 'primary' && 'hover:brightness-110 active:brightness-95 shadow-sm hover:shadow',
        variant !== 'primary' && variant !== 'ghost' && 'active:brightness-95',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      style={buttonStyle}
      {...props}
    >
      {loading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

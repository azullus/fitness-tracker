'use client';

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from 'react';
import { clsx } from 'clsx';
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, RefreshCw } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, 0 = permanent
  onRetry?: () => void;
  dismissible?: boolean;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast icons by type
const toastIcons: Record<ToastType, typeof AlertTriangle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

// Toast styles by type
const toastStyles: Record<ToastType, { container: string; icon: string; title: string }> = {
  success: {
    container: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/30',
    icon: 'text-green-500 dark:text-green-400 bg-green-100 dark:bg-green-900/50',
    title: 'text-green-800 dark:text-green-200',
  },
  error: {
    container: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30',
    icon: 'text-red-500 dark:text-red-400 bg-red-100 dark:bg-red-900/50',
    title: 'text-red-800 dark:text-red-200',
  },
  warning: {
    container: 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30',
    icon: 'text-amber-500 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50',
    title: 'text-amber-800 dark:text-amber-200',
  },
  info: {
    container: 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30',
    icon: 'text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50',
    title: 'text-blue-800 dark:text-blue-200',
  },
};

interface ToastItemProps {
  toast: Toast;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = toastIcons[toast.type];
  const styles = toastStyles[toast.type];
  const dismissible = toast.dismissible !== false;

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onRemove]);

  return (
    <div
      className={clsx(
        'rounded-lg border p-4 shadow-lg backdrop-blur-sm',
        'animate-in slide-in-from-top-2 fade-in duration-300',
        'max-w-sm w-full',
        styles.container
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={clsx('flex-shrink-0 p-1.5 rounded-full', styles.icon)}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-semibold', styles.title)}>{toast.title}</p>
          {toast.message && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{toast.message}</p>
          )}
          {toast.onRetry && (
            <button
              onClick={() => {
                toast.onRetry?.();
                onRemove(toast.id);
              }}
              className={clsx(
                'mt-2 inline-flex items-center gap-1.5 text-sm font-medium',
                'px-3 py-1.5 rounded-md',
                'bg-white/50 dark:bg-gray-800/50',
                'hover:bg-white dark:hover:bg-gray-800',
                'transition-colors duration-150',
                styles.title
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              Retry Connection
            </button>
          )}
        </div>
        {dismissible && (
          <button
            onClick={() => onRemove(toast.id)}
            className={clsx(
              'flex-shrink-0 p-1 rounded-full',
              'hover:bg-black/5 dark:hover:bg-white/10',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              'text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300'
            )}
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = useCallback(() => {
    return `toast-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>): string => {
      const id = generateId();
      const newToast: Toast = {
        ...toast,
        id,
        duration: toast.duration ?? 5000, // Default 5 seconds
        dismissible: toast.dismissible ?? true,
      };
      setToasts((prev) => [...prev, newToast]);
      return id;
    },
    [generateId]
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      {/* Toast container - fixed position at top of viewport */}
      <div
        className={clsx(
          'fixed top-4 right-4 z-[100]',
          'flex flex-col gap-2',
          'pointer-events-none'
        )}
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * Hook to access toast functionality
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

/**
 * Convenience hook for common toast actions
 */
export function useToastActions() {
  const { addToast, removeToast, clearToasts } = useToast();

  return {
    success: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, onRetry?: () => void) =>
      addToast({ type: 'error', title, message, onRetry, duration: onRetry ? 0 : 5000 }),
    warning: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'warning', title, message, duration: duration ?? 7000 }),
    info: (title: string, message?: string, duration?: number) =>
      addToast({ type: 'info', title, message, duration }),
    remove: removeToast,
    clear: clearToasts,
  };
}

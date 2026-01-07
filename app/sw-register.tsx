'use client';

import { useEffect, useState } from 'react';

export default function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Only register in production or when explicitly enabled
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_SW)
    ) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        setRegistration(reg);

        // Check for updates on registration
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available
              setUpdateAvailable(true);
            }
          });
        });

        // Check for updates periodically (every hour)
        setInterval(() => {
          reg.update();
        }, 60 * 60 * 1000);

      } catch {
        // Service worker registration failed
      }
    };

    // Handle controller change (when skipWaiting is called)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    registerServiceWorker();
  }, []);

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      // Tell the waiting service worker to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  // Show update prompt when new version is available
  if (updateAvailable) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-center justify-between">
        <div className="flex-1">
          <p className="font-medium">Update Available</p>
          <p className="text-sm text-blue-100">A new version of the app is ready.</p>
        </div>
        <button
          onClick={handleUpdate}
          className="ml-4 px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors"
        >
          Update
        </button>
      </div>
    );
  }

  // Render nothing when no update is available
  return null;
}

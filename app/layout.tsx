import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { PersonProvider } from '@/components/providers/PersonProvider';
import { CSRFProvider } from '@/components/providers/CSRFProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AppInitializer } from '@/components/providers/AppInitializer';
import { ToastProvider } from '@/components/ui/Toast';
import BottomNav from '@/components/navigation/BottomNav';
import ServiceWorkerRegister from './sw-register';

export const metadata: Metadata = {
  title: 'Fitness Tracker',
  description: 'Track your fitness journey with workouts, meals, and progress',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Fitness Tracker',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('fitness-tracker-theme');
                  var resolved = theme;
                  if (theme === 'system' || !theme) {
                    resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  document.documentElement.classList.add(resolved);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <AppInitializer>
          <ThemeProvider defaultTheme="system">
            <ToastProvider>
              <CSRFProvider>
                <AuthProvider>
                  <PersonProvider>
                    <main className="min-h-screen pb-20">
                      {children}
                    </main>
                    <BottomNav />
                  </PersonProvider>
                </AuthProvider>
              </CSRFProvider>
            </ToastProvider>
          </ThemeProvider>
        </AppInitializer>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

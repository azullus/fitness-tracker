'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers';
import { RefreshCw } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isAuthEnabled, isLoading } = useAuth();

  useEffect(() => {
    // Only redirect if auth is enabled and we're done loading
    if (!isLoading && isAuthEnabled && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, isAuthEnabled, isLoading, router]);

  // If auth is not enabled, render children directly (no protection needed)
  if (!isAuthEnabled) {
    return <>{children}</>;
  }

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading...
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (redirect will happen)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          Redirecting to login...
        </div>
      </div>
    );
  }

  // Authenticated - render children
  return <>{children}</>;
}

'use client';

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

/**
 * Loading fallback for the OnboardingWizard
 * Shows a branded loading screen that matches the wizard's blue gradient
 */
function OnboardingWizardLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Solid blurred background - matches OnboardingWizard */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Decorative blurred shapes */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
      </div>

      {/* Loading card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
        <div className="flex flex-col items-center justify-center space-y-4">
          <LoadingSpinner size="lg" variant="primary" />
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Loading setup wizard...
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Lazy-loaded OnboardingWizard with loading state
 * Use this to improve initial page load time since the wizard is only shown conditionally
 */
export const LazyOnboardingWizard = dynamic(
  () => import('./OnboardingWizard').then((mod) => mod.OnboardingWizard),
  {
    loading: () => <OnboardingWizardLoading />,
    ssr: false, // Wizard uses client-side state and localStorage
  }
);

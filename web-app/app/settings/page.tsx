'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import Header from '@/components/navigation/Header';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  Users,
  Palette,
  Bell,
  Shield,
  HelpCircle,
  ChevronRight,
  LogOut,
  User
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem('fitness-tracker-person');
    localStorage.removeItem('fitness-tracker-household');
    localStorage.removeItem('fitness-tracker-persons');
    localStorage.removeItem('fitness-tracker-onboarding-complete');
    router.push('/auth/login');
  };

  type SettingItem = {
    icon: typeof Users;
    label: string;
    description: string;
    href?: string;
    component?: React.ReactNode;
    disabled?: boolean;
  };

  const settingsGroups: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          icon: Users,
          label: 'Household Settings',
          description: 'Manage household members',
          href: '/settings/household',
        },
        {
          icon: User,
          label: 'Profile',
          description: 'Edit your profile information',
          href: '/settings/profile',
          disabled: true,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Palette,
          label: 'Appearance',
          description: 'Theme and color settings',
          component: (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Theme:</span>
              <ThemeToggle />
            </div>
          ),
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Manage notification preferences',
          href: '/settings/notifications',
          disabled: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & FAQ',
          description: 'Get help using the app',
          href: '/settings/help',
          disabled: true,
        },
        {
          icon: Shield,
          label: 'Privacy',
          description: 'Privacy policy and data settings',
          href: '/settings/privacy',
          disabled: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Settings" showPersonToggle={false} showGreeting={false} />

      <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* User info card */}
        {user && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {user.email}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isAuthenticated ? 'Signed in' : 'Demo mode'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Settings groups */}
        {settingsGroups.map((group) => (
          <div key={group.title}>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              {group.title}
            </h2>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
              {group.items.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="flex items-center gap-4 p-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.label}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </p>
                    </div>
                    {item.component ? (
                      item.component
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                );

                if (item.disabled) {
                  return (
                    <div key={item.label} className="opacity-50 cursor-not-allowed">
                      {content}
                    </div>
                  );
                }

                if (item.href) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="block hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {content}
                    </Link>
                  );
                }

                return <div key={item.label}>{content}</div>;
              })}
            </div>
          </div>
        ))}

        {/* Sign out button */}
        {isAuthenticated && user && (
          <Button
            variant="danger"
            onClick={handleLogout}
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        )}

        {/* Version info */}
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Fitness Tracker v1.0.0
        </p>
      </div>
    </div>
  );
}

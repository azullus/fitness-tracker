'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Dumbbell,
  UtensilsCrossed,
  ChefHat,
  PlusCircle,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isAction?: boolean;
}

// Reduced to 5 items for better mobile UX, with Log as prominent center action
const navItems: NavItem[] = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/workouts', label: 'Workouts', icon: Dumbbell },
  { href: '/log', label: 'Log', icon: PlusCircle, isAction: true },
  { href: '/meals', label: 'Meals', icon: UtensilsCrossed },
  { href: '/recipes', label: 'Recipes', icon: ChefHat },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md',
        'border-t border-gray-200/80 dark:border-gray-700/80',
        'shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.3)]',
        'pb-[env(safe-area-inset-bottom)]'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-20 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          // Center "Log" action button with special styling - uses CSS variables for theming
          if (item.isAction) {
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={clsx(
                  'flex flex-col items-center justify-center',
                  'min-w-[64px] min-h-[48px] -mt-4',
                  'transition-all duration-200'
                )}
              >
                <div
                  className={clsx(
                    'flex items-center justify-center w-16 h-16 rounded-full',
                    'shadow-lg',
                    'transition-all duration-200',
                    active ? 'scale-105' : 'hover:scale-105 active:scale-95'
                  )}
                  style={{
                    backgroundColor: `rgb(var(--theme-button-bg))`,
                    boxShadow: `0 10px 15px -3px rgba(var(--theme-accent), 0.3)`,
                  }}
                >
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <span
                  className="text-xs font-bold mt-1"
                  style={{ color: active ? `rgb(var(--theme-primary-text))` : undefined }}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              className={clsx(
                'group relative flex flex-col items-center justify-center',
                'min-w-[64px] min-h-[48px] py-2',
                'transition-all duration-200',
                !active && 'text-gray-500 dark:text-gray-400'
              )}
              style={active ? { color: `rgb(var(--theme-primary-text))` } : undefined}
            >
              {/* Active indicator */}
              {active && (
                <span
                  className="absolute top-0 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: `rgb(var(--theme-accent))` }}
                />
              )}

              {/* Icon with hover background */}
              <div
                className={clsx(
                  'relative p-2 rounded-xl transition-all duration-200',
                  !active && 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800 group-active:scale-95'
                )}
                style={active ? { backgroundColor: `rgba(var(--theme-primary-light), 0.8)` } : undefined}
              >
                <Icon
                  className={clsx(
                    'w-6 h-6 transition-transform duration-200',
                    active && 'scale-110',
                    !active && 'group-hover:scale-105'
                  )}
                />
              </div>

              <span
                className={clsx(
                  'text-xs font-semibold mt-1 transition-colors duration-200',
                  active
                    ? 'font-bold'
                    : 'group-hover:text-gray-700 dark:group-hover:text-gray-300'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

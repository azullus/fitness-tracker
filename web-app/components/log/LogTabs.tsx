'use client';

import { Scale, UtensilsCrossed, Dumbbell } from 'lucide-react';
import { clsx } from 'clsx';

export type TabType = 'weight' | 'food' | 'workout';

interface TabConfig {
  id: TabType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: TabConfig[] = [
  { id: 'weight', label: 'Weight', icon: Scale },
  { id: 'food', label: 'Food', icon: UtensilsCrossed },
  { id: 'workout', label: 'Workout', icon: Dumbbell },
];

interface LogTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function LogTabs({ activeTab, onTabChange }: LogTabsProps) {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors',
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

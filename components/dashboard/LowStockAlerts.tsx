'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import type { PantryItem } from '@/lib/types';

export interface LowStockAlertsProps {
  lowStockItems: PantryItem[];
}

export function LowStockAlerts({ lowStockItems }: LowStockAlertsProps) {
  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <Link href="/pantry" className="block">
      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <h2 className="font-semibold text-orange-800 dark:text-orange-200">Low Stock Items</h2>
          </div>
          <ChevronRight className="w-5 h-5 text-orange-400" />
        </div>
        <div className="flex flex-wrap gap-2">
          {lowStockItems.slice(0, 5).map(item => (
            <span
              key={item.id}
              className="px-2 py-1 bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded-full text-sm"
            >
              {item.name}
            </span>
          ))}
          {lowStockItems.length > 5 && (
            <span className="px-2 py-1 text-orange-600 dark:text-orange-400 text-sm">
              +{lowStockItems.length - 5} more
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default LowStockAlerts;

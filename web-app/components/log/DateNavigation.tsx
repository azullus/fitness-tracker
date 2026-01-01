'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isToday } from 'date-fns';

interface DateNavigationProps {
  date: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
}

export function DateNavigation({
  date,
  onPreviousDay,
  onNextDay,
  onToday,
}: DateNavigationProps) {
  const displayDate = format(date, 'EEEE, MMMM d');
  const isTodayDate = isToday(date);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onPreviousDay}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="font-semibold text-gray-900 dark:text-white">
            {displayDate}
          </span>
          {!isTodayDate && (
            <button
              onClick={onToday}
              className="mt-1 px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/60 transition-colors"
            >
              Today
            </button>
          )}
        </div>

        <button
          onClick={onNextDay}
          className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Next day"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

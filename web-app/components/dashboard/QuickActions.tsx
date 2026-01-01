'use client';

import React from 'react';
import { Scale, Plus, Dumbbell } from 'lucide-react';
import { QuickActionButton } from './shared';

export function QuickActions() {
  return (
    <div className="grid grid-cols-3 gap-3">
      <QuickActionButton
        href="/log?tab=weight"
        icon={Scale}
        label="Log Weight"
        colorClass="bg-blue-500"
      />
      <QuickActionButton
        href="/log?tab=food"
        icon={Plus}
        label="Log Food"
        colorClass="bg-green-500"
      />
      <QuickActionButton
        href="/workouts"
        icon={Dumbbell}
        label="Start Workout"
        colorClass="bg-purple-500"
      />
    </div>
  );
}

export default QuickActions;

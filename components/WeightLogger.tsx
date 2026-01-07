'use client';

import { useState } from 'react';
import { Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  person: 'Him' | 'Her';
  currentWeight?: number;
  sevenDayAvg?: number;
  trend?: 'up' | 'down' | 'stable';
  onLog?: (weight: number, notes?: string) => void;
};

export default function WeightLogger({
  person,
  currentWeight,
  sevenDayAvg,
  trend = 'stable',
  onLog,
}: Props) {
  const [weight, setWeight] = useState(currentWeight?.toString() || '');
  const [notes, setNotes] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-400';

  const handleSubmit = () => {
    const w = parseFloat(weight);
    if (w > 0 && onLog) {
      onLog(w, notes || undefined);
      setIsExpanded(false);
      setNotes('');
    }
  };

  const isHim = person === 'Him';

  return (
    <div className={cn('card', isHim ? 'border-l-4 border-l-strength-500' : 'border-l-4 border-l-cardio-500')}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isHim ? 'bg-red-100' : 'bg-purple-100'
          )}>
            <Scale className={cn('w-5 h-5', isHim ? 'text-red-600' : 'text-purple-600')} />
          </div>
          <div>
            <p className="text-sm text-gray-500">{person}</p>
            <p className="text-2xl font-bold text-gray-900">
              {currentWeight ? `${currentWeight} lbs` : '--'}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <span>7-day avg</span>
            <TrendIcon className={cn('w-4 h-4', trendColor)} />
          </div>
          <p className="text-lg font-semibold text-gray-700">
            {sevenDayAvg ? `${sevenDayAvg} lbs` : '--'}
          </p>
        </div>
      </div>

      {/* Quick log button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors',
          isExpanded
            ? 'bg-gray-100 text-gray-600'
            : isHim
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
        )}
      >
        {isExpanded ? 'Cancel' : 'Log Weight'}
      </button>

      {/* Expanded input */}
      {isExpanded && (
        <div className="mt-3 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeight((prev) => (parseFloat(prev) - 0.5).toFixed(1))}
              className="btn-secondary btn-sm"
            >
              -0.5
            </button>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Weight"
              step="0.1"
              className="input-number flex-1"
            />
            <button
              onClick={() => setWeight((prev) => (parseFloat(prev) + 0.5).toFixed(1))}
              className="btn-secondary btn-sm"
            >
              +0.5
            </button>
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            className="input input-sm"
          />
          <button
            onClick={handleSubmit}
            disabled={!weight || parseFloat(weight) <= 0}
            className={cn('w-full', isHim ? 'btn bg-red-600 text-white hover:bg-red-700' : 'btn bg-purple-600 text-white hover:bg-purple-700')}
          >
            Save
          </button>
        </div>
      )}
    </div>
  );
}

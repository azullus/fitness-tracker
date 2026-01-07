'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCurrentPerson } from '@/components/providers/PersonProvider';

interface WeightLogData {
  person_id: string;
  date: string;
  weight_lbs: number;
  notes?: string;
}

interface WeightLoggerProps {
  onSubmit: (data: WeightLogData) => Promise<void>;
  onCancel?: () => void;
}

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function WeightLogger({ onSubmit, onCancel }: WeightLoggerProps) {
  const currentPerson = useCurrentPerson();

  const [date, setDate] = useState<string>(formatDateForInput(new Date()));
  const [weight, setWeight] = useState<number>(150);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const incrementWeight = useCallback(() => {
    setWeight((prev) => Math.round((prev + 0.1) * 10) / 10);
  }, []);

  const decrementWeight = useCallback(() => {
    setWeight((prev) => Math.round((prev - 0.1) * 10) / 10);
  }, []);

  const handleWeightChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value > 0) {
      setWeight(Math.round(value * 10) / 10);
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentPerson) {
      setError('No person selected. Please select a person first.');
      return;
    }

    if (weight <= 0) {
      setError('Weight must be greater than 0.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: WeightLogData = {
        person_id: currentPerson.id,
        date,
        weight_lbs: weight,
        ...(notes.trim() && { notes: notes.trim() }),
      };

      await onSubmit(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log weight. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [currentPerson, date, weight, notes, onSubmit]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Log Weight</h2>
        {currentPerson && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Logging for: {currentPerson.name}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/30 p-4 text-sm text-red-700 dark:text-red-300" role="alert">
          {error}
        </div>
      )}

      <Input
        type="date"
        label="Date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        max={formatDateForInput(new Date())}
        required
      />

      <div className="space-y-2">
        <label id="weight-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Weight (lbs)
        </label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={decrementWeight}
            disabled={isSubmitting || weight <= 0.1}
            aria-label="Decrease weight by 0.1 lbs"
          >
            -
          </Button>
          <Input
            type="number"
            value={weight}
            onChange={handleWeightChange}
            step="0.1"
            min="0.1"
            required
            className="text-center text-lg font-medium"
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={incrementWeight}
            disabled={isSubmitting}
            aria-label="Increase weight by 0.1 lbs"
          >
            +
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="weight-notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Notes (optional)
        </label>
        <textarea
          id="weight-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g., Morning weigh-in, before breakfast..."
          rows={3}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          disabled={isSubmitting}
        />
      </div>

      <div className="flex gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={!currentPerson}
          className="flex-1"
        >
          Log Weight
        </Button>
      </div>
    </form>
  );
}

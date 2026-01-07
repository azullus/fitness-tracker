'use client';

import { useState } from 'react';
import { Dumbbell, Clock, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { cn, getEnergyEmoji } from '@/lib/utils';
import type { WorkoutExercise } from '@/lib/types';

type Props = {
  person: 'Him' | 'Her';
  workoutType: string;
  exercises: WorkoutExercise[];
  completed?: boolean;
  duration?: number;
  energy?: number;
  onComplete?: () => void;
};

export default function WorkoutCard({
  person,
  workoutType,
  exercises,
  completed = false,
  duration,
  energy,
  onComplete,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isHim = person === 'Him';

  // Group exercises by type (warmup vs main)
  const warmupExercises = exercises.filter((e) => e.notes?.toLowerCase().includes('warm'));
  const mainExercises = exercises.filter((e) => !e.notes?.toLowerCase().includes('warm'));

  return (
    <div className={cn(
      'card overflow-hidden',
      completed && 'bg-green-50 border-green-200'
    )}>
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center',
            completed
              ? 'bg-green-100'
              : isHim
                ? 'bg-red-100'
                : 'bg-purple-100'
          )}>
            {completed ? (
              <Check className="w-6 h-6 text-green-600" />
            ) : (
              <Dumbbell className={cn('w-6 h-6', isHim ? 'text-red-600' : 'text-purple-600')} />
            )}
          </div>
          <div>
            <p className="font-semibold text-gray-900">{workoutType}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className={cn('badge', isHim ? 'badge-strength' : 'badge-cardio')}>
                {person}
              </span>
              <span>{exercises.length} exercises</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {duration && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>{duration}m</span>
            </div>
          )}
          {energy && (
            <span className="text-lg">{getEnergyEmoji(energy)}</span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded exercise list */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 animate-fade-in">
          {warmupExercises.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Warm-up</p>
              <div className="space-y-2">
                {warmupExercises.map((ex) => (
                  <ExerciseRow key={ex.id} exercise={ex} isHim={isHim} />
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Main Workout</p>
            <div className="space-y-2">
              {mainExercises.map((ex) => (
                <ExerciseRow key={ex.id} exercise={ex} isHim={isHim} />
              ))}
            </div>
          </div>

          {!completed && onComplete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onComplete();
              }}
              className={cn(
                'mt-4 w-full py-3 rounded-lg font-medium text-white transition-colors',
                isHim
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-purple-600 hover:bg-purple-700'
              )}
            >
              Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ exercise, isHim }: { exercise: WorkoutExercise; isHim: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-gray-900 text-sm">{exercise.exercise_name}</p>
        <p className="text-xs text-gray-500">{exercise.target_muscles}</p>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">
          {exercise.sets} x {exercise.reps}
        </span>
        {exercise.weight_intensity && (
          <span className={cn(
            'px-2 py-0.5 rounded text-xs font-medium',
            isHim ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
          )}>
            {exercise.weight_intensity}
          </span>
        )}
      </div>
    </div>
  );
}

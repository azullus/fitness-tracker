'use client';

import React from 'react';
import Link from 'next/link';
import {
  Flame,
  Zap,
  Target,
  Dumbbell,
  ChevronRight,
  Sparkles,
  Heart,
  Activity,
  TrendingUp,
  Calendar,
  Award,
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import type { Person, Workout } from '@/lib/types';

// Motivational tips for the hero section
const MOTIVATIONAL_TIPS = [
  { tip: "Consistency beats intensity. Show up every day.", icon: Sparkles },
  { tip: "Protein within 30 min post-workout maximizes gains.", icon: Target },
  { tip: "Sleep is when your muscles grow. Aim for 7-9 hours.", icon: Heart },
  { tip: "Hydration improves performance by up to 25%.", icon: Activity },
  { tip: "Progressive overload is the key to strength gains.", icon: Dumbbell },
  { tip: "Track everything - what gets measured gets improved.", icon: TrendingUp },
  { tip: "Rest days are growth days. Recovery is part of training.", icon: Calendar },
  { tip: "Small wins compound into big transformations.", icon: Award },
];

// Get a consistent daily tip based on the date
function getDailyTip() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return MOTIVATIONAL_TIPS[dayOfYear % MOTIVATIONAL_TIPS.length];
}

export interface ScheduledWorkout {
  type: string;
  description?: string;
}

export interface HeroSectionProps {
  currentPerson: Person;
  workoutStreak: number;
  calorieProgress: number;
  proteinProgress: number;
  completedThisWeek: number;
  plannedThisWeek: number;
  todaysLoggedWorkout?: Workout;
  scheduledWorkout: ScheduledWorkout | null;
}

export function HeroSection({
  currentPerson,
  workoutStreak,
  calorieProgress,
  proteinProgress,
  completedThisWeek,
  plannedThisWeek,
  todaysLoggedWorkout,
  scheduledWorkout,
}: HeroSectionProps) {
  const dailyTip = getDailyTip();
  const TipIcon = dailyTip.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl">
      {/* Animated gradient background */}
      <div className={clsx(
        'absolute inset-0 animate-gradient',
        currentPerson.training_focus === 'powerlifting'
          ? 'bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500'
          : currentPerson.training_focus === 'cardio'
          ? 'bg-gradient-to-br from-rose-500 via-pink-500 to-orange-400'
          : 'bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500'
      )} />

      {/* Subtle overlay pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_50%_120%,white,transparent_60%)]" />

      {/* Glowing orbs */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />

      {/* Content */}
      <div className="relative p-5 text-white">
        {/* Top Row: Welcome + Training Focus Badge */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-white/80 mb-1">
              {format(new Date(), 'EEEE, MMMM d')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {currentPerson.name}!
            </h1>
          </div>
          <div className={clsx(
            'px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm',
            'bg-white/20 border border-white/30'
          )}>
            {currentPerson.training_focus === 'powerlifting' && 'Powerlifting'}
            {currentPerson.training_focus === 'cardio' && 'Cardio'}
            {currentPerson.training_focus === 'mixed' && 'Mixed Training'}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Streak */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
            <div className="flex justify-center mb-1">
              <Flame className={clsx(
                'w-5 h-5',
                workoutStreak > 0 ? 'text-orange-300 animate-flame' : 'text-white/60'
              )} />
            </div>
            <p className="text-xl font-bold">{workoutStreak}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wide">Streak</p>
          </div>

          {/* Calories */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
            <div className="flex justify-center mb-1">
              <Zap className="w-5 h-5 text-yellow-300" />
            </div>
            <p className="text-xl font-bold">{Math.round(calorieProgress)}%</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wide">Calories</p>
          </div>

          {/* Protein */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
            <div className="flex justify-center mb-1">
              <Target className="w-5 h-5 text-emerald-300" />
            </div>
            <p className="text-xl font-bold">{Math.round(proteinProgress)}%</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wide">Protein</p>
          </div>

          {/* Workouts */}
          <div className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
            <div className="flex justify-center mb-1">
              <Dumbbell className="w-5 h-5 text-violet-300" />
            </div>
            <p className="text-xl font-bold">{completedThisWeek}/{plannedThisWeek || '-'}</p>
            <p className="text-[10px] text-white/70 uppercase tracking-wide">This Week</p>
          </div>
        </div>

        {/* Motivational Tip */}
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-float">
            <TipIcon className="w-4 h-4" />
          </div>
          <p className="text-sm text-white/90 leading-snug">
            <span className="font-semibold text-white">Daily Tip:</span> {dailyTip.tip}
          </p>
        </div>

        {/* Today's Focus Bar */}
        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {todaysLoggedWorkout ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-white/90">
                  {todaysLoggedWorkout.completed ? 'Workout Complete' : 'Workout In Progress'}
                </span>
              </>
            ) : scheduledWorkout ? (
              <>
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-white/90">
                  Today: {scheduledWorkout.type}
                </span>
              </>
            ) : (
              <>
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-white/90">Rest Day - Recover Strong</span>
              </>
            )}
          </div>
          <Link
            href="/workouts"
            className="flex items-center gap-1 text-white/80 hover:text-white transition-colors"
          >
            <span>View</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HeroSection;

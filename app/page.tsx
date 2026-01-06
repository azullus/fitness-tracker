'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Calendar, TrendingUp, Utensils, Dumbbell, Database, RefreshCw, LogIn, LogOut, User } from 'lucide-react';
import WeightLogger from '@/components/WeightLogger';
import WorkoutCard from '@/components/WorkoutCard';
import MealCard from '@/components/MealCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/components/providers';
import { cn, getDayOfWeek, calculateWeightTrend } from '@/lib/utils';
import { fetchWeightLogs, logWeight, seedDatabase } from '@/lib/api';

export default function Dashboard() {
  const today = new Date();
  const dayOfWeek = getDayOfWeek(today);
  const todayStr = format(today, 'yyyy-MM-dd');
  const { isAuthenticated, isAuthEnabled, user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState<'him' | 'her'>('him');
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  // Data states
  const [hisWeightData, setHisWeightData] = useState<{ current: number; sevenDayAvg: number; trend: 'up' | 'down' | 'stable' }>({ current: 0, sevenDayAvg: 0, trend: 'stable' });
  const [herWeightData, setHerWeightData] = useState<{ current: number; sevenDayAvg: number; trend: 'up' | 'down' | 'stable' }>({ current: 0, sevenDayAvg: 0, trend: 'stable' });
  const [todayMeals, setTodayMeals] = useState<any>(null);
  const [hisExercises, setHisExercises] = useState<any[]>([]);
  const [herExercises, setHerExercises] = useState<any[]>([]);
  const [hisWorkoutType, setHisWorkoutType] = useState('Rest Day');
  const [herWorkoutType, setHerWorkoutType] = useState('Rest Day');

  // Load data
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Fetch weight logs
      const [hisLogs, herLogs] = await Promise.all([
        fetchWeightLogs('Him', 14),
        fetchWeightLogs('Her', 14),
      ]);

      if (hisLogs.length > 0) {
        const trend = calculateWeightTrend(hisLogs);
        setHisWeightData(trend);
      }

      if (herLogs.length > 0) {
        const trend = calculateWeightTrend(herLogs);
        setHerWeightData(trend);
      }

      // Fetch today's meals
      const mealsRes = await fetch(`/api/meals?date=${todayStr}`);
      const mealsData = await mealsRes.json();
      const todayMealData = mealsData.find((d: any) => d.date === todayStr);
      setTodayMeals(todayMealData);

      // Fetch today's workouts
      const [hisExRes, herExRes] = await Promise.all([
        fetch(`/api/exercises?person=Him&day=${dayOfWeek}`),
        fetch(`/api/exercises?person=Her&day=${dayOfWeek}`),
      ]);

      const hisEx = await hisExRes.json();
      const herEx = await herExRes.json();

      if (Array.isArray(hisEx) && hisEx.length > 0) {
        setHisExercises(hisEx);
        setHisWorkoutType(hisEx[0]?.workout_type || 'Workout');
      }

      if (Array.isArray(herEx) && herEx.length > 0) {
        setHerExercises(herEx);
        setHerWorkoutType(herEx[0]?.workout_type || 'Workout');
      }

    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  }

  async function handleSeed() {
    setSeeding(true);
    setSeedMessage('');
    try {
      const result = await seedDatabase();
      setSeedMessage(result.message);
      // Reload data after seeding
      await loadData();
    } catch (error: any) {
      setSeedMessage('Error: ' + error.message);
    }
    setSeeding(false);
  }

  async function handleLogWeight(person: 'Him' | 'Her', weight: number, notes?: string) {
    try {
      await logWeight(person, weight, notes);
      // Reload weight data
      const logs = await fetchWeightLogs(person, 14);
      if (logs.length > 0) {
        const trend = calculateWeightTrend(logs);
        if (person === 'Him') {
          setHisWeightData(trend);
        } else {
          setHerWeightData(trend);
        }
      }
    } catch (error) {
      console.error('Error logging weight:', error);
    }
  }

  // Calculate daily totals from meals
  const dailyTotals = todayMeals ? {
    calories: (todayMeals.breakfast?.recipe?.calories || 0) + (todayMeals.lunch?.recipe?.calories || 0) + (todayMeals.dinner?.recipe?.calories || 0),
    protein: (todayMeals.breakfast?.recipe?.protein_g || 0) + (todayMeals.lunch?.recipe?.protein_g || 0) + (todayMeals.dinner?.recipe?.protein_g || 0),
    carbs: (todayMeals.breakfast?.recipe?.carbs_g || 0) + (todayMeals.lunch?.recipe?.carbs_g || 0) + (todayMeals.dinner?.recipe?.carbs_g || 0),
    fat: (todayMeals.breakfast?.recipe?.fat_g || 0) + (todayMeals.lunch?.recipe?.fat_g || 0) + (todayMeals.dinner?.recipe?.fat_g || 0),
  } : { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return (
    <ProtectedRoute>
    <div className="px-4 py-6 max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {format(today, 'EEEE, MMMM d')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="btn-secondary btn-sm flex items-center gap-1"
          >
            {seeding ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            {seeding ? 'Seeding...' : 'Seed Data'}
          </button>
          {isAuthEnabled && (
            isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {user?.email?.split('@')[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="btn-secondary btn-sm flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/auth/login" className="btn-secondary btn-sm flex items-center gap-1">
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link href="/auth/signup" className="btn-primary btn-sm">
                  Sign Up
                </Link>
              </div>
            )
          )}
        </div>
      </div>

      {/* Seed message */}
      {seedMessage && (
        <div className={cn(
          'p-3 rounded-lg text-sm',
          seedMessage.startsWith('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        )}>
          {seedMessage}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading...
        </div>
      ) : (
        <>
          {/* Weight Section */}
          <section>
            <h2 className="card-header flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Weight Tracking
            </h2>
            <div className="grid grid-cols-1 gap-3">
              <WeightLogger
                person="Him"
                currentWeight={hisWeightData.current}
                sevenDayAvg={hisWeightData.sevenDayAvg}
                trend={hisWeightData.trend}
                onLog={(w, n) => handleLogWeight('Him', w, n)}
              />
              <WeightLogger
                person="Her"
                currentWeight={herWeightData.current}
                sevenDayAvg={herWeightData.sevenDayAvg}
                trend={herWeightData.trend}
                onLog={(w, n) => handleLogWeight('Her', w, n)}
              />
            </div>
          </section>

          {/* Today's Workout */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="card-header flex items-center gap-2 mb-0">
                <Dumbbell className="w-4 h-4" />
                Today&apos;s Workout
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveTab('him')}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                    activeTab === 'him'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Him
                </button>
                <button
                  onClick={() => setActiveTab('her')}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                    activeTab === 'her'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  Her
                </button>
              </div>
            </div>

            {activeTab === 'him' ? (
              hisExercises.length > 0 ? (
                <WorkoutCard
                  person="Him"
                  workoutType={hisWorkoutType}
                  exercises={hisExercises}
                  onComplete={() => console.log('His workout complete')}
                />
              ) : (
                <div className="card text-center py-8">
                  <span className="text-3xl">😴</span>
                  <p className="font-semibold text-gray-900 mt-2">Rest Day</p>
                  <p className="text-sm text-gray-500">Recovery is part of getting stronger</p>
                </div>
              )
            ) : (
              herExercises.length > 0 ? (
                <WorkoutCard
                  person="Her"
                  workoutType={herWorkoutType}
                  exercises={herExercises}
                  onComplete={() => console.log('Her workout complete')}
                />
              ) : (
                <div className="card text-center py-8">
                  <span className="text-3xl">😴</span>
                  <p className="font-semibold text-gray-900 mt-2">Rest Day</p>
                  <p className="text-sm text-gray-500">Active recovery or complete rest</p>
                </div>
              )
            )}
          </section>

          {/* Today's Meals */}
          <section>
            <h2 className="card-header flex items-center gap-2">
              <Utensils className="w-4 h-4" />
              Today&apos;s Meals
            </h2>
            <div className="space-y-3">
              <MealCard mealType="Breakfast" meal={todayMeals?.breakfast} />
              <MealCard mealType="Lunch" meal={todayMeals?.lunch} />
              <MealCard mealType="Dinner" meal={todayMeals?.dinner} />
            </div>

            {/* Daily totals */}
            {dailyTotals.calories > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <p className="text-sm font-medium text-gray-500 mb-2">Daily Totals (per person)</p>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div>
                    <p className="text-lg font-bold text-gray-900">{dailyTotals.calories}</p>
                    <p className="text-xs text-gray-500">Calories</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{dailyTotals.protein}g</p>
                    <p className="text-xs text-gray-500">Protein</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-amber-600">{dailyTotals.carbs}g</p>
                    <p className="text-xs text-gray-500">Carbs</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-red-600">{dailyTotals.fat}g</p>
                    <p className="text-xs text-gray-500">Fat</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
    </ProtectedRoute>
  );
}

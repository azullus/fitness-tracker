'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format, startOfWeek, addDays } from 'date-fns';
import { ShoppingCart, Flame, BookOpen, RefreshCw } from 'lucide-react';
import MealCard from '@/components/MealCard';
import ProtectedRoute from '@/components/ProtectedRoute';
import { cn } from '@/lib/utils';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function MealsPage() {
  const today = new Date();
  const [selectedDay, setSelectedDay] = useState(daysOfWeek[today.getDay()]);
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const [mealsData, setMealsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentDate = new Date();
    const todayStr = format(currentDate, 'yyyy-MM-dd');
    fetch(`/api/meals?date=${todayStr}`)
      .then(res => res.json())
      .then(data => {
        setMealsData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading meals:', err);
        setLoading(false);
      });
  }, []);

  // Find meals for selected day
  const selectedDate = format(addDays(weekStart, daysOfWeek.indexOf(selectedDay)), 'yyyy-MM-dd');
  const dayMeals = mealsData.find(d => d.date === selectedDate) || {
    breakfast: null,
    lunch: null,
    dinner: null,
    snacks: [],
  };

  // Calculate daily totals
  const dailyTotals = {
    calories: (dayMeals.breakfast?.recipe?.calories || 0) +
              (dayMeals.lunch?.recipe?.calories || 0) +
              (dayMeals.dinner?.recipe?.calories || 0),
    protein: (dayMeals.breakfast?.recipe?.protein_g || 0) +
             (dayMeals.lunch?.recipe?.protein_g || 0) +
             (dayMeals.dinner?.recipe?.protein_g || 0),
    carbs: (dayMeals.breakfast?.recipe?.carbs_g || 0) +
           (dayMeals.lunch?.recipe?.carbs_g || 0) +
           (dayMeals.dinner?.recipe?.carbs_g || 0),
    fat: (dayMeals.breakfast?.recipe?.fat_g || 0) +
         (dayMeals.lunch?.recipe?.fat_g || 0) +
         (dayMeals.dinner?.recipe?.fat_g || 0),
    fiber: (dayMeals.breakfast?.recipe?.fiber_g || 0) +
           (dayMeals.lunch?.recipe?.fiber_g || 0) +
           (dayMeals.dinner?.recipe?.fiber_g || 0),
  };

  return (
    <ProtectedRoute>
    <div className="px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
        <div className="flex gap-2">
          <Link href="/recipes" className="btn-secondary btn-sm flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            Recipes
          </Link>
          <button className="btn-secondary btn-sm flex items-center gap-1">
            <ShoppingCart className="w-4 h-4" />
            Grocery
          </button>
        </div>
      </div>

      {/* Week day selector */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 -mx-4 px-4">
        {daysOfWeek.map((day, index) => {
          const date = addDays(weekStart, index);
          const isToday = format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={cn(
                'flex flex-col items-center min-w-[3.5rem] py-2 px-3 rounded-xl transition-colors',
                selectedDay === day
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              <span className="text-xs font-medium">{day.slice(0, 3)}</span>
              <span className={cn(
                'text-lg font-bold',
                isToday && 'underline underline-offset-2'
              )}>
                {format(date, 'd')}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          Loading meals...
        </div>
      ) : (
        <>
          {/* Daily totals summary */}
          <div className="card mb-6 bg-gradient-to-r from-primary-50 to-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <Flame className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-gray-900">{selectedDay} Nutrition</span>
              <span className="text-sm text-gray-500">(per person)</span>
            </div>
            {dailyTotals.calories > 0 ? (
              <>
                <div className="grid grid-cols-5 gap-2 text-center">
                  <div>
                    <p className="text-xl font-bold text-gray-900">{dailyTotals.calories}</p>
                    <p className="text-xs text-gray-500">Calories</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-blue-600">{dailyTotals.protein}g</p>
                    <p className="text-xs text-gray-500">Protein</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-amber-600">{dailyTotals.carbs}g</p>
                    <p className="text-xs text-gray-500">Carbs</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-red-500">{dailyTotals.fat}g</p>
                    <p className="text-xs text-gray-500">Fat</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-green-600">{dailyTotals.fiber}g</p>
                    <p className="text-xs text-gray-500">Fiber</p>
                  </div>
                </div>

                {/* Protein target indicator */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Protein Target</span>
                    <span>{dailyTotals.protein}/160g</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill bg-blue-500"
                      style={{ width: `${Math.min((dailyTotals.protein / 160) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </>
            ) : (
              <p className="text-center text-gray-500 py-4">No meals planned for this day</p>
            )}
          </div>

          {/* Meals list */}
          <div className="space-y-3">
            <MealCard mealType="Breakfast" meal={dayMeals.breakfast} />
            <MealCard mealType="Lunch" meal={dayMeals.lunch} />
            <MealCard mealType="Dinner" meal={dayMeals.dinner} />
            <MealCard mealType="Snack" meal={dayMeals.snacks?.[0]} />
          </div>

          {/* Weekly protein overview */}
          <div className="mt-6 card">
            <h3 className="font-semibold text-gray-900 mb-3">Weekly Protein Overview</h3>
            <div className="space-y-2">
              {daysOfWeek.map((day, index) => {
                const dateStr = format(addDays(weekStart, index), 'yyyy-MM-dd');
                const meals = mealsData.find(d => d.date === dateStr);
                const protein = meals ?
                  (meals.breakfast?.recipe?.protein_g || 0) +
                  (meals.lunch?.recipe?.protein_g || 0) +
                  (meals.dinner?.recipe?.protein_g || 0) : 0;
                const isSelected = day === selectedDay;

                return (
                  <div key={day} className="flex items-center gap-3">
                    <span className={cn(
                      'text-sm w-12',
                      isSelected ? 'font-semibold text-primary-600' : 'text-gray-500'
                    )}>
                      {day.slice(0, 3)}
                    </span>
                    <div className="flex-1 progress-bar">
                      <div
                        className={cn(
                          'progress-bar-fill',
                          protein >= 140 ? 'bg-green-500' : protein >= 100 ? 'bg-amber-500' : 'bg-red-400'
                        )}
                        style={{ width: `${Math.min((protein / 160) * 100, 100)}%` }}
                      />
                    </div>
                    <span className={cn(
                      'text-sm font-medium w-12 text-right',
                      protein >= 140 ? 'text-green-600' : protein >= 100 ? 'text-amber-600' : 'text-red-500'
                    )}>
                      {protein}g
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
    </ProtectedRoute>
  );
}

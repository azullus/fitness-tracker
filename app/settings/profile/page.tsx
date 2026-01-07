'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePerson } from '@/components/providers/PersonProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Header from '@/components/navigation/Header';
import { calculateBMI, calculateDailyCalories } from '@/lib/recipe-utils';
import { csrfFetch } from '@/lib/csrf-client';
import {
  User,
  Save,
  AlertCircle,
  CheckCircle,
  Ruler,
  Calendar,
  Target,
  Dumbbell,
  Flame,
} from 'lucide-react';

interface ProfileFormData {
  age: string;
  heightFeet: string;
  heightInches: string;
  weight: string;
  training_focus: 'powerlifting' | 'cardio' | 'mixed';
  workoutDaysPerWeek: number;
  dailyCalorieTarget: string;
}

interface FormErrors {
  age?: string;
  heightFeet?: string;
  weight?: string;
  dailyCalorieTarget?: string;
}

const trainingFocusOptions = [
  {
    value: 'powerlifting' as const,
    label: 'Powerlifting',
    description: 'Strength & muscle building',
    icon: Dumbbell,
  },
  {
    value: 'cardio' as const,
    label: 'Cardio',
    description: 'Endurance & heart health',
    icon: Flame,
  },
  {
    value: 'mixed' as const,
    label: 'Mixed',
    description: 'Balanced training',
    icon: Target,
  },
];

const workoutDaysOptions = [
  { value: 3, label: '3', description: 'Light' },
  { value: 4, label: '4', description: 'Moderate' },
  { value: 5, label: '5', description: 'Active' },
  { value: 6, label: '6', description: 'Intensive' },
  { value: 7, label: '7', description: 'Daily' },
];

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { currentPerson, updatePerson, isDemoMode, showDemoModeAlert } = usePerson();
  useAuth(); // Initialize auth context

  const [formData, setFormData] = useState<ProfileFormData>({
    age: '',
    heightFeet: '',
    heightInches: '',
    weight: '',
    training_focus: 'mixed',
    workoutDaysPerWeek: 4,
    dailyCalorieTarget: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Convert cm to feet/inches
  const convertCmToFeetInches = useCallback((cm: number): { feet: number; inches: number } => {
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  }, []);

  // Convert feet/inches to cm
  const convertFeetInchesToCm = useCallback((feet: string, inches: string): number => {
    const ft = parseInt(feet) || 0;
    const inch = parseInt(inches) || 0;
    return Math.round((ft * 12 + inch) * 2.54);
  }, []);

  // Load current person data into form
  useEffect(() => {
    if (currentPerson) {
      const { feet, inches } = convertCmToFeetInches(currentPerson.height);
      setFormData({
        age: currentPerson.age.toString(),
        heightFeet: feet.toString(),
        heightInches: inches.toString(),
        weight: currentPerson.weight.toString(),
        training_focus: currentPerson.training_focus,
        workoutDaysPerWeek: currentPerson.workoutDaysPerWeek,
        dailyCalorieTarget: currentPerson.dailyCalorieTarget.toString(),
      });
      setIsLoading(false);
    }
  }, [currentPerson, convertCmToFeetInches]);

  // Track form changes
  useEffect(() => {
    if (!currentPerson) return;

    const { feet, inches } = convertCmToFeetInches(currentPerson.height);
    const hasFormChanges =
      formData.age !== currentPerson.age.toString() ||
      formData.heightFeet !== feet.toString() ||
      formData.heightInches !== inches.toString() ||
      formData.weight !== currentPerson.weight.toString() ||
      formData.training_focus !== currentPerson.training_focus ||
      formData.workoutDaysPerWeek !== currentPerson.workoutDaysPerWeek ||
      formData.dailyCalorieTarget !== currentPerson.dailyCalorieTarget.toString();

    setHasChanges(hasFormChanges);
  }, [formData, currentPerson, convertCmToFeetInches]);

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    const age = Number(formData.age);
    if (!formData.age || isNaN(age) || age < 13 || age > 120) {
      newErrors.age = 'Valid age required (13-120)';
    }

    const heightFeet = Number(formData.heightFeet);
    if (!formData.heightFeet || isNaN(heightFeet) || heightFeet < 3 || heightFeet > 8) {
      newErrors.heightFeet = 'Valid height required (3-8 feet)';
    }

    const weight = Number(formData.weight);
    if (!formData.weight || isNaN(weight) || weight < 50 || weight > 700) {
      newErrors.weight = 'Valid weight required (50-700 lbs)';
    }

    const dailyCalorieTarget = Number(formData.dailyCalorieTarget);
    if (!formData.dailyCalorieTarget || isNaN(dailyCalorieTarget) || dailyCalorieTarget < 1000 || dailyCalorieTarget > 10000) {
      newErrors.dailyCalorieTarget = 'Valid calorie target required (1000-10000)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculate recommended calories based on current form data
  const calculateRecommendedCalories = useCallback((): number => {
    if (!currentPerson) return 2000;

    const heightCm = convertFeetInchesToCm(formData.heightFeet, formData.heightInches);
    const weight = parseFloat(formData.weight) || currentPerson.weight;
    const age = parseInt(formData.age) || currentPerson.age;

    return calculateDailyCalories(currentPerson.gender, age, heightCm, weight, 'moderate');
  }, [currentPerson, formData.heightFeet, formData.heightInches, formData.weight, formData.age, convertFeetInchesToCm]);

  // Handle form field changes
  const handleChange = (field: keyof ProfileFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    setError(null);
    setSuccess(null);
  };

  // Set recommended calorie target
  const handleSetRecommendedCalories = () => {
    const recommended = calculateRecommendedCalories();
    handleChange('dailyCalorieTarget', recommended.toString());
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isDemoMode) {
      showDemoModeAlert();
      return;
    }

    if (!validateForm()) {
      return;
    }

    if (!currentPerson) {
      setError('No profile found. Please complete onboarding first.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const heightCm = convertFeetInchesToCm(formData.heightFeet, formData.heightInches);
      const weightLbs = parseFloat(formData.weight);
      const age = parseInt(formData.age);
      const bmi = calculateBMI(heightCm, weightLbs);
      const dailyCalorieTarget = parseInt(formData.dailyCalorieTarget);

      const updates = {
        age,
        height: heightCm,
        weight: weightLbs,
        bmi,
        dailyCalorieTarget,
        daily_calorie_target: dailyCalorieTarget, // For Supabase snake_case
        training_focus: formData.training_focus,
        workoutDaysPerWeek: formData.workoutDaysPerWeek,
        workout_days_per_week: formData.workoutDaysPerWeek, // For Supabase snake_case
      };

      // Call API to update person
      const response = await csrfFetch(`/api/persons?id=${currentPerson.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      // Update local state
      updatePerson(currentPerson.id, updates);

      setSuccess('Profile updated successfully!');
      setHasChanges(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !currentPerson) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const recommendedCalories = calculateRecommendedCalories();
  const currentCalories = parseInt(formData.dailyCalorieTarget) || 0;
  const caloriesDiff = currentCalories - recommendedCalories;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header title="Edit Profile" showPersonToggle={false} showGreeting={false} />

      <form onSubmit={handleSubmit} className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Status messages */}
        {error && (
          <div
            className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm"
            role="status"
            aria-live="polite"
          >
            <CheckCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {currentPerson.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentPerson.gender === 'male' ? 'Male' : 'Female'}
              </p>
            </div>
          </div>
        </div>

        {/* Physical Stats Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Ruler className="w-5 h-5" aria-hidden="true" />
            Physical Stats
          </h3>

          {/* Age */}
          <Input
            label="Age"
            type="number"
            value={formData.age}
            onChange={(e) => handleChange('age', e.target.value)}
            error={errors.age}
            min={13}
            max={120}
            aria-describedby={errors.age ? 'age-error' : undefined}
          />

          {/* Height */}
          <div>
            <label
              id="height-label"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Height
            </label>
            <div className="flex gap-2" role="group" aria-labelledby="height-label">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    value={formData.heightFeet}
                    onChange={(e) => handleChange('heightFeet', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 shadow-sm hover:shadow focus:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-0 ${
                      errors.heightFeet
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:border-emerald-500 focus:ring-emerald-500/30'
                    }`}
                    placeholder="Feet"
                    min={3}
                    max={8}
                    aria-label="Height in feet"
                    aria-invalid={!!errors.heightFeet}
                  />
                  <span className="absolute right-3 top-2 text-gray-400" aria-hidden="true">
                    ft
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="number"
                    value={formData.heightInches}
                    onChange={(e) => handleChange('heightInches', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 shadow-sm hover:shadow focus:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-0 focus:border-emerald-500 focus:ring-emerald-500/30"
                    placeholder="Inches"
                    min={0}
                    max={11}
                    aria-label="Height in inches"
                  />
                  <span className="absolute right-3 top-2 text-gray-400" aria-hidden="true">
                    in
                  </span>
                </div>
              </div>
            </div>
            {errors.heightFeet && (
              <p className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
                {errors.heightFeet}
              </p>
            )}
          </div>

          {/* Weight */}
          <div>
            <Input
              label="Weight (lbs)"
              type="number"
              value={formData.weight}
              onChange={(e) => handleChange('weight', e.target.value)}
              error={errors.weight}
              min={50}
              max={700}
              aria-describedby={errors.weight ? 'weight-error' : undefined}
            />
            {currentPerson && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Current BMI: {calculateBMI(convertFeetInchesToCm(formData.heightFeet, formData.heightInches), parseFloat(formData.weight) || 0).toFixed(1)}
              </p>
            )}
          </div>
        </div>

        {/* Training Focus Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5" aria-hidden="true" />
            Training Focus
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Training focus">
            {trainingFocusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = formData.training_focus === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleChange('training_focus', option.value)}
                  className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                >
                  <Icon
                    className={`w-6 h-6 mb-2 ${
                      isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`font-medium ${
                      isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{option.description}</span>
                </button>
              );
            })}
          </div>

          {/* Workout Days Per Week */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workout Days Per Week
            </label>
            <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Workout days per week">
              {workoutDaysOptions.map((option) => {
                const isSelected = formData.workoutDaysPerWeek === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleChange('workoutDaysPerWeek', option.value)}
                    className={`py-3 px-2 rounded-lg border-2 text-center transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
                    }`}
                    role="radio"
                    aria-checked={isSelected}
                  >
                    <div className="text-lg font-bold">{option.label}</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">{option.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Nutrition Targets Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5" aria-hidden="true" />
            Nutrition Targets
          </h3>

          <div>
            <Input
              label="Daily Calorie Target"
              type="number"
              value={formData.dailyCalorieTarget}
              onChange={(e) => handleChange('dailyCalorieTarget', e.target.value)}
              error={errors.dailyCalorieTarget}
              min={1000}
              max={10000}
              helperText={
                caloriesDiff !== 0
                  ? `${Math.abs(caloriesDiff)} ${caloriesDiff > 0 ? 'above' : 'below'} recommended`
                  : 'Matches recommended'
              }
              aria-describedby={errors.dailyCalorieTarget ? 'calories-error' : 'calories-helper'}
            />
            <div className="mt-2 flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSetRecommendedCalories}
              >
                Use Recommended ({recommendedCalories})
              </Button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={isSaving}
            disabled={!hasChanges || isDemoMode}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" aria-hidden="true" />
            Save Changes
          </Button>
        </div>

        {isDemoMode && (
          <p className="text-center text-sm text-amber-600 dark:text-amber-400">
            Profile editing is disabled in demo mode. Sign up to save your data.
          </p>
        )}
      </form>
    </div>
  );
}

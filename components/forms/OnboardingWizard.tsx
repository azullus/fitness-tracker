'use client';

import React, { useState } from 'react';
import { Users, ArrowRight, ArrowLeft, Check, Dumbbell, Heart, Flame, Target } from 'lucide-react';
import { calculateBMI, calculateDailyCalories } from '@/lib/recipe-utils';
import { captureException } from '@/lib/error-monitoring';
import type { Person } from '@/lib/types';

interface OnboardingWizardProps {
  onComplete: (persons: Omit<Person, 'id' | 'created_at'>[]) => Promise<void>;
  onCancel?: () => void;
  /** When true, only collects data for a single person (for adding new household members) */
  singlePersonMode?: boolean;
  /** Title to show at the top of the wizard when in single person mode */
  singlePersonTitle?: string;
}

// Fitness goal type for more specific user preferences
export type FitnessGoal = 'muscle_building' | 'weight_loss' | 'cardio' | 'mixed';

interface PersonFormData {
  name: string;
  gender: 'male' | 'female';
  age: string;
  heightFeet: string;
  heightInches: string;
  weight: string;
  training_focus: 'powerlifting' | 'cardio' | 'mixed' | 'weight_loss';
  fitness_goal: FitnessGoal;
  workoutDaysPerWeek: number;
}

const initialPersonData: PersonFormData = {
  name: '',
  gender: 'male',
  age: '',
  heightFeet: '',
  heightInches: '',
  weight: '',
  training_focus: 'mixed',
  fitness_goal: 'mixed',
  workoutDaysPerWeek: 4,
};

// Workout days options (3-7 days per week)
const workoutDaysOptions = [
  { value: 3, label: '3 days', description: 'Light schedule' },
  { value: 4, label: '4 days', description: 'Moderate' },
  { value: 5, label: '5 days', description: 'Active' },
  { value: 6, label: '6 days', description: 'Intensive' },
  { value: 7, label: '7 days', description: 'Every day' },
];

// Fitness goal configurations with icons and descriptions
const fitnessGoalOptions: { value: FitnessGoal; label: string; description: string; icon: React.ReactNode; trainingFocus: 'powerlifting' | 'cardio' | 'mixed' | 'weight_loss' }[] = [
  {
    value: 'muscle_building',
    label: 'Build Muscle',
    description: 'Gain strength and muscle mass',
    icon: <Dumbbell className="h-6 w-6" />,
    trainingFocus: 'powerlifting',
  },
  {
    value: 'weight_loss',
    label: 'Lose Weight',
    description: 'Burn fat and get lean',
    icon: <Flame className="h-6 w-6" />,
    trainingFocus: 'weight_loss',
  },
  {
    value: 'cardio',
    label: 'Cardio Focus',
    description: 'Improve endurance and heart health',
    icon: <Heart className="h-6 w-6" />,
    trainingFocus: 'cardio',
  },
  {
    value: 'mixed',
    label: 'Overall Fitness',
    description: 'Balanced strength and cardio',
    icon: <Target className="h-6 w-6" />,
    trainingFocus: 'mixed',
  },
];

type WizardStep = 'fitness_goal' | 'first_person' | 'household_size' | 'additional_persons' | 'review';

export function OnboardingWizard({
  onComplete,
  onCancel,
  singlePersonMode = false,
  singlePersonTitle = 'Add New Member'
}: OnboardingWizardProps) {
  // In single person mode, start directly with fitness goal selection
  const [step, setStep] = useState<WizardStep>('fitness_goal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firstPerson, setFirstPerson] = useState<PersonFormData>(initialPersonData);
  const [householdSize, setHouseholdSize] = useState<number>(1);
  const [additionalPersons, setAdditionalPersons] = useState<PersonFormData[]>([]);
  const [currentPersonIndex, setCurrentPersonIndex] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validatePerson = (person: PersonFormData): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!person.name.trim()) errs.name = 'Name is required';

    // Use Number() for proper NaN handling - parseInt can return NaN which fails comparison checks
    const age = Number(person.age);
    if (!person.age || isNaN(age) || age < 1 || age > 120) {
      errs.age = 'Valid age required (1-120)';
    }

    const heightFeet = Number(person.heightFeet);
    if (!person.heightFeet || isNaN(heightFeet) || heightFeet < 3 || heightFeet > 8) {
      errs.heightFeet = 'Valid height required (3-8 feet)';
    }

    const weight = Number(person.weight);
    if (!person.weight || isNaN(weight) || weight < 50 || weight > 500) {
      errs.weight = 'Valid weight required (50-500 lbs)';
    }
    return errs;
  };

  const convertToCm = (feet: string, inches: string): number => {
    const ft = parseInt(feet) || 0;
    const inch = parseInt(inches) || 0;
    return Math.round((ft * 12 + inch) * 2.54);
  };

  const formatPersonForSubmit = (data: PersonFormData): Omit<Person, 'id' | 'created_at'> => {
    const heightCm = convertToCm(data.heightFeet, data.heightInches);
    const weightLbs = parseFloat(data.weight);
    const age = parseInt(data.age);
    const bmi = calculateBMI(heightCm, weightLbs);
    const dailyCalorieTarget = calculateDailyCalories(data.gender, age, heightCm, weightLbs);

    return {
      name: data.name,
      gender: data.gender,
      age,
      height: heightCm,
      weight: weightLbs,
      bmi,
      dailyCalorieTarget,
      training_focus: data.training_focus,
      workoutDaysPerWeek: data.workoutDaysPerWeek,
      householdId: 'household-default',
    };
  };

  const handleFirstPersonSubmit = () => {
    const errs = validatePerson(firstPerson);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    // In single person mode, go directly to review (skip household size selection)
    if (singlePersonMode) {
      setStep('review');
    } else {
      setStep('household_size');
    }
  };

  const handleHouseholdSizeSelect = (size: number) => {
    setHouseholdSize(size);
    if (size === 1) {
      // Single person household, go to review
      setStep('review');
    } else {
      // Initialize additional persons
      setAdditionalPersons(
        Array.from({ length: size - 1 }, () => ({ ...initialPersonData }))
      );
      setCurrentPersonIndex(0);
      setStep('additional_persons');
    }
  };

  const handleAdditionalPersonSubmit = () => {
    const currentPerson = additionalPersons[currentPersonIndex];
    const errs = validatePerson(currentPerson);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});

    if (currentPersonIndex < additionalPersons.length - 1) {
      setCurrentPersonIndex(currentPersonIndex + 1);
    } else {
      setStep('review');
    }
  };

  const updateAdditionalPerson = (field: keyof PersonFormData, value: string | number) => {
    const updated = [...additionalPersons];
    updated[currentPersonIndex] = { ...updated[currentPersonIndex], [field]: value };
    setAdditionalPersons(updated);
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      // In single person mode, only submit the first person
      const allPersons = singlePersonMode
        ? [formatPersonForSubmit(firstPerson)]
        : [formatPersonForSubmit(firstPerson), ...additionalPersons.map(formatPersonForSubmit)];
      await onComplete(allPersons);
    } catch (error) {
      // Error is handled in PersonProvider with toast
      captureException(error instanceof Error ? error : new Error(String(error)), {
        component: 'OnboardingWizard',
        action: 'completeOnboarding',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderPersonForm = (
    person: PersonFormData,
    onChange: (field: keyof PersonFormData, value: string | number) => void,
    title: string
  ) => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>

      <div>
        <label htmlFor="person-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
        <input
          id="person-name"
          type="text"
          value={person.name}
          onChange={(e) => onChange('name', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Enter name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'person-name-error' : undefined}
        />
        {errors.name && <p id="person-name-error" className="text-red-500 text-sm mt-1" role="alert">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender</label>
        <div className="flex gap-4">
          {(['male', 'female'] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange('gender', g)}
              className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                person.gender === g
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="person-age" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
        <input
          id="person-age"
          type="number"
          value={person.age}
          onChange={(e) => onChange('age', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Age in years"
          min="1"
          max="120"
          aria-invalid={!!errors.age}
          aria-describedby={errors.age ? 'person-age-error' : undefined}
        />
        {errors.age && <p id="person-age-error" className="text-red-500 text-sm mt-1" role="alert">{errors.age}</p>}
      </div>

      <div>
        <label id="height-label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height</label>
        <div className="flex gap-2" role="group" aria-labelledby="height-label">
          <div className="flex-1">
            <div className="relative">
              <input
                id="person-height-feet"
                type="number"
                value={person.heightFeet}
                onChange={(e) => onChange('heightFeet', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Feet"
                min="3"
                max="8"
                aria-label="Height in feet"
                aria-invalid={!!errors.heightFeet}
              />
              <span className="absolute right-3 top-2 text-gray-400" aria-hidden="true">ft</span>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative">
              <input
                id="person-height-inches"
                type="number"
                value={person.heightInches}
                onChange={(e) => onChange('heightInches', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                placeholder="Inches"
                min="0"
                max="11"
                aria-label="Height in inches"
              />
              <span className="absolute right-3 top-2 text-gray-400" aria-hidden="true">in</span>
            </div>
          </div>
        </div>
        {errors.heightFeet && <p id="person-height-error" className="text-red-500 text-sm mt-1" role="alert">{errors.heightFeet}</p>}
      </div>

      <div>
        <label htmlFor="person-weight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Weight (lbs)</label>
        <input
          id="person-weight"
          type="number"
          value={person.weight}
          onChange={(e) => onChange('weight', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Weight in pounds"
          min="50"
          max="500"
          aria-invalid={!!errors.weight}
          aria-describedby={errors.weight ? 'person-weight-error' : undefined}
        />
        {errors.weight && <p id="person-weight-error" className="text-red-500 text-sm mt-1" role="alert">{errors.weight}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Training Focus</label>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: 'powerlifting', label: 'Powerlifting' },
            { value: 'weight_loss', label: 'Weight Loss' },
            { value: 'cardio', label: 'Cardio' },
            { value: 'mixed', label: 'Mixed' },
          ] as const).map((focus) => (
            <button
              key={focus.value}
              type="button"
              onClick={() => onChange('training_focus', focus.value)}
              className={`py-2 px-3 rounded-lg border-2 text-sm transition-colors ${
                person.training_focus === focus.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              {focus.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Workout Days Per Week
        </label>
        <div className="grid grid-cols-5 gap-2">
          {workoutDaysOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange('workoutDaysPerWeek', option.value)}
              className={`py-3 px-2 rounded-lg border-2 text-center transition-colors ${
                person.workoutDaysPerWeek === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-900 dark:text-white'
              }`}
            >
              <div className="text-lg font-bold">{option.value}</div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400">{option.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFitnessGoalStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Target className="h-12 w-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {singlePersonMode ? singlePersonTitle : "What's Your Goal?"}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {singlePersonMode ? "Select their primary fitness goal" : "Choose your primary fitness objective"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {fitnessGoalOptions.map((goal) => (
          <button
            key={goal.value}
            onClick={() => {
              setFirstPerson({
                ...firstPerson,
                fitness_goal: goal.value,
                training_focus: goal.trainingFocus,
              });
            }}
            className={`flex items-center gap-4 p-4 border-2 rounded-xl transition-all ${
              firstPerson.fitness_goal === goal.value
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className={`p-3 rounded-full ${
              firstPerson.fitness_goal === goal.value
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
            }`}>
              {goal.icon}
            </div>
            <div className="text-left">
              <div className={`font-semibold ${
                firstPerson.fitness_goal === goal.value
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-gray-900 dark:text-white'
              }`}>
                {goal.label}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{goal.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderHouseholdSizeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 text-blue-500 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Household Size</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">How many people are in your household?</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((size) => (
          <button
            key={size}
            onClick={() => handleHouseholdSizeSelect(size)}
            className="py-4 px-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{size}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {size === 1 ? 'person' : 'people'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderReviewStep = () => {
    const allPersons = singlePersonMode ? [firstPerson] : [firstPerson, ...additionalPersons];
    const goalLabel = fitnessGoalOptions.find(g => g.value === firstPerson.fitness_goal)?.label || 'Overall Fitness';

    return (
      <div className="space-y-6">
        <div className="text-center">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review & Confirm</h2>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {singlePersonMode ? "Ready to add this member!" : "Your household is ready!"}
          </p>
        </div>

        {/* Fitness Goal Summary */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 text-center">
          <p className="text-sm text-blue-600 dark:text-blue-300">Primary Goal</p>
          <p className="font-semibold text-blue-800 dark:text-blue-200">{goalLabel}</p>
        </div>

        <div className="space-y-3">
          {allPersons.map((person, index) => {
            const heightCm = convertToCm(person.heightFeet, person.heightInches);
            const bmi = calculateBMI(heightCm, parseFloat(person.weight) || 0);
            const calories = calculateDailyCalories(
              person.gender,
              parseInt(person.age) || 25,
              heightCm,
              parseFloat(person.weight) || 150
            );

            return (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{person.name || 'Person ' + (index + 1)}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {person.gender === 'male' ? 'Male' : 'Female'}, {person.age} years
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      BMI: {bmi.toFixed(1)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {calories} cal/day
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                    {person.heightFeet}&apos;{person.heightInches || 0}&quot;
                  </span>
                  <span className="px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                    {person.weight} lbs
                  </span>
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                    {person.training_focus}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // In single person mode, only show 3 steps: fitness_goal, first_person, review
  const steps: WizardStep[] = singlePersonMode
    ? ['fitness_goal', 'first_person', 'review']
    : ['fitness_goal', 'first_person', 'household_size', 'additional_persons', 'review'];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Solid blurred background - completely blocks app content */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        {/* Decorative blurred shapes */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
      </div>

      {/* Content card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20">
        <div className="p-6">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((s, i) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  currentStepIndex >= i
                    ? 'w-8 bg-blue-500'
                    : 'w-2 bg-gray-200 dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          {step === 'fitness_goal' && renderFitnessGoalStep()}

          {step === 'first_person' && renderPersonForm(
            firstPerson,
            (field, value) => setFirstPerson({ ...firstPerson, [field]: value }),
            "Tell us about yourself"
          )}

          {step === 'household_size' && renderHouseholdSizeStep()}

          {step === 'additional_persons' && renderPersonForm(
            additionalPersons[currentPersonIndex],
            updateAdditionalPerson,
            `Person ${currentPersonIndex + 2} of ${householdSize}`
          )}

          {step === 'review' && renderReviewStep()}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step !== 'fitness_goal' && (
              <button
                onClick={() => {
                  if (step === 'first_person') setStep('fitness_goal');
                  else if (step === 'household_size') setStep('first_person');
                  else if (step === 'additional_persons' && currentPersonIndex > 0) {
                    setCurrentPersonIndex(currentPersonIndex - 1);
                  } else if (step === 'additional_persons') setStep('household_size');
                  else if (step === 'review') {
                    // In single person mode, go back to first_person
                    if (singlePersonMode) {
                      setStep('first_person');
                    } else if (householdSize > 1) {
                      setCurrentPersonIndex(additionalPersons.length - 1);
                      setStep('additional_persons');
                    } else {
                      setStep('household_size');
                    }
                  }
                }}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}

            {step === 'fitness_goal' && (
              <button
                onClick={() => setStep('first_person')}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === 'first_person' && (
              <button
                onClick={handleFirstPersonSubmit}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === 'additional_persons' && (
              <button
                onClick={handleAdditionalPersonSubmit}
                className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
              >
                {currentPersonIndex < additionalPersons.length - 1 ? 'Next Person' : 'Review'}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {step === 'review' && (
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    {singlePersonMode ? 'Add Member' : 'Complete Setup'}
                  </>
                )}
              </button>
            )}
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="w-full mt-3 py-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 text-sm"
            >
              {singlePersonMode ? 'Cancel' : 'Skip for now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default OnboardingWizard;

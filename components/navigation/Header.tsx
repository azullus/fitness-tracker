'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { Activity, Dumbbell, Flame, ChevronDown, Check, Calendar, LogOut, Settings, User, Users } from 'lucide-react';
import { usePerson } from '@/components/providers/PersonProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { ColorThemePicker } from '@/components/ui/ColorThemePicker';
import { calculateDailyCalories } from '@/lib/recipe-utils';
import type { Person } from '@/lib/types';

interface HeaderProps {
  title: string;
  showPersonToggle?: boolean;
  showGreeting?: boolean;
}

const trainingFocusLabels: Record<Person['training_focus'], string> = {
  powerlifting: 'Powerlifting',
  cardio: 'Cardio & Mobility',
  mixed: 'Mixed Training',
};

const trainingFocusIcons: Record<Person['training_focus'], typeof Dumbbell> = {
  powerlifting: Dumbbell,
  cardio: Activity,
  mixed: Flame,
};

// Map training focus to activity level for calorie calculation
const trainingFocusActivityLevel: Record<Person['training_focus'], 'moderate' | 'active' | 'very_active'> = {
  cardio: 'active',
  mixed: 'active',
  powerlifting: 'very_active',
};

const trainingFocusOptions: { value: Person['training_focus']; label: string; description: string }[] = [
  { value: 'powerlifting', label: 'Powerlifting', description: 'Strength training, heavy compounds' },
  { value: 'cardio', label: 'Cardio & Mobility', description: 'HIIT, running, yoga, flexibility' },
  { value: 'mixed', label: 'Mixed Training', description: 'Balanced strength and cardio' },
];

const workoutDaysOptions = [
  { value: 3, label: '3 days', description: 'Light schedule' },
  { value: 4, label: '4 days', description: 'Moderate' },
  { value: 5, label: '5 days', description: 'Active' },
  { value: 6, label: '6 days', description: 'Intensive' },
  { value: 7, label: '7 days', description: 'Every day' },
];

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Header({ title, showPersonToggle = true, showGreeting = true }: HeaderProps) {
  const router = useRouter();
  const { currentPerson, setCurrentPerson, householdMembers, updatePerson } = usePerson();
  const { user, isAuthenticated, isAuthEnabled, signOut, profile } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [trainingFocusOpen, setTrainingFocusOpen] = useState(false);
  const [workoutDaysOpen, setWorkoutDaysOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const iconRef = useRef<HTMLButtonElement>(null);
  const trainingFocusRef = useRef<HTMLButtonElement>(null);
  const trainingDropdownRef = useRef<HTMLDivElement>(null);
  const workoutDaysRef = useRef<HTMLButtonElement>(null);
  const workoutDaysDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLButtonElement>(null);
  const userMenuDropdownRef = useRef<HTMLDivElement>(null);

  // Handle logout
  const handleLogout = async () => {
    await signOut();
    // Clear localStorage cache
    localStorage.removeItem('fitness-tracker-person');
    localStorage.removeItem('fitness-tracker-household');
    localStorage.removeItem('fitness-tracker-persons');
    localStorage.removeItem('fitness-tracker-onboarding-complete');
    setUserMenuOpen(false);
    router.push('/auth/login');
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close training focus dropdown on click outside
  useEffect(() => {
    if (!trainingFocusOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        trainingDropdownRef.current &&
        !trainingDropdownRef.current.contains(event.target as Node) &&
        trainingFocusRef.current &&
        !trainingFocusRef.current.contains(event.target as Node)
      ) {
        setTrainingFocusOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setTrainingFocusOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [trainingFocusOpen]);

  // Close workout days dropdown on click outside
  useEffect(() => {
    if (!workoutDaysOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        workoutDaysDropdownRef.current &&
        !workoutDaysDropdownRef.current.contains(event.target as Node) &&
        workoutDaysRef.current &&
        !workoutDaysRef.current.contains(event.target as Node)
      ) {
        setWorkoutDaysOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setWorkoutDaysOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [workoutDaysOpen]);

  // Close user menu dropdown on click outside
  useEffect(() => {
    if (!userMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuDropdownRef.current &&
        !userMenuDropdownRef.current.contains(event.target as Node) &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [userMenuOpen]);

  // Handle training focus change
  const handleTrainingFocusChange = (newFocus: Person['training_focus']) => {
    if (!currentPerson) return;

    // Recalculate daily calories based on new training focus
    const activityLevel = trainingFocusActivityLevel[newFocus];
    const newCalories = calculateDailyCalories(
      currentPerson.gender,
      currentPerson.age,
      currentPerson.height,
      currentPerson.weight,
      activityLevel
    );

    // Update person with new training focus and recalculated calories
    updatePerson(currentPerson.id, {
      training_focus: newFocus,
      dailyCalorieTarget: newCalories,
    });

    setTrainingFocusOpen(false);
  };

  // Handle workout days change
  const handleWorkoutDaysChange = (newDays: number) => {
    if (!currentPerson) return;
    updatePerson(currentPerson.id, { workoutDaysPerWeek: newDays });
    setWorkoutDaysOpen(false);
  };

  // Check if Supabase is configured (for connection indicator)
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const greeting = useMemo(() => getTimeOfDayGreeting(), []);
  const TrainingIcon = currentPerson ? trainingFocusIcons[currentPerson.training_focus] : Activity;

  return (
    <header className="sticky top-0 z-10 relative">
      {/* Color Theme Picker Dropdown - positioned at header level to avoid clipping */}
      <ColorThemePicker
        isOpen={colorPickerOpen}
        onClose={() => setColorPickerOpen(false)}
        anchorRef={iconRef}
      />

      {/* Gradient background with pattern overlay - uses CSS variables for dynamic theming */}
      <div
        className="relative"
        style={{
          background: `linear-gradient(to right, rgb(var(--theme-primary-from)), rgb(var(--theme-primary-via)), rgb(var(--theme-primary-to)))`,
        }}
      >
        {/* Decorative pattern overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />

        <div className="relative px-4 py-3">
          {/* Top row: Greeting/Title and controls */}
          <div className="flex items-start justify-between gap-3">
            {/* Left side: Greeting, Title, and Icon */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Fitness icon badge - clickable to open color theme picker */}
              <button
                ref={iconRef}
                onClick={() => setColorPickerOpen(!colorPickerOpen)}
                className={clsx(
                  'flex-shrink-0 p-2 bg-white/20 backdrop-blur-sm rounded-xl',
                  'transition-all duration-200',
                  'hover:bg-white/30 hover:scale-105 active:scale-95',
                  'focus:outline-none focus:ring-2 focus:ring-white/50',
                  colorPickerOpen && 'bg-white/30 ring-2 ring-white/50'
                )}
                aria-label="Open color theme picker"
                aria-expanded={colorPickerOpen}
                aria-haspopup="dialog"
              >
                <TrainingIcon className="w-5 h-5 text-white" />
              </button>

              <div className="min-w-0">
                {/* Greeting with person name */}
                {showGreeting && currentPerson && mounted ? (
                  <>
                    <p className="text-white/70 text-xs font-medium tracking-wide uppercase">
                      {greeting}
                    </p>
                    <h1 className="text-white font-bold text-lg truncate">
                      {currentPerson.name}
                    </h1>
                  </>
                ) : (
                  <h1 className="text-white font-bold text-lg truncate">{title}</h1>
                )}
              </div>

              {/* Connection indicator */}
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <span
                  className={clsx(
                    'w-2 h-2 rounded-full ring-2 ring-white/30',
                    isSupabaseConfigured ? 'bg-green-300' : 'bg-yellow-300'
                  )}
                  title={isSupabaseConfigured ? 'Connected to Supabase' : 'Demo Mode'}
                />
              </div>
            </div>

            {/* Right side: User menu and Theme toggle */}
            <div className="flex-shrink-0 flex items-center gap-2">
              {/* User menu */}
              {isAuthEnabled && (
                <div className="relative">
                  <button
                    ref={userMenuRef}
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className={clsx(
                      'p-2 rounded-lg transition-all duration-200',
                      'hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                      userMenuOpen && 'bg-white/20'
                    )}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    aria-label="User menu"
                  >
                    <User className="w-5 h-5 text-white" />
                  </button>

                  {/* User menu dropdown */}
                  {userMenuOpen && (
                    <div
                      ref={userMenuDropdownRef}
                      className={clsx(
                        'absolute right-0 top-full mt-2 z-50',
                        'bg-white dark:bg-gray-800',
                        'rounded-xl shadow-xl',
                        'border border-gray-200 dark:border-gray-700',
                        'p-2 min-w-[200px]',
                        'animate-in fade-in slide-in-from-top-2 duration-200'
                      )}
                      role="menu"
                    >
                      {/* User info */}
                      {user && (
                        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {profile?.display_name || user.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {user.email}
                          </p>
                        </div>
                      )}

                      {/* Menu items */}
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          router.push('/settings/household');
                        }}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                          'text-left text-gray-700 dark:text-gray-300',
                          'hover:bg-gray-100 dark:hover:bg-gray-700',
                          'transition-colors duration-150'
                        )}
                        role="menuitem"
                      >
                        <Users className="w-4 h-4" />
                        <span className="text-sm">Household Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          router.push('/settings');
                        }}
                        className={clsx(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                          'text-left text-gray-700 dark:text-gray-300',
                          'hover:bg-gray-100 dark:hover:bg-gray-700',
                          'transition-colors duration-150'
                        )}
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </button>

                      <div className="my-2 border-t border-gray-200 dark:border-gray-700" />

                      {isAuthenticated && user ? (
                        <button
                          onClick={handleLogout}
                          className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                            'text-left text-red-600 dark:text-red-400',
                            'hover:bg-red-50 dark:hover:bg-red-900/20',
                            'transition-colors duration-150'
                          )}
                          role="menuitem"
                        >
                          <LogOut className="w-4 h-4" />
                          <span className="text-sm">Sign Out</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            router.push('/auth/login');
                          }}
                          className={clsx(
                            'w-full flex items-center gap-3 px-3 py-2 rounded-lg',
                            'text-left text-blue-600 dark:text-blue-400',
                            'hover:bg-blue-50 dark:hover:bg-blue-900/20',
                            'transition-colors duration-150'
                          )}
                          role="menuitem"
                        >
                          <User className="w-4 h-4" />
                          <span className="text-sm">Sign In</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              <ThemeToggle variant="gradient" />
            </div>
          </div>

          {/* Bottom row: Person toggle and training info */}
          {showPersonToggle && householdMembers.length > 0 && (
            <div className="mt-3 flex items-center justify-between gap-3">
              {/* Person toggle pills */}
              <div
                role="tablist"
                aria-label="Select household member"
                className="flex rounded-xl bg-white/20 backdrop-blur-sm p-1 shadow-inner"
              >
                {householdMembers.map((person) => (
                  <button
                    key={person.id}
                    role="tab"
                    aria-selected={currentPerson?.id === person.id}
                    aria-label={`Switch to ${person.name}`}
                    onClick={() => setCurrentPerson(person)}
                    className={clsx(
                      'px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-lg',
                      'transition-all duration-200',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                      currentPerson?.id === person.id
                        ? 'bg-white shadow-md'
                        : 'text-white/90 hover:bg-white/20 hover:text-white'
                    )}
                    style={currentPerson?.id === person.id ? { color: `rgb(var(--theme-primary-text))` } : undefined}
                  >
                    {person.name}
                  </button>
                ))}
              </div>

              {/* Training focus selector and workout days */}
              {currentPerson && (
                <div className="flex items-center gap-2">
                  {/* Workout days selector */}
                  <div className="relative">
                    <button
                      ref={workoutDaysRef}
                      onClick={() => setWorkoutDaysOpen(!workoutDaysOpen)}
                      className={clsx(
                        'flex items-center gap-1.5 text-xs text-white/90 bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-2',
                        'hover:bg-white/25 transition-all duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                        'min-h-[40px]',
                        workoutDaysOpen && 'bg-white/25'
                      )}
                      aria-expanded={workoutDaysOpen}
                      aria-haspopup="listbox"
                      aria-label="Change workout days per week"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="font-medium">
                        {currentPerson.workoutDaysPerWeek}d/wk
                      </span>
                      <ChevronDown className={clsx(
                        'w-3 h-3 transition-transform duration-200',
                        workoutDaysOpen && 'rotate-180'
                      )} />
                    </button>

                    {/* Workout days dropdown */}
                    {workoutDaysOpen && (
                      <div
                        ref={workoutDaysDropdownRef}
                        className={clsx(
                          'absolute right-0 top-full mt-2 z-50',
                          'bg-white dark:bg-gray-800',
                          'rounded-xl shadow-xl',
                          'border border-gray-200 dark:border-gray-700',
                          'p-2 min-w-[180px]',
                          'animate-in fade-in slide-in-from-top-2 duration-200'
                        )}
                        role="listbox"
                        aria-label="Select workout days per week"
                      >
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1.5 font-medium">
                          Workout Days/Week
                        </p>
                        {workoutDaysOptions.map((option) => {
                          const isSelected = currentPerson.workoutDaysPerWeek === option.value;
                          return (
                            <button
                              key={option.value}
                              onClick={() => handleWorkoutDaysChange(option.value)}
                              className={clsx(
                                'w-full flex items-center justify-between px-3 py-2 rounded-lg',
                                'transition-all duration-150',
                                'text-left',
                                isSelected
                                  ? 'bg-gray-100 dark:bg-gray-700'
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                              )}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {option.label}
                                </span>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {option.description}
                                </p>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Training focus selector */}
                  <div className="relative">
                    <button
                      ref={trainingFocusRef}
                      onClick={() => setTrainingFocusOpen(!trainingFocusOpen)}
                      className={clsx(
                        'flex items-center gap-2 text-xs text-white/90 bg-white/15 backdrop-blur-sm rounded-lg px-3 py-2',
                        'hover:bg-white/25 transition-all duration-200',
                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                        'min-h-[40px]',
                        trainingFocusOpen && 'bg-white/25'
                      )}
                      aria-expanded={trainingFocusOpen}
                      aria-haspopup="listbox"
                      aria-label="Change training focus"
                    >
                      <span className="font-medium">
                        {trainingFocusLabels[currentPerson.training_focus]}
                      </span>
                      <ChevronDown className={clsx(
                        'w-3.5 h-3.5 transition-transform duration-200',
                        trainingFocusOpen && 'rotate-180'
                      )} />
                      <span className="text-white/50">|</span>
                      <span className="font-bold text-yellow-200">
                        {currentPerson.dailyCalorieTarget} cal
                      </span>
                    </button>

                  {/* Training focus dropdown */}
                  {trainingFocusOpen && (
                    <div
                      ref={trainingDropdownRef}
                      className={clsx(
                        'absolute right-0 top-full mt-2 z-50',
                        'bg-white dark:bg-gray-800',
                        'rounded-xl shadow-xl',
                        'border border-gray-200 dark:border-gray-700',
                        'p-2 min-w-[240px]',
                        'animate-in fade-in slide-in-from-top-2 duration-200'
                      )}
                      role="listbox"
                      aria-label="Select training focus"
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1.5 font-medium">
                        Training Focus
                      </p>
                      {trainingFocusOptions.map((option) => {
                        const Icon = trainingFocusIcons[option.value];
                        const isSelected = currentPerson.training_focus === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleTrainingFocusChange(option.value)}
                            className={clsx(
                              'w-full flex items-start gap-3 px-3 py-2.5 rounded-lg',
                              'transition-all duration-150',
                              'text-left',
                              isSelected
                                ? 'bg-gray-100 dark:bg-gray-700'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                            )}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <div
                              className="p-1.5 rounded-lg mt-0.5"
                              style={{ backgroundColor: `rgba(var(--theme-primary-light), 0.5)` }}
                            >
                              <Icon
                                className="w-4 h-4"
                                style={{ color: `rgb(var(--theme-primary-text))` }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                  {option.label}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-green-500" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {option.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 px-3">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">
                          Changing focus recalculates your daily calorie target
                        </p>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

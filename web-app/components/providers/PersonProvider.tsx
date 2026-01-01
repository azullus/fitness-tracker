'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { Person, Household } from '@/lib/types';
import { OnboardingWizard } from '@/components/forms/OnboardingWizard';
import { calculateBMI, calculateDailyCalories } from '@/lib/recipe-utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { DEMO_PERSONS as RICH_DEMO_PERSONS } from '@/lib/demo-data';
import { useToastActions } from '@/components/ui/Toast';

// Use rich demo data from demo-data.ts (Taylor and Dylan with full history)
const DEMO_PERSONS: Person[] = RICH_DEMO_PERSONS;

const DEMO_HOUSEHOLD: Household = {
  id: 'household-demo',
  name: 'Demo Household',
  memberIds: DEMO_PERSONS.map(p => p.id),
  created_at: new Date().toISOString(),
};

const STORAGE_KEY = 'fitness-tracker-person';
const HOUSEHOLD_STORAGE_KEY = 'fitness-tracker-household';
const ONBOARDING_KEY = 'fitness-tracker-onboarding-complete';
const DEMO_MODE_KEY = 'fitness-tracker-demo-mode';

interface PersonContextType {
  currentPerson: Person | null;
  persons: Person[];
  household: Household | null;
  householdMembers: Person[];
  setCurrentPerson: (person: Person) => void;
  addPerson: (person: Omit<Person, 'id' | 'created_at'>) => Person;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  isLoading: boolean;
  showOnboarding: boolean;
  completeOnboarding: (persons: Omit<Person, 'id' | 'created_at'>[]) => void;
  skipOnboarding: () => void;
  isDemoMode: boolean;
  showDemoModeAlert: () => void;
  connectionError: string | null;
  retryConnection: () => void;
}

const PersonContext = createContext<PersonContextType | undefined>(undefined);

interface PersonProviderProps {
  children: ReactNode;
}

// Track whether onboarding is for an authenticated user (no skip allowed)
type OnboardingMode = 'authenticated' | 'demo' | null;

export function PersonProvider({ children }: PersonProviderProps) {
  const { isAuthenticated, isAuthEnabled, profile, isLoading: authLoading } = useAuth();
  const [persons, setPersons] = useState<Person[]>([]);
  const [household, setHousehold] = useState<Household | null>(null);
  const [currentPerson, setCurrentPersonState] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingMode, setOnboardingMode] = useState<OnboardingMode>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [hasShownDemoNotification, setHasShownDemoNotification] = useState(false);

  // Toast notifications - will be null if ToastProvider is not mounted yet
  let toast: ReturnType<typeof useToastActions> | null = null;
  try {
    toast = useToastActions();
  } catch {
    // ToastProvider not available yet, notifications will be skipped
  }

  // Show alert when user tries to modify data in demo mode
  const showDemoModeAlert = useCallback(() => {
    if (toast) {
      toast.warning(
        'Demo Mode',
        'Data modifications are disabled. Sign up for a free account to save your fitness data!',
        5000
      );
    } else {
      alert('Demo Mode: Data modifications are disabled. Sign up for a free account to save your fitness data!');
    }
  }, [toast]);

  // Retry connection by clearing demo mode and reloading
  const retryConnection = useCallback(() => {
    try {
      localStorage.removeItem(DEMO_MODE_KEY);
      sessionStorage.removeItem('demo-banner-dismissed');
    } catch {
      // Ignore localStorage errors
    }
    window.location.reload();
  }, []);

  // Generate a unique ID
  const generateId = (prefix: string): string => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get all household members
  const householdMembers = useMemo(() => {
    if (!household) return persons;
    return persons.filter((p) => household.memberIds.includes(p.id));
  }, [persons, household]);

  // Load persons from Supabase (authenticated) or API/demo
  const loadPersons = useCallback(async (): Promise<{ persons: Person[]; source: 'supabase' | 'api' | 'demo'; error?: string }> => {
    // If authenticated with Supabase, load from Supabase directly
    if (isAuthenticated && isAuthEnabled && profile?.household_id && supabase) {
      try {
        const { data, error } = await supabase
          .from('persons')
          .select('*')
          .eq('household_id', profile.household_id)
          .order('name', { ascending: true });

        if (error) {
          setConnectionError(error.message);
          // Fall through to API/demo fallback
        } else if (data && data.length > 0) {
          setConnectionError(null);
          // Map Supabase fields to our Person type
          return {
            persons: data.map((p: Record<string, unknown>) => ({
              id: p.id as string,
              name: p.name as string,
              gender: ((p.gender as string) || 'male') as 'male' | 'female',
              age: (p.age as number) || 30,
              height: (p.height as number) || 170,
              weight: (p.weight as number) || 150,
              bmi: (p.bmi as number) || 25,
              dailyCalorieTarget: (p.daily_calorie_target as number) || 2000,
              training_focus: (p.training_focus as Person['training_focus']) || 'mixed',
              workoutDaysPerWeek: (p.workout_days_per_week as number) || 4,
              householdId: (p.household_id as string) || '',
              created_at: p.created_at as string,
            })),
            source: 'supabase',
          };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setConnectionError(errorMsg);
      }
    }

    // Fallback: try API endpoint
    try {
      const response = await fetch('/api/persons');
      if (response.ok) {
        const json = await response.json();
        // Handle both direct array response and { data: [] } wrapper
        const data = Array.isArray(json) ? json : json?.data;
        const source = json?.source as 'supabase' | 'sqlite' | 'demo' | undefined;

        if (Array.isArray(data) && data.length > 0) {
          // Check if API returned demo data (indicates fallback occurred)
          if (source === 'demo') {
            setConnectionError('Database unavailable, using demo data');
            return { persons: data, source: 'demo', error: 'Database unavailable' };
          }
          setConnectionError(null);
          return { persons: data, source: 'api' };
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';
      setConnectionError(errorMsg);
    }
    // Fallback to demo data
    return { persons: DEMO_PERSONS, source: 'demo', error: connectionError || 'Using demo data' };
  }, [isAuthenticated, isAuthEnabled, profile?.household_id, connectionError]);

  // Add a new person
  const addPerson = useCallback((personData: Omit<Person, 'id' | 'created_at'>): Person => {
    const newPerson: Person = {
      ...personData,
      id: generateId('person'),
      created_at: new Date().toISOString(),
    };

    setPersons((prev) => [...prev, newPerson]);

    // Add to household
    if (household) {
      setHousehold((prev) => prev ? {
        ...prev,
        memberIds: [...prev.memberIds, newPerson.id],
      } : null);
    }

    return newPerson;
  }, [household]);

  // Update an existing person and persist to localStorage
  const updatePerson = useCallback((id: string, updates: Partial<Person>): void => {
    setPersons((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      // Persist to localStorage
      try {
        localStorage.setItem('fitness-tracker-persons', JSON.stringify(updated));
      } catch {
        // Failed to persist to localStorage
      }
      return updated;
    });

    // If updating current person, also update their selection in localStorage
    setCurrentPersonState((prev) => {
      if (prev?.id === id) {
        const updated = { ...prev, ...updates };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Failed to persist to localStorage
        }
        return updated;
      }
      return prev;
    });
  }, []);

  // Persist selected person to localStorage
  const setCurrentPerson = useCallback((person: Person) => {
    setCurrentPersonState(person);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(person));
    } catch {
      // Failed to save to localStorage
    }
  }, []);

  // Complete onboarding with new persons
  const completeOnboarding = useCallback(
    (newPersons: Omit<Person, 'id' | 'created_at'>[]) => {
      // Guard against empty array
      if (newPersons.length === 0) {
        skipOnboarding();
        return;
      }

      const createdPersons: Person[] = newPersons.map((p) => ({
        ...p,
        id: generateId('person'),
        created_at: new Date().toISOString(),
      }));

      const newHousehold: Household = {
        id: generateId('household'),
        name: `${createdPersons[0].name}'s Household`,
        memberIds: createdPersons.map((p) => p.id),
        created_at: new Date().toISOString(),
      };

      setPersons(createdPersons);
      setHousehold(newHousehold);
      setCurrentPersonState(createdPersons[0]);
      setShowOnboarding(false);
      setOnboardingMode(null);

      // Persist to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(createdPersons[0]));
        localStorage.setItem(HOUSEHOLD_STORAGE_KEY, JSON.stringify(newHousehold));
        localStorage.setItem('fitness-tracker-persons', JSON.stringify(createdPersons));
        localStorage.setItem(ONBOARDING_KEY, 'true');
      } catch {
        // Failed to save to localStorage
      }
    },
    []
  );

  // Skip onboarding and use demo data
  const skipOnboarding = useCallback(() => {
    setPersons(DEMO_PERSONS);
    setHousehold(DEMO_HOUSEHOLD);
    setCurrentPersonState(DEMO_PERSONS[0]);
    setShowOnboarding(false);
    setOnboardingMode(null);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_PERSONS[0]));
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // Failed to save to localStorage
    }
  }, []);

  // Initial load: restore from localStorage and fetch persons
  useEffect(() => {
    const initialize = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      setIsLoading(true);

      // CHECK DEMO MODE FIRST - takes precedence over authentication
      let demoModeActive = false;
      let onboardingComplete = false;
      try {
        demoModeActive = localStorage.getItem(DEMO_MODE_KEY) === 'true';
        onboardingComplete = localStorage.getItem(ONBOARDING_KEY) === 'true';
      } catch {
        // Failed to check localStorage
      }

      // If demo mode is active, use demo data regardless of auth state
      if (demoModeActive) {
        setIsDemoMode(true);
        if (onboardingComplete) {
          // Load rich demo data immediately
          setPersons(DEMO_PERSONS);
          setHousehold(DEMO_HOUSEHOLD);
          setCurrentPersonState(DEMO_PERSONS[0]);
          setIsLoading(false);
          return;
        } else {
          // Show onboarding with skip option
          setShowOnboarding(true);
          setOnboardingMode('demo');
          setIsLoading(false);
          return;
        }
      }

      // AUTHENTICATED USER: Load from Supabase, show onboarding if no persons exist
      if (isAuthenticated && isAuthEnabled && supabase) {
        try {
          // Load persons from Supabase
          const loadResult = await loadPersons();
          const loadedPersons = loadResult.persons;

          // If authenticated user has no persons, show onboarding WITHOUT skip option
          if (loadedPersons.length === 0) {
            setShowOnboarding(true);
            setOnboardingMode('authenticated');
            setIsLoading(false);
            return;
          }

          // Check if we fell back to demo mode
          if (loadResult.source === 'demo') {
            setIsDemoMode(true);
            // Set demo mode flag for persistence
            try {
              localStorage.setItem(DEMO_MODE_KEY, 'true');
            } catch {
              // Ignore localStorage errors
            }
          }

          // Try to load household if profile has household_id
          let supabaseHousehold: Household | null = null;
          if (profile?.household_id) {
            const { data: householdData } = await supabase
              .from('households')
              .select('*')
              .eq('id', profile.household_id)
              .single();

            if (householdData) {
              supabaseHousehold = {
                id: householdData.id,
                name: householdData.name || 'My Household',
                memberIds: loadedPersons.map(p => p.id),
                created_at: householdData.created_at,
              };
            }
          }

          // Fallback household if not loaded
          if (!supabaseHousehold && loadedPersons.length > 0) {
            supabaseHousehold = {
              id: 'authenticated-household',
              name: 'My Household',
              memberIds: loadedPersons.map(p => p.id),
              created_at: new Date().toISOString(),
            };
          }

          setPersons(loadedPersons);
          setHousehold(supabaseHousehold);

          // Select first person or restore selection
          let selectedPerson = loadedPersons[0] || null;
          try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored) as Person;
              const found = loadedPersons.find((p) => p.id === parsed.id);
              if (found) {
                selectedPerson = found;
              }
            }
          } catch {
            // Ignore localStorage errors
          }

          if (selectedPerson) {
            setCurrentPersonState(selectedPerson);
          }

          setIsLoading(false);
          return; // Always return for authenticated users
        } catch {
          // On error for authenticated users, show onboarding to set up their profile
          setShowOnboarding(true);
          setOnboardingMode('authenticated');
          setIsLoading(false);
          return;
        }
      }

      // NOT AUTHENTICATED: Use localStorage flow (demo mode already handled above)
      // Try to load saved persons from localStorage first
      let savedPersons: Person[] | null = null;
      let savedHousehold: Household | null = null;
      try {
        const personsStr = localStorage.getItem('fitness-tracker-persons');
        const householdStr = localStorage.getItem(HOUSEHOLD_STORAGE_KEY);
        if (personsStr) {
          savedPersons = JSON.parse(personsStr);
        }
        if (householdStr) {
          savedHousehold = JSON.parse(householdStr);
        }
      } catch {
        // Failed to load from localStorage
      }

      if (savedPersons && savedPersons.length > 0) {
        // Use saved data
        setPersons(savedPersons);
        setHousehold(savedHousehold);
      } else if (!onboardingComplete && !isAuthEnabled) {
        // Show onboarding ONLY if auth is NOT enabled (demo mode) WITH skip option
        // If auth IS enabled, skip onboarding - page will redirect to login
        setShowOnboarding(true);
        setOnboardingMode('demo');
        setIsDemoMode(true);
        setIsLoading(false);
        return;
      } else {
        // Load from API or use demo data
        const loadResult = await loadPersons();
        setPersons(loadResult.persons);
        setHousehold(DEMO_HOUSEHOLD);

        // Track if we're in demo mode
        if (loadResult.source === 'demo') {
          setIsDemoMode(true);
        }
      }

      // Try to restore selection from localStorage
      let selectedPerson: Person | null = null;
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as Person;
          // Verify the stored person still exists
          const allPersons = savedPersons || DEMO_PERSONS;
          const found = allPersons.find((p) => p.id === parsed.id);
          if (found) {
            selectedPerson = found;
          }
        }
      } catch {
        // Failed to restore from localStorage
      }

      // Default to first person if no valid selection
      const finalPersons = savedPersons || DEMO_PERSONS;
      if (!selectedPerson && finalPersons.length > 0) {
        selectedPerson = finalPersons[0];
      }

      if (selectedPerson) {
        setCurrentPersonState(selectedPerson);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedPerson));
        } catch {
          // Failed to sync to localStorage
        }
      }

      setIsLoading(false);
    };

    initialize();
  }, [loadPersons, authLoading, isAuthenticated, isAuthEnabled, profile?.household_id]);

  // Show demo mode notification when falling back to demo data
  useEffect(() => {
    if (isDemoMode && !isLoading && !hasShownDemoNotification && toast) {
      setHasShownDemoNotification(true);

      // Check if this is due to a connection error
      if (connectionError) {
        toast.warning(
          'Connection Failed - Demo Mode Active',
          connectionError + '. Your changes will not be saved.',
          10000 // Show for 10 seconds
        );
      } else {
        toast.info(
          'Demo Mode',
          'Running with sample data. Sign in to save your fitness data.',
          8000
        );
      }
    }
  }, [isDemoMode, isLoading, hasShownDemoNotification, toast, connectionError]);

  const contextValue = useMemo<PersonContextType>(
    () => ({
      currentPerson,
      persons,
      household,
      householdMembers,
      setCurrentPerson,
      addPerson,
      updatePerson,
      isLoading,
      showOnboarding,
      completeOnboarding,
      skipOnboarding,
      isDemoMode,
      showDemoModeAlert,
      connectionError,
      retryConnection,
    }),
    [
      currentPerson,
      persons,
      household,
      householdMembers,
      setCurrentPerson,
      addPerson,
      updatePerson,
      isLoading,
      showOnboarding,
      completeOnboarding,
      skipOnboarding,
      isDemoMode,
      showDemoModeAlert,
      connectionError,
      retryConnection,
    ]
  );

  return (
    <PersonContext.Provider value={contextValue}>
      {showOnboarding && (
        <OnboardingWizard
          onComplete={completeOnboarding}
          // Only allow skipping for demo mode users, not authenticated users
          onCancel={onboardingMode === 'demo' ? skipOnboarding : undefined}
        />
      )}
      {children}
    </PersonContext.Provider>
  );
}

/**
 * Hook to access the full person context
 * @throws Error if used outside PersonProvider
 */
export function usePerson(): PersonContextType {
  const context = useContext(PersonContext);
  if (context === undefined) {
    throw new Error('usePerson must be used within a PersonProvider');
  }
  return context;
}

/**
 * Hook to get just the current person
 * @returns The currently selected person or null if loading
 */
export function useCurrentPerson(): Person | null {
  const { currentPerson } = usePerson();
  return currentPerson;
}

/**
 * Hook to get just the current person's ID
 * @returns The current person's ID or undefined if no person selected
 */
export function usePersonId(): string | undefined {
  const { currentPerson } = usePerson();
  return currentPerson?.id;
}

/**
 * Hook to get household members
 * @returns Array of household members
 */
export function useHouseholdMembers(): Person[] {
  const { householdMembers } = usePerson();
  return householdMembers;
}

/**
 * Hook to check if in demo mode and get the alert function
 * @returns Object with isDemoMode flag and showDemoModeAlert function
 */
export function useDemoMode(): { isDemoMode: boolean; showDemoModeAlert: () => void } {
  const { isDemoMode, showDemoModeAlert } = usePerson();
  return { isDemoMode, showDemoModeAlert };
}

export default PersonProvider;

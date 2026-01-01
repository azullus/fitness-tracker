'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { usePerson } from '@/components/providers/PersonProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Header from '@/components/navigation/Header';
import { OnboardingWizard } from '@/components/forms/OnboardingWizard';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Person } from '@/lib/types';

export default function HouseholdSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isAuthEnabled, profile } = useAuth();
  const { persons, householdMembers, addPerson, updatePerson } = usePerson();

  const [householdName, setHouseholdName] = useState('');
  const [editingHouseholdName, setEditingHouseholdName] = useState(false);
  const [showAddPersonWizard, setShowAddPersonWizard] = useState(false);
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null);
  const [editingPersonName, setEditingPersonName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load household data
  useEffect(() => {
    const loadHousehold = async () => {
      if (!isAuthEnabled || !profile?.household_id || !supabase) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('households')
          .select('name')
          .eq('id', profile.household_id)
          .single();

        if (error) throw error;
        setHouseholdName(data?.name || 'My Household');
      } catch {
        // Failed to load household
      } finally {
        setIsLoading(false);
      }
    };

    loadHousehold();
  }, [isAuthEnabled, profile?.household_id]);

  // Update household name
  const handleUpdateHouseholdName = async () => {
    if (!supabase || !profile?.household_id) return;

    setError(null);
    try {
      const { error } = await supabase
        .from('households')
        .update({ name: householdName })
        .eq('id', profile.household_id);

      if (error) throw error;
      setSuccess('Household name updated!');
      setEditingHouseholdName(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to update household name');
    }
  };

  // Handle completion of add person wizard
  const handleAddPersonComplete = async (newPersons: Omit<Person, 'id' | 'created_at'>[]) => {
    if (newPersons.length === 0) {
      setShowAddPersonWizard(false);
      return;
    }

    const personData = newPersons[0]; // Single person mode returns one person

    if (!supabase || !profile?.household_id) {
      // Demo mode - use local addPerson
      addPerson(personData);
      setShowAddPersonWizard(false);
      setSuccess('Person added!');
      setTimeout(() => setSuccess(null), 3000);
      return;
    }

    setError(null);
    try {
      const { error } = await supabase
        .from('persons')
        .insert({
          name: personData.name,
          gender: personData.gender,
          age: personData.age,
          height: personData.height,
          weight: personData.weight,
          bmi: personData.bmi,
          daily_calorie_target: personData.dailyCalorieTarget,
          training_focus: personData.training_focus,
          workout_days_per_week: personData.workoutDaysPerWeek,
          household_id: profile.household_id,
        });

      if (error) throw error;
      setShowAddPersonWizard(false);
      setSuccess('Person added to household!');
      setTimeout(() => setSuccess(null), 3000);
      // Reload page to refresh persons list
      window.location.reload();
    } catch (err) {
      setError('Failed to add person');
      setShowAddPersonWizard(false);
    }
  };

  // Update person name
  const handleUpdatePersonName = async (personId: string) => {
    if (!editingPersonName.trim()) {
      setError('Please enter a name');
      return;
    }

    if (!supabase) {
      // Demo mode
      updatePerson(personId, { name: editingPersonName });
      setEditingPersonId(null);
      setSuccess('Person updated!');
      setTimeout(() => setSuccess(null), 3000);
      return;
    }

    setError(null);
    try {
      const { error } = await supabase
        .from('persons')
        .update({ name: editingPersonName })
        .eq('id', personId);

      if (error) throw error;
      setEditingPersonId(null);
      setSuccess('Person updated!');
      setTimeout(() => setSuccess(null), 3000);
      window.location.reload();
    } catch (err) {
      setError('Failed to update person');
    }
  };

  // Delete person
  const handleDeletePerson = async (personId: string) => {
    if (!confirm('Are you sure you want to remove this person? This will delete all their data.')) {
      return;
    }

    setError(null);
    try {
      // Get CSRF token
      const csrfResponse = await fetch('/api/csrf');
      const { token } = await csrfResponse.json();

      // Use API route (handles both SQLite and Supabase)
      const response = await fetch(`/api/persons?id=${personId}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-Token': token,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete person');
      }

      setSuccess('Person removed from household');
      setTimeout(() => setSuccess(null), 3000);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove person');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      {/* Add Person Wizard Modal */}
      {showAddPersonWizard && (
        <OnboardingWizard
          onComplete={handleAddPersonComplete}
          onCancel={() => setShowAddPersonWizard(false)}
          singlePersonMode={true}
          singlePersonTitle="Add New Household Member"
        />
      )}

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header title="Household Settings" showPersonToggle={false} showGreeting={false} />

        <div className="p-4 max-w-2xl mx-auto space-y-6">
        {/* Status messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Household Name Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Household
          </h2>

          {editingHouseholdName ? (
            <div className="flex items-center gap-2">
              <Input
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="Household name"
                className="flex-1"
              />
              <Button onClick={handleUpdateHouseholdName} size="sm">
                <Save className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingHouseholdName(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300">{householdName}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingHouseholdName(true)}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Household Members Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Members ({householdMembers.length})
            </h2>
            <Button
              size="sm"
              onClick={() => setShowAddPersonWizard(true)}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Add Person
            </Button>
          </div>

          {/* Members list */}
          <div className="space-y-2">
            {householdMembers.map((person) => (
              <div
                key={person.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                {editingPersonId === person.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editingPersonName}
                      onChange={(e) => setEditingPersonName(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleUpdatePersonName(person.id)}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingPersonId(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {person.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {person.training_focus === 'powerlifting' ? 'Powerlifting' :
                         person.training_focus === 'cardio' ? 'Cardio & Mobility' : 'Mixed Training'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingPersonId(person.id);
                          setEditingPersonName(person.name);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePerson(person.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {householdMembers.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                No members in household. Add someone to get started!
              </p>
            )}
          </div>
        </div>

          {/* Back button */}
          <Button
            variant="secondary"
            onClick={() => router.back()}
            className="w-full"
          >
            Back
          </Button>
        </div>
      </div>
    </>
  );
}

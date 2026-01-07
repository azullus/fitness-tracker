// Client-side API functions for fetching/posting data

import type { Person, WeightLog, WorkoutLog, PantryItem } from './types';

const API_BASE = '/api';

// ============ PERSONS ============

export async function fetchPersons(): Promise<Person[]> {
  const res = await fetch(`${API_BASE}/persons`);
  if (!res.ok) throw new Error('Failed to fetch persons');
  return res.json();
}

// ============ WEIGHT ============

export async function fetchWeightLogs(person?: 'Him' | 'Her', limit = 30): Promise<WeightLog[]> {
  const params = new URLSearchParams();
  if (person) params.set('person', person);
  params.set('limit', limit.toString());

  const res = await fetch(`${API_BASE}/weight?${params}`);
  if (!res.ok) throw new Error('Failed to fetch weight logs');
  return res.json();
}

export async function logWeight(person: 'Him' | 'Her', weight: number, notes?: string): Promise<WeightLog> {
  const res = await fetch(`${API_BASE}/weight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      person,
      weight,
      date: new Date().toISOString().split('T')[0],
      notes,
    }),
  });
  if (!res.ok) throw new Error('Failed to log weight');
  return res.json();
}

// ============ WORKOUTS ============

export async function fetchWorkoutLogs(person?: 'Him' | 'Her', date?: string): Promise<WorkoutLog[]> {
  const params = new URLSearchParams();
  if (person) params.set('person', person);
  if (date) params.set('date', date);

  const res = await fetch(`${API_BASE}/workouts?${params}`);
  if (!res.ok) throw new Error('Failed to fetch workout logs');
  return res.json();
}

export async function logWorkout(data: {
  person: 'Him' | 'Her';
  workout_type: string;
  completed: boolean;
  main_lifts?: string;
  top_set_weight?: number;
  rpe?: string;
  is_pr?: boolean;
  activities?: string;
  duration_min?: number;
  intensity?: string;
  energy?: number;
  notes?: string;
}): Promise<WorkoutLog> {
  const res = await fetch(`${API_BASE}/workouts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      date: new Date().toISOString().split('T')[0],
    }),
  });
  if (!res.ok) throw new Error('Failed to log workout');
  return res.json();
}

// ============ PANTRY ============

export async function fetchPantryItems(): Promise<PantryItem[]> {
  const res = await fetch(`${API_BASE}/pantry`);
  if (!res.ok) throw new Error('Failed to fetch pantry items');
  return res.json();
}

export async function updatePantryQuantity(id: string, quantity: number): Promise<PantryItem> {
  const res = await fetch(`${API_BASE}/pantry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'update', id, quantity }),
  });
  if (!res.ok) throw new Error('Failed to update pantry item');
  return res.json();
}

export async function addPantryItem(item: {
  category: string;
  item: string;
  quantity: number;
  unit: string;
  location?: string;
  notes?: string;
}): Promise<PantryItem> {
  const res = await fetch(`${API_BASE}/pantry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'add', ...item }),
  });
  if (!res.ok) throw new Error('Failed to add pantry item');
  return res.json();
}

// ============ SEED DATA ============

export async function seedDatabase(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
  return res.json();
}

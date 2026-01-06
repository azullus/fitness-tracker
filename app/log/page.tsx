'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Scale, Dumbbell, Package, Utensils, Check, Plus, Minus, RefreshCw, CheckCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { cn, getDayOfWeek } from '@/lib/utils';
import { logWeight, logWorkout, updatePantryQuantity, addPantryItem, fetchPantryItems } from '@/lib/api';

type LogType = 'weight' | 'workout' | 'pantry' | null;

interface RecentActivity {
  type: 'weight' | 'workout' | 'pantry';
  description: string;
  person?: string;
  time: Date;
}

export default function LogPage() {
  const [activeLog, setActiveLog] = useState<LogType>(null);
  const [person, setPerson] = useState<'him' | 'her'>('him');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  // Weight log state
  const [weight, setWeight] = useState('');
  const [weightNotes, setWeightNotes] = useState('');

  // Workout log state
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [energy, setEnergy] = useState(7);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [topSetWeight, setTopSetWeight] = useState('');
  const [rpe, setRpe] = useState('');
  const [isPR, setIsPR] = useState(false);
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState('');

  // Pantry log state
  const [pantryAction, setPantryAction] = useState<'add' | 'remove' | 'out'>('add');
  const [pantryItem, setPantryItem] = useState('');
  const [pantryQuantity, setPantryQuantity] = useState('1');
  const [pantryItems, setPantryItems] = useState<any[]>([]);
  const [selectedPantryId, setSelectedPantryId] = useState<string | null>(null);

  const isHim = person === 'him';
  const today = format(new Date(), 'EEEE, MMMM d');
  const dayOfWeek = getDayOfWeek(new Date());

  // Load pantry items for autocomplete
  useEffect(() => {
    fetchPantryItems().then(setPantryItems).catch(console.error);
  }, []);

  const resetForm = () => {
    setActiveLog(null);
    setWeight('');
    setWeightNotes('');
    setWorkoutCompleted(false);
    setEnergy(7);
    setWorkoutNotes('');
    setTopSetWeight('');
    setRpe('');
    setIsPR(false);
    setDuration('');
    setIntensity('');
    setPantryItem('');
    setPantryQuantity('1');
    setSelectedPantryId(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);

    try {
      if (activeLog === 'weight') {
        const personName = person === 'him' ? 'Him' : 'Her';
        await logWeight(personName, parseFloat(weight), weightNotes || undefined);
        setRecentActivity(prev => [{
          type: 'weight',
          description: `${weight} lbs`,
          person: personName,
          time: new Date(),
        }, ...prev.slice(0, 4)]);
      } else if (activeLog === 'workout') {
        const personName = person === 'him' ? 'Him' : 'Her';
        await logWorkout({
          person: personName,
          workout_type: isHim ? `${dayOfWeek} Lifting` : `${dayOfWeek} Training`,
          completed: workoutCompleted,
          main_lifts: isHim ? topSetWeight ? `Top set: ${topSetWeight} lbs` : undefined : undefined,
          top_set_weight: isHim && topSetWeight ? parseFloat(topSetWeight) : undefined,
          rpe: isHim ? rpe || undefined : undefined,
          is_pr: isHim ? isPR : undefined,
          duration_min: !isHim && duration ? parseInt(duration) : undefined,
          intensity: !isHim ? intensity || undefined : undefined,
          energy,
          notes: workoutNotes || undefined,
        });
        setRecentActivity(prev => [{
          type: 'workout',
          description: workoutCompleted ? 'Completed' : 'Logged',
          person: personName,
          time: new Date(),
        }, ...prev.slice(0, 4)]);
      } else if (activeLog === 'pantry') {
        if (pantryAction === 'out') {
          // Find the item and set quantity to 0
          const existing = pantryItems.find(p => p.item.toLowerCase() === pantryItem.toLowerCase());
          if (existing) {
            await updatePantryQuantity(existing.id, 0);
          }
        } else if (selectedPantryId) {
          // Update existing item
          const existing = pantryItems.find(p => p.id === selectedPantryId);
          if (existing) {
            const qty = parseFloat(pantryQuantity) || 1;
            const newQty = pantryAction === 'add'
              ? existing.quantity + qty
              : Math.max(0, existing.quantity - qty);
            await updatePantryQuantity(selectedPantryId, newQty);
          }
        } else {
          // Add new item
          await addPantryItem({
            category: 'General',
            item: pantryItem,
            quantity: parseFloat(pantryQuantity) || 1,
            unit: 'each',
          });
        }
        setRecentActivity(prev => [{
          type: 'pantry',
          description: pantryAction === 'out' ? `Out of ${pantryItem}` : `${pantryAction === 'add' ? 'Added' : 'Used'} ${pantryItem}`,
          time: new Date(),
        }, ...prev.slice(0, 4)]);
        // Refresh pantry list
        fetchPantryItems().then(setPantryItems).catch(console.error);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        resetForm();
      }, 1500);
    } catch (error) {
      console.error('Error saving:', error);
      alert('Error saving. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute>
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Quick Log</h1>
      <p className="text-sm text-gray-500 mb-6">{today}</p>

      {/* Log type selection */}
      {!activeLog && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setActiveLog('weight')}
            className="card hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
              <Scale className="w-6 h-6 text-blue-600" />
            </div>
            <p className="font-semibold text-gray-900">Log Weight</p>
            <p className="text-sm text-gray-500">Daily weigh-in</p>
          </button>

          <button
            onClick={() => setActiveLog('workout')}
            className="card hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
              <Dumbbell className="w-6 h-6 text-green-600" />
            </div>
            <p className="font-semibold text-gray-900">Log Workout</p>
            <p className="text-sm text-gray-500">Mark complete</p>
          </button>

          <button
            onClick={() => setActiveLog('pantry')}
            className="card hover:shadow-md transition-shadow text-left"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <p className="font-semibold text-gray-900">Update Pantry</p>
            <p className="text-sm text-gray-500">Add or use items</p>
          </button>

          <button
            className="card hover:shadow-md transition-shadow text-left opacity-50 cursor-not-allowed"
            disabled
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
              <Utensils className="w-6 h-6 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-900">Log Meal</p>
            <p className="text-sm text-gray-500">Coming soon</p>
          </button>
        </div>
      )}

      {/* Weight Log Form */}
      {activeLog === 'weight' && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Log Weight</h2>
            <button onClick={() => setActiveLog(null)} className="text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>

          {/* Person toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4">
            <button
              onClick={() => setPerson('him')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                person === 'him' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
              )}
            >
              Him
            </button>
            <button
              onClick={() => setPerson('her')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                person === 'her' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'
              )}
            >
              Her
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (lbs)</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeight((prev) => (parseFloat(prev || '0') - 0.5).toFixed(1))}
                  className="btn-secondary btn-sm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="185.0"
                  step="0.1"
                  className="input-number flex-1 text-2xl font-bold text-center"
                />
                <button
                  onClick={() => setWeight((prev) => (parseFloat(prev || '0') + 0.5).toFixed(1))}
                  className="btn-secondary btn-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
              <input
                type="text"
                value={weightNotes}
                onChange={(e) => setWeightNotes(e.target.value)}
                placeholder="Morning, before coffee..."
                className="input"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!weight || saving}
              className={cn(
                'w-full py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2',
                saveSuccess ? 'bg-green-600' : isHim ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700',
                (!weight || saving) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {saveSuccess && <CheckCircle className="w-4 h-4" />}
              {saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save Weight'}
            </button>
          </div>
        </div>
      )}

      {/* Workout Log Form */}
      {activeLog === 'workout' && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Log Workout</h2>
            <button onClick={() => setActiveLog(null)} className="text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>

          {/* Person toggle */}
          <div className="flex bg-gray-100 rounded-lg p-0.5 mb-4">
            <button
              onClick={() => setPerson('him')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                person === 'him' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
              )}
            >
              Him
            </button>
            <button
              onClick={() => setPerson('her')}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-md transition-colors',
                person === 'her' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'
              )}
            >
              Her
            </button>
          </div>

          <div className="space-y-4">
            {/* Completion toggle */}
            <button
              onClick={() => setWorkoutCompleted(!workoutCompleted)}
              className={cn(
                'w-full py-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-colors',
                workoutCompleted
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500'
              )}
            >
              <Check className={cn('w-6 h-6', workoutCompleted && 'text-green-600')} />
              <span className="font-medium">{workoutCompleted ? 'Completed!' : 'Mark as Complete'}</span>
            </button>

            {/* Energy level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Energy Level: {energy}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="w-full accent-primary-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>

            {/* His-specific fields */}
            {isHim && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Top Set (lbs)</label>
                    <input
                      type="number"
                      value={topSetWeight}
                      onChange={(e) => setTopSetWeight(e.target.value)}
                      placeholder="315"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RPE</label>
                    <select
                      value={rpe}
                      onChange={(e) => setRpe(e.target.value)}
                      className="input"
                    >
                      <option value="">Select</option>
                      <option value="6">6 - Light</option>
                      <option value="7">7 - Moderate</option>
                      <option value="7-8">7-8</option>
                      <option value="8">8 - Hard</option>
                      <option value="8-9">8-9</option>
                      <option value="9">9 - Very Hard</option>
                      <option value="10">10 - Max</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPR}
                    onChange={(e) => setIsPR(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="font-medium text-gray-700">New PR! 🎉</span>
                </label>
              </>
            )}

            {/* Her-specific fields */}
            {!isHim && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                    <input
                      type="number"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="45"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Intensity</label>
                    <select
                      value={intensity}
                      onChange={(e) => setIntensity(e.target.value)}
                      className="input"
                    >
                      <option value="">Select</option>
                      <option value="Low">Low - Easy</option>
                      <option value="Moderate">Moderate</option>
                      <option value="High">High - Intense</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={workoutNotes}
                onChange={(e) => setWorkoutNotes(e.target.value)}
                placeholder="How did the workout feel?"
                rows={2}
                className="input resize-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'w-full py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2',
                saveSuccess ? 'bg-green-600' : isHim ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700',
                saving && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {saveSuccess && <CheckCircle className="w-4 h-4" />}
              {saveSuccess ? 'Saved!' : saving ? 'Saving...' : 'Save Workout'}
            </button>
          </div>
        </div>
      )}

      {/* Pantry Log Form */}
      {activeLog === 'pantry' && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Update Pantry</h2>
            <button onClick={() => setActiveLog(null)} className="text-gray-400 hover:text-gray-600">
              Cancel
            </button>
          </div>

          <div className="space-y-4">
            {/* Action type */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPantryAction('add')}
                className={cn(
                  'py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                  pantryAction === 'add'
                    ? 'bg-green-100 text-green-700 border-2 border-green-500'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                Add Stock
              </button>
              <button
                onClick={() => setPantryAction('remove')}
                className={cn(
                  'py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                  pantryAction === 'remove'
                    ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                Used
              </button>
              <button
                onClick={() => setPantryAction('out')}
                className={cn(
                  'py-2 px-3 rounded-lg text-sm font-medium transition-colors',
                  pantryAction === 'out'
                    ? 'bg-amber-100 text-amber-700 border-2 border-amber-500'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                Out of
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item</label>
              <input
                type="text"
                value={pantryItem}
                onChange={(e) => setPantryItem(e.target.value)}
                placeholder="Chicken breast, eggs, rice..."
                className="input"
              />
            </div>

            {pantryAction !== 'out' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input
                  type="text"
                  value={pantryQuantity}
                  onChange={(e) => setPantryQuantity(e.target.value)}
                  placeholder="2 lbs, 12 count..."
                  className="input"
                />
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={!pantryItem || saving}
              className={cn(
                'w-full py-3 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2',
                saveSuccess ? 'bg-green-600' : 'bg-primary-600 hover:bg-primary-700',
                (!pantryItem || saving) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {saveSuccess && <CheckCircle className="w-4 h-4" />}
              {saveSuccess ? 'Saved!' : saving ? 'Saving...' : (
                pantryAction === 'add' ? 'Add to Pantry' :
                pantryAction === 'remove' ? 'Mark as Used' : "Mark as Out"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {!activeLog && (
        <div className="mt-8">
          <h2 className="card-header">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <div className="card text-center py-8 text-gray-500">
              <p>No recent activity</p>
              <p className="text-sm">Log something to see it here!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="card flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    activity.type === 'weight' && 'bg-blue-100',
                    activity.type === 'workout' && 'bg-green-100',
                    activity.type === 'pantry' && 'bg-amber-100'
                  )}>
                    {activity.type === 'weight' && <Scale className="w-5 h-5 text-blue-600" />}
                    {activity.type === 'workout' && <Check className="w-5 h-5 text-green-600" />}
                    {activity.type === 'pantry' && <Package className="w-5 h-5 text-amber-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {activity.type === 'weight' && 'Weight logged'}
                      {activity.type === 'workout' && 'Workout logged'}
                      {activity.type === 'pantry' && 'Pantry updated'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {activity.person ? `${activity.person} - ` : ''}{activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">Just now</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}

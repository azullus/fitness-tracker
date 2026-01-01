'use client';

import { useState, useMemo, useEffect } from 'react';
import Header from '@/components/navigation/Header';
import { PantryItemCard } from '@/components/cards';
import { Button, ConfirmDialog } from '@/components/ui';
import { AddPantryItemModal } from '@/components/modals';
import { DEMO_PANTRY_ITEMS } from '@/lib/demo-data';
import {
  initializePantryWithDemoData,
  updatePantryItemQuantity,
  deletePantryItem,
  addPantryItem,
} from '@/lib/pantry-log';
import { Plus, Search, Package, AlertTriangle } from 'lucide-react';
import type { PantryItem } from '@/lib/types';

// Category options for filtering
const CATEGORIES = [
  'All',
  'Proteins',
  'Dairy',
  'Grains',
  'Produce',
  'Frozen',
  'Condiments',
  'Snacks',
] as const;

type CategoryFilter = (typeof CATEGORIES)[number];

export default function PantryPage() {
  // Local state for pantry items - initialized from localStorage
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  // Confirmation dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; item: PantryItem | null }>({
    isOpen: false,
    item: null,
  });
  // Add item modal state
  const [showAddModal, setShowAddModal] = useState(false);

  // Initialize pantry from localStorage on mount
  useEffect(() => {
    const items = initializePantryWithDemoData(DEMO_PANTRY_ITEMS);
    setPantryItems(items);
    setIsLoaded(true);
  }, []);

  // Get low stock items from current state
  const lowStockItems = useMemo(() => {
    return pantryItems.filter((item) => {
      if (item.low_stock_threshold === undefined) return false;
      return item.quantity <= item.low_stock_threshold;
    });
  }, [pantryItems]);

  // Filter items based on category and search
  const filteredItems = useMemo(() => {
    let items = pantryItems;

    // Filter by category
    if (selectedCategory !== 'All') {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter((item) =>
        item.name.toLowerCase().includes(query)
      );
    }

    // Sort alphabetically by name
    return items.sort((a, b) => a.name.localeCompare(b.name));
  }, [pantryItems, selectedCategory, searchQuery]);

  // Handle quantity update - persists to localStorage
  const handleUpdateQuantity = (id: string, delta: number) => {
    try {
      const updatedItem = updatePantryItemQuantity(id, delta);
      if (updatedItem) {
        setPantryItems((prev) =>
          prev.map((item) =>
            item.id === id ? updatedItem : item
          )
        );
      }
    } catch {
      // Silently fail - UI already shows current state
    }
  };

  // Handle delete item - shows confirmation dialog
  const handleDeleteItem = (id: string) => {
    const item = pantryItems.find((i) => i.id === id);
    if (item) {
      setDeleteConfirm({ isOpen: true, item });
    }
  };

  // Confirm delete - persists to localStorage
  const confirmDeleteItem = () => {
    if (!deleteConfirm.item) return;

    try {
      const deleted = deletePantryItem(deleteConfirm.item.id);
      if (deleted) {
        setPantryItems((prev) => prev.filter((item) => item.id !== deleteConfirm.item?.id));
      }
    } catch {
      // Silently fail - item remains in UI
    }

    setDeleteConfirm({ isOpen: false, item: null });
  };

  // Cancel delete
  const cancelDeleteItem = () => {
    setDeleteConfirm({ isOpen: false, item: null });
  };

  // Handle add new item - opens modal
  const handleAddItem = () => {
    setShowAddModal(true);
  };

  // Handle save new item
  const handleSaveNewItem = (itemData: Omit<PantryItem, 'id' | 'created_at'>) => {
    try {
      const newItem = addPantryItem(itemData);
      setPantryItems((prev) => [...prev, newItem]);
    } catch {
      // Silently fail - modal will close
    }
  };

  // Get expiring items (within 7 days) - memoized to avoid unnecessary recalculation
  const expiringItems = useMemo(() => {
    const today = new Date();
    return pantryItems.filter((item) => {
      if (!item.expires_at) return false;
      const expiryDate = new Date(item.expires_at);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    });
  }, [pantryItems]);

  // Show loading state while initializing
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <Header title="Pantry" showPersonToggle={false} />
        <div className="p-4 flex justify-center items-center h-64">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading pantry...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <Header title="Pantry" showPersonToggle={false} />

      <div className="p-4 space-y-4">
        {/* Expiring Soon Warning */}
        {expiringItems.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <h2 className="font-semibold text-red-800 dark:text-red-300">
                Expiring Soon ({expiringItems.length} items)
              </h2>
            </div>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1">
              {expiringItems.slice(0, 3).map((item) => (
                <li key={item.id}>{item.name}</li>
              ))}
              {expiringItems.length > 3 && (
                <li className="text-red-600 dark:text-red-500">
                  +{expiringItems.length - 3} more items expiring soon
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-orange-500 focus:ring-2 focus:ring-orange-500 focus:ring-opacity-20 outline-none transition-colors"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex overflow-x-auto gap-2 pb-2 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-orange-500 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Low Stock Section */}
        {lowStockItems.length > 0 && selectedCategory === 'All' && !searchQuery && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <h2 className="font-semibold text-orange-800 dark:text-orange-300">
                Low Stock ({lowStockItems.length} items)
              </h2>
            </div>
            <div className="space-y-3">
              {lowStockItems.slice(0, 3).map((item) => (
                <PantryItemCard
                  key={item.id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onDelete={handleDeleteItem}
                />
              ))}
              {lowStockItems.length > 3 && (
                <p className="text-sm text-orange-600 text-center pt-2">
                  +{lowStockItems.length - 3} more low stock items below
                </p>
              )}
            </div>
          </div>
        )}

        {/* Items Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Package className="h-5 w-5" />
            <span className="text-sm font-medium">
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
              {selectedCategory !== 'All' && ` in ${selectedCategory}`}
              {searchQuery && ` matching "${searchQuery}"`}
            </span>
          </div>
        </div>

        {/* Items Grid/List */}
        {filteredItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => (
              <PantryItemCard
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              No items found
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs">
              {searchQuery
                ? `No items match "${searchQuery}"`
                : selectedCategory !== 'All'
                ? `No items in ${selectedCategory} category`
                : 'Your pantry is empty. Add some items to get started.'}
            </p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-4 text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Floating Add Item Button */}
      <div className="fixed bottom-20 right-4 z-20">
        <Button
          variant="primary"
          size="lg"
          className="rounded-full shadow-lg !bg-orange-500 hover:!bg-orange-600 !px-4"
          aria-label="Add new item"
          onClick={handleAddItem}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Item"
        message={`Are you sure you want to delete "${deleteConfirm.item?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDeleteItem}
        onCancel={cancelDeleteItem}
      />

      {/* Add Item Modal */}
      <AddPantryItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleSaveNewItem}
      />
    </div>
  );
}

'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { BarcodeScanner } from './BarcodeScanner';
import { ScannedFoodPreview } from './ScannedFoodPreview';
import { Button } from '@/components/ui/Button';
import type { OpenFoodFactsProduct } from '@/lib/open-food-facts';

type ScannerState = 'scanning' | 'loading' | 'preview' | 'error' | 'not-found';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodScanned: (data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    servingSize: string;
  }) => void;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onFoodScanned,
}: BarcodeScannerModalProps) {
  const [state, setState] = useState<ScannerState>('scanning');
  const [product, setProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannedBarcode, setScannedBarcode] = useState<string | null>(null);
  const previousOverflowRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Reset state when modal opens and manage body scroll lock
  useEffect(() => {
    if (isOpen) {
      setState('scanning');
      setProduct(null);
      setError(null);
      setScannedBarcode(null);
      // Store previous overflow value and prevent body scrolling
      previousOverflowRef.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      // Restore previous overflow value when modal closes
      document.body.style.overflow = previousOverflowRef.current;
      // Cancel any pending fetch requests when modal closes
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    }

    // Cleanup on unmount - ensure scroll is restored and requests cancelled
    return () => {
      if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = previousOverflowRef.current;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const lookupBarcode = useCallback(async (barcode: string) => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setState('loading');
    setScannedBarcode(barcode);
    setError(null);

    try {
      const response = await fetch(
        `/api/food-lookup?barcode=${encodeURIComponent(barcode)}`,
        { signal: abortController.signal }
      );
      const data = await response.json();

      if (data.success && data.data) {
        setProduct(data.data);
        setState('preview');
      } else if (response.status === 404) {
        setState('not-found');
        setError(data.error || 'Product not found in database');
      } else {
        setState('error');
        setError(data.error || 'Failed to look up product');
      }
    } catch (err) {
      // Ignore abort errors - they're expected when user closes modal
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      setState('error');
      setError(err instanceof Error ? err.message : 'Network error. Please check your connection.');
    }
  }, []);

  const handleScanSuccess = useCallback(
    (barcode: string) => {
      lookupBarcode(barcode);
    },
    [lookupBarcode]
  );

  const handleScanError = useCallback((errorMessage: string) => {
    setState('error');
    setError(errorMessage);
  }, []);

  const handleScanAgain = useCallback(() => {
    setState('scanning');
    setProduct(null);
    setError(null);
    setScannedBarcode(null);
  }, []);

  const handleConfirm = useCallback(
    (data: {
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      servingSize: string;
    }) => {
      onFoodScanned(data);
      onClose();
    },
    [onFoodScanned, onClose]
  );

  const handleManualEntry = useCallback(() => {
    // Close scanner and let user enter manually
    // The scanned barcode info could be passed to help user
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black"
      role="dialog"
      aria-modal="true"
      aria-label="Barcode Scanner"
    >
      {/* Scanning State */}
      {state === 'scanning' && (
        <BarcodeScanner
          isActive={state === 'scanning'}
          onScanSuccess={handleScanSuccess}
          onScanError={handleScanError}
          onClose={onClose}
        />
      )}

      {/* Loading State */}
      {state === 'loading' && (
        <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
          <p className="text-lg">Looking up product...</p>
          {scannedBarcode && (
            <p className="text-sm text-gray-400 mt-2">Barcode: {scannedBarcode}</p>
          )}
        </div>
      )}

      {/* Preview State */}
      {state === 'preview' && product && (
        <ScannedFoodPreview
          product={product}
          onConfirm={handleConfirm}
          onScanAgain={handleScanAgain}
          onCancel={onClose}
        />
      )}

      {/* Not Found State */}
      {state === 'not-found' && (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Product Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">
              This product isn&apos;t in the Open Food Facts database yet.
            </p>
            {scannedBarcode && (
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
                Barcode: {scannedBarcode}
              </p>
            )}
            <div className="w-full max-w-xs space-y-3">
              <Button
                onClick={handleScanAgain}
                variant="primary"
                className="w-full"
              >
                Try Another Product
              </Button>
              <Button
                onClick={handleManualEntry}
                variant="secondary"
                className="w-full"
              >
                Enter Manually
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {state === 'error' && (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800">
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
              <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something Went Wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {error || 'An unexpected error occurred.'}
            </p>
            <div className="w-full max-w-xs space-y-3">
              <Button
                onClick={handleScanAgain}
                variant="primary"
                className="w-full"
              >
                Try Again
              </Button>
              <Button
                onClick={onClose}
                variant="secondary"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BarcodeScannerModal;

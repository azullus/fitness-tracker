'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, Flashlight, FlashlightOff, X } from 'lucide-react';
import { clsx } from 'clsx';

// Dynamic import types for html5-qrcode (browser-only library)
type Html5QrcodeType = import('html5-qrcode').Html5Qrcode;
type Html5QrcodeSupportedFormatsType = typeof import('html5-qrcode').Html5QrcodeSupportedFormats;

interface BarcodeScannerProps {
  onScanSuccess: (barcode: string) => void;
  onScanError?: (error: string) => void;
  onClose: () => void;
  isActive: boolean;
}

// Scanner configuration - formats will be set dynamically after import
const SCANNER_CONFIG_BASE = {
  fps: 10,
  qrbox: { width: 280, height: 150 },
  experimentalFeatures: {
    useBarCodeDetectorIfSupported: true,
  },
};

export function BarcodeScanner({
  onScanSuccess,
  onScanError,
  onClose,
  isActive,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeType | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const hasScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
        scannerRef.current = null;
      } catch {
        // Ignore errors when stopping - scanner may already be stopped
        scannerRef.current = null;
      }
    }
  }, []);

  const handleScanSuccess = useCallback(
    (decodedText: string) => {
      // Prevent multiple rapid scans
      if (hasScannedRef.current) return;
      hasScannedRef.current = true;

      // Vibrate if supported (mobile feedback)
      if (navigator.vibrate) {
        navigator.vibrate(100);
      }

      onScanSuccess(decodedText);
    },
    [onScanSuccess]
  );

  const toggleTorch = useCallback(async () => {
    if (!scannerRef.current || !hasTorch) return;

    try {
      const newState = !torchEnabled;
      await scannerRef.current.applyVideoConstraints({
        // @ts-expect-error - torch is a valid constraint but not in types
        advanced: [{ torch: newState }],
      });
      setTorchEnabled(newState);
    } catch {
      // Torch toggle failed, ignore
    }
  }, [torchEnabled, hasTorch]);

  useEffect(() => {
    // Track mount state for this effect instance
    isMountedRef.current = true;

    if (!isActive) {
      stopScanner();
      return;
    }

    const containerId = 'barcode-scanner-container';
    hasScannedRef.current = false;
    setError(null);
    setIsInitializing(true);

    const initScanner = async () => {
      try {
        // Check for camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera not supported on this device');
        }

        // Dynamically import html5-qrcode (browser-only library)
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

        // Check if still mounted after async import
        if (!isMountedRef.current) return;

        // Build scanner config with supported formats
        const scannerConfig = {
          ...SCANNER_CONFIG_BASE,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.EAN_13,
          ],
        };

        // Create scanner instance
        const html5Qrcode = new Html5Qrcode(containerId);
        scannerRef.current = html5Qrcode;

        // Get available cameras
        const cameras = await Html5Qrcode.getCameras();

        // Check if still mounted after async operation
        if (!isMountedRef.current) {
          await stopScanner();
          return;
        }

        if (!cameras || cameras.length === 0) {
          throw new Error('No camera found on this device');
        }

        // Prefer back camera for barcode scanning
        const backCamera = cameras.find(
          (cam) =>
            cam.label.toLowerCase().includes('back') ||
            cam.label.toLowerCase().includes('rear') ||
            cam.label.toLowerCase().includes('environment')
        );
        const cameraId = backCamera?.id || cameras[cameras.length - 1].id;

        // Start scanning
        await html5Qrcode.start(
          cameraId,
          scannerConfig,
          handleScanSuccess,
          () => {
            // Ignore scan failures (they happen constantly when no barcode in view)
          }
        );

        // Check if still mounted after starting
        if (!isMountedRef.current) {
          await stopScanner();
          return;
        }

        // Check if torch is available
        try {
          const capabilities = html5Qrcode.getRunningTrackCameraCapabilities();
          // @ts-expect-error - torch is not in the types
          if (capabilities?.torchFeature?.isSupported?.()) {
            if (isMountedRef.current) {
              setHasTorch(true);
            }
          }
        } catch {
          // Torch not available
        }

        if (isMountedRef.current) {
          setIsInitializing(false);
        }
      } catch (err) {
        // Only set error state if still mounted
        if (isMountedRef.current) {
          const errorMessage =
            err instanceof Error ? err.message : 'Failed to initialize camera';
          setError(errorMessage);
          setIsInitializing(false);
          onScanError?.(errorMessage);
        }
      }
    };

    initScanner();

    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, [isActive, handleScanSuccess, onScanError, stopScanner]);

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 to-transparent">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Close scanner"
        >
          <X className="w-6 h-6" />
        </button>
        {hasTorch && (
          <button
            onClick={toggleTorch}
            className={clsx(
              'p-2 rounded-full transition-colors',
              torchEnabled
                ? 'bg-yellow-500 text-black'
                : 'bg-black/50 text-white hover:bg-black/70'
            )}
            aria-label={torchEnabled ? 'Turn off flashlight' : 'Turn on flashlight'}
          >
            {torchEnabled ? (
              <Flashlight className="w-6 h-6" />
            ) : (
              <FlashlightOff className="w-6 h-6" />
            )}
          </button>
        )}
      </div>

      {/* Scanner Container */}
      <div className="flex-1 flex items-center justify-center">
        <div
          id="barcode-scanner-container"
          ref={containerRef}
          className="w-full h-full"
        />

        {/* Overlay with viewfinder */}
        {!error && !isInitializing && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Dark overlay with transparent center */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Top dark area */}
              <div className="absolute top-0 left-0 right-0 h-[calc(50%-75px)] bg-black/50" />
              {/* Bottom dark area */}
              <div className="absolute bottom-0 left-0 right-0 h-[calc(50%-75px)] bg-black/50" />
              {/* Left dark area */}
              <div className="absolute left-0 top-[calc(50%-75px)] h-[150px] w-[calc(50%-140px)] bg-black/50" />
              {/* Right dark area */}
              <div className="absolute right-0 top-[calc(50%-75px)] h-[150px] w-[calc(50%-140px)] bg-black/50" />

              {/* Viewfinder corners */}
              <div className="relative w-[280px] h-[150px]">
                {/* Top-left corner */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg" />
                {/* Top-right corner */}
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg" />
                {/* Bottom-left corner */}
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg" />
                {/* Bottom-right corner */}
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg" />

                {/* Scanning line animation - uses custom CSS animation defined in globals.css */}
                <div className="absolute left-4 right-4 h-0.5 bg-green-500 animate-scanner-line" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Messages */}
      <div className="absolute bottom-0 left-0 right-0 p-6 text-center bg-gradient-to-t from-black/70 to-transparent">
        {isInitializing && (
          <div className="flex flex-col items-center gap-3">
            <Camera className="w-8 h-8 text-white animate-pulse" />
            <p className="text-white text-lg">Starting camera...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        {!isInitializing && !error && (
          <p className="text-white text-lg">
            Position barcode within the frame
          </p>
        )}
      </div>

    </div>
  );
}

export default BarcodeScanner;

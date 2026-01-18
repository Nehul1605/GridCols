/**
 * useFPSMonitor - Performance Monitoring Hook
 *
 * Measures and reports frame rate for scroll performance.
 * Displays FPS overlay and reports when below threshold.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// TYPES
// ============================================

interface FPSData {
  /** Current FPS */
  current: number;
  /** Average FPS over measurement period */
  average: number;
  /** Minimum FPS recorded */
  min: number;
  /** Maximum FPS recorded */
  max: number;
  /** Number of frames below 60 FPS */
  droppedFrames: number;
  /** Whether currently measuring */
  isActive: boolean;
}

interface UseFPSMonitorOptions {
  /** Target FPS (default: 60) */
  targetFPS?: number;
  /** Sample window size (default: 60 frames) */
  sampleSize?: number;
  /** Callback when FPS drops below threshold */
  onFPSDrop?: (fps: number) => void;
  /** Threshold for FPS drop callback (default: 55) */
  dropThreshold?: number;
  /** Enable monitoring (default: true in dev) */
  enabled?: boolean;
}

interface UseFPSMonitorReturn {
  /** Current FPS data */
  fpsData: FPSData;
  /** Start measuring */
  startMeasuring: () => void;
  /** Stop measuring */
  stopMeasuring: () => void;
  /** Reset statistics */
  resetStats: () => void;
  /** Get formatted FPS string */
  fpsDisplay: string;
  /** Whether performance is good (>= 55 FPS avg) */
  isPerformanceGood: boolean;
  /** Ref to attach to scroll container for automatic measurement */
  measureRef: React.RefObject<HTMLDivElement>;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_TARGET_FPS = 60;
const DEFAULT_SAMPLE_SIZE = 60;
const DEFAULT_DROP_THRESHOLD = 55;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useFPSMonitor({
  targetFPS = DEFAULT_TARGET_FPS,
  sampleSize = DEFAULT_SAMPLE_SIZE,
  onFPSDrop,
  dropThreshold = DEFAULT_DROP_THRESHOLD,
  enabled = process.env.NODE_ENV === 'development',
}: UseFPSMonitorOptions = {}): UseFPSMonitorReturn {
  // ==========================================
  // STATE
  // ==========================================

  const [fpsData, setFpsData] = useState<FPSData>({
    current: targetFPS,
    average: targetFPS,
    min: targetFPS,
    max: targetFPS,
    droppedFrames: 0,
    isActive: false,
  });

  // ==========================================
  // REFS
  // ==========================================

  const measureRef = useRef<HTMLDivElement>(null);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ==========================================
  // FPS CALCULATION
  // ==========================================

  const calculateFPS = useCallback(() => {
    const frameTimes = frameTimesRef.current;
    if (frameTimes.length < 2) {
      return { current: targetFPS, average: targetFPS, min: targetFPS, max: targetFPS };
    }

    // Calculate FPS from frame deltas
    const deltas: number[] = [];
    for (let i = 1; i < frameTimes.length; i++) {
      const prev = frameTimes[i - 1];
      const curr = frameTimes[i];
      if (prev !== undefined && curr !== undefined) {
        deltas.push(curr - prev);
      }
    }

    if (deltas.length === 0) {
      return { current: targetFPS, average: targetFPS, min: targetFPS, max: targetFPS };
    }

    // Current FPS from last delta
    const lastDelta = deltas[deltas.length - 1];
    const currentFPS = lastDelta ? Math.round(1000 / lastDelta) : targetFPS;

    // Average FPS
    const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    const averageFPS = Math.round(1000 / avgDelta);

    // Min/Max FPS
    const maxDelta = Math.max(...deltas);
    const minDelta = Math.min(...deltas);
    const minFPS = Math.round(1000 / maxDelta); // Slowest frame
    const maxFPS = Math.round(1000 / minDelta); // Fastest frame

    return {
      current: Math.min(currentFPS, 120), // Cap at 120
      average: Math.min(averageFPS, 120),
      min: Math.min(minFPS, 120),
      max: Math.min(maxFPS, 120),
    };
  }, [targetFPS]);

  // ==========================================
  // FRAME LOOP
  // ==========================================

  const measureFrame = useCallback(
    (timestamp: number) => {
      if (!enabled || !fpsData.isActive) return;

      // Record frame time
      frameTimesRef.current.push(timestamp);

      // Keep only recent samples
      if (frameTimesRef.current.length > sampleSize) {
        frameTimesRef.current = frameTimesRef.current.slice(-sampleSize);
      }

      // Update FPS data
      const { current, average, min, max } = calculateFPS();

      setFpsData((prev) => ({
        ...prev,
        current,
        average,
        min: Math.min(prev.min, min),
        max: Math.max(prev.max, max),
        droppedFrames: prev.droppedFrames + (current < targetFPS ? 1 : 0),
      }));

      // Check for FPS drop
      if (current < dropThreshold && onFPSDrop) {
        onFPSDrop(current);
      }

      lastFrameTimeRef.current = timestamp;

      // Continue measuring if scrolling
      if (isScrollingRef.current) {
        rafIdRef.current = requestAnimationFrame(measureFrame);
      }
    },
    [enabled, fpsData.isActive, sampleSize, calculateFPS, targetFPS, dropThreshold, onFPSDrop]
  );

  // ==========================================
  // SCROLL DETECTION
  // ==========================================

  useEffect(() => {
    if (!enabled) return;

    const element = measureRef.current;
    if (!element) return;

    const handleScroll = () => {
      // Start measuring on scroll
      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        rafIdRef.current = requestAnimationFrame(measureFrame);
      }

      // Reset scroll timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }
      }, 150);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [enabled, measureFrame]);

  // ==========================================
  // CONTROL FUNCTIONS
  // ==========================================

  const startMeasuring = useCallback(() => {
    if (!enabled) return;

    setFpsData((prev) => ({ ...prev, isActive: true }));
    frameTimesRef.current = [];
    lastFrameTimeRef.current = performance.now();
  }, [enabled]);

  const stopMeasuring = useCallback(() => {
    setFpsData((prev) => ({ ...prev, isActive: false }));
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }
    isScrollingRef.current = false;
  }, []);

  const resetStats = useCallback(() => {
    frameTimesRef.current = [];
    setFpsData({
      current: targetFPS,
      average: targetFPS,
      min: targetFPS,
      max: targetFPS,
      droppedFrames: 0,
      isActive: fpsData.isActive,
    });
  }, [targetFPS, fpsData.isActive]);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const fpsDisplay = `${fpsData.current} FPS (avg: ${fpsData.average}, min: ${fpsData.min})`;
  const isPerformanceGood = fpsData.average >= dropThreshold;

  return {
    fpsData,
    startMeasuring,
    stopMeasuring,
    resetStats,
    fpsDisplay,
    isPerformanceGood,
    measureRef,
  };
}

// ============================================
// FPS OVERLAY COMPONENT
// ============================================

interface FPSOverlayProps {
  fpsData: FPSData;
  show: boolean;
}

export const FPSOverlay: React.FC<FPSOverlayProps> = ({ fpsData, show }) => {
  if (!show) return null;

  const getColor = () => {
    if (fpsData.average >= 55) return 'bg-green-500';
    if (fpsData.average >= 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div
      className={`fixed bottom-4 right-4 ${getColor()} text-white px-3 py-2 rounded-lg shadow-lg font-mono text-sm z-50`}
      role="status"
      aria-live="polite"
    >
      <div className="font-bold">{fpsData.current} FPS</div>
      <div className="text-xs opacity-80">
        avg: {fpsData.average} | min: {fpsData.min} | max: {fpsData.max}
      </div>
      {fpsData.droppedFrames > 0 && (
        <div className="text-xs opacity-80">
          dropped: {fpsData.droppedFrames}
        </div>
      )}
    </div>
  );
};

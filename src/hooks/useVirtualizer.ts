/**
 * useVirtualizer - Manual Virtualization Engine
 *
 * Replaces react-window/react-virtualized with O(1) math calculations.
 * Optimized for 60fps performance with 50k+ rows.
 *
 * Key optimizations:
 * 1. O(1) visible range calculation (no iteration)
 * 2. Stable references via useCallback/useMemo
 * 3. RAF-based scroll updates for smooth 60fps
 * 4. Minimal state updates
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import type { VirtualItem } from '../types';
import { GRID_TOKENS } from '../constants/tokens';

// ============================================
// TYPES
// ============================================

interface UseVirtualizerOptions {
  /** Total number of items */
  count: number;
  /** Height of each item in pixels */
  itemHeight: number;
  /** Height of the scrollable container */
  containerHeight: number;
  /** Extra items to render above/below viewport (prevents white flash) */
  overscan?: number;
  /** Enable smooth scrolling updates */
  enableSmoothScroll?: boolean;
}

interface UseVirtualizerReturn {
  /** Array of visible virtual items with index and offset */
  virtualItems: VirtualItem[];
  /** Total height of all items (for scrollbar) */
  totalHeight: number;
  /** Start index of visible range */
  startIndex: number;
  /** End index of visible range */
  endIndex: number;
  /** Number of visible items */
  visibleCount: number;
  /** Current scroll position */
  scrollTop: number;
  /** Whether currently scrolling */
  isScrolling: boolean;
  /** Scroll event handler - attach to container */
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  /** Scroll to specific index */
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  /** Scroll to specific offset */
  scrollToOffset: (offset: number) => void;
  /** Ref to attach to scroll container */
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useVirtualizer({
  count,
  itemHeight,
  containerHeight,
  overscan = GRID_TOKENS.SCROLL_BUFFER,
  enableSmoothScroll = true,
}: UseVirtualizerOptions): UseVirtualizerReturn {
  // Scroll position state
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  // Refs for performance
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollTopRef = useRef(0);

  // ==========================================
  // CORE CALCULATION: O(1) Visible Range
  // ==========================================

  const { virtualItems, startIndex, endIndex, visibleCount } = useMemo(() => {
    // Early return for invalid state
    if (containerHeight <= 0 || count === 0 || itemHeight <= 0) {
      return {
        virtualItems: [] as VirtualItem[],
        startIndex: 0,
        endIndex: 0,
        visibleCount: 0,
      };
    }

    // O(1) Calculation: Which index is at the top of viewport?
    const rawStartIndex = Math.floor(scrollTop / itemHeight);

    // O(1) Calculation: How many items fit in viewport?
    const rawVisibleCount = Math.ceil(containerHeight / itemHeight);

    // Apply overscan buffer and clamp to valid bounds
    const start = Math.max(0, rawStartIndex - overscan);
    const end = Math.min(count - 1, rawStartIndex + rawVisibleCount + overscan);

    // Build virtual items array (only for visible + overscan items)
    // This is O(k) where k is visible items (~20-30), not O(n) where n is total items
    const items: VirtualItem[] = [];

    for (let i = start; i <= end; i++) {
      items.push({
        index: i,
        offsetTop: i * itemHeight,
        size: itemHeight,
      });
    }

    return {
      virtualItems: items,
      startIndex: start,
      endIndex: end,
      visibleCount: rawVisibleCount,
    };
  }, [count, itemHeight, containerHeight, scrollTop, overscan]);

  // Total scrollable height (creates proper scrollbar)
  const totalHeight = count * itemHeight;

  // ==========================================
  // SCROLL HANDLER: RAF-Optimized for 60fps
  // ==========================================

  const onScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      const newScrollTop = target.scrollTop;

      // Skip if scroll position hasn't meaningfully changed
      // This prevents unnecessary re-renders on sub-pixel scrolling
      if (Math.abs(newScrollTop - lastScrollTopRef.current) < 1) {
        return;
      }

      lastScrollTopRef.current = newScrollTop;

      if (enableSmoothScroll) {
        // Cancel any pending RAF
        if (rafIdRef.current !== null) {
          cancelAnimationFrame(rafIdRef.current);
        }

        // Schedule update on next animation frame for smooth 60fps
        rafIdRef.current = requestAnimationFrame(() => {
          setScrollTop(newScrollTop);
          rafIdRef.current = null;
        });
      } else {
        // Direct update (can cause jank on slow devices)
        setScrollTop(newScrollTop);
      }

      // Set scrolling state
      if (!isScrolling) {
        setIsScrolling(true);
      }

      // Clear scrolling state after scroll ends
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);
    },
    [enableSmoothScroll, isScrolling]
  );

  // ==========================================
  // SCROLL TO METHODS
  // ==========================================

  const scrollToOffset = useCallback(
    (offset: number) => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = Math.max(
          0,
          Math.min(offset, totalHeight - containerHeight)
        );
      }
    },
    [totalHeight, containerHeight]
  );

  const scrollToIndex = useCallback(
    (index: number, align: 'start' | 'center' | 'end' = 'start') => {
      if (index < 0 || index >= count) return;

      const itemOffset = index * itemHeight;

      let targetOffset: number;

      switch (align) {
        case 'center':
          targetOffset = itemOffset - containerHeight / 2 + itemHeight / 2;
          break;
        case 'end':
          targetOffset = itemOffset - containerHeight + itemHeight;
          break;
        case 'start':
        default:
          targetOffset = itemOffset;
          break;
      }

      scrollToOffset(targetOffset);
    },
    [count, itemHeight, containerHeight, scrollToOffset]
  );

  // ==========================================
  // CLEANUP
  // ==========================================

  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return {
    virtualItems,
    totalHeight,
    startIndex,
    endIndex,
    visibleCount,
    scrollTop,
    isScrolling,
    onScroll,
    scrollToIndex,
    scrollToOffset,
    scrollContainerRef,
  };
}

// ============================================
// PERFORMANCE UTILITIES
// ============================================

/**
 * Calculate if a given index is currently visible
 * O(1) operation - no iteration needed
 */
export function isIndexVisible(
  index: number,
  scrollTop: number,
  containerHeight: number,
  itemHeight: number
): boolean {
  const itemTop = index * itemHeight;
  const itemBottom = itemTop + itemHeight;
  const viewportTop = scrollTop;
  const viewportBottom = scrollTop + containerHeight;

  return itemBottom > viewportTop && itemTop < viewportBottom;
}

/**
 * Get the index of the item at a given offset
 * O(1) operation
 */
export function getIndexAtOffset(offset: number, itemHeight: number): number {
  return Math.floor(offset / itemHeight);
}

/**
 * Get the offset of an item at a given index
 * O(1) operation
 */
export function getOffsetForIndex(index: number, itemHeight: number): number {
  return index * itemHeight;
}

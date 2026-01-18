/**
 * useMultiSort - Multi-column Sorting Hook
 *
 * Implements deterministic multi-column sorting.
 * Supports adding, removing, and reordering sort columns.
 */

import { useState, useCallback } from 'react';
import type { SortDirection, ColumnDataType } from '../types';
import { multiSort as performMultiSort } from '../utils/comparators';

// ============================================
// TYPES
// ============================================

export interface MultiSortItem {
  /** Column ID */
  columnId: string;
  /** Accessor key for data */
  accessorKey: string;
  /** Data type for comparison */
  dataType: ColumnDataType;
  /** Sort direction */
  direction: SortDirection;
  /** Sort priority (lower = higher priority) */
  priority: number;
}

interface UseMultiSortOptions {
  /** Maximum number of sort columns (default: 3) */
  maxSorts?: number;
  /** Initial sort state */
  initialSorts?: MultiSortItem[];
  /** Callback when sort changes */
  onSortChange?: (sorts: MultiSortItem[]) => void;
}

interface UseMultiSortReturn {
  /** Current sort items in priority order */
  sorts: MultiSortItem[];
  /** Toggle sort for a column (adds if not present, cycles direction, removes if already desc) */
  toggleSort: (columnId: string, accessorKey: string, dataType: ColumnDataType, additive?: boolean) => void;
  /** Add a sort column */
  addSort: (columnId: string, accessorKey: string, dataType: ColumnDataType, direction: SortDirection) => void;
  /** Remove a sort column */
  removeSort: (columnId: string) => void;
  /** Clear all sorts */
  clearSorts: () => void;
  /** Move a sort to a different priority */
  moveSortPriority: (columnId: string, newPriority: number) => void;
  /** Get sort direction for a column */
  getSortDirection: (columnId: string) => SortDirection;
  /** Get sort priority for a column (1-based, null if not sorted) */
  getSortPriority: (columnId: string) => number | null;
  /** Apply multi-sort to data */
  sortData: <T extends Record<string, unknown>>(data: readonly T[]) => T[];
  /** Check if a column is being sorted */
  isSorted: (columnId: string) => boolean;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_MAX_SORTS = 3;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useMultiSort({
  maxSorts = DEFAULT_MAX_SORTS,
  initialSorts = [],
  onSortChange,
}: UseMultiSortOptions = {}): UseMultiSortReturn {
  const [sorts, setSorts] = useState<MultiSortItem[]>(initialSorts);

  // ==========================================
  // TOGGLE SORT
  // ==========================================

  const toggleSort = useCallback(
    (columnId: string, accessorKey: string, dataType: ColumnDataType, additive = false) => {
      setSorts((currentSorts) => {
        const existingIndex = currentSorts.findIndex((s) => s.columnId === columnId);

        let newSorts: MultiSortItem[];

        if (existingIndex === -1) {
          // Column not in sorts - add it
          if (additive) {
            // Add to existing sorts (multi-sort)
            if (currentSorts.length >= maxSorts) {
              // Remove oldest sort to make room
              newSorts = [
                ...currentSorts.slice(1),
                {
                  columnId,
                  accessorKey,
                  dataType,
                  direction: 'asc',
                  priority: currentSorts.length,
                },
              ];
            } else {
              newSorts = [
                ...currentSorts,
                {
                  columnId,
                  accessorKey,
                  dataType,
                  direction: 'asc',
                  priority: currentSorts.length,
                },
              ];
            }
          } else {
            // Single sort mode - replace all
            newSorts = [
              {
                columnId,
                accessorKey,
                dataType,
                direction: 'asc',
                priority: 0,
              },
            ];
          }
        } else {
          // Column already in sorts - cycle direction
          const existing = currentSorts[existingIndex];
          if (!existing) return currentSorts;

          if (existing.direction === 'asc') {
            // asc -> desc
            newSorts = currentSorts.map((s) =>
              s.columnId === columnId ? { ...s, direction: 'desc' as SortDirection } : s
            );
          } else {
            // desc -> remove
            newSorts = currentSorts
              .filter((s) => s.columnId !== columnId)
              .map((s, i) => ({ ...s, priority: i }));
          }
        }

        // Notify callback
        onSortChange?.(newSorts);

        return newSorts;
      });
    },
    [maxSorts, onSortChange]
  );

  // ==========================================
  // ADD SORT
  // ==========================================

  const addSort = useCallback(
    (columnId: string, accessorKey: string, dataType: ColumnDataType, direction: SortDirection) => {
      if (direction === null) return;

      setSorts((currentSorts) => {
        // Check if already exists
        if (currentSorts.some((s) => s.columnId === columnId)) {
          return currentSorts;
        }

        // Check max limit
        if (currentSorts.length >= maxSorts) {
          return currentSorts;
        }

        const newSorts = [
          ...currentSorts,
          {
            columnId,
            accessorKey,
            dataType,
            direction,
            priority: currentSorts.length,
          },
        ];

        onSortChange?.(newSorts);
        return newSorts;
      });
    },
    [maxSorts, onSortChange]
  );

  // ==========================================
  // REMOVE SORT
  // ==========================================

  const removeSort = useCallback(
    (columnId: string) => {
      setSorts((currentSorts) => {
        const newSorts = currentSorts
          .filter((s) => s.columnId !== columnId)
          .map((s, i) => ({ ...s, priority: i }));

        onSortChange?.(newSorts);
        return newSorts;
      });
    },
    [onSortChange]
  );

  // ==========================================
  // CLEAR SORTS
  // ==========================================

  const clearSorts = useCallback(() => {
    setSorts([]);
    onSortChange?.([]);
  }, [onSortChange]);

  // ==========================================
  // MOVE SORT PRIORITY
  // ==========================================

  const moveSortPriority = useCallback(
    (columnId: string, newPriority: number) => {
      setSorts((currentSorts) => {
        const index = currentSorts.findIndex((s) => s.columnId === columnId);
        if (index === -1) return currentSorts;

        const item = currentSorts[index];
        if (!item) return currentSorts;

        const newSorts = [...currentSorts];
        newSorts.splice(index, 1);
        newSorts.splice(newPriority, 0, item);

        // Update priorities
        const updatedSorts = newSorts.map((s, i) => ({ ...s, priority: i }));

        onSortChange?.(updatedSorts);
        return updatedSorts;
      });
    },
    [onSortChange]
  );

  // ==========================================
  // GETTERS
  // ==========================================

  const getSortDirection = useCallback(
    (columnId: string): SortDirection => {
      const sort = sorts.find((s) => s.columnId === columnId);
      return sort?.direction ?? null;
    },
    [sorts]
  );

  const getSortPriority = useCallback(
    (columnId: string): number | null => {
      const index = sorts.findIndex((s) => s.columnId === columnId);
      return index === -1 ? null : index + 1;
    },
    [sorts]
  );

  const isSorted = useCallback(
    (columnId: string): boolean => {
      return sorts.some((s) => s.columnId === columnId);
    },
    [sorts]
  );

  // ==========================================
  // SORT DATA FUNCTION
  // ==========================================

  const sortData = useCallback(
    <T extends Record<string, unknown>>(data: readonly T[]): T[] => {
      if (sorts.length === 0) return [...data];

      return performMultiSort(
        data,
        sorts.map((s) => ({
          accessorKey: s.accessorKey as keyof T,
          dataType: s.dataType,
          direction: s.direction,
        }))
      );
    },
    [sorts]
  );

  return {
    sorts,
    toggleSort,
    addSort,
    removeSort,
    clearSorts,
    moveSortPriority,
    getSortDirection,
    getSortPriority,
    sortData,
    isSorted,
  };
}

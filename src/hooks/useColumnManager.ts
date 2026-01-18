/**
 * useColumnManager - Column Reordering and Visibility Management
 *
 * Handles column reordering via drag-and-drop and visibility toggles.
 * Maintains column order state and provides handlers.
 */

import { useState, useCallback, useMemo } from 'react';
import type { ColumnDef, BaseRow } from '../types';

// ============================================
// TYPES
// ============================================

export interface ColumnState {
  /** Column ID */
  id: string;
  /** Is column visible */
  visible: boolean;
  /** Order index */
  order: number;
  /** Pinned state */
  pinned: 'left' | 'right' | false;
  /** Current width (if resized) */
  width?: number;
}

interface UseColumnManagerOptions<TData extends BaseRow> {
  /** Initial column definitions */
  columns: readonly ColumnDef<TData>[];
  /** Callback when column order changes */
  onColumnOrderChange?: (columnIds: string[]) => void;
  /** Callback when column visibility changes */
  onColumnVisibilityChange?: (columnId: string, visible: boolean) => void;
  /** Callback when column is pinned/unpinned */
  onColumnPinChange?: (columnId: string, pinned: 'left' | 'right' | false) => void;
}

interface UseColumnManagerReturn<TData extends BaseRow> {
  /** Columns in current order with visibility/pinned state */
  orderedColumns: ColumnDef<TData>[];
  /** Column state map */
  columnStates: Map<string, ColumnState>;
  /** Reorder columns */
  reorderColumns: (fromIndex: number, toIndex: number) => void;
  /** Move column by ID to new position */
  moveColumn: (columnId: string, toIndex: number) => void;
  /** Toggle column visibility */
  toggleColumnVisibility: (columnId: string) => void;
  /** Set column visibility */
  setColumnVisibility: (columnId: string, visible: boolean) => void;
  /** Pin/unpin column */
  setColumnPinned: (columnId: string, pinned: 'left' | 'right' | false) => void;
  /** Reset to initial column order */
  resetColumnOrder: () => void;
  /** Show all columns */
  showAllColumns: () => void;
  /** Hide all columns except required */
  hideAllColumns: (exceptIds?: string[]) => void;
  /** Get visible columns */
  visibleColumns: ColumnDef<TData>[];
  /** Get hidden columns */
  hiddenColumns: ColumnDef<TData>[];
  /** Drag and drop handlers */
  dragHandlers: {
    onDragStart: (columnId: string) => void;
    onDragOver: (columnId: string) => void;
    onDragEnd: () => void;
    draggingColumnId: string | null;
    dragOverColumnId: string | null;
  };
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useColumnManager<TData extends BaseRow>({
  columns,
  onColumnOrderChange,
  onColumnVisibilityChange,
  onColumnPinChange,
}: UseColumnManagerOptions<TData>): UseColumnManagerReturn<TData> {
  // ==========================================
  // STATE
  // ==========================================

  // Initialize column states from column definitions
  const initialStates = useMemo(() => {
    const map = new Map<string, ColumnState>();
    columns.forEach((col, index) => {
      map.set(col.id, {
        id: col.id,
        visible: col.visible !== false,
        order: index,
        pinned: col.pinned ?? false,
        width: typeof col.width === 'number' ? col.width : undefined,
      });
    });
    return map;
  }, [columns]);

  const [columnStates, setColumnStates] = useState<Map<string, ColumnState>>(initialStates);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // ==========================================
  // ORDERED COLUMNS
  // ==========================================

  const orderedColumns = useMemo((): ColumnDef<TData>[] => {
    // Get column order from state
    const stateArray = Array.from(columnStates.values()).sort((a, b) => a.order - b.order);

    // Map back to column definitions with updated state
    const result: ColumnDef<TData>[] = [];
    for (const state of stateArray) {
      const column = columns.find((c) => c.id === state.id);
      if (column) {
        result.push({
          ...column,
          visible: state.visible,
          pinned: state.pinned,
          width: state.width ?? column.width,
        });
      }
    }
    return result;
  }, [columns, columnStates]);

  const visibleColumns = useMemo(
    () => orderedColumns.filter((c) => c.visible !== false),
    [orderedColumns]
  );

  const hiddenColumns = useMemo(
    () => orderedColumns.filter((c) => c.visible === false),
    [orderedColumns]
  );

  // ==========================================
  // REORDER COLUMNS
  // ==========================================

  const reorderColumns = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      setColumnStates((current) => {
        const states = Array.from(current.values()).sort((a, b) => a.order - b.order);
        const [moved] = states.splice(fromIndex, 1);
        if (!moved) return current;

        states.splice(toIndex, 0, moved);

        // Update order values
        const newMap = new Map<string, ColumnState>();
        states.forEach((state, index) => {
          newMap.set(state.id, { ...state, order: index });
        });

        // Notify callback
        onColumnOrderChange?.(states.map((s) => s.id));

        return newMap;
      });
    },
    [onColumnOrderChange]
  );

  const moveColumn = useCallback(
    (columnId: string, toIndex: number) => {
      setColumnStates((current) => {
        const states = Array.from(current.values()).sort((a, b) => a.order - b.order);
        const fromIndex = states.findIndex((s) => s.id === columnId);

        if (fromIndex === -1 || fromIndex === toIndex) return current;

        const [moved] = states.splice(fromIndex, 1);
        if (!moved) return current;

        states.splice(toIndex, 0, moved);

        // Update order values
        const newMap = new Map<string, ColumnState>();
        states.forEach((state, index) => {
          newMap.set(state.id, { ...state, order: index });
        });

        onColumnOrderChange?.(states.map((s) => s.id));
        return newMap;
      });
    },
    [onColumnOrderChange]
  );

  // ==========================================
  // VISIBILITY
  // ==========================================

  const toggleColumnVisibility = useCallback(
    (columnId: string) => {
      setColumnStates((current) => {
        const state = current.get(columnId);
        if (!state) return current;

        const newVisible = !state.visible;
        const newMap = new Map(current);
        newMap.set(columnId, { ...state, visible: newVisible });

        onColumnVisibilityChange?.(columnId, newVisible);
        return newMap;
      });
    },
    [onColumnVisibilityChange]
  );

  const setColumnVisibility = useCallback(
    (columnId: string, visible: boolean) => {
      setColumnStates((current) => {
        const state = current.get(columnId);
        if (!state || state.visible === visible) return current;

        const newMap = new Map(current);
        newMap.set(columnId, { ...state, visible });

        onColumnVisibilityChange?.(columnId, visible);
        return newMap;
      });
    },
    [onColumnVisibilityChange]
  );

  const showAllColumns = useCallback(() => {
    setColumnStates((current) => {
      const newMap = new Map<string, ColumnState>();
      current.forEach((state, key) => {
        newMap.set(key, { ...state, visible: true });
      });
      return newMap;
    });
  }, []);

  const hideAllColumns = useCallback((exceptIds: string[] = []) => {
    setColumnStates((current) => {
      const newMap = new Map<string, ColumnState>();
      current.forEach((state, key) => {
        newMap.set(key, {
          ...state,
          visible: exceptIds.includes(key),
        });
      });
      return newMap;
    });
  }, []);

  // ==========================================
  // PINNING
  // ==========================================

  const setColumnPinned = useCallback(
    (columnId: string, pinned: 'left' | 'right' | false) => {
      setColumnStates((current) => {
        const state = current.get(columnId);
        if (!state || state.pinned === pinned) return current;

        const newMap = new Map(current);
        newMap.set(columnId, { ...state, pinned });

        onColumnPinChange?.(columnId, pinned);
        return newMap;
      });
    },
    [onColumnPinChange]
  );

  // ==========================================
  // RESET
  // ==========================================

  const resetColumnOrder = useCallback(() => {
    setColumnStates(initialStates);
  }, [initialStates]);

  // ==========================================
  // DRAG AND DROP HANDLERS
  // ==========================================

  const onDragStart = useCallback((columnId: string) => {
    setDraggingColumnId(columnId);
  }, []);

  const onDragOver = useCallback((columnId: string) => {
    setDragOverColumnId(columnId);
  }, []);

  const onDragEnd = useCallback(() => {
    if (draggingColumnId && dragOverColumnId && draggingColumnId !== dragOverColumnId) {
      const states = Array.from(columnStates.values()).sort((a, b) => a.order - b.order);
      const fromIndex = states.findIndex((s) => s.id === draggingColumnId);
      const toIndex = states.findIndex((s) => s.id === dragOverColumnId);

      if (fromIndex !== -1 && toIndex !== -1) {
        reorderColumns(fromIndex, toIndex);
      }
    }

    setDraggingColumnId(null);
    setDragOverColumnId(null);
  }, [draggingColumnId, dragOverColumnId, columnStates, reorderColumns]);

  const dragHandlers = useMemo(
    () => ({
      onDragStart,
      onDragOver,
      onDragEnd,
      draggingColumnId,
      dragOverColumnId,
    }),
    [onDragStart, onDragOver, onDragEnd, draggingColumnId, dragOverColumnId]
  );

  return {
    orderedColumns,
    columnStates,
    reorderColumns,
    moveColumn,
    toggleColumnVisibility,
    setColumnVisibility,
    setColumnPinned,
    resetColumnOrder,
    showAllColumns,
    hideAllColumns,
    visibleColumns,
    hiddenColumns,
    dragHandlers,
  };
}

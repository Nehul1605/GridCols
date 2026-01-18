/**
 * useGridState - State Management with useReducer
 *
 * Handles all grid state: sorting, selection, editing, filters
 * No external state libraries (Redux/Zustand forbidden)
 */

import { useReducer, useCallback } from 'react';
import type {
  GridState,
  GridAction,
  SortState,
  CellCoordinate,
  CellValue,
  SelectionMode,
  PendingEdit,
} from '../types';
import { createInitialGridState, gridActions } from '../types';
import { PERFORMANCE } from '../constants/tokens';

// ============================================
// REDUCER
// ============================================

function gridReducer(state: GridState, action: GridAction): GridState {
  switch (action.type) {
    // ==========================================
    // SORT ACTIONS
    // ==========================================
    case 'SORT_SET':
      return {
        ...state,
        sort: action.payload,
      };

    case 'SORT_TOGGLE': {
      const { columnId } = action.payload;
      const currentSort = state.sort;

      let newDirection: 'asc' | 'desc' | null;

      if (currentSort?.columnId !== columnId) {
        // Different column - start with ascending
        newDirection = 'asc';
      } else if (currentSort.direction === 'asc') {
        // Same column, was ascending - switch to descending
        newDirection = 'desc';
      } else {
        // Same column, was descending - clear sort
        newDirection = null;
      }

      return {
        ...state,
        sort: newDirection ? { columnId, direction: newDirection } : null,
      };
    }

    case 'SORT_CLEAR':
      return {
        ...state,
        sort: null,
      };

    // ==========================================
    // SELECTION ACTIONS
    // ==========================================
    case 'SELECT_ROW': {
      const { rowId, multi } = action.payload;
      const newSelectedIds = new Set(state.selection.selectedRowIds);

      if (state.selection.mode === 'none') {
        return state;
      }

      if (state.selection.mode === 'single' || !multi) {
        // Single select - clear others
        newSelectedIds.clear();
        newSelectedIds.add(rowId);
      } else {
        // Multi select - toggle
        if (newSelectedIds.has(rowId)) {
          newSelectedIds.delete(rowId);
        } else {
          newSelectedIds.add(rowId);
        }
      }

      return {
        ...state,
        selection: {
          ...state.selection,
          selectedRowIds: newSelectedIds,
        },
      };
    }

    case 'DESELECT_ROW': {
      const newSelectedIds = new Set(state.selection.selectedRowIds);
      newSelectedIds.delete(action.payload.rowId);

      return {
        ...state,
        selection: {
          ...state.selection,
          selectedRowIds: newSelectedIds,
        },
      };
    }

    case 'SELECT_ALL': {
      if (state.selection.mode !== 'multiple') {
        return state;
      }

      return {
        ...state,
        selection: {
          ...state.selection,
          selectedRowIds: new Set(action.payload.rowIds),
        },
      };
    }

    case 'DESELECT_ALL':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedRowIds: new Set(),
          selectedCells: new Set(),
          selectionRange: null,
        },
      };

    case 'SET_ACTIVE_CELL':
      return {
        ...state,
        selection: {
          ...state.selection,
          activeCell: action.payload,
        },
      };

    case 'SELECT_CELL': {
      const cellKey = `${action.payload.rowIndex}:${action.payload.columnId}`;
      const newSelectedCells = new Set<string>([cellKey]);

      return {
        ...state,
        selection: {
          ...state.selection,
          selectedCells: newSelectedCells,
          activeCell: action.payload,
        },
      };
    }

    case 'SELECT_CELL_RANGE': {
      const { start, end } = action.payload;
      const newSelectedCells = new Set<string>();

      const minRow = Math.min(start.rowIndex, end.rowIndex);
      const maxRow = Math.max(start.rowIndex, end.rowIndex);

      // For simplicity, we just store the range
      // Actual cell enumeration would need column order info
      for (let row = minRow; row <= maxRow; row++) {
        newSelectedCells.add(`${row}:${start.columnId}`);
      }

      return {
        ...state,
        selection: {
          ...state.selection,
          selectedCells: newSelectedCells,
          selectionRange: { start, end },
          activeCell: start,
        },
      };
    }

    // ==========================================
    // EDIT ACTIONS
    // ==========================================
    case 'EDIT_START':
      return {
        ...state,
        edit: {
          isEditing: true,
          cell: action.payload.cell,
          originalValue: action.payload.value,
          currentValue: action.payload.value,
          isDirty: false,
        },
      };

    case 'EDIT_CHANGE':
      return {
        ...state,
        edit: {
          ...state.edit,
          currentValue: action.payload.value,
          isDirty: state.edit.originalValue !== action.payload.value,
        },
      };

    case 'EDIT_COMMIT': {
      if (!state.edit.isEditing || !state.edit.cell) {
        return state;
      }

      // Add to history for undo support
      const newEdit: PendingEdit = {
        rowId: action.payload.rowId,
        columnId: action.payload.columnId,
        oldValue: state.edit.originalValue,
        newValue: state.edit.currentValue,
        timestamp: Date.now(),
      };

      // Trim history if too long
      const newHistory = [...state.editHistory.slice(0, state.historyIndex + 1), newEdit].slice(
        -PERFORMANCE.MAX_UNDO_HISTORY
      );

      return {
        ...state,
        edit: {
          isEditing: false,
          cell: null,
          originalValue: null,
          currentValue: null,
          isDirty: false,
        },
        editHistory: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'EDIT_CANCEL':
      return {
        ...state,
        edit: {
          isEditing: false,
          cell: null,
          originalValue: null,
          currentValue: null,
          isDirty: false,
        },
      };

    case 'EDIT_UNDO': {
      if (state.historyIndex < 0) {
        return state;
      }

      return {
        ...state,
        historyIndex: state.historyIndex - 1,
      };
    }

    case 'EDIT_REDO': {
      if (state.historyIndex >= state.editHistory.length - 1) {
        return state;
      }

      return {
        ...state,
        historyIndex: state.historyIndex + 1,
      };
    }

    // ==========================================
    // FILTER ACTIONS
    // ==========================================
    case 'FILTER_SET': {
      const existingIndex = state.filters.findIndex((f) => f.columnId === action.payload.columnId);

      const newFilters = [...state.filters];

      if (existingIndex >= 0) {
        newFilters[existingIndex] = action.payload;
      } else {
        newFilters.push(action.payload);
      }

      return {
        ...state,
        filters: newFilters,
      };
    }

    case 'FILTER_REMOVE': {
      return {
        ...state,
        filters: state.filters.filter((f) => f.columnId !== action.payload.columnId),
      };
    }

    case 'FILTER_CLEAR':
      return {
        ...state,
        filters: [],
      };

    // ==========================================
    // UI ACTIONS
    // ==========================================
    case 'SET_FOCUSED_CELL':
      return {
        ...state,
        focusedCell: action.payload,
      };

    case 'SET_SCROLLING':
      return {
        ...state,
        isScrolling: action.payload,
      };

    case 'SET_COLUMN_WIDTH': {
      const newWidths = new Map(state.columnWidths);
      newWidths.set(action.payload.columnId, action.payload.width);

      return {
        ...state,
        columnWidths: newWidths,
      };
    }

    default:
      return state;
  }
}

// ============================================
// HOOK
// ============================================

interface UseGridStateOptions {
  initialSort?: SortState | null;
  initialSelection?: Set<string | number>;
  selectionMode?: SelectionMode;
  onSortChange?: (sort: SortState | null) => void;
  onSelectionChange?: (selectedIds: Set<string | number>) => void;
  onCellChange?: (
    rowId: string | number,
    columnId: string,
    newValue: CellValue,
    oldValue: CellValue
  ) => void | Promise<void>;
}

export function useGridState(options: UseGridStateOptions = {}) {
  const {
    initialSort,
    initialSelection,
    selectionMode = 'multiple',
    onSortChange,
    onSelectionChange,
    onCellChange,
  } = options;

  const [state, dispatch] = useReducer(
    gridReducer,
    { initialSort, initialSelection, selectionMode },
    ({ initialSort, initialSelection, selectionMode }) =>
      createInitialGridState(initialSort, initialSelection, selectionMode)
  );

  // ==========================================
  // MEMOIZED ACTION DISPATCHERS
  // ==========================================

  const toggleSort = useCallback(
    (columnId: string) => {
      dispatch(gridActions.toggleSort(columnId));

      // Calculate new sort state for callback
      const currentSort = state.sort;
      let newSort: SortState | null;

      if (currentSort?.columnId !== columnId) {
        newSort = { columnId, direction: 'asc' };
      } else if (currentSort.direction === 'asc') {
        newSort = { columnId, direction: 'desc' };
      } else {
        newSort = null;
      }

      onSortChange?.(newSort);
    },
    [state.sort, onSortChange]
  );

  const selectRow = useCallback(
    (rowId: string | number, multi = false) => {
      dispatch(gridActions.selectRow(rowId, multi));

      // Calculate new selection for callback
      const newSelectedIds = new Set(state.selection.selectedRowIds);
      if (selectionMode === 'single' || !multi) {
        newSelectedIds.clear();
      }
      if (newSelectedIds.has(rowId)) {
        newSelectedIds.delete(rowId);
      } else {
        newSelectedIds.add(rowId);
      }

      onSelectionChange?.(newSelectedIds);
    },
    [state.selection.selectedRowIds, selectionMode, onSelectionChange]
  );

  const deselectAll = useCallback(() => {
    dispatch(gridActions.deselectAll());
    onSelectionChange?.(new Set());
  }, [onSelectionChange]);

  const selectAll = useCallback(
    (rowIds: (string | number)[]) => {
      dispatch(gridActions.selectAll(rowIds));
      onSelectionChange?.(new Set(rowIds));
    },
    [onSelectionChange]
  );

  const setActiveCell = useCallback((cell: CellCoordinate | null) => {
    dispatch(gridActions.setActiveCell(cell));
  }, []);

  const startEdit = useCallback((cell: CellCoordinate, value: CellValue) => {
    dispatch(gridActions.startEdit(cell, value));
  }, []);

  const changeEdit = useCallback((value: CellValue) => {
    dispatch(gridActions.changeEdit(value));
  }, []);

  const commitEdit = useCallback(
    async (rowId: string | number, columnId: string) => {
      // Always notify parent of current value (even if not dirty, to ensure sync)
      if (onCellChange && state.edit.currentValue !== undefined) {
        await onCellChange(rowId, columnId, state.edit.currentValue, state.edit.originalValue);
      }
      dispatch(gridActions.commitEdit(rowId, columnId));
    },
    [state.edit.currentValue, state.edit.originalValue, onCellChange]
  );

  const cancelEdit = useCallback(() => {
    dispatch(gridActions.cancelEdit());
  }, []);

  const undo = useCallback(() => {
    if (state.historyIndex >= 0) {
      const edit = state.editHistory[state.historyIndex];
      if (edit) {
        onCellChange?.(edit.rowId, edit.columnId, edit.oldValue, edit.newValue);
      }
      dispatch(gridActions.undo());
    }
  }, [state.historyIndex, state.editHistory, onCellChange]);

  const redo = useCallback(() => {
    if (state.historyIndex < state.editHistory.length - 1) {
      const edit = state.editHistory[state.historyIndex + 1];
      if (edit) {
        onCellChange?.(edit.rowId, edit.columnId, edit.newValue, edit.oldValue);
      }
      dispatch(gridActions.redo());
    }
  }, [state.historyIndex, state.editHistory, onCellChange]);

  const setColumnWidth = useCallback((columnId: string, width: number) => {
    dispatch(gridActions.setColumnWidth(columnId, width));
  }, []);

  // ==========================================
  // DERIVED STATE
  // ==========================================

  const canUndo = state.historyIndex >= 0;
  const canRedo = state.historyIndex < state.editHistory.length - 1;
  const selectedCount = state.selection.selectedRowIds.size;
  const hasSelection = selectedCount > 0;

  return {
    // State
    state,
    sort: state.sort,
    selection: state.selection,
    edit: state.edit,
    filters: state.filters,
    columnWidths: state.columnWidths,

    // Derived
    canUndo,
    canRedo,
    selectedCount,
    hasSelection,

    // Actions
    dispatch,
    toggleSort,
    selectRow,
    selectAll,
    deselectAll,
    setActiveCell,
    startEdit,
    changeEdit,
    commitEdit,
    cancelEdit,
    undo,
    redo,
    setColumnWidth,
  };
}

export type UseGridStateReturn = ReturnType<typeof useGridState>;

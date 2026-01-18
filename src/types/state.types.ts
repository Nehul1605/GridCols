/**
 * State Management Types
 * For useReducer-based grid state
 */

import type {
  CellValue,
  SortState,
  FilterState,
  SelectionState,
  EditState,
  CellCoordinate,
  PendingEdit,
  SelectionMode,
} from './grid.types';

// ============================================
// GRID STATE
// ============================================

/** Complete grid state */
export interface GridState {
  // Sorting
  sort: SortState | null;

  // Filtering
  filters: FilterState[];

  // Selection
  selection: SelectionState;

  // Editing
  edit: EditState;

  // Edit history for undo/redo
  editHistory: PendingEdit[];
  historyIndex: number;

  // UI State
  focusedCell: CellCoordinate | null;
  isScrolling: boolean;

  // Column widths (for resizing)
  columnWidths: Map<string, number>;
}

/** Initial grid state factory */
export const createInitialGridState = (
  initialSort?: SortState | null,
  initialSelection?: Set<string | number>,
  selectionMode: SelectionMode = 'multiple'
): GridState => ({
  sort: initialSort ?? null,
  filters: [],
  selection: {
    mode: selectionMode,
    selectedRowIds: initialSelection ?? new Set(),
    selectedCells: new Set(),
    activeCell: null,
    selectionRange: null,
  },
  edit: {
    isEditing: false,
    cell: null,
    originalValue: null,
    currentValue: null,
    isDirty: false,
  },
  editHistory: [],
  historyIndex: -1,
  focusedCell: null,
  isScrolling: false,
  columnWidths: new Map(),
});

// ============================================
// ACTION TYPES
// ============================================

/** Sort actions */
export type SortAction =
  | { type: 'SORT_SET'; payload: SortState }
  | { type: 'SORT_TOGGLE'; payload: { columnId: string } }
  | { type: 'SORT_CLEAR' };

/** Selection actions */
export type SelectionAction =
  | { type: 'SELECT_ROW'; payload: { rowId: string | number; multi?: boolean } }
  | { type: 'DESELECT_ROW'; payload: { rowId: string | number } }
  | { type: 'SELECT_ALL'; payload: { rowIds: (string | number)[] } }
  | { type: 'DESELECT_ALL' }
  | {
      type: 'SELECT_RANGE';
      payload: {
        startRowId: string | number;
        endRowId: string | number;
        rowIds: (string | number)[];
      };
    }
  | { type: 'SET_ACTIVE_CELL'; payload: CellCoordinate | null }
  | { type: 'SELECT_CELL'; payload: CellCoordinate }
  | { type: 'SELECT_CELL_RANGE'; payload: { start: CellCoordinate; end: CellCoordinate } };

/** Edit actions */
export type EditAction =
  | { type: 'EDIT_START'; payload: { cell: CellCoordinate; value: CellValue } }
  | { type: 'EDIT_CHANGE'; payload: { value: CellValue } }
  | { type: 'EDIT_COMMIT'; payload: { rowId: string | number; columnId: string } }
  | { type: 'EDIT_CANCEL' }
  | { type: 'EDIT_UNDO' }
  | { type: 'EDIT_REDO' };

/** Filter actions */
export type FilterAction =
  | { type: 'FILTER_SET'; payload: FilterState }
  | { type: 'FILTER_REMOVE'; payload: { columnId: string } }
  | { type: 'FILTER_CLEAR' };

/** UI actions */
export type UIAction =
  | { type: 'SET_FOCUSED_CELL'; payload: CellCoordinate | null }
  | { type: 'SET_SCROLLING'; payload: boolean }
  | { type: 'SET_COLUMN_WIDTH'; payload: { columnId: string; width: number } };

/** Combined action type */
export type GridAction = SortAction | SelectionAction | EditAction | FilterAction | UIAction;

// ============================================
// ACTION CREATORS
// ============================================

export const gridActions = {
  // Sort
  setSort: (sort: SortState): SortAction => ({ type: 'SORT_SET', payload: sort }),
  toggleSort: (columnId: string): SortAction => ({ type: 'SORT_TOGGLE', payload: { columnId } }),
  clearSort: (): SortAction => ({ type: 'SORT_CLEAR' }),

  // Selection
  selectRow: (rowId: string | number, multi = false): SelectionAction => ({
    type: 'SELECT_ROW',
    payload: { rowId, multi },
  }),
  deselectRow: (rowId: string | number): SelectionAction => ({
    type: 'DESELECT_ROW',
    payload: { rowId },
  }),
  selectAll: (rowIds: (string | number)[]): SelectionAction => ({
    type: 'SELECT_ALL',
    payload: { rowIds },
  }),
  deselectAll: (): SelectionAction => ({ type: 'DESELECT_ALL' }),
  setActiveCell: (cell: CellCoordinate | null): SelectionAction => ({
    type: 'SET_ACTIVE_CELL',
    payload: cell,
  }),

  // Edit
  startEdit: (cell: CellCoordinate, value: CellValue): EditAction => ({
    type: 'EDIT_START',
    payload: { cell, value },
  }),
  changeEdit: (value: CellValue): EditAction => ({ type: 'EDIT_CHANGE', payload: { value } }),
  commitEdit: (rowId: string | number, columnId: string): EditAction => ({
    type: 'EDIT_COMMIT',
    payload: { rowId, columnId },
  }),
  cancelEdit: (): EditAction => ({ type: 'EDIT_CANCEL' }),
  undo: (): EditAction => ({ type: 'EDIT_UNDO' }),
  redo: (): EditAction => ({ type: 'EDIT_REDO' }),

  // UI
  setFocusedCell: (cell: CellCoordinate | null): UIAction => ({
    type: 'SET_FOCUSED_CELL',
    payload: cell,
  }),
  setScrolling: (isScrolling: boolean): UIAction => ({
    type: 'SET_SCROLLING',
    payload: isScrolling,
  }),
  setColumnWidth: (columnId: string, width: number): UIAction => ({
    type: 'SET_COLUMN_WIDTH',
    payload: { columnId, width },
  }),
} as const;

/**
 * Event Type Definitions
 */

import type { CellCoordinate, CellValue, SortState } from './grid.types';

// ============================================
// GRID EVENTS
// ============================================

/** Cell change event */
export interface GridCellChangeEvent {
  rowId: string | number;
  columnId: string;
  oldValue: CellValue;
  newValue: CellValue;
  timestamp: number;
}

/** Selection change event */
export interface GridSelectionChangeEvent {
  selectedRowIds: Set<string | number>;
  selectedCells: Set<string>;
  activeCell: CellCoordinate | null;
}

/** Sort change event */
export interface GridSortChangeEvent {
  sort: SortState | null;
  previousSort: SortState | null;
}

/** Scroll event with virtualization data */
export interface GridScrollEvent {
  scrollTop: number;
  scrollLeft: number;
  visibleStartIndex: number;
  visibleEndIndex: number;
}

/** Row click event */
export interface GridRowClickEvent<TData> {
  row: TData;
  rowIndex: number;
  nativeEvent: React.MouseEvent;
}

/** Cell click event */
export interface GridCellClickEvent<TData> {
  row: TData;
  rowIndex: number;
  columnId: string;
  value: CellValue;
  nativeEvent: React.MouseEvent;
}

/** Keyboard navigation event */
export interface GridKeyboardEvent {
  key: string;
  cell: CellCoordinate | null;
  shiftKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  preventDefault: () => void;
}

// ============================================
// EVENT HANDLER TYPES
// ============================================

export type GridCellChangeHandler = (event: GridCellChangeEvent) => void | Promise<void>;
export type GridSelectionChangeHandler = (event: GridSelectionChangeEvent) => void;
export type GridSortChangeHandler = (event: GridSortChangeEvent) => void;
export type GridScrollHandler = (event: GridScrollEvent) => void;
export type GridRowClickHandler<TData> = (event: GridRowClickEvent<TData>) => void;
export type GridCellClickHandler<TData> = (event: GridCellClickEvent<TData>) => void;
export type GridKeyboardHandler = (event: GridKeyboardEvent) => void;

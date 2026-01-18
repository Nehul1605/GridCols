/**
 * useKeyboardNav - Keyboard Navigation Hook
 *
 * Implements roving tabindex pattern for grid navigation.
 * Supports: Arrow keys, Tab, Enter, Escape, Home, End, Page Up/Down
 */

import { useCallback, useRef, useEffect } from 'react';
import type { CellCoordinate, ColumnDef, BaseRow } from '../types';
import { KEYS } from '../constants/tokens';

// ============================================
// TYPES
// ============================================

interface UseKeyboardNavOptions<TData extends BaseRow> {
  /** Total row count */
  rowCount: number;
  /** Column definitions */
  columns: readonly ColumnDef<TData>[];
  /** Currently active cell */
  activeCell: CellCoordinate | null;
  /** Set active cell callback */
  setActiveCell: (cell: CellCoordinate | null) => void;
  /** Currently editing state */
  isEditing: boolean;
  /** Start editing callback */
  onStartEdit?: () => void;
  /** Cancel edit callback */
  onCancelEdit?: () => void;
  /** Commit edit callback */
  onCommitEdit?: () => void;
  /** Select row callback */
  onSelectRow?: (rowIndex: number, multi: boolean) => void;
  /** Scroll to index callback */
  scrollToIndex?: (index: number) => void;
  /** Page size for Page Up/Down */
  pageSize?: number;
  /** Is grid enabled */
  enabled?: boolean;
}

export interface UseKeyboardNavReturn {
  /** Keyboard event handler */
  onKeyDown: (event: React.KeyboardEvent) => void;
  /** Get tabindex for a cell */
  getTabIndex: (rowIndex: number, columnId: string) => 0 | -1;
  /** Ref for the container element */
  containerRef: React.RefObject<HTMLDivElement>;
  /** Focus the currently active cell */
  focusActiveCell: () => void;
}

// ============================================
// HOOK
// ============================================

export function useKeyboardNav<TData extends BaseRow>({
  rowCount,
  columns,
  activeCell,
  setActiveCell,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onCommitEdit,
  onSelectRow,
  scrollToIndex,
  pageSize = 10,
  enabled = true,
}: UseKeyboardNavOptions<TData>): UseKeyboardNavReturn {
  const containerRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Get visible columns (for navigation order)
  const visibleColumns = columns.filter((col) => col.visible !== false);
  const columnCount = visibleColumns.length;

  // ==========================================
  // NAVIGATION HELPERS
  // ==========================================

  const getColumnIndex = useCallback(
    (columnId: string): number => {
      return visibleColumns.findIndex((col) => col.id === columnId);
    },
    [visibleColumns]
  );

  const getColumnIdAtIndex = useCallback(
    (index: number): string | null => {
      const col = visibleColumns[index];
      return col?.id ?? null;
    },
    [visibleColumns]
  );

  const clampRow = useCallback(
    (row: number): number => {
      return Math.max(0, Math.min(row, rowCount - 1));
    },
    [rowCount]
  );

  const clampColumn = useCallback(
    (col: number): number => {
      return Math.max(0, Math.min(col, columnCount - 1));
    },
    [columnCount]
  );

  // ==========================================
  // CELL MOVEMENT
  // ==========================================

  const moveCell = useCallback(
    (rowDelta: number, colDelta: number, event?: React.KeyboardEvent) => {
      if (!activeCell || rowCount === 0 || columnCount === 0) {
        // Initialize to first cell if no active cell
        const firstColumnId = getColumnIdAtIndex(0);
        if (firstColumnId) {
          setActiveCell({ rowIndex: 0, columnId: firstColumnId });
        }
        return;
      }

      const currentColIndex = getColumnIndex(activeCell.columnId);
      if (currentColIndex === -1) return;

      let newRowIndex = clampRow(activeCell.rowIndex + rowDelta);
      let newColIndex = clampColumn(currentColIndex + colDelta);

      // Handle wrap-around for Tab navigation
      if (event?.key === KEYS.TAB) {
        if (colDelta > 0 && currentColIndex === columnCount - 1) {
          // Tab at end of row - go to next row
          if (activeCell.rowIndex < rowCount - 1) {
            newRowIndex = activeCell.rowIndex + 1;
            newColIndex = 0;
          }
        } else if (colDelta < 0 && currentColIndex === 0) {
          // Shift+Tab at start of row - go to previous row
          if (activeCell.rowIndex > 0) {
            newRowIndex = activeCell.rowIndex - 1;
            newColIndex = columnCount - 1;
          }
        }
      }

      const newColumnId = getColumnIdAtIndex(newColIndex);
      if (newColumnId) {
        setActiveCell({ rowIndex: newRowIndex, columnId: newColumnId });
        scrollToIndex?.(newRowIndex);
      }
    },
    [
      activeCell,
      rowCount,
      columnCount,
      getColumnIndex,
      getColumnIdAtIndex,
      clampRow,
      clampColumn,
      setActiveCell,
      scrollToIndex,
    ]
  );

  // ==========================================
  // KEYDOWN HANDLER
  // ==========================================

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!enabled) return;

      const { key, shiftKey, ctrlKey, metaKey } = event;
      const isModified = ctrlKey || metaKey;

      // When editing, only handle specific keys that should end editing
      // All other keys (including arrows) should pass through to the editor
      if (isEditing) {
        switch (key) {
          case KEYS.ESCAPE:
            event.preventDefault();
            onCancelEdit?.();
            return;
          case KEYS.ENTER:
            event.preventDefault();
            onCommitEdit?.();
            // Move to next row after commit
            moveCell(1, 0);
            return;
          case KEYS.TAB:
            event.preventDefault();
            onCommitEdit?.();
            moveCell(0, shiftKey ? -1 : 1, event);
            return;
          default:
            // IMPORTANT: Do nothing - let the editor handle all other keys
            // This includes arrow keys which should work normally in the input
            return;
        }
      }

      // Navigation and action keys when not editing
      switch (key) {
        // Arrow navigation
        case KEYS.ARROW_UP:
          event.preventDefault();
          moveCell(-1, 0);
          break;

        case KEYS.ARROW_DOWN:
          event.preventDefault();
          moveCell(1, 0);
          break;

        case KEYS.ARROW_LEFT:
          event.preventDefault();
          moveCell(0, -1);
          break;

        case KEYS.ARROW_RIGHT:
          event.preventDefault();
          moveCell(0, 1);
          break;

        // Tab navigation
        case KEYS.TAB:
          event.preventDefault();
          moveCell(0, shiftKey ? -1 : 1, event);
          break;

        // Page navigation
        case KEYS.PAGE_UP:
          event.preventDefault();
          moveCell(-pageSize, 0);
          break;

        case KEYS.PAGE_DOWN:
          event.preventDefault();
          moveCell(pageSize, 0);
          break;

        // Home/End
        case KEYS.HOME:
          event.preventDefault();
          if (isModified) {
            // Ctrl+Home - go to first cell
            const firstColId = getColumnIdAtIndex(0);
            if (firstColId) {
              setActiveCell({ rowIndex: 0, columnId: firstColId });
              scrollToIndex?.(0);
            }
          } else {
            // Home - go to first column in current row
            const firstColId = getColumnIdAtIndex(0);
            if (firstColId && activeCell) {
              setActiveCell({ rowIndex: activeCell.rowIndex, columnId: firstColId });
            }
          }
          break;

        case KEYS.END:
          event.preventDefault();
          if (isModified) {
            // Ctrl+End - go to last cell
            const lastColId = getColumnIdAtIndex(columnCount - 1);
            if (lastColId) {
              setActiveCell({ rowIndex: rowCount - 1, columnId: lastColId });
              scrollToIndex?.(rowCount - 1);
            }
          } else {
            // End - go to last column in current row
            const lastColId = getColumnIdAtIndex(columnCount - 1);
            if (lastColId && activeCell) {
              setActiveCell({ rowIndex: activeCell.rowIndex, columnId: lastColId });
            }
          }
          break;

        // Edit triggers
        case KEYS.ENTER:
        case KEYS.F2:
          event.preventDefault();
          onStartEdit?.();
          break;

        // Space for selection toggle
        case KEYS.SPACE:
          event.preventDefault();
          if (activeCell) {
            onSelectRow?.(activeCell.rowIndex, shiftKey);
          }
          break;

        // Select all (Ctrl+A)
        case KEYS.A:
          if (isModified) {
            event.preventDefault();
            // Selection handled by parent
          }
          break;

        default:
          // Let other keys pass through
          break;
      }
    },
    [
      enabled,
      isEditing,
      activeCell,
      rowCount,
      columnCount,
      pageSize,
      moveCell,
      getColumnIdAtIndex,
      setActiveCell,
      scrollToIndex,
      onStartEdit,
      onCancelEdit,
      onCommitEdit,
      onSelectRow,
    ]
  );

  // ==========================================
  // TAB INDEX MANAGEMENT (Roving TabIndex)
  // ==========================================

  const getTabIndex = useCallback(
    (rowIndex: number, columnId: string): 0 | -1 => {
      // Only the active cell should be tabbable
      if (!activeCell) {
        // If no active cell, make first cell tabbable
        return rowIndex === 0 && columnId === getColumnIdAtIndex(0) ? 0 : -1;
      }

      return activeCell.rowIndex === rowIndex && activeCell.columnId === columnId ? 0 : -1;
    },
    [activeCell, getColumnIdAtIndex]
  );

  // ==========================================
  // FOCUS MANAGEMENT
  // ==========================================

  const focusActiveCell = useCallback(() => {
    if (!activeCell) return;

    const cellKey = `${activeCell.rowIndex}:${activeCell.columnId}`;
    const cellElement = cellRefs.current.get(cellKey);

    if (cellElement) {
      cellElement.focus();
    }
  }, [activeCell]);

  // Focus active cell when it changes
  useEffect(() => {
    if (activeCell && !isEditing) {
      // Small delay to ensure DOM is updated
      requestAnimationFrame(() => {
        focusActiveCell();
      });
    }
  }, [activeCell, isEditing, focusActiveCell]);

  return {
    onKeyDown,
    getTabIndex,
    containerRef,
    focusActiveCell,
  };
}

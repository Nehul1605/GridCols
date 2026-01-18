/**
 * useSelection - Multi-cell/row selection hook
 */

import { useCallback, useMemo } from 'react';
import type { CellCoordinate } from '../types';

interface UseSelectionOptions {
  /** Selected row IDs */
  selectedRowIds: Set<string | number>;
  /** Selected cells (format: "rowIndex:columnId") */
  selectedCells: Set<string>;
  /** Active cell coordinate */
  activeCell: CellCoordinate | null;
  /** Selection mode */
  mode: 'none' | 'single' | 'multiple' | 'range';
}

interface UseSelectionReturn {
  /** Check if row is selected */
  isRowSelected: (rowId: string | number) => boolean;
  /** Check if cell is selected */
  isCellSelected: (rowIndex: number, columnId: string) => boolean;
  /** Check if cell is active */
  isCellActive: (rowIndex: number, columnId: string) => boolean;
  /** Get selection count */
  selectionCount: number;
  /** Check if has any selection */
  hasSelection: boolean;
}

export function useSelection({
  selectedRowIds,
  selectedCells,
  activeCell,
  mode,
}: UseSelectionOptions): UseSelectionReturn {
  const isRowSelected = useCallback(
    (rowId: string | number): boolean => {
      if (mode === 'none') return false;
      return selectedRowIds.has(rowId);
    },
    [selectedRowIds, mode]
  );

  const isCellSelected = useCallback(
    (rowIndex: number, columnId: string): boolean => {
      const cellKey = `${rowIndex}:${columnId}`;
      return selectedCells.has(cellKey);
    },
    [selectedCells]
  );

  const isCellActive = useCallback(
    (rowIndex: number, columnId: string): boolean => {
      if (!activeCell) return false;
      return activeCell.rowIndex === rowIndex && activeCell.columnId === columnId;
    },
    [activeCell]
  );

  const selectionCount = useMemo(() => {
    return selectedRowIds.size + selectedCells.size;
  }, [selectedRowIds, selectedCells]);

  const hasSelection = selectionCount > 0;

  return {
    isRowSelected,
    isCellSelected,
    isCellActive,
    selectionCount,
    hasSelection,
  };
}

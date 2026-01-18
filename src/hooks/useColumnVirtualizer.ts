/**
 * useColumnVirtualizer - Horizontal Column Virtualization
 *
 * Implements column virtualization for wide grids.
 * Only renders visible columns + pinned columns.
 * Supports pinned left and pinned right columns.
 */

import { useMemo, useCallback, useState, useRef } from 'react';
import type { ColumnDef, BaseRow } from '../types';

// ============================================
// TYPES
// ============================================

export interface VirtualColumn<TData extends BaseRow> {
  /** Original column definition */
  column: ColumnDef<TData>;
  /** Index in the visible columns array */
  index: number;
  /** Offset from left edge (for positioning) */
  offsetLeft: number;
  /** Computed width in pixels */
  width: number;
  /** Whether this is a pinned column */
  isPinned: 'left' | 'right' | false;
}

interface UseColumnVirtualizerOptions<TData extends BaseRow> {
  /** All column definitions */
  columns: readonly ColumnDef<TData>[];
  /** Container width in pixels */
  containerWidth: number;
  /** Default column width */
  defaultColumnWidth?: number;
  /** Column widths override map */
  columnWidths?: Map<string, number>;
  /** Enable column virtualization (default: true) */
  enabled?: boolean;
}

interface UseColumnVirtualizerReturn<TData extends BaseRow> {
  /** Columns pinned to the left */
  pinnedLeftColumns: VirtualColumn<TData>[];
  /** Columns pinned to the right */
  pinnedRightColumns: VirtualColumn<TData>[];
  /** Visible scrollable columns (virtualized) */
  visibleColumns: VirtualColumn<TData>[];
  /** All virtual columns for rendering */
  allVirtualColumns: VirtualColumn<TData>[];
  /** Total width of all columns */
  totalWidth: number;
  /** Width of pinned left section */
  pinnedLeftWidth: number;
  /** Width of pinned right section */
  pinnedRightWidth: number;
  /** Current horizontal scroll position */
  scrollLeft: number;
  /** Scroll handler for horizontal scrolling */
  onHorizontalScroll: (scrollLeft: number) => void;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_COLUMN_WIDTH = 150;
const COLUMN_OVERSCAN = 1; // Extra columns to render on each side

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useColumnVirtualizer<TData extends BaseRow>({
  columns,
  containerWidth,
  defaultColumnWidth = DEFAULT_COLUMN_WIDTH,
  columnWidths = new Map(),
  enabled = true,
}: UseColumnVirtualizerOptions<TData>): UseColumnVirtualizerReturn<TData> {
  const [scrollLeft, setScrollLeft] = useState(0);
  const lastScrollLeftRef = useRef(0);

  // ==========================================
  // COLUMN WIDTH CALCULATION
  // ==========================================

  const getColumnWidth = useCallback(
    (column: ColumnDef<TData>): number => {
      // Check if we have an override from column widths map
      const override = columnWidths.get(column.id);
      if (override !== undefined) return override;

      // Check column definition
      if (typeof column.width === 'number') {
        return column.width;
      }

      // Use default width
      return column.minWidth ?? defaultColumnWidth;
    },
    [columnWidths, defaultColumnWidth]
  );

  // ==========================================
  // SEPARATE PINNED AND SCROLLABLE COLUMNS
  // ==========================================

  const { pinnedLeft, pinnedRight, scrollable, totalWidth, pinnedLeftWidth, pinnedRightWidth } =
    useMemo(() => {
      const visibleColumns = columns.filter((c) => c.visible !== false);

      const left: Array<{ column: ColumnDef<TData>; width: number }> = [];
      const right: Array<{ column: ColumnDef<TData>; width: number }> = [];
      const center: Array<{ column: ColumnDef<TData>; width: number }> = [];

      let leftWidth = 0;
      let rightWidth = 0;
      let centerWidth = 0;

      for (const column of visibleColumns) {
        const width = getColumnWidth(column);

        if (column.pinned === 'left') {
          left.push({ column, width });
          leftWidth += width;
        } else if (column.pinned === 'right') {
          right.push({ column, width });
          rightWidth += width;
        } else {
          center.push({ column, width });
          centerWidth += width;
        }
      }

      return {
        pinnedLeft: left,
        pinnedRight: right,
        scrollable: center,
        totalWidth: leftWidth + centerWidth + rightWidth,
        pinnedLeftWidth: leftWidth,
        pinnedRightWidth: rightWidth,
      };
    }, [columns, getColumnWidth]);

  // ==========================================
  // VIRTUALIZED SCROLLABLE COLUMNS
  // ==========================================

  const visibleScrollableColumns = useMemo(() => {
    if (!enabled || scrollable.length === 0) {
      // No virtualization - return all columns
      let offset = pinnedLeftWidth;
      return scrollable.map(({ column, width }, index) => {
        const virtual: VirtualColumn<TData> = {
          column,
          index: pinnedLeft.length + index,
          offsetLeft: offset,
          width,
          isPinned: false,
        };
        offset += width;
        return virtual;
      });
    }

    // Available width for scrollable columns
    const availableWidth = containerWidth - pinnedLeftWidth - pinnedRightWidth;
    if (availableWidth <= 0) return [];

    // Find first visible column
    let accumulatedWidth = 0;
    let startIndex = 0;

    for (let i = 0; i < scrollable.length; i++) {
      const item = scrollable[i];
      if (!item) continue;

      if (accumulatedWidth + item.width > scrollLeft) {
        startIndex = i;
        break;
      }
      accumulatedWidth += item.width;
    }

    // Apply overscan
    startIndex = Math.max(0, startIndex - COLUMN_OVERSCAN);

    // Find last visible column
    let endIndex = startIndex;
    let visibleWidth = 0;

    // Reset accumulated width to start position
    accumulatedWidth = 0;
    for (let i = 0; i < startIndex; i++) {
      const item = scrollable[i];
      if (item) accumulatedWidth += item.width;
    }

    for (let i = startIndex; i < scrollable.length; i++) {
      const item = scrollable[i];
      if (!item) continue;

      visibleWidth += item.width;
      endIndex = i;

      if (visibleWidth > availableWidth + scrollLeft - accumulatedWidth) {
        break;
      }
    }

    // Apply overscan to end
    endIndex = Math.min(scrollable.length - 1, endIndex + COLUMN_OVERSCAN);

    // Build virtual columns
    const result: VirtualColumn<TData>[] = [];
    let offset = pinnedLeftWidth;

    // Calculate offset for start index
    for (let i = 0; i < startIndex; i++) {
      const item = scrollable[i];
      if (item) offset += item.width;
    }

    for (let i = startIndex; i <= endIndex; i++) {
      const item = scrollable[i];
      if (!item) continue;

      result.push({
        column: item.column,
        index: pinnedLeft.length + i,
        offsetLeft: offset,
        width: item.width,
        isPinned: false,
      });
      offset += item.width;
    }

    return result;
  }, [enabled, scrollable, scrollLeft, containerWidth, pinnedLeftWidth, pinnedRightWidth, pinnedLeft.length]);

  // ==========================================
  // PINNED COLUMN VIRTUAL ITEMS
  // ==========================================

  const pinnedLeftColumns = useMemo((): VirtualColumn<TData>[] => {
    let offset = 0;
    return pinnedLeft.map(({ column, width }, index) => {
      const virtual: VirtualColumn<TData> = {
        column,
        index,
        offsetLeft: offset,
        width,
        isPinned: 'left',
      };
      offset += width;
      return virtual;
    });
  }, [pinnedLeft]);

  const pinnedRightColumns = useMemo((): VirtualColumn<TData>[] => {
    let offset = containerWidth - pinnedRightWidth;
    return pinnedRight.map(({ column, width }, index) => {
      const virtual: VirtualColumn<TData> = {
        column,
        index: pinnedLeft.length + scrollable.length + index,
        offsetLeft: offset,
        width,
        isPinned: 'right',
      };
      offset += width;
      return virtual;
    });
  }, [pinnedRight, containerWidth, pinnedRightWidth, pinnedLeft.length, scrollable.length]);

  // ==========================================
  // COMBINED COLUMNS
  // ==========================================

  const allVirtualColumns = useMemo((): VirtualColumn<TData>[] => {
    return [...pinnedLeftColumns, ...visibleScrollableColumns, ...pinnedRightColumns];
  }, [pinnedLeftColumns, visibleScrollableColumns, pinnedRightColumns]);

  // ==========================================
  // SCROLL HANDLER
  // ==========================================

  const onHorizontalScroll = useCallback((newScrollLeft: number) => {
    lastScrollLeftRef.current = newScrollLeft;
    setScrollLeft(newScrollLeft);
  }, []);

  return {
    pinnedLeftColumns,
    pinnedRightColumns,
    visibleColumns: visibleScrollableColumns,
    allVirtualColumns,
    totalWidth,
    pinnedLeftWidth,
    pinnedRightWidth,
    scrollLeft,
    onHorizontalScroll,
  };
}

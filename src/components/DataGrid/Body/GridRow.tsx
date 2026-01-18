/**
 * GridRow - Memoized row component for virtualization
 *
 * Performance critical - uses custom comparison function
 * to prevent unnecessary re-renders of visible rows.
 * Supports pinned columns (left/right).
 */

import React, { useCallback, useMemo } from 'react';
import type { GridRowProps, BaseRow, CellValue } from '../../../types';
import { GridCell } from './GridCell';
import { ARIA } from '../../../constants/tokens';
import { getRowId } from '../../../utils/a11y';

// Extended props with pinned column support
interface ExtendedGridRowProps<TData extends BaseRow> extends GridRowProps<TData> {
  pinnedLeftWidth?: number;
  pinnedRightWidth?: number;
  /** Enable column resizing from cells */
  enableResize?: boolean;
  /** Callback when column is resized */
  onColumnResize?: (columnId: string, width: number) => void;
}

/**
 * Custom props comparison for memoization
 * This is THE critical performance optimization
 */
function areRowPropsEqual<TData extends BaseRow>(
  prev: ExtendedGridRowProps<TData>,
  next: ExtendedGridRowProps<TData>
): boolean {
  // Quick structural checks
  if (prev.index !== next.index) return false;
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.isEven !== next.isEven) return false;
  if (prev.activeColumnId !== next.activeColumnId) return false;
  if (prev.editingColumnId !== next.editingColumnId) return false;
  if (prev.pinnedLeftWidth !== next.pinnedLeftWidth) return false;
  if (prev.pinnedRightWidth !== next.pinnedRightWidth) return false;
  if (prev.enableResize !== next.enableResize) return false;

  // Style position check (critical for virtualization)
  if (prev.style.top !== next.style.top) return false;
  if (prev.style.height !== next.style.height) return false;

  // Reference equality for data (assumes immutable updates)
  if (prev.data !== next.data) return false;

  // Reference equality for columns array
  if (prev.columns !== next.columns) return false;

  return true;
}

function GridRowInner<TData extends BaseRow>({
  index,
  data,
  columns,
  style,
  isSelected,
  isEven,
  activeColumnId,
  editingColumnId,
  onCellClick,
  onCellDoubleClick,
  onCellChange,
  onEditComplete,
  onEditCancel,
  pinnedLeftWidth = 0,
  pinnedRightWidth = 0,
  enableResize = false,
  onColumnResize,
}: ExtendedGridRowProps<TData>): React.ReactElement {
  // Generate row ID for ARIA
  const rowId = useMemo(() => getRowId('grid', index), [index]);

  // Separate pinned and scrollable columns
  const { pinnedLeft, pinnedRight, scrollable } = useMemo(() => {
    const left = columns.filter((c) => c.pinned === 'left' && c.visible !== false);
    const right = columns.filter((c) => c.pinned === 'right' && c.visible !== false);
    const center = columns.filter((c) => c.pinned !== 'left' && c.pinned !== 'right' && c.visible !== false);
    return { pinnedLeft: left, pinnedRight: right, scrollable: center };
  }, [columns]);

  // Row click handler for selection
  const handleRowClick = useCallback((e: React.MouseEvent) => {
    // Only select row if clicking on row background, not cells
    if (e.target === e.currentTarget) {
      // Selection is handled at cell level
    }
  }, []);

  // Background class based on state
  const bgClass = useMemo(() => {
    if (isSelected) return 'bg-grid-row-selected';
    return isEven ? 'bg-grid-row-even' : 'bg-grid-row-odd';
  }, [isSelected, isEven]);

  // Render a cell for a column
  const renderCell = (column: typeof columns[number], isPinned: 'left' | 'right' | false = false) => {
    const cellValue = data[column.accessorKey] as CellValue;
    const isActive = activeColumnId === column.id;
    const isEditing = editingColumnId === column.id;

    return (
      <GridCell
        key={column.id}
        column={column}
        value={cellValue}
        row={data}
        rowIndex={index}
        isActive={isActive}
        isEditing={isEditing}
        onClick={() => onCellClick(index, column.id)}
        onDoubleClick={() => onCellDoubleClick(index, column.id)}
        onChange={(value) => onCellChange(column.id, value)}
        onEditComplete={onEditComplete}
        onEditCancel={onEditCancel}
        isPinned={isPinned}
        enableResize={enableResize}
        onResize={onColumnResize}
      />
    );
  };

  return (
    <div
      id={rowId}
      role={ARIA.ROW_ROLE}
      aria-rowindex={index + 2} // +2 because header is row 1 (1-indexed)
      aria-selected={isSelected}
      style={style}
      onClick={handleRowClick}
      className={`
        grid-row
        absolute left-0
        flex items-center
        border-b border-grid-border
        ${bgClass}
        hover:bg-grid-row-hover
        transition-colors duration-75
      `}
    >
      {/* Pinned Left Columns */}
      {pinnedLeft.length > 0 && (
        <div
          className={`flex sticky left-0 z-10 ${bgClass} border-r border-grid-border`}
          style={{ width: pinnedLeftWidth }}
        >
          {pinnedLeft.map((column) => renderCell(column, 'left'))}
        </div>
      )}

      {/* Scrollable Columns */}
      <div className="flex flex-1">
        {scrollable.map((column) => renderCell(column, false))}
      </div>

      {/* Pinned Right Columns */}
      {pinnedRight.length > 0 && (
        <div
          className={`flex sticky right-0 z-10 ${bgClass} border-l border-grid-border`}
          style={{ width: pinnedRightWidth }}
        >
          {pinnedRight.map((column) => renderCell(column, 'right'))}
        </div>
      )}
    </div>
  );
}

// Export memoized version with custom comparison
export const GridRow = React.memo(GridRowInner, areRowPropsEqual) as typeof GridRowInner;


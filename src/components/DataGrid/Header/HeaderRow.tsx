/**
 * HeaderRow - Container for header cells
 *
 * Supports:
 * - Multi-sort indicators with priority numbers
 * - Drag and drop column reordering
 * - Pinned columns (left/right)
 */

import React from 'react';
import type { ColumnDef, SortState, BaseRow } from '../../../types';
import { HeaderCell } from './HeaderCell';
import { ARIA, GRID_TOKENS } from '../../../constants/tokens';

interface HeaderRowProps<TData extends BaseRow> {
  columns: readonly ColumnDef<TData>[];
  sortState: SortState | null;
  onSort: (columnId: string) => void;
  onResize?: (columnId: string, width: number) => void;
  height?: number;
  /** Get sort priority for multi-sort display */
  getSortPriority?: (columnId: string) => number | null;
  /** Width of pinned left columns */
  pinnedLeftWidth?: number;
  /** Width of pinned right columns */
  pinnedRightWidth?: number;
  /** Drag start handler */
  onDragStart?: (columnId: string) => void;
  /** Drag over handler */
  onDragOver?: (columnId: string) => void;
  /** Drag end handler */
  onDragEnd?: () => void;
  /** Pin/unpin handler */
  onPin?: (columnId: string, pinned: 'left' | 'right' | false) => void;
}

export function HeaderRow<TData extends BaseRow>({
  columns,
  sortState,
  onSort,
  onResize,
  height = GRID_TOKENS.HEADER_HEIGHT,
  getSortPriority,
  pinnedLeftWidth = 0,
  pinnedRightWidth = 0,
  onDragStart,
  onDragOver,
  onDragEnd,
  onPin,
}: HeaderRowProps<TData>): React.ReactElement {
  // Separate pinned and scrollable columns
  const pinnedLeft = columns.filter((c) => c.pinned === 'left' && c.visible !== false);
  const pinnedRight = columns.filter((c) => c.pinned === 'right' && c.visible !== false);
  const scrollable = columns.filter((c) => c.pinned !== 'left' && c.pinned !== 'right' && c.visible !== false);

  const renderHeaderCell = (column: ColumnDef<TData>, isPinned: 'left' | 'right' | false = false) => (
    <HeaderCell
      key={column.id}
      column={column}
      sortState={sortState}
      onSort={onSort}
      onResize={onResize}
      sortPriority={getSortPriority?.(column.id) ?? null}
      draggable={!isPinned && !!onDragStart}
      onDragStart={onDragStart ? () => onDragStart(column.id) : undefined}
      onDragOver={onDragOver ? () => onDragOver(column.id) : undefined}
      onDragEnd={onDragEnd}
      onPin={onPin}
      isPinned={isPinned}
    />
  );

  return (
    <div
      role={ARIA.ROW_ROLE}
      aria-rowindex={1}
      style={{ height }}
      className="
        flex items-center
        bg-grid-header-bg
        border-b border-grid-border
        z-grid-header
        sticky top-0
        shadow-sm
        relative
      "
    >
      {/* Pinned Left Columns */}
      {pinnedLeft.length > 0 && (
        <div
          className="flex sticky left-0 z-10 bg-grid-header-bg border-r border-grid-border"
          style={{ width: pinnedLeftWidth }}
        >
          {pinnedLeft.map((column) => renderHeaderCell(column, 'left'))}
        </div>
      )}

      {/* Scrollable Columns */}
      <div className="flex flex-1">
        {scrollable.map((column) => renderHeaderCell(column, false))}
      </div>

      {/* Pinned Right Columns */}
      {pinnedRight.length > 0 && (
        <div
          className="flex sticky right-0 z-10 bg-grid-header-bg border-l border-grid-border"
          style={{ width: pinnedRightWidth }}
        >
          {pinnedRight.map((column) => renderHeaderCell(column, 'right'))}
        </div>
      )}
    </div>
  );
}


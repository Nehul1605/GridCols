/**
 * HeaderCell - Individual header cell with sort functionality
 *
 * Supports:
 * - Single and multi-column sorting
 * - Column resizing
 * - Drag and drop reordering
 * - Pin/unpin columns
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { HeaderCellProps, BaseRow } from '../../../types';
import { SortIndicator } from './SortIndicator';
import { ARIA, GRID_TOKENS } from '../../../constants/tokens';
import { getAriaSortValue, getHeaderCellId } from '../../../utils/a11y';

interface ExtendedHeaderCellProps<TData extends BaseRow> extends HeaderCellProps<TData> {
  /** Sort priority for multi-sort display (1, 2, 3, etc.) */
  sortPriority?: number | null;
  /** Whether this cell can be dragged */
  draggable?: boolean;
  /** Drag start handler */
  onDragStart?: () => void;
  /** Drag over handler */
  onDragOver?: () => void;
  /** Drag end handler */
  onDragEnd?: () => void;
  /** Pin/unpin handler */
  onPin?: (columnId: string, pinned: 'left' | 'right' | false) => void;
  /** Whether this column is pinned */
  isPinned?: 'left' | 'right' | false;
}

export function HeaderCell<TData extends BaseRow>({
  column,
  sortState,
  onSort,
  onResize,
  sortPriority,
  draggable = false,
  onDragStart,
  onDragOver,
  onDragEnd,
  onPin,
  isPinned = false,
}: ExtendedHeaderCellProps<TData>): React.ReactElement {
  const cellRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPinMenu, setShowPinMenu] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Check if this column is currently sorted
  const isSorted = sortState?.columnId === column.id;
  const sortDirection = isSorted ? sortState.direction : null;

  // Handle click for sorting
  const handleClick = useCallback(() => {
    if (column.sortable !== false) {
      onSort(column.id);
    }
  }, [column.id, column.sortable, onSort]);

  // Handle keyboard activation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if ((e.key === 'Enter' || e.key === ' ') && column.sortable !== false) {
        e.preventDefault();
        onSort(column.id);
      }
    },
    [column.id, column.sortable, onSort]
  );

  // Resize handlers
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!column.resizable || !onResize) return;

      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = cellRef.current?.offsetWidth ?? GRID_TOKENS.DEFAULT_COLUMN_WIDTH;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startXRef.current;
        const newWidth = Math.max(
          column.minWidth ?? GRID_TOKENS.MIN_COLUMN_WIDTH,
          Math.min(column.maxWidth ?? GRID_TOKENS.MAX_COLUMN_WIDTH, startWidthRef.current + delta)
        );
        onResize(column.id, newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [column.id, column.resizable, column.minWidth, column.maxWidth, onResize]
  );

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      if (!draggable) return;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', column.id);
      onDragStart?.();
    },
    [draggable, column.id, onDragStart]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!draggable) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
      onDragOver?.();
    },
    [draggable, onDragOver]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      onDragEnd?.();
    },
    [onDragEnd]
  );

  // Context menu for pinning
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (onPin) {
        e.preventDefault();
        setShowPinMenu(!showPinMenu);
      }
    },
    [onPin, showPinMenu]
  );

  // Width style
  const widthStyle = useMemo((): React.CSSProperties => {
    if (typeof column.width === 'number') {
      return { width: column.width, minWidth: column.minWidth, maxWidth: column.maxWidth };
    }
    return {};
  }, [column.width, column.minWidth, column.maxWidth]);

  // Flex class
  const flexClass = useMemo(() => {
    if (typeof column.width === 'string') {
      return `flex-${column.width}`;
    }
    return 'flex-1';
  }, [column.width]);

  // Custom header render
  const headerContent = column.renderHeader ? column.renderHeader(column) : column.header;

  return (
    <div
      ref={cellRef}
      id={getHeaderCellId('grid', column.id)}
      role={ARIA.COLUMNHEADER_ROLE}
      aria-sort={column.sortable !== false ? getAriaSortValue(sortDirection) : undefined}
      tabIndex={column.sortable !== false ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onContextMenu={handleContextMenu}
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={widthStyle}
      className={`
        ${flexClass}
        relative
        px-3 h-full
        flex items-center
        font-semibold text-gray-700
        border-r border-grid-border last:border-r-0
        ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-200' : ''}
        ${isDragOver ? 'bg-blue-100 border-l-2 border-l-blue-500' : ''}
        ${isPinned ? 'bg-gray-100' : ''}
        select-none
        transition-colors duration-75
        focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-grid-cell-focus
      `}
    >
      {/* Pin indicator */}
      {isPinned && (
        <span className="mr-1 text-xs text-gray-400" title={`Pinned ${isPinned}`}>
          📌
        </span>
      )}

      {/* Header text */}
      <span className="truncate">{headerContent}</span>

      {/* Multi-sort priority badge */}
      {sortPriority !== null && sortPriority !== undefined && (
        <span className="ml-1 px-1 text-xs bg-blue-500 text-white rounded-full min-w-[16px] text-center">
          {sortPriority}
        </span>
      )}

      {/* Sort indicator */}
      {column.sortable !== false && <SortIndicator direction={sortDirection} isActive={isSorted} />}

      {/* Pin context menu */}
      {showPinMenu && onPin && (
        <div
          className="absolute top-full left-0 mt-1 bg-white border rounded shadow-lg z-50 min-w-[100px]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-3 py-1 text-left text-xs hover:bg-gray-100"
            onClick={() => {
              onPin(column.id, 'left');
              setShowPinMenu(false);
            }}
          >
            Pin Left
          </button>
          <button
            className="w-full px-3 py-1 text-left text-xs hover:bg-gray-100"
            onClick={() => {
              onPin(column.id, 'right');
              setShowPinMenu(false);
            }}
          >
            Pin Right
          </button>
          {isPinned && (
            <button
              className="w-full px-3 py-1 text-left text-xs hover:bg-gray-100 border-t"
              onClick={() => {
                onPin(column.id, false);
                setShowPinMenu(false);
              }}
            >
              Unpin
            </button>
          )}
        </div>
      )}

      {/* Resize handle */}
      {column.resizable && onResize && (
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handleResizeStart}
          className={`
            absolute right-0 top-0 bottom-0 w-1
            cursor-col-resize
            hover:bg-blue-400
            ${isResizing ? 'bg-blue-500' : 'bg-transparent'}
            transition-colors
          `}
        />
      )}
    </div>
  );
}


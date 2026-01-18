/**
 * GridCell - Individual cell with editing support
 * Uses memo for performance optimization.
 * Supports pinned columns and column resizing.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { GridCellProps, BaseRow } from '../../../types';
import { TextEditor, NumberEditor, SelectEditor } from '../Editors';
import { ARIA, GRID_TOKENS } from '../../../constants/tokens';

// Extended props with pinned support and resize
interface ExtendedGridCellProps<TData extends BaseRow> extends GridCellProps<TData> {
  isPinned?: 'left' | 'right' | false;
  /** Enable column resize from this cell */
  enableResize?: boolean;
  /** Callback when column is resized */
  onResize?: (columnId: string, width: number) => void;
}

/**
 * Custom comparison for cell memoization
 * Only re-render when these specific props change
 */
function areCellPropsEqual<TData extends BaseRow>(
  prev: ExtendedGridCellProps<TData>,
  next: ExtendedGridCellProps<TData>
): boolean {
  return (
    prev.value === next.value &&
    prev.isActive === next.isActive &&
    prev.isEditing === next.isEditing &&
    prev.column.id === next.column.id &&
    prev.column.width === next.column.width &&
    prev.rowIndex === next.rowIndex &&
    prev.isPinned === next.isPinned &&
    prev.enableResize === next.enableResize
  );
}

function GridCellInner<TData extends BaseRow>({
  column,
  value,
  row,
  rowIndex,
  isActive,
  isEditing,
  onClick,
  onDoubleClick,
  onChange,
  onEditComplete,
  onEditCancel,
  isPinned = false,
  enableResize = false,
  onResize,
}: ExtendedGridCellProps<TData>): React.ReactElement {
  const cellRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  // Handle keyboard activation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  // Column resize handler
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      if (!enableResize || !onResize || !column.resizable) return;

      e.preventDefault();
      e.stopPropagation();

      setIsResizing(true);
      const startX = e.clientX;
      const startWidth = cellRef.current?.offsetWidth ?? (typeof column.width === 'number' ? column.width : GRID_TOKENS.DEFAULT_COLUMN_WIDTH);

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - startX;
        const newWidth = Math.max(
          column.minWidth ?? GRID_TOKENS.MIN_COLUMN_WIDTH,
          Math.min(column.maxWidth ?? GRID_TOKENS.MAX_COLUMN_WIDTH, startWidth + delta)
        );
        onResize(column.id, newWidth);
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [enableResize, onResize, column]
  );

  // Render appropriate editor based on column type
  const renderEditor = useMemo(() => {
    if (!isEditing) return null;

    const editorProps = {
      value,
      onChange,
      onComplete: onEditComplete,
      onCancel: onEditCancel,
      autoFocus: true,
    };

    switch (column.editorType) {
      case 'number':
        return <NumberEditor {...editorProps} />;
      case 'select':
        return <SelectEditor {...editorProps} options={column.selectOptions} />;
      case 'text':
      default:
        return <TextEditor {...editorProps} />;
    }
  }, [
    isEditing,
    value,
    onChange,
    onEditComplete,
    onEditCancel,
    column.editorType,
    column.selectOptions,
  ]);

  // Display value formatting
  const displayValue = useMemo(() => {
    if (column.renderCell) {
      return column.renderCell(value, row, rowIndex);
    }

    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'boolean') {
      return value ? '✓' : '✗';
    }

    return String(value);
  }, [column, value, row, rowIndex]);

  // Cell alignment class
  const alignClass = useMemo(() => {
    switch (column.align) {
      case 'center':
        return 'justify-center text-center';
      case 'right':
        return 'justify-end text-right';
      default:
        return 'justify-start text-left';
    }
  }, [column.align]);

  // Width style
  const widthStyle = useMemo((): React.CSSProperties => {
    if (typeof column.width === 'number') {
      return { width: column.width, minWidth: column.minWidth, maxWidth: column.maxWidth };
    }
    return {};
  }, [column.width, column.minWidth, column.maxWidth]);

  // Flex class for flexible columns
  const flexClass = useMemo(() => {
    if (typeof column.width === 'string') {
      return `flex-${column.width}`;
    }
    return 'flex-1';
  }, [column.width]);

  return (
    <div
      role={ARIA.GRIDCELL_ROLE}
      aria-colindex={rowIndex + 1}
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      style={widthStyle}
      className={`
        grid-cell grid-cell-focusable
        ${flexClass}
        relative
        px-3 h-full flex items-center
        ${alignClass}
        border-r border-grid-border last:border-r-0
        ${isActive ? 'ring-2 ring-inset ring-grid-cell-focus bg-blue-50' : ''}
        ${isEditing ? 'p-0' : 'truncate'}
        ${isPinned ? 'bg-gray-50' : ''}
        ${isResizing ? 'select-none' : ''}
        transition-colors duration-75
        focus:outline-none focus-visible:ring-2 focus-visible:ring-grid-cell-focus
      `}
    >
      {/* Cell content */}
      <span className={isEditing ? 'w-full h-full' : 'truncate flex-1'}>
        {isEditing ? renderEditor : displayValue}
      </span>

      {/* Column resize handle - visible on hover */}
      {enableResize && column.resizable !== false && (
        <div
          role="separator"
          aria-orientation="vertical"
          onMouseDown={handleResizeStart}
          className={`
            absolute right-0 top-0 bottom-0 w-1.5
            cursor-col-resize
            hover:bg-blue-400
            ${isResizing ? 'bg-blue-600 w-2' : 'bg-transparent hover:bg-blue-400'}
            transition-colors
            z-10
          `}
          title="Drag to resize column"
        />
      )}
    </div>
  );
}

// Export memoized version
export const GridCell = React.memo(GridCellInner, areCellPropsEqual) as typeof GridCellInner;

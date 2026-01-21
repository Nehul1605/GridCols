import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface Column<T = any> {
  id: string;
  header: string;
  width: number;
  minWidth?: number;
  maxWidth?: number;
  accessor: (row: T) => any;
  renderer?: (value: any, row: T) => React.ReactNode;
  editor?: (value: any, onChange: (value: any) => void) => React.ReactNode;
  validator?: (value: any) => Promise<{ valid: boolean; error?: string }>;
  sortable?: boolean;
  resizable?: boolean;
  pinned?: "left" | "right" | null;
  editable?: boolean;
  visible?: boolean;
}

interface SortConfig {
  columnId: string;
  direction: "asc" | "desc";
}

interface EditingCell {
  rowIndex: number;
  columnId: string;
  value: any;
  originalValue: any;
}

interface HistoryEntry {
  type: "edit" | "columnResize" | "columnReorder";
  data: any;
}

// ============================================================================
// FPS MONITOR HOOK
// ============================================================================

const useFPSMonitor = () => {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let animationFrameId: number;

    const measureFPS = () => {
      frameCountRef.current++;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTimeRef.current;

      if (elapsed >= 1000) {
        const currentFPS = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFPS);
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(measureFPS);
    };

    animationFrameId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return fps;
};

// ============================================================================
// DATAGRID PROPS
// ============================================================================

export interface DataGridProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  rowHeight?: number;
  headerHeight?: number;
  overscan?: number;
  onCellEdit?: (rowId: any, columnId: string, newValue: any) => void;
  getRowId?: (row: T) => any;
}

// ============================================================================
// MAIN DATAGRID COMPONENT
// ============================================================================

const DataGrid = <T extends Record<string, any>>({
  data,
  columns: initialColumns,
  rowHeight = 40,
  headerHeight = 48,
  overscan = 5,
  onCellEdit,
  getRowId = (row: any) => row.id,
}: DataGridProps<T>) => {
  const [columns, setColumns] = useState(initialColumns);
  const [sortConfig, setSortConfig] = useState<SortConfig[]>([]);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [focusedCell, setFocusedCell] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [resizingColumn, setResizingColumn] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const focusedCellRef = useRef<HTMLDivElement>(null);
  const fps = useFPSMonitor();

  // Scrollbar width calculation
  const [scrollbarWidth, setScrollbarWidth] = useState(0);
  useEffect(() => {
    if (scrollRef.current) {
      const width =
        scrollRef.current.offsetWidth - scrollRef.current.clientWidth;
      setScrollbarWidth(width);
    }
  }, []);

  // Focus management: ensure focused cell gets DOM focus
  useEffect(() => {
    if (focusedCell && focusedCellRef.current) {
      focusedCellRef.current.focus();
    }
  }, [focusedCell]);

  // Dimensions
  const containerHeight = 700;
  const containerWidth = 1320;

  const totalHeight = data.length * rowHeight;

  // Column categorization
  const pinnedLeftColumns = columns.filter(
    (col) => col.pinned === "left" && col.visible !== false,
  );
  const pinnedRightColumns = columns.filter(
    (col) => col.pinned === "right" && col.visible !== false,
  );
  const scrollableColumns = columns.filter(
    (col) => !col.pinned && col.visible !== false,
  );

  const pinnedLeftWidth = pinnedLeftColumns.reduce(
    (sum, col) => sum + col.width,
    0,
  );
  const pinnedRightWidth = pinnedRightColumns.reduce(
    (sum, col) => sum + col.width,
    0,
  );
  const scrollableWidth = scrollableColumns.reduce(
    (sum, col) => sum + col.width,
    0,
  );

  // Scroll focused cell into view
  useEffect(() => {
    if (!focusedCell || !scrollRef.current) return;

    const { row, col } = focusedCell;
    const visibleCols = [
      ...pinnedLeftColumns,
      ...scrollableColumns,
      ...pinnedRightColumns,
    ];
    const column = visibleCols[col];
    if (!column) return;

    const cellTop = row * rowHeight;
    const cellBottom = cellTop + rowHeight;
    const cellLeft = visibleCols.slice(0, col).reduce((sum, c) => sum + c.width, 0);
    const cellRight = cellLeft + column.width;

    const currentScrollTop = scrollRef.current.scrollTop;
    const currentScrollLeft = scrollRef.current.scrollLeft;
    const scrollHeight = scrollRef.current.clientHeight;
    const scrollWidth = scrollRef.current.clientWidth;

    // Scroll vertically if needed
    if (cellTop < currentScrollTop) {
      scrollRef.current.scrollTop = cellTop;
    } else if (cellBottom > currentScrollTop + scrollHeight) {
      scrollRef.current.scrollTop = cellBottom - scrollHeight;
    }

    // Scroll horizontally if needed (considering pinned columns)
    if (column.pinned === "left" || column.pinned === "right") {
      // Pinned columns don't need scrolling
      return;
    }

    const adjustedCellLeft = cellLeft - pinnedLeftWidth;
    const adjustedCellRight = cellRight - pinnedLeftWidth;

    if (adjustedCellLeft < currentScrollLeft) {
      scrollRef.current.scrollLeft = adjustedCellLeft;
    } else if (adjustedCellRight > currentScrollLeft + scrollWidth) {
      scrollRef.current.scrollLeft = adjustedCellRight - scrollWidth;
    }
  }, [focusedCell, rowHeight, pinnedLeftColumns, scrollableColumns, pinnedRightColumns, pinnedLeftWidth]);

  // Virtualization - Rows
  const visibleRowCount = Math.ceil(containerHeight / rowHeight);
  const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endRow = Math.min(
    data.length,
    startRow + visibleRowCount + overscan * 2,
  );

  // Virtualization - Columns
  const availableScrollWidth =
    containerWidth - pinnedLeftWidth - pinnedRightWidth - scrollbarWidth;
  const visibleScrollableColumns: Column<T>[] = [];
  let scrollableStartX = 0;

  const stickyLeftOffsets: Record<string, number> = {};
  {
    let acc = 0;
    pinnedLeftColumns.forEach((col) => {
      stickyLeftOffsets[col.id] = acc;
      acc += col.width;
    });
  }

  const stickyRightOffsets: Record<string, number> = {};
  {
    let acc = 0;
    [...pinnedRightColumns].reverse().forEach((col) => {
      stickyRightOffsets[col.id] = acc;
      acc += col.width;
    });
  }

  let accumulatedWidth = 0;
  for (const col of scrollableColumns) {
    const colStart = accumulatedWidth + pinnedLeftWidth;
    const colEnd = colStart + col.width;

    if (
      colEnd > scrollLeft - 500 && // Overscan
      colStart < scrollLeft + containerWidth + 500 // Overscan
    ) {
      if (visibleScrollableColumns.length === 0) {
        scrollableStartX = accumulatedWidth;
      }
      visibleScrollableColumns.push(col);
    }
    accumulatedWidth += col.width;
  }

  // Sort data
  const sortedData = useMemo(() => {
    if (sortConfig.length === 0) return data;

    return [...data].sort((a, b) => {
      for (const sort of sortConfig) {
        const column = columns.find((col) => col.id === sort.columnId);
        if (!column) continue;

        const aVal = column.accessor(a);
        const bVal = column.accessor(b);

        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;

        if (comparison !== 0) {
          return sort.direction === "asc" ? comparison : -comparison;
        }
      }
      return 0;
    });
  }, [data, sortConfig, columns]);

  const visibleData = sortedData.slice(startRow, endRow);

  // Add to history
  const addToHistory = (entry: HistoryEntry) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(entry);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo/Redo
  const handleUndo = () => {
    setEditingCell(null);
    if (historyIndex < 0) return;
    const entry = history[historyIndex];

    if (!entry) return;

    if (entry.type === "columnResize") {
      setColumns(entry.data.previousColumns);
    } else if (entry.type === "edit") {
      onCellEdit?.(
        entry.data.rowId,
        entry.data.columnId,
        entry.data.previousValue,
      );
    }

    setHistoryIndex(historyIndex - 1);
  };

  const handleRedo = () => {
    setEditingCell(null);
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];

    if (!entry) return;

    if (entry.type === "columnResize") {
      setColumns(entry.data.newColumns);
    } else if (entry.type === "edit") {
      onCellEdit?.(entry.data.rowId, entry.data.columnId, entry.data.newValue);
    }

    setHistoryIndex(historyIndex + 1);
  };

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Undo/Redo
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z" && !e.shiftKey) {
          if (editingCell) return;
          e.preventDefault();
          handleUndo();
          return;
        }
        if (e.key === "z" && e.shiftKey) {
          if (editingCell) return;
          e.preventDefault();
          handleRedo();
          return;
        }
      }

      // Handle arrow and tab keys when no cell is focused - focus first cell
      if (!focusedCell) {
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key)) {
          e.preventDefault();
          setFocusedCell({ row: 0, col: 0 });
        }
        return;
      }

      if (
        editingCell &&
        [
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Home",
          "End",
        ].includes(e.key)
      ) {
        return;
      }

      const visibleCols = [
        ...pinnedLeftColumns,
        ...scrollableColumns,
        ...pinnedRightColumns,
      ];
      const { row, col } = focusedCell;
      let newRow = row;
      let newCol = col;

      if (
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.key.length === 1 &&
        !editingCell
      ) {
        const column = visibleCols[col];
        if (column && column.editable) {
          e.preventDefault();
          const rowData = sortedData[row];
          if (rowData) {
            setEditingCell({
              rowIndex: row,
              columnId: column.id,
              value: e.key,
              originalValue: column.accessor(rowData),
            });
          }
          return;
        }
      }

      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          newRow = Math.max(0, row - 1);
          break;
        case "ArrowDown":
          e.preventDefault();
          newRow = Math.min(data.length - 1, row + 1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          newCol = Math.max(0, col - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          newCol = Math.min(visibleCols.length - 1, col + 1);
          break;
        case "Home":
          e.preventDefault();
          if (e.ctrlKey) {
            newRow = 0;
            newCol = 0;
          } else {
            newCol = 0;
          }
          break;
        case "End":
          e.preventDefault();
          if (e.ctrlKey) {
            newRow = data.length - 1;
            newCol = visibleCols.length - 1;
          } else {
            newCol = visibleCols.length - 1;
          }
          break;
        case "PageUp":
          e.preventDefault();
          newRow = Math.max(0, row - 10);
          break;
        case "PageDown":
          e.preventDefault();
          newRow = Math.min(data.length - 1, row + 10);
          break;
        case "Enter":
          e.preventDefault();
          if (editingCell) {
            handleCellEdit(editingCell.value);
          } else {
            const column = visibleCols[col];
            if (column && column.editable) {
              const rowData = sortedData[row];
              if (rowData) {
                const value = column.accessor(rowData);
                setEditingCell({
                  rowIndex: row,
                  columnId: column.id,
                  value,
                  originalValue: value,
                });
              }
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          if (editingCell) {
            setEditingCell(null);
            setEditError(null);
          }
          break;
        case "Tab":
          e.preventDefault();
          if (editingCell) {
            handleCellEdit(editingCell.value);
          }
          if (e.shiftKey) {
            newCol = col > 0 ? col - 1 : visibleCols.length - 1;
            if (newCol === visibleCols.length - 1)
              newRow = Math.max(0, row - 1);
          } else {
            newCol = col < visibleCols.length - 1 ? col + 1 : 0;
            if (newCol === 0) newRow = Math.min(data.length - 1, row + 1);
          }
          break;
        default:
          return;
      }

      setFocusedCell({ row: newRow, col: newCol });
    },
    [
      focusedCell,
      columns,
      data.length,
      sortedData,
      editingCell,
      pinnedLeftColumns,
      scrollableColumns,
      pinnedRightColumns,
      historyIndex,
      history,
    ],
  );

  // Sorting
  const handleSort = (columnId: string) => {
    const column = columns.find((col) => col.id === columnId);
    if (!column?.sortable) return;

    setSortConfig((prev) => {
      const existing = prev.find((s) => s.columnId === columnId);
      if (!existing) {
        return [...prev, { columnId, direction: "asc" as const }];
      }
      if (existing.direction === "asc") {
        return prev.map((s) =>
          s.columnId === columnId ? { ...s, direction: "desc" as const } : s,
        );
      }
      return prev.filter((s) => s.columnId !== columnId);
    });
  };

  // Cell editing
  const handleCellEdit = async (newValue: any) => {
    if (!editingCell) return;

    const column = columns.find((col) => col.id === editingCell.columnId);
    if (!column) return;

    if (column.validator) {
      try {
        const result = await column.validator(newValue);
        if (!result.valid) {
          setEditError(result.error || "Validation failed");
          setTimeout(() => {
            setEditingCell(null);
            setEditError(null);
          }, 2000);
          return;
        }
      } catch (err) {
        setEditError("Validation error");
        setTimeout(() => {
          setEditingCell(null);
          setEditError(null);
        }, 2000);
        return;
      }
    }

    const row = sortedData[editingCell.rowIndex];
    if (!row) return;
    const rowId = getRowId(row);

    onCellEdit?.(rowId, editingCell.columnId, newValue);
    addToHistory({
      type: "edit",
      data: {
        rowId: rowId,
        columnId: editingCell.columnId,
        previousValue: editingCell.originalValue,
        newValue,
      },
    });
    setEditingCell(null);
    setEditError(null);
  };

  // Column resizing
  const handleResizeStart = (columnId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setResizingColumn(columnId);
    setDragStartX(e.clientX);
  };

  useEffect(() => {
    if (!resizingColumn) return;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX;

      setColumns((prev) =>
        prev.map((col) => {
          if (col.id !== resizingColumn) return col;
          const newWidth = Math.max(
            col.minWidth || 50,
            Math.min(col.maxWidth || 500, col.width + delta),
          );
          return { ...col, width: newWidth };
        }),
      );

      setDragStartX(e.clientX);
    };

    const handleMouseUp = () => {
      if (resizingColumn) {
        addToHistory({
          type: "columnResize",
          data: {
            columnId: resizingColumn,
            previousColumns: columns,
            newColumns: columns,
          },
        });
      }
      setResizingColumn(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [resizingColumn, dragStartX, columns]);

  // Column visibility toggle
  const toggleColumnVisibility = (columnId: string) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === columnId
          ? { ...col, visible: col.visible === false ? true : false }
          : col,
      ),
    );
  };

  // Render cell
  const renderCell = (
    row: T,
    column: Column<T>,
    rowIndex: number,
    colIndex: number,
  ) => {
    const value = column.accessor(row);
    const isFocused =
      focusedCell?.row === rowIndex && focusedCell?.col === colIndex;
    const isEditing =
      editingCell?.rowIndex === rowIndex && editingCell?.columnId === column.id;

    const stickyStyle: React.CSSProperties = {};
    if (column.pinned === "left") {
      stickyStyle.position = "sticky";
      stickyStyle.left = stickyLeftOffsets[column.id];
      stickyStyle.zIndex = 10;
    } else if (column.pinned === "right") {
      stickyStyle.position = "sticky";
      stickyStyle.right = stickyRightOffsets[column.id];
      stickyStyle.zIndex = 10;
    }

    return (
      <div
        ref={isFocused ? focusedCellRef : null}
        role="gridcell"
        aria-rowindex={rowIndex + 2}
        aria-colindex={colIndex + 1}
        tabIndex={isFocused ? 0 : -1}
        aria-selected={isFocused}
        className={`px-4 flex items-center border-r border-gray-200 ${
          isFocused ? "ring-2 ring-blue-500 ring-inset bg-blue-50" : ""
        } ${!isFocused && column.pinned ? "bg-gray-50 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" : "bg-white"}`}
        style={{ width: column.width, height: rowHeight, ...stickyStyle }}
        onClick={() => setFocusedCell({ row: rowIndex, col: colIndex })}
        onKeyDown={isFocused ? handleKeyDown : undefined}
        onDoubleClick={() => {
          if (!column.editable) return;
          const val = column.accessor(row);
          setEditingCell({
            rowIndex,
            columnId: column.id,
            value: val,
            originalValue: val,
          });
        }}
      >
        {isEditing ? (
          <div
            className="w-full"
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {column.editor ? (
              column.editor(editingCell.value, (newVal) => {
                setEditingCell((prev) =>
                  prev ? { ...prev, value: newVal } : null,
                );
              })
            ) : (
              <input
                className="w-full h-full px-1 border-none bg-white text-black outline-none"
                autoFocus
                value={editingCell.value}
                onChange={(e) =>
                  setEditingCell((prev) =>
                    prev ? { ...prev, value: e.target.value } : null,
                  )
                }
              />
            )}
            <div className="flex gap-2 mt-1 z-20 relative">
              <button
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                onClick={() => handleCellEdit(editingCell.value)}
              >
                Save
              </button>
              <button
                className="px-2 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setEditingCell(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : column.renderer ? (
          column.renderer(value, row)
        ) : (
          <span className="truncate">{String(value)}</span>
        )}
      </div>
    );
  };

  // Render header
  const renderHeader = (col: Column<T>, idx: number) => (
    <div
      key={col.id}
      role="columnheader"
      aria-colindex={idx + 1}
      aria-sort={
        sortConfig.find((s) => s.columnId === col.id)
          ? sortConfig.find((s) => s.columnId === col.id)?.direction === "asc"
            ? "ascending"
            : "descending"
          : "none"
      }
      className="px-4 py-3 font-semibold border-r border-gray-300 flex items-center justify-between bg-gray-50 relative"
      style={{ width: col.width, height: headerHeight, minWidth: col.width }}
    >
      <span
        className={col.sortable ? "cursor-pointer select-none" : ""}
        onClick={() => col.sortable && handleSort(col.id)}
      >
        {col.header}
        {sortConfig.find((s) => s.columnId === col.id) && (
          <span className="ml-1 text-blue-600">
            {sortConfig.find((s) => s.columnId === col.id)?.direction === "asc"
              ? "↑"
              : "↓"}
          </span>
        )}
      </span>
      {col.resizable && (
        <div
          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500 active:bg-blue-600"
          onMouseDown={(e) => handleResizeStart(col.id, e)}
        />
      )}
    </div>
  );

  const allVisibleColumns = [
    ...pinnedLeftColumns,
    ...visibleScrollableColumns,
    ...pinnedRightColumns,
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="mb-4 flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex < 0}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50 hover:bg-gray-300"
          >
            ↷ Redo
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <span className="font-semibold">Columns:</span>
          {columns.map((col) => (
            <label key={col.id} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={col.visible !== false}
                onChange={() => toggleColumnVisibility(col.id)}
              />
              {col.header}
            </label>
          ))}
        </div>
      </div>

      {editError && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-2"
        >
          {editError}
        </div>
      )}

      <div
        ref={containerRef}
        className="border border-gray-300 bg-white overflow-hidden"
        style={{ height: containerHeight, width: containerWidth }}
        onKeyDown={handleKeyDown}
        onFocus={(e) => {
          // If focusing the container itself (not a child cell), set focus to first cell
          if (e.target === containerRef.current && !focusedCell) {
            setFocusedCell({ row: 0, col: 0 });
          }
        }}
        role="grid"
        aria-rowcount={data.length + 1}
        aria-colcount={allVisibleColumns.length}
        tabIndex={0}
      >
        {/* Header */}
        <div className="flex sticky top-0 z-20 bg-gray-50 border-b-2 border-gray-300">
          {/* Pinned Left Headers */}
          {pinnedLeftColumns.map((col, idx) => renderHeader(col, idx))}

          {/* Scrollable Headers */}
          <div
            className="flex overflow-hidden"
            style={{ width: availableScrollWidth }}
          >
            <div
              className="flex"
              style={{
                transform: `translateX(-${scrollLeft - scrollableStartX}px)`,
              }}
            >
              {visibleScrollableColumns.map((col, idx) =>
                renderHeader(col, pinnedLeftColumns.length + idx),
              )}
            </div>
          </div>

          {/* Pinned Right Headers */}
          {pinnedRightColumns.map((col, idx) =>
            renderHeader(
              col,
              pinnedLeftColumns.length + scrollableColumns.length + idx,
            ),
          )}

          {/* Scrollbar Spacer */}
          <div
            style={{ width: scrollbarWidth, flexShrink: 0 }}
            className="bg-gray-50 border-r border-gray-300"
          />
        </div>

        {/* Body */}
        <div
          ref={scrollRef}
          className="overflow-auto"
          style={{ height: containerHeight - headerHeight }}
          onScroll={(e) => {
            const target = e.currentTarget;
            setScrollTop(target.scrollTop);
            setScrollLeft(target.scrollLeft);
          }}
        >
          <div
            style={{
              height: totalHeight,
              width: pinnedLeftWidth + scrollableWidth + pinnedRightWidth,
            }}
          >
            <div style={{ transform: `translateY(${startRow * rowHeight}px)` }}>
              {visibleData.map((row, idx) => {
                const actualRowIndex = startRow + idx;
                const visibleScrollableWidth = visibleScrollableColumns.reduce(
                  (sum, col) => sum + col.width,
                  0,
                );
                const rightSpacerWidth =
                  scrollableWidth - (scrollableStartX + visibleScrollableWidth);

                return (
                  <div
                    key={actualRowIndex}
                    role="row"
                    aria-rowindex={actualRowIndex + 2}
                    className="flex border-b border-gray-200"
                    style={{ minWidth: "max-content" }}
                  >
                    {pinnedLeftColumns.map((col, idx) =>
                      renderCell(row, col, actualRowIndex, idx),
                    )}
                    <div style={{ flexShrink: 0, width: scrollableStartX }} />
                    {visibleScrollableColumns.map((col) => {
                      const scrollableIndex = scrollableColumns.indexOf(col);
                      return renderCell(
                        row,
                        col,
                        actualRowIndex,
                        pinnedLeftColumns.length + scrollableIndex,
                      );
                    })}
                    <div style={{ flexShrink: 0, width: rightSpacerWidth }} />
                    {pinnedRightColumns.map((col, idx) =>
                      renderCell(
                        row,
                        col,
                        actualRowIndex,
                        pinnedLeftColumns.length +
                          scrollableColumns.length +
                          idx,
                      ),
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 text-sm text-gray-600 space-y-1">
        <p className="font-semibold text-lg">Performance Metrics:</p>
        <p>
          FPS:{" "}
          <span
            className={
              fps < 50 ? "text-red-600 font-bold" : "text-green-600 font-bold"
            }
          >
            {fps}
          </span>
        </p>
      </div>
    </div>
  );
};

export default DataGrid;

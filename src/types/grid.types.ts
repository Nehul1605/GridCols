/**
 * Core Grid Type Definitions
 * Strict TypeScript with noImplicitAny, strictNullChecks, noUncheckedIndexedAccess
 */

// ============================================
// CELL VALUE TYPES
// ============================================

/** Primitive cell values */
export type CellValue = string | number | boolean | null | undefined;

/** Cell data with metadata */
export interface CellData<T = CellValue> {
  value: T;
  displayValue?: string;
  isEditing?: boolean;
  isValid?: boolean;
  errorMessage?: string;
}

// ============================================
// COLUMN DEFINITIONS
// ============================================

/** Alignment options for cell content */
export type CellAlignment = 'left' | 'center' | 'right';

/** Sort direction */
export type SortDirection = 'asc' | 'desc' | null;

/** Column data types for proper sorting/filtering */
export type ColumnDataType = 'string' | 'number' | 'boolean' | 'date';

/** Editor types for inline editing */
export type EditorType = 'text' | 'number' | 'select' | 'checkbox';

/** Column definition - Generic over row data type */
export interface ColumnDef<TData extends Record<string, unknown> = Record<string, unknown>> {
  /** Unique identifier for the column */
  id: string;

  /** Display header text */
  header: string;

  /** Key to access data from row object */
  accessorKey: keyof TData & string;

  /** Fixed width in pixels, or flex value (e.g., '1' for flex-1) */
  width?: number | string;

  /** Minimum width in pixels */
  minWidth?: number;

  /** Maximum width in pixels */
  maxWidth?: number;

  /** Content alignment */
  align?: CellAlignment;

  /** Data type for sorting/filtering */
  dataType?: ColumnDataType;

  /** Whether column is sortable */
  sortable?: boolean;

  /** Whether column is resizable */
  resizable?: boolean;

  /** Whether cells in this column are editable */
  editable?: boolean;

  /** Editor type for editable cells */
  editorType?: EditorType;

  /** Options for select editor */
  selectOptions?: readonly SelectOption[];

  /** Custom cell renderer */
  renderCell?: (value: CellValue, row: TData, rowIndex: number) => React.ReactNode;

  /** Custom header renderer */
  renderHeader?: (column: ColumnDef<TData>) => React.ReactNode;

  /** Cell validator function */
  validate?: (value: CellValue, row: TData) => ValidationResult;

  /** Whether column is visible */
  visible?: boolean;

  /** Whether column is pinned */
  pinned?: 'left' | 'right' | false;
}

/** Option for select editor */
export interface SelectOption {
  value: string | number;
  label: string;
}

/** Validation result */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// ============================================
// ROW DEFINITIONS
// ============================================

/** Base row with required id - extends Record for generic compatibility */
export interface BaseRow extends Record<string, unknown> {
  id: string | number;
}

/** Row metadata for internal tracking */
export interface RowMeta {
  index: number;
  isSelected: boolean;
  isExpanded?: boolean;
  isEditing?: boolean;
  editingCellId?: string | null;
}

/** Virtual row item from virtualization engine */
export interface VirtualItem {
  index: number;
  offsetTop: number;
  size: number;
}

// ============================================
// SELECTION TYPES
// ============================================

/** Selection mode */
export type SelectionMode = 'none' | 'single' | 'multiple' | 'range';

/** Cell coordinate */
export interface CellCoordinate {
  rowIndex: number;
  columnId: string;
}

/** Selection range */
export interface SelectionRange {
  start: CellCoordinate;
  end: CellCoordinate;
}

/** Selection state */
export interface SelectionState {
  mode: SelectionMode;
  selectedRowIds: Set<string | number>;
  selectedCells: Set<string>; // Format: "rowIndex:columnId"
  activeCell: CellCoordinate | null;
  selectionRange: SelectionRange | null;
}

// ============================================
// SORT & FILTER TYPES
// ============================================

/** Sort state for a column */
export interface SortState {
  columnId: string;
  direction: SortDirection;
}

/** Filter operator types */
export type FilterOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'isEmpty'
  | 'isNotEmpty';

/** Filter state for a column */
export interface FilterState {
  columnId: string;
  operator: FilterOperator;
  value: CellValue;
  valueTo?: CellValue; // For 'between' operator
}

// ============================================
// EDIT TYPES
// ============================================

/** Edit state */
export interface EditState {
  isEditing: boolean;
  cell: CellCoordinate | null;
  originalValue: CellValue;
  currentValue: CellValue;
  isDirty: boolean;
}

/** Pending edit for batch operations */
export interface PendingEdit {
  rowId: string | number;
  columnId: string;
  oldValue: CellValue;
  newValue: CellValue;
  timestamp: number;
}

// ============================================
// GRID PROPS & CONFIG
// ============================================

/** Grid configuration */
export interface GridConfig {
  rowHeight: number;
  headerHeight: number;
  overscan: number; // Buffer rows for virtualization
  enableKeyboardNav: boolean;
  enableCellSelection: boolean;
  enableRowSelection: boolean;
  enableSorting: boolean;
  enableFiltering: boolean;
  enableEditing: boolean;
  enableResizing: boolean;
  stickyHeader: boolean;
}

/** Default grid configuration */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  rowHeight: 35,
  headerHeight: 40,
  overscan: 5,
  enableKeyboardNav: true,
  enableCellSelection: true,
  enableRowSelection: true,
  enableSorting: true,
  enableFiltering: false,
  enableEditing: true,
  enableResizing: true,
  stickyHeader: true,
};

/** Main DataGrid props */
export interface DataGridProps<TData extends BaseRow = BaseRow> {
  /** Row data array */
  data: readonly TData[];

  /** Column definitions */
  columns: readonly ColumnDef<TData>[];

  /** Grid configuration overrides */
  config?: Partial<GridConfig>;

  /** Container height (required for virtualization) */
  height: number;

  /** Container width */
  width?: number | string;

  /** Loading state */
  isLoading?: boolean;

  /** Empty state message */
  emptyMessage?: string;

  /** Initial sort state */
  initialSort?: SortState | null;

  /** Initial selection */
  initialSelection?: Set<string | number>;

  /** Callback when cell value changes */
  onCellChange?: (
    rowId: string | number,
    columnId: string,
    newValue: CellValue,
    oldValue: CellValue
  ) => void | Promise<void>;

  /** Callback when selection changes */
  onSelectionChange?: (selectedIds: Set<string | number>) => void;

  /** Callback when sort changes */
  onSortChange?: (sort: SortState | null) => void;

  /** Callback when row is clicked */
  onRowClick?: (row: TData, rowIndex: number) => void;

  /** Callback when cell is double-clicked (enters edit mode) */
  onCellDoubleClick?: (cell: CellCoordinate, row: TData) => void;

  /** Custom row class name generator */
  getRowClassName?: (row: TData, rowIndex: number) => string;

  /** Custom cell class name generator */
  getCellClassName?: (row: TData, columnId: string) => string;

  /** Aria label for the grid */
  ariaLabel?: string;

  /** Aria described by id */
  ariaDescribedBy?: string;
}

// ============================================
// INTERNAL COMPONENT PROPS
// ============================================

/** Props for GridRow component */
export interface GridRowProps<TData extends BaseRow = BaseRow> {
  index: number;
  data: TData;
  columns: readonly ColumnDef<TData>[];
  style: React.CSSProperties;
  isSelected: boolean;
  isEven: boolean;
  activeColumnId: string | null;
  editingColumnId: string | null;
  onCellClick: (rowIndex: number, columnId: string) => void;
  onCellDoubleClick: (rowIndex: number, columnId: string) => void;
  onCellChange: (columnId: string, value: CellValue) => void;
  onEditComplete: () => void;
  onEditCancel: () => void;
}

/** Props for GridCell component */
export interface GridCellProps<TData extends BaseRow = BaseRow> {
  column: ColumnDef<TData>;
  value: CellValue;
  row: TData;
  rowIndex: number;
  isActive: boolean;
  isEditing: boolean;
  onClick: () => void;
  onDoubleClick: () => void;
  onChange: (value: CellValue) => void;
  onEditComplete: () => void;
  onEditCancel: () => void;
}

/** Props for HeaderCell component */
export interface HeaderCellProps<TData extends BaseRow = BaseRow> {
  column: ColumnDef<TData>;
  sortState: SortState | null;
  onSort: (columnId: string) => void;
  onResize?: (columnId: string, width: number) => void;
}

/** Props for cell editors */
export interface CellEditorProps {
  value: CellValue;
  onChange: (value: CellValue) => void;
  onComplete: () => void;
  onCancel: () => void;
  options?: readonly SelectOption[];
  autoFocus?: boolean;
}

// ============================================
// UTILITY TYPES
// ============================================

/** Extract row type from data array */
export type InferRowType<T> = T extends readonly (infer U)[] ? U : never;

/** Make specific keys required */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/** Deep partial type */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

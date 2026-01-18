/**
 * Design Tokens & Constants
 * Centralized values for consistency
 */

// ============================================
// SIZING TOKENS
// ============================================

export const GRID_TOKENS = {
  ROW_HEIGHT: 35,
  HEADER_HEIGHT: 40,
  MIN_COLUMN_WIDTH: 50,
  DEFAULT_COLUMN_WIDTH: 150,
  MAX_COLUMN_WIDTH: 500,
  CELL_PADDING_X: 12,
  CELL_PADDING_Y: 8,
  BORDER_WIDTH: 1,
  SCROLL_BUFFER: 5, // Overscan rows for virtualization
} as const;

// ============================================
// KEYBOARD CODES
// ============================================

export const KEYS = {
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  SPACE: ' ',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  DELETE: 'Delete',
  BACKSPACE: 'Backspace',
  F2: 'F2', // Edit mode trigger
  A: 'a', // Select all
  C: 'c', // Copy
  V: 'v', // Paste
  Z: 'z', // Undo
  Y: 'y', // Redo
} as const;

// ============================================
// ARIA CONSTANTS
// ============================================

export const ARIA = {
  GRID_ROLE: 'grid',
  ROW_ROLE: 'row',
  COLUMNHEADER_ROLE: 'columnheader',
  GRIDCELL_ROLE: 'gridcell',
  ROWHEADER_ROLE: 'rowheader',
  SORT_ASCENDING: 'ascending',
  SORT_DESCENDING: 'descending',
  SORT_NONE: 'none',
} as const;

// ============================================
// CSS CLASS NAMES
// ============================================

export const CSS_CLASSES = {
  GRID_CONTAINER: 'grid-container',
  GRID_VIEWPORT: 'grid-viewport',
  GRID_SCROLL: 'grid-scroll-container',
  GRID_ROW: 'grid-row',
  GRID_CELL: 'grid-cell',
  GRID_HEADER: 'grid-header',
  GRID_HEADER_CELL: 'grid-header-cell',
  CELL_FOCUSABLE: 'grid-cell-focusable',
  ROW_SELECTED: 'grid-row-selected',
  ROW_EVEN: 'grid-row-even',
  ROW_ODD: 'grid-row-odd',
  CELL_EDITING: 'grid-cell-editing',
  CELL_ACTIVE: 'grid-cell-active',
} as const;

// ============================================
// ANIMATION DURATIONS
// ============================================

export const ANIMATION = {
  HOVER_TRANSITION: 150, // ms
  SCROLL_DEBOUNCE: 16, // ~60fps
  EDIT_TRANSITION: 100,
} as const;

// ============================================
// PERFORMANCE THRESHOLDS
// ============================================

export const PERFORMANCE = {
  /** Maximum rows before warning */
  WARN_ROW_COUNT: 100000,
  /** Scroll position update throttle (ms) */
  SCROLL_THROTTLE: 16,
  /** Resize observer debounce (ms) */
  RESIZE_DEBOUNCE: 100,
  /** Maximum undo history size */
  MAX_UNDO_HISTORY: 50,
} as const;

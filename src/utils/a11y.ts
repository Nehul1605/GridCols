/**
 * Accessibility Utilities
 * ARIA helpers for grid navigation and screen readers
 */

import { ARIA } from '../constants/tokens';

/**
 * Generate unique ID for grid element
 */
export function generateGridId(prefix: string, ...parts: (string | number)[]): string {
  return [prefix, ...parts].join('-');
}

/**
 * Generate cell ID
 */
export function getCellId(gridId: string, rowIndex: number, columnId: string): string {
  return generateGridId(gridId, 'cell', rowIndex, columnId);
}

/**
 * Generate row ID
 */
export function getRowId(gridId: string, rowIndex: number): string {
  return generateGridId(gridId, 'row', rowIndex);
}

/**
 * Generate header cell ID
 */
export function getHeaderCellId(gridId: string, columnId: string): string {
  return generateGridId(gridId, 'header', columnId);
}

/**
 * Get ARIA sort value from sort direction
 */
export function getAriaSortValue(
  direction: 'asc' | 'desc' | null
): 'ascending' | 'descending' | 'none' {
  switch (direction) {
    case 'asc':
      return ARIA.SORT_ASCENDING;
    case 'desc':
      return ARIA.SORT_DESCENDING;
    default:
      return ARIA.SORT_NONE;
  }
}

/**
 * Get announcement text for screen readers
 */
export function getSelectionAnnouncement(count: number): string {
  if (count === 0) return 'No rows selected';
  if (count === 1) return '1 row selected';
  return `${count} rows selected`;
}

/**
 * Get sort announcement for screen readers
 */
export function getSortAnnouncement(columnName: string, direction: 'asc' | 'desc' | null): string {
  if (!direction) return `Sort cleared for ${columnName}`;
  const dirText = direction === 'asc' ? 'ascending' : 'descending';
  return `Sorted by ${columnName}, ${dirText} order`;
}

/**
 * Get cell position announcement
 */
export function getCellPositionAnnouncement(
  rowIndex: number,
  columnName: string,
  totalRows: number
): string {
  return `Row ${rowIndex + 1} of ${totalRows}, ${columnName}`;
}

/**
 * Announce message to screen readers via live region
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `;
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Comparator Functions for Sorting
 * Manual implementation - no external sorting libraries
 */

import type { CellValue, ColumnDataType, SortDirection } from '../types';

type Comparator<T> = (a: T, b: T) => number;

/**
 * Create a comparator for cell values based on data type
 */
export function createComparator(
  dataType: ColumnDataType = 'string',
  direction: SortDirection = 'asc'
): Comparator<CellValue> {
  const multiplier = direction === 'desc' ? -1 : 1;

  return (a: CellValue, b: CellValue): number => {
    // Handle null/undefined - always sort to end
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;

    let result: number;

    switch (dataType) {
      case 'number':
        result = compareNumbers(a, b);
        break;

      case 'boolean':
        result = compareBooleans(a, b);
        break;

      case 'date':
        result = compareDates(a, b);
        break;

      case 'string':
      default:
        result = compareStrings(a, b);
        break;
    }

    return result * multiplier;
  };
}

/**
 * Compare string values (case-insensitive)
 */
function compareStrings(a: CellValue, b: CellValue): number {
  const strA = String(a).toLowerCase();
  const strB = String(b).toLowerCase();
  return strA.localeCompare(strB);
}

/**
 * Compare numeric values
 */
function compareNumbers(a: CellValue, b: CellValue): number {
  const numA = typeof a === 'number' ? a : parseFloat(String(a));
  const numB = typeof b === 'number' ? b : parseFloat(String(b));

  if (isNaN(numA) && isNaN(numB)) return 0;
  if (isNaN(numA)) return 1;
  if (isNaN(numB)) return -1;

  return numA - numB;
}

/**
 * Compare boolean values (true before false)
 */
function compareBooleans(a: CellValue, b: CellValue): number {
  const boolA = Boolean(a);
  const boolB = Boolean(b);

  if (boolA === boolB) return 0;
  return boolA ? -1 : 1;
}

/**
 * Compare date values
 * Note: CellValue type is string | number | boolean | null | undefined
 * Dates are typically stored as ISO strings or timestamps
 */
function compareDates(a: CellValue, b: CellValue): number {
  const toDate = (val: CellValue): Date => {
    if (typeof val === 'number') {
      return new Date(val);
    }
    return new Date(String(val ?? ''));
  };

  const dateA = toDate(a);
  const dateB = toDate(b);

  const timeA = dateA.getTime();
  const timeB = dateB.getTime();

  if (isNaN(timeA) && isNaN(timeB)) return 0;
  if (isNaN(timeA)) return 1;
  if (isNaN(timeB)) return -1;

  return timeA - timeB;
}

/**
 * Sort array of objects by accessor key
 */
export function sortByAccessor<T extends Record<string, unknown>>(
  data: readonly T[],
  accessorKey: keyof T,
  dataType: ColumnDataType,
  direction: SortDirection
): T[] {
  if (!direction) return [...data];

  const comparator = createComparator(dataType, direction);

  return [...data].sort((a, b) => {
    const valueA = a[accessorKey] as CellValue;
    const valueB = b[accessorKey] as CellValue;
    return comparator(valueA, valueB);
  });
}

/**
 * Multi-column sort
 */
export function multiSort<T extends Record<string, unknown>>(
  data: readonly T[],
  sorts: Array<{
    accessorKey: keyof T;
    dataType: ColumnDataType;
    direction: SortDirection;
  }>
): T[] {
  if (sorts.length === 0) return [...data];

  const comparators = sorts.map((sort) => ({
    comparator: createComparator(sort.dataType, sort.direction),
    accessorKey: sort.accessorKey,
  }));

  return [...data].sort((a, b) => {
    for (const { comparator, accessorKey } of comparators) {
      const valueA = a[accessorKey] as CellValue;
      const valueB = b[accessorKey] as CellValue;
      const result = comparator(valueA, valueB);

      if (result !== 0) return result;
    }
    return 0;
  });
}

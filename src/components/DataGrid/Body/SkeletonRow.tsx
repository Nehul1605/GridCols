/**
 * SkeletonRow - Loading placeholder row
 */

import React from 'react';

interface SkeletonRowProps {
  columnCount: number;
  style: React.CSSProperties;
}

export const SkeletonRow: React.FC<SkeletonRowProps> = ({ columnCount, style }) => {
  return (
    <div
      role="row"
      aria-hidden="true"
      style={style}
      className="absolute left-0 w-full flex items-center border-b border-grid-border bg-white"
    >
      {Array.from({ length: columnCount }, (_, i) => (
        <div key={i} className="flex-1 px-3 h-full flex items-center">
          <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>
      ))}
    </div>
  );
};

/**
 * SkeletonGrid - Full loading state
 */
interface SkeletonGridProps {
  rowCount: number;
  columnCount: number;
  rowHeight: number;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ rowCount, columnCount, rowHeight }) => {
  return (
    <div className="relative w-full" style={{ height: rowCount * rowHeight }}>
      {Array.from({ length: rowCount }, (_, i) => (
        <SkeletonRow
          key={i}
          columnCount={columnCount}
          style={{
            height: rowHeight,
            top: i * rowHeight,
            position: 'absolute',
          }}
        />
      ))}
    </div>
  );
};

/**
 * SortIndicator - Visual indicator for sort direction
 */

import React from 'react';
import type { SortDirection } from '../../../types';

interface SortIndicatorProps {
  direction: SortDirection;
  isActive: boolean;
}

export const SortIndicator: React.FC<SortIndicatorProps> = ({ direction, isActive }) => {
  if (!isActive || !direction) {
    // Show inactive indicator (both arrows, muted)
    return (
      <span className="ml-1 flex flex-col text-gray-300" aria-hidden="true">
        <svg className="w-3 h-3 -mb-1" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 14l5-5 5 5z" />
        </svg>
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="ml-1 text-blue-600" aria-hidden="true">
      {direction === 'asc' ? (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 14l5-5 5 5z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 10l5 5 5-5z" />
        </svg>
      )}
    </span>
  );
};

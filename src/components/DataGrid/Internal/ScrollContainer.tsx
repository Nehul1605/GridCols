/**
 * ScrollContainer - Internal virtualized scroll container
 *
 * Handles the scroll viewport and phantom container for virtualization.
 * Uses CSS containment for GPU-accelerated scrolling.
 */

import React, { forwardRef } from 'react';

interface ScrollContainerProps {
  /** Total height of all items */
  totalHeight: number;
  /** Scroll event handler */
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  /** Whether currently scrolling */
  isScrolling?: boolean;
  /** Children (virtual items) */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
}

export const ScrollContainer = forwardRef<HTMLDivElement, ScrollContainerProps>(
  function ScrollContainer({ totalHeight, onScroll, isScrolling, children, className, style }, ref) {
    return (
      <div
        ref={ref}
        onScroll={onScroll}
        tabIndex={0}
        style={style}
        className={`
          grid-scroll-container grid-viewport
          overflow-auto
          relative
          flex-1
          focus:outline-none
          ${isScrolling ? 'scrolling' : ''}
          ${className ?? ''}
        `}
      >
        {/* Phantom container - creates proper scrollbar height */}
        <div
          style={{
            height: totalHeight,
            position: 'relative',
            // Performance: Enable GPU acceleration
            willChange: 'transform',
            contain: 'strict',
          }}
          className="w-full"
        >
          {children}
        </div>
      </div>
    );
  }
);

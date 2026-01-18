/**
 * TextEditor - Simple text input for inline cell editing
 * No external libraries (react-hook-form, formik forbidden)
 */

import React, { useRef, useEffect, useCallback } from 'react';
import type { CellEditorProps } from '../../../types';
import { KEYS } from '../../../constants/tokens';

export const TextEditor: React.FC<CellEditorProps> = ({
  value,
  onChange,
  onComplete,
  onCancel,
  autoFocus = true,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Always stop propagation to prevent grid navigation while editing
      e.stopPropagation();
      
      switch (e.key) {
        case KEYS.ENTER:
          e.preventDefault();
          onComplete();
          break;
        case KEYS.ESCAPE:
          e.preventDefault();
          onCancel();
          break;
        case KEYS.TAB:
          // Let parent handle tab navigation
          e.preventDefault();
          onComplete();
          break;
        // Arrow keys should be allowed in the input - no special handling
      }
    },
    [onComplete, onCancel]
  );

  const handleBlur = useCallback(() => {
    // Complete edit on blur
    onComplete();
  }, [onComplete]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={String(value ?? '')}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className="w-full h-full px-3 py-1 border-2 border-blue-500 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-300
                 bg-white text-gray-900"
      aria-label="Edit cell value"
    />
  );
};

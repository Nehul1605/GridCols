/**
 * NumberEditor - Number input for inline cell editing
 */

import React, { useRef, useEffect, useCallback } from 'react';
import type { CellEditorProps } from '../../../types';
import { KEYS } from '../../../constants/tokens';

interface NumberEditorProps extends CellEditorProps {
  min?: number;
  max?: number;
  step?: number;
}

export const NumberEditor: React.FC<NumberEditorProps> = ({
  value,
  onChange,
  onComplete,
  onCancel,
  autoFocus = true,
  min,
  max,
  step = 1,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const numValue = e.target.value === '' ? null : parseFloat(e.target.value);
      onChange(numValue);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
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
          onComplete();
          break;
        default:
          e.stopPropagation();
      }
    },
    [onComplete, onCancel]
  );

  const handleBlur = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <input
      ref={inputRef}
      type="number"
      value={value === null || value === undefined ? '' : String(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      min={min}
      max={max}
      step={step}
      className="w-full h-full px-3 py-1 border-2 border-blue-500 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-300
                 bg-white text-gray-900"
      aria-label="Edit number value"
    />
  );
};

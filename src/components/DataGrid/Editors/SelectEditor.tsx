/**
 * SelectEditor - Dropdown select for inline cell editing
 * Manual implementation - react-select is forbidden
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { CellEditorProps } from '../../../types';
import { KEYS } from '../../../constants/tokens';

export const SelectEditor: React.FC<CellEditorProps> = ({
  value,
  onChange,
  onComplete,
  onCancel,
  options = [],
  autoFocus = true,
}) => {
  const selectRef = useRef<HTMLSelectElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (autoFocus && selectRef.current) {
      selectRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = e.target.value;
      // Try to parse as number if it was originally a number option
      const option = options.find((o) => String(o.value) === selectedValue);
      onChange(option?.value ?? selectedValue);
    },
    [onChange, options]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLSelectElement>) => {
      switch (e.key) {
        case KEYS.ENTER:
          if (!isOpen) {
            e.preventDefault();
            onComplete();
          }
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
    [isOpen, onComplete, onCancel]
  );

  const handleBlur = useCallback(() => {
    onComplete();
  }, [onComplete]);

  return (
    <select
      ref={selectRef}
      value={String(value ?? '')}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onFocus={() => setIsOpen(true)}
      onClick={() => setIsOpen(true)}
      className="w-full h-full px-3 py-1 border-2 border-blue-500 rounded 
                 focus:outline-none focus:ring-2 focus:ring-blue-300
                 bg-white text-gray-900 cursor-pointer"
      aria-label="Select value"
    >
      {options.map((option) => (
        <option key={String(option.value)} value={String(option.value)}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

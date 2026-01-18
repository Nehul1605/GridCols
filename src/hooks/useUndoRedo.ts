/**
 * useUndoRedo - History management for edit operations
 */

import { useState, useCallback } from 'react';
import type { CellValue } from '../types';
import { PERFORMANCE } from '../constants/tokens';

interface HistoryEntry {
  rowId: string | number;
  columnId: string;
  oldValue: CellValue;
  newValue: CellValue;
  timestamp: number;
}

interface UseUndoRedoOptions {
  maxHistory?: number;
  onUndo?: (entry: HistoryEntry) => void;
  onRedo?: (entry: HistoryEntry) => void;
}

interface UseUndoRedoReturn {
  /** Add entry to history */
  pushHistory: (entry: Omit<HistoryEntry, 'timestamp'>) => void;
  /** Undo last action */
  undo: () => HistoryEntry | null;
  /** Redo last undone action */
  redo: () => HistoryEntry | null;
  /** Check if can undo */
  canUndo: boolean;
  /** Check if can redo */
  canRedo: boolean;
  /** Clear all history */
  clearHistory: () => void;
  /** Current history entries */
  history: readonly HistoryEntry[];
  /** Current position in history */
  historyIndex: number;
}

export function useUndoRedo({
  maxHistory = PERFORMANCE.MAX_UNDO_HISTORY,
  onUndo,
  onRedo,
}: UseUndoRedoOptions = {}): UseUndoRedoReturn {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const pushHistory = useCallback(
    (entry: Omit<HistoryEntry, 'timestamp'>) => {
      const newEntry: HistoryEntry = {
        ...entry,
        timestamp: Date.now(),
      };

      setHistory((prev) => {
        // Remove any redo entries
        const trimmed = prev.slice(0, historyIndex + 1);
        // Add new entry and enforce max length
        const newHistory = [...trimmed, newEntry].slice(-maxHistory);
        return newHistory;
      });

      setHistoryIndex((prev) => Math.min(prev + 1, maxHistory - 1));
    },
    [historyIndex, maxHistory]
  );

  const undo = useCallback((): HistoryEntry | null => {
    if (historyIndex < 0) return null;

    const entry = history[historyIndex];
    if (!entry) return null;

    setHistoryIndex((prev) => prev - 1);
    onUndo?.(entry);

    return entry;
  }, [history, historyIndex, onUndo]);

  const redo = useCallback((): HistoryEntry | null => {
    if (historyIndex >= history.length - 1) return null;

    const entry = history[historyIndex + 1];
    if (!entry) return null;

    setHistoryIndex((prev) => prev + 1);
    onRedo?.(entry);

    return entry;
  }, [history, historyIndex, onRedo]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    pushHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    history,
    historyIndex,
  };
}

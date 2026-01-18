/**
 * useUndoRedo - Undo/Redo History Management
 *
 * Manages history stack for cell edits and column actions.
 * Provides undo/redo with action batching support.
 */

import { useState, useCallback, useRef } from 'react';

// ============================================
// TYPES
// ============================================

export type UndoableActionType = 
  | 'cell-edit'
  | 'column-resize'
  | 'column-reorder'
  | 'column-visibility'
  | 'column-pin'
  | 'sort-change'
  | 'selection-change';

export interface UndoableAction<T = unknown> {
  /** Type of action */
  type: UndoableActionType;
  /** Description for UI */
  description: string;
  /** Data to restore on undo */
  previousState: T;
  /** Data to restore on redo */
  nextState: T;
  /** Timestamp */
  timestamp: number;
  /** Optional batch ID for grouping */
  batchId?: string;
}

interface UseUndoRedoOptions {
  /** Maximum history size (default: 50) */
  maxHistorySize?: number;
  /** Callback when undo is performed */
  onUndo?: (action: UndoableAction) => void;
  /** Callback when redo is performed */
  onRedo?: (action: UndoableAction) => void;
}

interface UseUndoRedoReturn {
  /** Can undo */
  canUndo: boolean;
  /** Can redo */
  canRedo: boolean;
  /** Undo last action */
  undo: () => UndoableAction | null;
  /** Redo last undone action */
  redo: () => UndoableAction | null;
  /** Push a new action to history */
  pushAction: <T>(action: Omit<UndoableAction<T>, 'timestamp'>) => void;
  /** Clear all history */
  clearHistory: () => void;
  /** Get current history for display */
  history: UndoableAction[];
  /** Get current position in history */
  historyIndex: number;
  /** Start a batch of actions */
  startBatch: (description: string) => string;
  /** End current batch */
  endBatch: () => void;
  /** Get description of next undo */
  undoDescription: string | null;
  /** Get description of next redo */
  redoDescription: string | null;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_MAX_HISTORY = 50;

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useUndoRedo({
  maxHistorySize = DEFAULT_MAX_HISTORY,
  onUndo,
  onRedo,
}: UseUndoRedoOptions = {}): UseUndoRedoReturn {
  // ==========================================
  // STATE
  // ==========================================

  const [history, setHistory] = useState<UndoableAction[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const batchIdRef = useRef<string | null>(null);
  const batchDescriptionRef = useRef<string | null>(null);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  const undoDescription = canUndo ? (history[historyIndex]?.description ?? null) : null;
  const redoDescription = canRedo ? (history[historyIndex + 1]?.description ?? null) : null;

  // ==========================================
  // PUSH ACTION
  // ==========================================

  const pushAction = useCallback(
    <T,>(action: Omit<UndoableAction<T>, 'timestamp'>) => {
      const newAction: UndoableAction<T> = {
        ...action,
        timestamp: Date.now(),
        batchId: batchIdRef.current ?? undefined,
      };

      setHistory((current) => {
        // Remove any actions after current index (clear redo stack)
        const newHistory = current.slice(0, historyIndex + 1);

        // Add new action
        newHistory.push(newAction as UndoableAction);

        // Trim to max size
        if (newHistory.length > maxHistorySize) {
          return newHistory.slice(-maxHistorySize);
        }

        return newHistory;
      });

      setHistoryIndex((current) => {
        const newIndex = Math.min(current + 1, maxHistorySize - 1);
        return newIndex;
      });
    },
    [historyIndex, maxHistorySize]
  );

  // ==========================================
  // UNDO
  // ==========================================

  const undo = useCallback((): UndoableAction | null => {
    if (!canUndo) return null;

    const action = history[historyIndex];
    if (!action) return null;

    // If action is part of a batch, undo all actions in the batch
    if (action.batchId) {
      // Find all actions with same batch ID
      let batchStartIndex = historyIndex;
      while (
        batchStartIndex > 0 &&
        history[batchStartIndex - 1]?.batchId === action.batchId
      ) {
        batchStartIndex--;
      }

      // Undo all batched actions (in reverse order)
      for (let i = historyIndex; i >= batchStartIndex; i--) {
        const batchAction = history[i];
        if (batchAction) {
          onUndo?.(batchAction);
        }
      }

      setHistoryIndex(batchStartIndex - 1);
      return history[batchStartIndex] ?? null;
    }

    setHistoryIndex(historyIndex - 1);
    onUndo?.(action);

    return action;
  }, [canUndo, history, historyIndex, onUndo]);

  // ==========================================
  // REDO
  // ==========================================

  const redo = useCallback((): UndoableAction | null => {
    if (!canRedo) return null;

    const action = history[historyIndex + 1];
    if (!action) return null;

    // If action is part of a batch, redo all actions in the batch
    if (action.batchId) {
      // Find all actions with same batch ID
      let batchEndIndex = historyIndex + 1;
      while (
        batchEndIndex < history.length - 1 &&
        history[batchEndIndex + 1]?.batchId === action.batchId
      ) {
        batchEndIndex++;
      }

      // Redo all batched actions
      for (let i = historyIndex + 1; i <= batchEndIndex; i++) {
        const batchAction = history[i];
        if (batchAction) {
          onRedo?.(batchAction);
        }
      }

      setHistoryIndex(batchEndIndex);
      return history[batchEndIndex] ?? null;
    }

    setHistoryIndex(historyIndex + 1);
    onRedo?.(action);

    return action;
  }, [canRedo, history, historyIndex, onRedo]);

  // ==========================================
  // CLEAR HISTORY
  // ==========================================

  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  // ==========================================
  // BATCHING
  // ==========================================

  const startBatch = useCallback((description: string): string => {
    const batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    batchIdRef.current = batchId;
    batchDescriptionRef.current = description;
    return batchId;
  }, []);

  const endBatch = useCallback(() => {
    batchIdRef.current = null;
    batchDescriptionRef.current = null;
  }, []);

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    pushAction,
    clearHistory,
    history,
    historyIndex,
    startBatch,
    endBatch,
    undoDescription,
    redoDescription,
  };
}

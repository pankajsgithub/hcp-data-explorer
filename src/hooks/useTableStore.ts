import { useState, useCallback, useRef } from 'react';
import { validateCalls } from '../starter/mock-validator';
import type { CellEditState } from '../types';

export interface EditCommand {
  rowKey: string;
  prevValue: number;
  nextValue: number;
}

export function useTableStore() {
  const [edits, setEdits] = useState<Record<string, CellEditState>>({});
  const undoStack = useRef<EditCommand[]>([]);
  const redoStack = useRef<EditCommand[]>([]);

  // 1. Commit and validate single cell edit
  const commitEdit = useCallback(
    async (rowKey: string, newValue: number, baseRecordValue: number | string) => {
      const parsedBaseVal = typeof baseRecordValue === 'number' ? baseRecordValue : Number(baseRecordValue) || 0;
      const currentSavedVal = edits[rowKey]?.status === 'saved' ? edits[rowKey].value : parsedBaseVal;

      // No-op if value is unchanged
      if (newValue === currentSavedVal) return;

      // Prevent simultaneous commits if cell is already in-flight
      if (edits[rowKey]?.status === 'pending') return;

      // Enter 'pending' lifecycle state and lock input
      setEdits((prev) => ({
        ...prev,
        [rowKey]: { value: newValue, status: 'pending', timestamp: Date.now() },
      }));

      try {
        await validateCalls(newValue);

        // Transition to 'saved'
        setEdits((prev) => ({
          ...prev,
          [rowKey]: { value: newValue, status: 'saved', timestamp: Date.now() },
        }));

        // Push to Command History (non-snapshot)
        undoStack.current.push({
          rowKey,
          prevValue: currentSavedVal,
          nextValue: newValue,
        });
        redoStack.current = []; // Clear redo on new action
      } catch (error: unknown) {
        // Transition to 'rejected': revert to previous valid value & capture reason
        const rejectionReason = typeof error === 'string' ? error : 'Validation failed';
        setEdits((prev) => ({
          ...prev,
          [rowKey]: {
            value: currentSavedVal,
            status: 'rejected',
            rejectionReason,
            timestamp: Date.now(),
          },
        }));
      }
    },
    [edits]
  );

  // 2. Undo Single Step
  const undo = useCallback(() => {
    const command = undoStack.current.pop();
    if (!command) return;

    redoStack.current.push(command);

    setEdits((prev) => ({
      ...prev,
      [command.rowKey]: {
        value: command.prevValue,
        status: 'saved',
        timestamp: Date.now(),
      },
    }));
  }, []);

  // 3. Redo Single Step
  const redo = useCallback(() => {
    const command = redoStack.current.pop();
    if (!command) return;

    undoStack.current.push(command);

    setEdits((prev) => ({
      ...prev,
      [command.rowKey]: {
        value: command.nextValue,
        status: 'saved',
        timestamp: Date.now(),
      },
    }));
  }, []);

  return {
    edits,
    commitEdit,
    undo,
    redo,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,
  };
}
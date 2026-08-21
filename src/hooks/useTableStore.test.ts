// @vitest-environment jsdom
import '../../src/test/setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTableStore } from './useTableStore';
import * as validator from '../starter/mock-validator';

describe('useTableStore Lifecycle & Command History (FR-4)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('completes successful edit lifecycle from pending to saved and updates undo stack', async () => {
    vi.spyOn(validator, 'validateCalls').mockResolvedValue(true as any);

    const { result } = renderHook(() => useTableStore());

    await act(async () => {
      await result.current.commitEdit('HCP-100_0', 25, 10);
    });

    expect(result.current.edits['HCP-100_0'].status).toBe('saved');
    expect(result.current.edits['HCP-100_0'].value).toBe(25);
    expect(result.current.canUndo).toBe(true);
  });

  it('handles validation failure and rollbacks to previous valid value', async () => {
    vi.spyOn(validator, 'validateCalls').mockRejectedValue('exceeds per-HCP call cap (60)');

    const { result } = renderHook(() => useTableStore());

    await act(async () => {
      await result.current.commitEdit('HCP-100_0', 75, 10);
    });

    expect(result.current.edits['HCP-100_0'].status).toBe('rejected');
    expect(result.current.edits['HCP-100_0'].value).toBe(10);
    expect(result.current.edits['HCP-100_0'].rejectionReason).toBe('exceeds per-HCP call cap (60)');
    expect(result.current.canUndo).toBe(false);
  });

  it('supports non-snapshot undo and redo stack operations', async () => {
    vi.spyOn(validator, 'validateCalls').mockResolvedValue(true as any);

    const { result } = renderHook(() => useTableStore());

    // Step 1: Commit edit (10 -> 30)
    await act(async () => {
      await result.current.commitEdit('HCP-100_0', 30, 10);
    });
    expect(result.current.edits['HCP-100_0'].value).toBe(30);

    // Step 2: Undo
    act(() => {
      result.current.undo();
    });
    expect(result.current.edits['HCP-100_0'].value).toBe(10);
    expect(result.current.canRedo).toBe(true);

    // Step 3: Redo
    act(() => {
      result.current.redo();
    });
    expect(result.current.edits['HCP-100_0'].value).toBe(30);
  });
});
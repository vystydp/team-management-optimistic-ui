import { renderHook, act } from '@testing-library/react';
import { useOptimistic, useOptimisticMutation, useOptimisticConfidence } from '../useOptimistic';

describe('useOptimistic', () => {
  it('should initialize with the provided state', () => {
    const { result } = renderHook(() => useOptimistic(10));
    expect(result.current[0]).toBe(10);
  });

  it('should update optimistic state', () => {
    const { result } = renderHook(() => useOptimistic(10));

    act(() => {
      result.current[1](20);
    });

    expect(result.current[0]).toBe(20);
  });

  it('should update optimistic state with function', () => {
    const { result } = renderHook(() => useOptimistic(10));

    act(() => {
      result.current[1]((current) => current + 5);
    });

    expect(result.current[0]).toBe(15);
  });

  it('should rollback optimistic state', () => {
    const { result } = renderHook(() => useOptimistic(10));

    act(() => {
      result.current[1](20);
    });

    expect(result.current[0]).toBe(20);

    act(() => {
      result.current[2](); // rollback
    });

    expect(result.current[0]).toBe(10);
  });

  it('should use custom update function', () => {
    const updateFn = (current: number, optimistic: number) => current + optimistic;
    const { result } = renderHook(() => useOptimistic(10, updateFn));

    act(() => {
      result.current[1](5);
    });

    expect(result.current[0]).toBe(15);
  });

  it('should auto-rollback after timeout', async () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useOptimistic(10));

    act(() => {
      result.current[1](20);
    });

    expect(result.current[0]).toBe(20);

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    expect(result.current[0]).toBe(10);
    jest.useRealTimers();
  });
});

describe('useOptimisticMutation', () => {
  it('should track pending state during mutation', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useOptimisticMutation(mutationFn));

    expect(result.current.isPending).toBe(false);

    let promise: Promise<unknown>;
    act(() => {
      promise = result.current.mutate({ id: 1 });
    });

    expect(result.current.isPending).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(result.current.isPending).toBe(false);
  });

  it('should track optimistic state', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() => useOptimisticMutation(mutationFn));

    await act(async () => {
      await result.current.mutate({ id: 1 }, { success: true });
    });

    expect(mutationFn).toHaveBeenCalled();
  });

  it('should call onSuccess callback', async () => {
    const onSuccess = jest.fn();
    const mutationFn = jest.fn().mockResolvedValue({ success: true });
    const { result } = renderHook(() =>
      useOptimisticMutation(mutationFn, { onSuccess })
    );

    await act(async () => {
      await result.current.mutate({ id: 1 });
    });

    expect(onSuccess).toHaveBeenCalledWith({ success: true });
  });

  it('should call onError callback on failure', async () => {
    const onError = jest.fn();
    const error = new Error('Mutation failed');
    const mutationFn = jest.fn().mockRejectedValue(error);
    const { result } = renderHook(() =>
      useOptimisticMutation(mutationFn, { onError })
    );

    await act(async () => {
      try {
        await result.current.mutate({ id: 1 });
      } catch (e) {
        // Expected error
      }
    });

    expect(onError).toHaveBeenCalledWith(error);
    expect(result.current.error).toBe(error);
  });

  it('should reset state', async () => {
    const error = new Error('Test error');
    const mutationFn = jest.fn().mockRejectedValue(error);
    const { result } = renderHook(() => useOptimisticMutation(mutationFn));

    await act(async () => {
      try {
        await result.current.mutate({ id: 1 });
      } catch (e) {
        // Expected
      }
    });

    expect(result.current.error).toBe(error);

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isPending).toBe(false);
  });
});

describe('useOptimisticConfidence', () => {
  it('should initialize with default confidence', () => {
    const { result } = renderHook(() => useOptimisticConfidence());
    expect(result.current.confidence).toBe(0.95);
  });

  it('should initialize with custom confidence', () => {
    const { result } = renderHook(() => useOptimisticConfidence(0.8));
    expect(result.current.confidence).toBe(0.8);
  });

  it('should update confidence on success', () => {
    const { result } = renderHook(() => useOptimisticConfidence(0.95));

    act(() => {
      result.current.recordSuccess();
    });

    expect(result.current.successRate).toBe(1.0);
  });

  it('should update confidence on failure', () => {
    const { result } = renderHook(() => useOptimisticConfidence(0.95));

    act(() => {
      result.current.recordFailure();
    });

    expect(result.current.successRate).toBe(0);
    expect(result.current.confidence).toBeLessThan(0.95);
  });

  it('should calculate error probability', () => {
    const { result } = renderHook(() => useOptimisticConfidence(0.9));
    expect(result.current.errorProbability).toBeCloseTo(0.1, 2);
  });

  it('should track success rate over multiple operations', () => {
    const { result } = renderHook(() => useOptimisticConfidence());

    act(() => {
      result.current.recordSuccess();
      result.current.recordSuccess();
      result.current.recordFailure();
    });

    expect(result.current.successRate).toBeCloseTo(0.667, 2);
  });
});

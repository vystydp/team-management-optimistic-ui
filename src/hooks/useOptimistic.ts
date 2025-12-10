import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook implementing optimistic UI pattern
 * Similar to React's experimental useOptimistic hook
 */
export function useOptimistic<T>(
  initialState: T,
  updateFn?: (currentState: T, optimisticValue: T) => T
): [T, (action: T | ((current: T) => T)) => void, () => void, (newActualState: T) => void] {
  const [actualState, setActualState] = useState<T>(initialState);
  const [optimisticState, setOptimisticState] = useState<T | null>(null);
  const optimisticTimeoutRef = useRef<NodeJS.Timeout>();

  // Current state is optimistic if available, otherwise actual
  const currentState = optimisticState !== null ? optimisticState : actualState;

  /**
   * Rolls back optimistic update to actual state
   */
  const rollback = useCallback(() => {
    if (optimisticTimeoutRef.current) {
      clearTimeout(optimisticTimeoutRef.current);
    }
    setOptimisticState(null);
  }, []);

  /**
   * Sets optimistic state that will be used until confirmed or rolled back
   */
  const setOptimistic = useCallback(
    (action: T | ((current: T) => T)) => {
      // Clear any existing timeout
      if (optimisticTimeoutRef.current) {
        clearTimeout(optimisticTimeoutRef.current);
      }

      const newOptimisticValue =
        typeof action === 'function'
          ? (action as (current: T) => T)(currentState)
          : action;

      const updatedState = updateFn
        ? updateFn(actualState, newOptimisticValue)
        : newOptimisticValue;

      setOptimisticState(updatedState);

      // Auto-rollback after 30 seconds if not confirmed
      optimisticTimeoutRef.current = setTimeout(() => {
        rollback();
      }, 30000);
    },
    [actualState, currentState, updateFn, rollback]
  );

  /**
   * Confirms optimistic update and makes it permanent
   */
  const commit = useCallback((newActualState: T) => {
    if (optimisticTimeoutRef.current) {
      clearTimeout(optimisticTimeoutRef.current);
    }
    setActualState(newActualState);
    setOptimisticState(null);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (optimisticTimeoutRef.current) {
        clearTimeout(optimisticTimeoutRef.current);
      }
    };
  }, []);

  return [currentState, setOptimistic, rollback, commit];
}

/**
 * Hook for optimistic mutations with automatic error handling
 */
export function useOptimisticMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData) => void;
    onError?: (error: Error) => void;
    onSettled?: () => void;
  }
) {
  const [isPending, setIsPending] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (variables: TVariables, optimisticData?: TData) => {
      setIsPending(true);
      setError(null);

      if (optimisticData) {
        setIsOptimistic(true);
        // Optimistic update happens in the caller's context
      }

      try {
        const result = await mutationFn(variables);
        setIsOptimistic(false);
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        setIsOptimistic(false);
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        options?.onError?.(error);
        throw error;
      } finally {
        setIsPending(false);
        options?.onSettled?.();
      }
    },
    [mutationFn, options]
  );

  return {
    mutate,
    isPending,
    isOptimistic,
    error,
    reset: () => {
      setIsPending(false);
      setIsOptimistic(false);
      setError(null);
    },
  };
}

/**
 * Hook for tracking optimistic update confidence
 */
export function useOptimisticConfidence(initialConfidence: number = 0.95): {
  confidence: number;
  recordSuccess: () => void;
  recordFailure: () => void;
  shouldShowOptimistic: () => boolean;
  errorProbability: number;
  successRate: number;
} {
  const [confidence, setConfidence] = useState(initialConfidence);
  const [successCount, setSuccessCount] = useState(0);
  const [failureCount, setFailureCount] = useState(0);

  const recordSuccess = useCallback(() => {
    setSuccessCount((prev) => prev + 1);
    const newSuccessRate = (successCount + 1) / (successCount + failureCount + 1);
    setConfidence(Math.max(0.5, Math.min(1.0, newSuccessRate * 0.95)));
  }, [successCount, failureCount]);

  const recordFailure = useCallback(() => {
    setFailureCount((prev) => prev + 1);
    const newSuccessRate = successCount / (successCount + failureCount + 1);
    setConfidence(Math.max(0.5, Math.min(1.0, newSuccessRate * 0.95)));
  }, [successCount, failureCount]);

  const getErrorProbability = useCallback(() => {
    return 1 - confidence;
  }, [confidence]);

  const shouldShowOptimistic = useCallback(() => {
    return confidence > 0.7;
  }, [confidence]);

  return {
    confidence,
    errorProbability: getErrorProbability(),
    successRate: successCount / (successCount + failureCount || 1),
    recordSuccess,
    recordFailure,
    shouldShowOptimistic,
  };
}

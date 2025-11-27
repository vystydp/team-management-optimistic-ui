/**
 * useEnvironmentPolling Hook
 * Polls environment status updates for environments in transient states
 * 
 * Phase 2.8: Real Crossplane reconciliation status updates
 */

import { useEffect, useRef } from 'react';
import { getEnvironment } from '../services/environmentsService';
import type { TeamEnvironment } from '../types/aws';

const POLL_INTERVAL = parseInt(import.meta.env.VITE_POLL_INTERVAL || '3000', 10);

// Transient statuses that need polling
const TRANSIENT_STATUSES = ['CREATING', 'UPDATING', 'PAUSING', 'RESUMING', 'DELETING', 'VALIDATING'];

interface UseEnvironmentPollingOptions {
  enabled?: boolean;
  onUpdate?: (environment: TeamEnvironment) => void;
  onError?: (error: Error) => void;
}

/**
 * Poll a single environment for status updates
 */
export function useEnvironmentPolling(
  environmentId: string | null,
  currentStatus: string | null,
  options: UseEnvironmentPollingOptions = {}
) {
  const { enabled = true, onUpdate, onError } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't poll if disabled, no environment, or not in transient status
    if (!enabled || !environmentId || !currentStatus || !TRANSIENT_STATUSES.includes(currentStatus)) {
      return;
    }

    // Start polling
    const poll = async () => {
      try {
        const updatedEnv = await getEnvironment(environmentId);
        
        if (isMountedRef.current && onUpdate) {
          onUpdate(updatedEnv);
        }

        // Stop polling if reached stable state
        if (!TRANSIENT_STATUSES.includes(updatedEnv.status)) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (error) {
        if (isMountedRef.current && onError) {
          onError(error as Error);
        }
      }
    };

    // Poll immediately once, then set interval
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [environmentId, currentStatus, enabled, onUpdate, onError]);
}

/**
 * Poll multiple environments for status updates
 */
export function useEnvironmentsPolling(
  environments: TeamEnvironment[],
  options: UseEnvironmentPollingOptions = {}
) {
  const { enabled = true, onUpdate, onError } = options;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Find environments that need polling
    const transientEnvs = environments?.filter(env => 
      TRANSIENT_STATUSES.includes(env.status)
    ) ?? [];

    // Don't poll if disabled or no transient environments
    if (!enabled || transientEnvs.length === 0) {
      return;
    }

    // Poll all transient environments
    const poll = async () => {
      try {
        const updates = await Promise.all(
          transientEnvs.map(env => getEnvironment(env.id))
        );

        if (isMountedRef.current && onUpdate) {
          updates.forEach(updatedEnv => onUpdate(updatedEnv));
        }
      } catch (error) {
        if (isMountedRef.current && onError) {
          onError(error as Error);
        }
      }
    };

    // Poll immediately once, then set interval
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [environments, enabled, onUpdate, onError]);
}

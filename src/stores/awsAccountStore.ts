import { create } from 'zustand';
import { AwsAccountRef } from '../types/aws';

/**
 * Optimistic update tracking
 */
interface OptimisticUpdate<T> {
  id: string;
  type: 'add' | 'update' | 'delete';
  data: T;
  timestamp: number;
  confidence: number; // 0-1, based on network conditions & user history
  rollbackData?: T;
}

interface AwsAccountStore {
  // State
  accounts: AwsAccountRef[];
  optimisticUpdates: Map<string, OptimisticUpdate<AwsAccountRef>>;
  
  // Analytics for optimistic UI confidence
  userSuccessRate: number; // 0-1
  networkCondition: 'fast' | 'slow' | 'offline';

  // Actions
  setAccounts: (accounts: AwsAccountRef[]) => void;
  
  // Optimistic operations
  addAccountOptimistic: (account: AwsAccountRef) => string;
  updateAccountOptimistic: (id: string, account: AwsAccountRef, rollbackData: AwsAccountRef) => string;
  deleteAccountOptimistic: (id: string, rollbackData: AwsAccountRef) => string;
  
  // Commit/rollback
  commitOptimistic: (updateId: string, actualData?: AwsAccountRef) => void;
  rollbackOptimistic: (updateId: string) => void;
  
  // Analytics
  recordSuccess: () => void;
  recordFailure: () => void;
}

export const useAwsAccountStore = create<AwsAccountStore>((set, get) => ({
  // Initial state
  accounts: [],
  optimisticUpdates: new Map(),
  userSuccessRate: 0.95, // Start with optimistic assumption
  networkCondition: 'fast',

  // Set accounts (from API)
  setAccounts: (accounts) => set({ accounts }),

  // Add account optimistically
  addAccountOptimistic: (account) => {
    const updateId = `add-${Date.now()}-${Math.random()}`;
    const optimisticUpdate: OptimisticUpdate<AwsAccountRef> = {
      id: updateId,
      type: 'add',
      data: account,
      timestamp: Date.now(),
      confidence: get().userSuccessRate,
    };

    set((state) => ({
      accounts: [...state.accounts, account],
      optimisticUpdates: new Map(state.optimisticUpdates).set(updateId, optimisticUpdate),
    }));

    return updateId;
  },

  // Update account optimistically
  updateAccountOptimistic: (id, account, rollbackData) => {
    const updateId = `update-${Date.now()}-${Math.random()}`;
    const optimisticUpdate: OptimisticUpdate<AwsAccountRef> = {
      id: updateId,
      type: 'update',
      data: account,
      timestamp: Date.now(),
      confidence: get().userSuccessRate,
      rollbackData,
    };

    set((state) => ({
      accounts: state.accounts.map((acc) => (acc.id === id ? account : acc)),
      optimisticUpdates: new Map(state.optimisticUpdates).set(updateId, optimisticUpdate),
    }));

    return updateId;
  },

  // Delete account optimistically
  deleteAccountOptimistic: (id, rollbackData) => {
    const updateId = `delete-${Date.now()}-${Math.random()}`;
    const optimisticUpdate: OptimisticUpdate<AwsAccountRef> = {
      id: updateId,
      type: 'delete',
      data: rollbackData,
      timestamp: Date.now(),
      confidence: get().userSuccessRate,
      rollbackData,
    };

    set((state) => ({
      accounts: state.accounts.filter((acc) => acc.id !== id),
      optimisticUpdates: new Map(state.optimisticUpdates).set(updateId, optimisticUpdate),
    }));

    return updateId;
  },

  // Commit optimistic update (success)
  commitOptimistic: (updateId, actualData) => {
    set((state) => {
      const updates = new Map(state.optimisticUpdates);
      const update = updates.get(updateId);
      
      if (!update) return state;

      updates.delete(updateId);

      // If we have actual data from server, update the account
      if (actualData && update.type !== 'delete') {
        return {
          accounts: state.accounts.map((acc) => 
            acc.id === actualData.id ? actualData : acc
          ),
          optimisticUpdates: updates,
        };
      }

      return { optimisticUpdates: updates };
    });

    get().recordSuccess();
  },

  // Rollback optimistic update (failure)
  rollbackOptimistic: (updateId) => {
    set((state) => {
      const updates = new Map(state.optimisticUpdates);
      const update = updates.get(updateId);
      
      if (!update) return state;

      updates.delete(updateId);

      // Revert the optimistic change
      if (update.type === 'add') {
        return {
          accounts: state.accounts.filter((acc) => acc.id !== update.data.id),
          optimisticUpdates: updates,
        };
      } else if (update.type === 'update' && update.rollbackData) {
        return {
          accounts: state.accounts.map((acc) => 
            acc.id === update.data.id ? update.rollbackData! : acc
          ),
          optimisticUpdates: updates,
        };
      } else if (update.type === 'delete' && update.rollbackData) {
        return {
          accounts: [...state.accounts, update.rollbackData],
          optimisticUpdates: updates,
        };
      }

      return { optimisticUpdates: updates };
    });

    get().recordFailure();
  },

  // Record successful operation
  recordSuccess: () => {
    set((state) => ({
      userSuccessRate: Math.min(0.99, state.userSuccessRate + 0.01),
    }));
  },

  // Record failed operation
  recordFailure: () => {
    set((state) => ({
      userSuccessRate: Math.max(0.5, state.userSuccessRate - 0.05),
    }));
  },
}));

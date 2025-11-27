import { create } from 'zustand';
import { TeamEnvironment, EnvironmentTemplate } from '../types/aws';

interface OptimisticUpdate<T> {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: T;
  timestamp: number;
  confidence: number;
  rollbackData?: T;
}

interface EnvironmentStore {
  // State
  environments: TeamEnvironment[];
  templates: EnvironmentTemplate[];
  optimisticUpdates: Map<string, OptimisticUpdate<TeamEnvironment>>;
  
  // Actions
  setEnvironments: (environments: TeamEnvironment[]) => void;
  setTemplates: (templates: EnvironmentTemplate[]) => void;
  addEnvironmentOptimistic: (environment: TeamEnvironment) => string;
  updateEnvironmentOptimistic: (id: string, environment: TeamEnvironment, rollbackData: TeamEnvironment) => string;
  deleteEnvironmentOptimistic: (id: string, rollbackData: TeamEnvironment) => string;
  commitOptimistic: (updateId: string, actualData?: TeamEnvironment) => void;
  rollbackOptimistic: (updateId: string) => void;
  
  // Analytics
  userSuccessRate: number;
  networkCondition: 'good' | 'fair' | 'poor';
  recordSuccess: () => void;
  recordFailure: () => void;
  setNetworkCondition: (condition: 'good' | 'fair' | 'poor') => void;
}

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  // Initial state
  environments: [],
  templates: [],
  optimisticUpdates: new Map(),
  userSuccessRate: 0.95,
  networkCondition: 'good',

  // Set environments (e.g., after initial fetch)
  setEnvironments: (environments) => set({ environments }),

  // Set templates (e.g., after initial fetch)
  setTemplates: (templates) => set({ templates }),

  // Add environment optimistically
  addEnvironmentOptimistic: (environment) => {
    const updateId = `add-${Date.now()}-${Math.random()}`;
    const optimisticUpdate: OptimisticUpdate<TeamEnvironment> = {
      id: updateId,
      type: 'create',
      data: environment,
      timestamp: Date.now(),
      confidence: get().userSuccessRate,
    };

    set((state) => ({
      environments: [...state.environments, environment],
      optimisticUpdates: new Map(state.optimisticUpdates).set(updateId, optimisticUpdate),
    }));

    return updateId;
  },

  // Update environment optimistically
  updateEnvironmentOptimistic: (id, environment, rollbackData) => {
    const updateId = `update-${Date.now()}-${Math.random()}`;
    const optimisticUpdate: OptimisticUpdate<TeamEnvironment> = {
      id: updateId,
      type: 'update',
      data: environment,
      timestamp: Date.now(),
      confidence: get().userSuccessRate,
      rollbackData,
    };

    set((state) => ({
      environments: state.environments.map((env) => (env.id === id ? environment : env)),
      optimisticUpdates: new Map(state.optimisticUpdates).set(updateId, optimisticUpdate),
    }));

    return updateId;
  },

  // Delete environment optimistically
  deleteEnvironmentOptimistic: (id, rollbackData) => {
    const updateId = `delete-${Date.now()}-${Math.random()}`;
    const optimisticUpdate: OptimisticUpdate<TeamEnvironment> = {
      id: updateId,
      type: 'delete',
      data: rollbackData,
      timestamp: Date.now(),
      confidence: get().userSuccessRate,
      rollbackData,
    };

    set((state) => ({
      environments: state.environments.filter((env) => env.id !== id),
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

      // If we have actual data from server, update the environment
      if (actualData && update.type !== 'delete') {
        // Replace the optimistic environment with actual backend data
        // For creates: replace by optimistic ID (update.data.id) with new backend ID (actualData.id)
        // For updates: replace by matching ID
        return {
          environments: state.environments.map((env) =>
            env.id === update.data.id ? actualData : env
          ),
          optimisticUpdates: updates,
        };
      }

      return { optimisticUpdates: updates };
    });
  },

  // Rollback optimistic update (failure)
  rollbackOptimistic: (updateId) => {
    set((state) => {
      const updates = new Map(state.optimisticUpdates);
      const update = updates.get(updateId);
      
      if (!update) return state;

      updates.delete(updateId);

      // Rollback the change
      let environments = state.environments;

      if (update.type === 'create') {
        // Remove the optimistically added environment
        environments = environments.filter((env) => env.id !== update.data.id);
      } else if (update.type === 'update' && update.rollbackData) {
        // Restore the original data
        environments = environments.map((env) =>
          env.id === update.rollbackData!.id ? update.rollbackData! : env
        );
      } else if (update.type === 'delete' && update.rollbackData) {
        // Re-add the deleted environment
        environments = [...environments, update.rollbackData];
      }

      get().recordFailure();

      return {
        environments,
        optimisticUpdates: updates,
      };
    });
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
      userSuccessRate: Math.max(0.70, state.userSuccessRate - 0.05),
    }));
  },

  // Set network condition
  setNetworkCondition: (condition) => set({ networkCondition: condition }),
}));

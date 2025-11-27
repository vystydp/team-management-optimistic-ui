import { create } from 'zustand';
import { TeamMember, OptimisticUpdate } from '../types/team';

interface TeamStore {
  // State
  members: TeamMember[];
  optimisticUpdates: Map<string, OptimisticUpdate<TeamMember>>;
  
  // Actions
  setMembers: (members: TeamMember[]) => void;
  addMemberOptimistic: (member: TeamMember) => string;
  updateMemberOptimistic: (id: string, member: TeamMember, rollbackData: TeamMember) => string;
  deleteMemberOptimistic: (id: string, rollbackData: TeamMember) => string;
  commitOptimistic: (updateId: string, actualData?: TeamMember) => void;
  rollbackOptimistic: (updateId: string) => void;
  
  // Analytics
  userSuccessRate: number;
  networkCondition: 'good' | 'fair' | 'poor';
  recordSuccess: () => void;
  recordFailure: () => void;
  setNetworkCondition: (condition: 'good' | 'fair' | 'poor') => void;
}

export const useTeamStore = create<TeamStore>((set, get) => ({
  // Initial state
  members: [],
  optimisticUpdates: new Map(),
  userSuccessRate: 0.95,
  networkCondition: 'good',

  // Set members (e.g., after initial fetch)
  setMembers: (members) => set({ members }),

  // Add member optimistically
  addMemberOptimistic: (member) => {
    const updateId = `add-${Date.now()}-${Math.random()}`;
    const optimisticUpdate: OptimisticUpdate<TeamMember> = {
      id: updateId,
      type: 'create',
      data: member,
      timestamp: Date.now(),
      confidence: get().userSuccessRate,
    };

    set((state) => ({
      members: [...state.members, member],
      optimisticUpdates: new Map(state.optimisticUpdates).set(updateId, optimisticUpdate),
    }));

    return updateId;
  },

  // Update member optimistically
  updateMemberOptimistic: (id, member, rollbackData) => {
    const updateId = `update-${Date.now()}-${Math.random()}`;
    const optimisticUpdate: OptimisticUpdate<TeamMember> = {
      id: updateId,
      type: 'update',
      data: member,
      timestamp: Date.now(),
      confidence: get().userSuccessRate,
      rollbackData,
    };

    set((state) => ({
      members: state.members.map((m) => (m.id === id ? member : m)),
      optimisticUpdates: new Map(state.optimisticUpdates).set(updateId, optimisticUpdate),
    }));

    return updateId;
  },

  // Delete member optimistically
  deleteMemberOptimistic: (id, rollbackData) => {
    const updateId = `delete-${Date.now()}-${Math.random()}`;
    const optimisticUpdate: OptimisticUpdate<TeamMember> = {
      id: updateId,
      type: 'delete',
      data: rollbackData,
      timestamp: Date.now(),
      confidence: get().userSuccessRate,
      rollbackData,
    };

    set((state) => ({
      members: state.members.filter((m) => m.id !== id),
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

      // If we have actual data from server, update the member
      if (actualData && update.type !== 'delete') {
        return {
          members: state.members.map((m) =>
            m.id === update.data.id || m.id === actualData.id ? actualData : m
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

      // Rollback the optimistic change
      if (update.type === 'create') {
        // Remove the optimistically added member
        return {
          members: state.members.filter((m) => m.id !== update.data.id),
          optimisticUpdates: updates,
        };
      } else if (update.type === 'update' && update.rollbackData) {
        // Restore previous state
        return {
          members: state.members.map((m) =>
            m.id === update.data.id ? update.rollbackData! : m
          ),
          optimisticUpdates: updates,
        };
      } else if (update.type === 'delete' && update.rollbackData) {
        // Restore deleted member
        return {
          members: [...state.members, update.rollbackData],
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
      userSuccessRate: Math.min(0.99, state.userSuccessRate * 1.05),
    }));
  },

  // Record failed operation
  recordFailure: () => {
    set((state) => ({
      userSuccessRate: Math.max(0.5, state.userSuccessRate * 0.9),
    }));
  },

  // Set network condition
  setNetworkCondition: (condition) => set({ networkCondition: condition }),
}));

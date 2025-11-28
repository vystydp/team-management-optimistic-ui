import { useCallback } from 'react';
import { useTeamStore } from '../stores/teamStore';
import { teamMemberService } from '../services/teamMemberService';
import { TeamMember } from '../types/team';
import { TeamMemberModel } from '../models/TeamMemberModel';

/**
 * Hook for team member operations with optimistic UI
 */
export function useTeamMembers(): {
  members: TeamMember[];
  loading: boolean;
  error: Error | null;
  addMember: (member: TeamMember) => void;
  updateMember: (id: string, updates: Partial<TeamMember>) => void;
  removeMember: (id: string) => void;
  createMember: (data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
} {
  const members = useTeamStore((state) => state.members);
  const addOptimistic = useTeamStore((state) => state.addMemberOptimistic);
  const updateOptimistic = useTeamStore((state) => state.updateMemberOptimistic);
  const deleteOptimistic = useTeamStore((state) => state.deleteMemberOptimistic);
  const commit = useTeamStore((state) => state.commitOptimistic);
  const rollback = useTeamStore((state) => state.rollbackOptimistic);

  /**
   * Creates a new team member with optimistic update
   */
  const createMember = useCallback(
    async (data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => {
      // Create optimistic model
      const optimisticModel = TeamMemberModel.create(data);
      const optimisticMember = optimisticModel.getData();

      // Apply optimistic update
      const updateId = addOptimistic(optimisticMember);

      try {
        // Perform actual API call
        const createdMember = await teamMemberService.create(data);
        
        // Commit optimistic update with real data
        commit(updateId, createdMember);
        
        return createdMember;
      } catch (error) {
        // Rollback on error
        rollback(updateId);
        throw error;
      }
    },
    [addOptimistic, commit, rollback]
  );

  /**
   * Updates a team member with optimistic update
   */
  const updateMember = useCallback(
    async (id: string, data: Partial<TeamMember>) => {
      // Get current member for rollback
      const currentMember = members.find((m) => m.id === id);
      if (!currentMember) {
        throw new Error('Team member not found');
      }

      // Create optimistic update
      const optimisticModel = new TeamMemberModel(currentMember);
      const updatedModel = optimisticModel.update(data);
      const optimisticMember = updatedModel.getData();

      // Apply optimistic update
      const updateId = updateOptimistic(id, optimisticMember, currentMember);

      try {
        // Perform actual API call
        const updatedMember = await teamMemberService.update(id, data);
        
        // Commit optimistic update with real data
        commit(updateId, updatedMember);
        
        return updatedMember;
      } catch (error) {
        // Rollback on error
        rollback(updateId);
        throw error;
      }
    },
    [members, updateOptimistic, commit, rollback]
  );

  /**
   * Deletes a team member with optimistic update
   */
  const deleteMember = useCallback(
    async (id: string) => {
      // Get current member for rollback
      const currentMember = members.find((m) => m.id === id);
      if (!currentMember) {
        throw new Error('Team member not found');
      }

      // Apply optimistic delete
      const updateId = deleteOptimistic(id, currentMember);

      try {
        // Perform actual API call
        await teamMemberService.delete(id);
        
        // Commit optimistic update
        commit(updateId);
      } catch (error) {
        // Rollback on error
        rollback(updateId);
        throw error;
      }
    },
    [members, deleteOptimistic, commit, rollback]
  );

  /**
   * Toggles team member status with optimistic update
   */
  const toggleStatus = useCallback(
    async (id: string) => {
      // Get current member
      const currentMember = members.find((m) => m.id === id);
      if (!currentMember) {
        throw new Error('Team member not found');
      }

      // Create optimistic toggle
      const optimisticModel = new TeamMemberModel(currentMember);
      const toggledModel = optimisticModel.toggleStatus();
      const optimisticMember = toggledModel.getData();

      // Apply optimistic update
      const updateId = updateOptimistic(id, optimisticMember, currentMember);

      try {
        // Perform actual API call
        const updatedMember = await teamMemberService.toggleStatus(id);
        
        // Commit optimistic update with real data
        commit(updateId, updatedMember);
        
        return updatedMember;
      } catch (error) {
        // Rollback on error
        rollback(updateId);
        throw error;
      }
    },
    [members, updateOptimistic, commit, rollback]
  );

  // Wrap functions that need void return type
  const createMemberVoid = async (data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
    await createMember(data);
  };
  
  const deleteMemberVoid = async (id: string): Promise<void> => {
    await deleteMember(id);
  };
  
  const toggleStatusVoid = async (id: string): Promise<void> => {
    await toggleStatus(id);
  };

  return {
    members,
    createMember: createMemberVoid,
    updateMember,
    deleteMember: deleteMemberVoid,
    toggleStatus: toggleStatusVoid,
    addMember: () => {}, // stub
    removeMember: () => {}, // stub  
    loading: false,
    error: null,
  };
}

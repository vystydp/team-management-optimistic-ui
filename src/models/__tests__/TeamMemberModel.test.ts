import { TeamMemberModel, OptimisticUpdateModel } from '../TeamMemberModel';
import { TeamMember, OptimisticUpdate } from '../../types/team';

describe('TeamMemberModel', () => {
  const validTeamMember: TeamMember = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Developer',
    department: 'Engineering',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  describe('constructor and validation', () => {
    it('should create a valid team member model', () => {
      const model = new TeamMemberModel(validTeamMember);
      expect(model.getData()).toEqual(validTeamMember);
    });

    it('should throw error for empty name', () => {
      const invalidMember = { ...validTeamMember, name: '' };
      expect(() => new TeamMemberModel(invalidMember)).toThrow('Name is required');
    });

    it('should throw error for invalid email', () => {
      const invalidMember = { ...validTeamMember, email: 'invalid-email' };
      expect(() => new TeamMemberModel(invalidMember)).toThrow('Invalid email format');
    });

    it('should throw error for empty role', () => {
      const invalidMember = { ...validTeamMember, role: '' };
      expect(() => new TeamMemberModel(invalidMember)).toThrow('Role is required');
    });

    it('should throw error for empty department', () => {
      const invalidMember = { ...validTeamMember, department: '' };
      expect(() => new TeamMemberModel(invalidMember)).toThrow('Department is required');
    });
  });

  describe('update', () => {
    it('should update team member data', () => {
      const model = new TeamMemberModel(validTeamMember);
      const updated = model.update({ name: 'Jane Doe' });
      
      expect(updated.getData().name).toBe('Jane Doe');
      expect(updated.getData().id).toBe(validTeamMember.id);
      expect(updated.getData().createdAt).toBe(validTeamMember.createdAt);
    });

    it('should update updatedAt timestamp', () => {
      const model = new TeamMemberModel(validTeamMember);
      const updated = model.update({ name: 'Jane Doe' });
      
      expect(updated.getData().updatedAt).not.toBe(validTeamMember.updatedAt);
    });

    it('should preserve immutability', () => {
      const model = new TeamMemberModel(validTeamMember);
      const updated = model.update({ name: 'Jane Doe' });
      
      expect(model.getData().name).toBe('John Doe');
      expect(updated.getData().name).toBe('Jane Doe');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle active to inactive', () => {
      const model = new TeamMemberModel(validTeamMember);
      const toggled = model.toggleStatus();
      
      expect(toggled.getData().status).toBe('inactive');
    });

    it('should toggle inactive to active', () => {
      const inactiveMember = { ...validTeamMember, status: 'inactive' as const };
      const model = new TeamMemberModel(inactiveMember);
      const toggled = model.toggleStatus();
      
      expect(toggled.getData().status).toBe('active');
    });
  });

  describe('isActive', () => {
    it('should return true for active member', () => {
      const model = new TeamMemberModel(validTeamMember);
      expect(model.isActive()).toBe(true);
    });

    it('should return false for inactive member', () => {
      const inactiveMember = { ...validTeamMember, status: 'inactive' as const };
      const model = new TeamMemberModel(inactiveMember);
      expect(model.isActive()).toBe(false);
    });
  });

  describe('getDisplayName', () => {
    it('should return formatted display name', () => {
      const model = new TeamMemberModel(validTeamMember);
      expect(model.getDisplayName()).toBe('John Doe (Developer)');
    });
  });

  describe('isInDepartment', () => {
    it('should return true for matching department (case insensitive)', () => {
      const model = new TeamMemberModel(validTeamMember);
      expect(model.isInDepartment('Engineering')).toBe(true);
      expect(model.isInDepartment('engineering')).toBe(true);
      expect(model.isInDepartment('ENGINEERING')).toBe(true);
    });

    it('should return false for non-matching department', () => {
      const model = new TeamMemberModel(validTeamMember);
      expect(model.isInDepartment('Marketing')).toBe(false);
    });
  });

  describe('create factory method', () => {
    it('should create new team member with temporary ID', () => {
      const newMemberData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'Designer',
        department: 'Design',
        status: 'active' as const,
      };

      const model = TeamMemberModel.create(newMemberData);
      const data = model.getData();

      expect(data.name).toBe(newMemberData.name);
      expect(data.id).toMatch(/^temp-/);
      expect(data.createdAt).toBeTruthy();
      expect(data.updatedAt).toBeTruthy();
    });
  });
});

describe('OptimisticUpdateModel', () => {
  const mockData: TeamMember = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Developer',
    department: 'Engineering',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  describe('calculateConfidence', () => {
    it('should calculate confidence based on user success rate and network', () => {
      const update: OptimisticUpdate<TeamMember> = {
        id: 'opt-1',
        type: 'update',
        data: mockData,
        timestamp: Date.now(),
        confidence: 0.95,
      };

      const model = new OptimisticUpdateModel(update);

      // Good network, high success rate
      expect(model.calculateConfidence(0.95, 'good')).toBeCloseTo(0.9025, 2);

      // Fair network, lower success rate
      expect(model.calculateConfidence(0.8, 'fair')).toBeCloseTo(0.684, 2);

      // Poor network, low success rate
      expect(model.calculateConfidence(0.7, 'poor')).toBeCloseTo(0.5, 1);
    });

    it('should not return confidence below 0.5', () => {
      const update: OptimisticUpdate<TeamMember> = {
        id: 'opt-1',
        type: 'update',
        data: mockData,
        timestamp: Date.now(),
        confidence: 0.95,
      };

      const model = new OptimisticUpdateModel(update);
      const confidence = model.calculateConfidence(0.3, 'poor');

      expect(confidence).toBeGreaterThanOrEqual(0.5);
    });
  });

  describe('estimateErrorProbability', () => {
    it('should estimate error probability based on operation type', () => {
      const update: OptimisticUpdate<TeamMember> = {
        id: 'opt-1',
        type: 'create',
        data: mockData,
        timestamp: Date.now(),
        confidence: 0.95,
      };

      const model = new OptimisticUpdateModel(update);

      expect(model.estimateErrorProbability('create', 0.02)).toBe(0.05);
      expect(model.estimateErrorProbability('update', 0.02)).toBe(0.03);
      expect(model.estimateErrorProbability('delete', 0.02)).toBe(0.04);
    });

    it('should use historical failure rate if higher', () => {
      const update: OptimisticUpdate<TeamMember> = {
        id: 'opt-1',
        type: 'update',
        data: mockData,
        timestamp: Date.now(),
        confidence: 0.95,
      };

      const model = new OptimisticUpdateModel(update);
      expect(model.estimateErrorProbability('update', 0.1)).toBe(0.1);
    });

    it('should cap error probability at 0.5', () => {
      const update: OptimisticUpdate<TeamMember> = {
        id: 'opt-1',
        type: 'create',
        data: mockData,
        timestamp: Date.now(),
        confidence: 0.95,
      };

      const model = new OptimisticUpdateModel(update);
      expect(model.estimateErrorProbability('create', 0.9)).toBe(0.5);
    });
  });

  describe('isStale', () => {
    it('should return false for recent updates', () => {
      const update: OptimisticUpdate<TeamMember> = {
        id: 'opt-1',
        type: 'update',
        data: mockData,
        timestamp: Date.now(),
        confidence: 0.95,
      };

      const model = new OptimisticUpdateModel(update);
      expect(model.isStale(30000)).toBe(false);
    });

    it('should return true for old updates', () => {
      const update: OptimisticUpdate<TeamMember> = {
        id: 'opt-1',
        type: 'update',
        data: mockData,
        timestamp: Date.now() - 40000, // 40 seconds ago
        confidence: 0.95,
      };

      const model = new OptimisticUpdateModel(update);
      expect(model.isStale(30000)).toBe(true);
    });
  });

  describe('createRollback', () => {
    it('should create rollback update when rollbackData exists', () => {
      const rollbackData = { ...mockData, name: 'Original Name' };
      const update: OptimisticUpdate<TeamMember> = {
        id: 'opt-1',
        type: 'update',
        data: mockData,
        timestamp: Date.now(),
        confidence: 0.95,
        rollbackData,
      };

      const model = new OptimisticUpdateModel(update);
      const rollback = model.createRollback();

      expect(rollback).not.toBeNull();
      expect(rollback?.data).toEqual(rollbackData);
      expect(rollback?.id).toMatch(/^rollback-/);
      expect(rollback?.confidence).toBe(1.0);
    });

    it('should return null when no rollbackData exists', () => {
      const update: OptimisticUpdate<TeamMember> = {
        id: 'opt-1',
        type: 'create',
        data: mockData,
        timestamp: Date.now(),
        confidence: 0.95,
      };

      const model = new OptimisticUpdateModel(update);
      expect(model.createRollback()).toBeNull();
    });
  });

  describe('create factory method', () => {
    it('should create optimistic update with proper structure', () => {
      const model = OptimisticUpdateModel.create('update', mockData, mockData);
      const data = model.getData();

      expect(data.type).toBe('update');
      expect(data.data).toEqual(mockData);
      expect(data.rollbackData).toEqual(mockData);
      expect(data.id).toMatch(/^opt-/);
      expect(data.confidence).toBe(0.95);
      expect(data.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });
});

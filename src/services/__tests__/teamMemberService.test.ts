import { TeamMemberService } from '../teamMemberService';
import { TeamMember } from '../../types/team';

// Mock fetch globally
global.fetch = jest.fn();

describe('TeamMemberService', () => {
  let service: TeamMemberService;
  const mockMember: TeamMember = {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Developer',
    department: 'Engineering',
    status: 'active',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    service = new TeamMemberService('/api');
    (global.fetch as jest.Mock).mockClear();
  });

  describe('getAll', () => {
    it('should fetch all team members', async () => {
      const mockMembers = [mockMember];
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMembers,
      });

      const result = await service.getAll();

      expect(global.fetch).toHaveBeenCalledWith('/api/team-members');
      expect(result).toEqual(mockMembers);
    });

    it('should throw error on failed request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await expect(service.getAll()).rejects.toThrow(
        'Failed to fetch team members: Internal Server Error'
      );
    });
  });

  describe('getById', () => {
    it('should fetch team member by ID', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockMember,
      });

      const result = await service.getById('1');

      expect(global.fetch).toHaveBeenCalledWith('/api/team-members/1');
      expect(result).toEqual(mockMember);
    });

    it('should throw specific error for 404', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(service.getById('999')).rejects.toThrow('Team member not found');
    });
  });

  describe('create', () => {
    it('should create a new team member', async () => {
      const newMemberData = {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        role: 'Designer',
        department: 'Design',
        status: 'active' as const,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...newMemberData, id: '2', createdAt: '', updatedAt: '' }),
      });

      const result = await service.create(newMemberData);

      expect(global.fetch).toHaveBeenCalledWith('/api/team-members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemberData),
      });
      expect(result.name).toBe(newMemberData.name);
    });

    it('should throw error on failed creation', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(
        service.create({
          name: 'Test',
          email: 'test@example.com',
          role: 'Tester',
          department: 'QA',
          status: 'active',
        })
      ).rejects.toThrow('Failed to create team member: Bad Request');
    });
  });

  describe('update', () => {
    it('should update a team member', async () => {
      const updates = { name: 'John Updated' };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockMember, ...updates }),
      });

      const result = await service.update('1', updates);

      expect(global.fetch).toHaveBeenCalledWith('/api/team-members/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      expect(result.name).toBe('John Updated');
    });

    it('should throw error for non-existent member', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(service.update('999', { name: 'Test' })).rejects.toThrow(
        'Team member not found'
      );
    });
  });

  describe('delete', () => {
    it('should delete a team member', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await service.delete('1');

      expect(global.fetch).toHaveBeenCalledWith('/api/team-members/1', {
        method: 'DELETE',
      });
    });

    it('should throw error for non-existent member', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      await expect(service.delete('999')).rejects.toThrow('Team member not found');
    });
  });

  describe('toggleStatus', () => {
    it('should toggle team member status', async () => {
      const toggled = { ...mockMember, status: 'inactive' as const };
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => toggled,
      });

      const result = await service.toggleStatus('1');

      expect(global.fetch).toHaveBeenCalledWith('/api/team-members/1/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result.status).toBe('inactive');
    });
  });
});

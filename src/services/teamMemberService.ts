import { TeamMember } from '../types/team';

/**
 * API Service for team member operations
 */
export class TeamMemberService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  /**
   * Fetches all team members
   */
  async getAll(): Promise<TeamMember[]> {
    const response = await fetch(`${this.baseUrl}/team-members`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch team members: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetches a single team member by ID
   */
  async getById(id: string): Promise<TeamMember> {
    const response = await fetch(`${this.baseUrl}/team-members/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Team member not found');
      }
      throw new Error(`Failed to fetch team member: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Creates a new team member
   */
  async create(
    data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TeamMember> {
    const response = await fetch(`${this.baseUrl}/team-members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to create team member: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Updates an existing team member
   */
  async update(id: string, data: Partial<TeamMember>): Promise<TeamMember> {
    const response = await fetch(`${this.baseUrl}/team-members/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Team member not found');
      }
      throw new Error(`Failed to update team member: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Deletes a team member
   */
  async delete(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/team-members/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Team member not found');
      }
      throw new Error(`Failed to delete team member: ${response.statusText}`);
    }
  }

  /**
   * Toggles team member status
   */
  async toggleStatus(id: string): Promise<TeamMember> {
    const response = await fetch(`${this.baseUrl}/team-members/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Team member not found');
      }
      throw new Error(`Failed to toggle status: ${response.statusText}`);
    }

    return response.json();
  }
}

// Singleton instance
export const teamMemberService = new TeamMemberService();

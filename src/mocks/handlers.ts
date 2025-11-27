import { http, HttpResponse, delay } from 'msw';
import { TeamMember } from '../types/team';

// In-memory storage for demo
const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    role: 'Senior Developer',
    department: 'Engineering',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    role: 'Product Manager',
    department: 'Product',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Simulate network delay
const SIMULATED_DELAY = 800;

// Simulate random failures (5% chance)
const shouldSimulateError = () => Math.random() < 0.05;

export const handlers = [
  // Get all team members
  http.get('/api/team-members', async () => {
    await delay(SIMULATED_DELAY);
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to fetch team members' },
        { status: 500 }
      );
    }

    return HttpResponse.json(teamMembers);
  }),

  // Get single team member
  http.get('/api/team-members/:id', async ({ params }) => {
    await delay(SIMULATED_DELAY);
    
    const member = teamMembers.find((m) => m.id === params.id);
    
    if (!member) {
      return HttpResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(member);
  }),

  // Create team member
  http.post('/api/team-members', async ({ request }) => {
    await delay(SIMULATED_DELAY);
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to create team member' },
        { status: 500 }
      );
    }

    const body = await request.json() as Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>;
    const newMember: TeamMember = {
      ...body,
      id: String(Date.now()),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    teamMembers.push(newMember);
    return HttpResponse.json(newMember, { status: 201 });
  }),

  // Update team member
  http.put('/api/team-members/:id', async ({ params, request }) => {
    await delay(SIMULATED_DELAY);
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to update team member' },
        { status: 500 }
      );
    }

    const index = teamMembers.findIndex((m) => m.id === params.id);
    
    if (index === -1) {
      return HttpResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    const body = await request.json() as Partial<TeamMember>;
    const updatedMember: TeamMember = {
      ...teamMembers[index],
      ...body,
      id: teamMembers[index].id,
      updatedAt: new Date().toISOString(),
    };

    teamMembers[index] = updatedMember;
    return HttpResponse.json(updatedMember);
  }),

  // Delete team member
  http.delete('/api/team-members/:id', async ({ params }) => {
    await delay(SIMULATED_DELAY);
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to delete team member' },
        { status: 500 }
      );
    }

    const index = teamMembers.findIndex((m) => m.id === params.id);
    
    if (index === -1) {
      return HttpResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    teamMembers.splice(index, 1);
    return HttpResponse.json({ success: true }, { status: 204 });
  }),

  // Toggle member status
  http.patch('/api/team-members/:id/status', async ({ params }) => {
    await delay(SIMULATED_DELAY);
    
    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to toggle status' },
        { status: 500 }
      );
    }

    const index = teamMembers.findIndex((m) => m.id === params.id);
    
    if (index === -1) {
      return HttpResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    teamMembers[index].status = 
      teamMembers[index].status === 'active' ? 'inactive' : 'active';
    teamMembers[index].updatedAt = new Date().toISOString();

    return HttpResponse.json(teamMembers[index]);
  }),
];

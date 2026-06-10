import { http, HttpResponse, delay } from 'msw';
import { TeamMember } from '../types/team';
import { TeamEnvironment, EnvironmentTemplate, AwsAccountRef } from '../types/aws';

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

  // ===================
  // Environment Templates
  // ===================
  http.get('/api/templates', async () => {
    await delay(SIMULATED_DELAY);

    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    const templates: EnvironmentTemplate[] = [
      {
        id: 'tpl-sandbox',
        name: 'Sandbox Environment',
        description: 'Basic sandbox for development and testing',
        type: 'sandbox',
        version: '1.0.0',
        parameters: {
          size: 'small',
          region: 'us-east-1',
        },
        allowedRegions: ['us-east-1'],
        allowedSizes: ['small'],
        estimatedCost: {
          hourly: 0.07,
          monthly: 50,
        },
        resources: ['VPC', 'ECS', 'S3'],
        tags: ['sandbox', 'development'],
      },
      {
        id: 'tpl-dev',
        name: 'Development Environment',
        description: 'Full development environment with monitoring',
        type: 'development',
        version: '2.1.0',
        parameters: {
          size: 'medium',
          region: 'us-east-1',
          enableAutoScaling: true,
          enableMonitoring: true,
        },
        allowedRegions: ['us-east-1', 'us-west-2'],
        allowedSizes: ['small', 'medium'],
        estimatedCost: {
          hourly: 0.28,
          monthly: 200,
        },
        resources: ['VPC', 'ECS', 'RDS', 'S3'],
        tags: ['development', 'monitored'],
      },
      {
        id: 'tpl-staging',
        name: 'Staging Environment',
        description: 'Pre-production staging environment',
        type: 'staging',
        version: '2.0.5',
        parameters: {
          size: 'large',
          region: 'us-east-1',
          enableAutoScaling: true,
          enableMonitoring: true,
          enableBackups: true,
        },
        allowedRegions: ['us-east-1', 'us-west-2', 'eu-west-1'],
        allowedSizes: ['medium', 'large', 'xlarge'],
        estimatedCost: {
          hourly: 0.70,
          monthly: 500,
        },
        resources: ['VPC', 'ECS', 'RDS', 'S3', 'CloudWatch'],
        tags: ['staging', 'production-ready'],
      },
    ];

    return HttpResponse.json(templates);
  }),

  // ===================
  // AWS Accounts
  // ===================
  http.get('/api/aws/accounts', async () => {
    await delay(SIMULATED_DELAY);

    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to fetch AWS accounts' },
        { status: 500 }
      );
    }

    const accounts: AwsAccountRef[] = [
      {
        id: 'acc-1',
        accountId: '123456789012',
        accountName: 'Development Account',
        roleArn: 'arn:aws:iam::123456789012:role/CrossplaneRole',
        type: 'linked',
        status: 'guardrailed',
        ownerEmail: 'dev-team@example.com',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        tags: { environment: 'development', team: 'platform' },
      },
      {
        id: 'acc-2',
        accountId: '234567890123',
        accountName: 'Staging Account',
        roleArn: 'arn:aws:iam::234567890123:role/CrossplaneRole',
        type: 'managed',
        status: 'guardrailed',
        ownerEmail: 'staging@example.com',
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        tags: { environment: 'staging', team: 'platform' },
      },
    ];

    // awsAccountService expects an object envelope: { accounts: [...] }
    return HttpResponse.json({ accounts });
  }),

  // Link an existing AWS account
  http.post('/api/aws/link-account', async ({ request }) => {
    await delay(SIMULATED_DELAY);

    const body = (await request.json()) as {
      accountId: string;
      accountName: string;
      roleArn: string;
      ownerEmail: string;
    };

    const account: AwsAccountRef = {
      id: `acc-${Date.now()}`,
      accountId: body.accountId,
      accountName: body.accountName,
      roleArn: body.roleArn,
      type: 'linked',
      status: 'linked',
      ownerEmail: body.ownerEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: {},
    };

    return HttpResponse.json({ account }, { status: 201 });
  }),

  // ===================
  // AWS Account Requests
  // ===================
  http.get('/api/aws/account-requests', async () => {
    await delay(SIMULATED_DELAY);

    const requests = [
      {
        id: 'req-1',
        userId: 'demo-user',
        status: 'READY',
        accountName: 'Analytics Sandbox',
        ownerEmail: 'analytics@example.com',
        purpose: 'development',
        primaryRegion: 'us-east-1',
        awsAccountId: '345678901234',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        completedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'req-2',
        userId: 'demo-user',
        status: 'GUARDRAILING',
        accountName: 'Payments Staging',
        ownerEmail: 'payments@example.com',
        purpose: 'staging',
        primaryRegion: 'eu-west-1',
        awsAccountId: '456789012345',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        updatedAt: new Date(Date.now() - 600000).toISOString(),
      },
    ];

    return HttpResponse.json({ requests, total: requests.length });
  }),

  // ===================
  // Team Environments
  // ===================
  http.get('/api/environments', async () => {
    await delay(SIMULATED_DELAY);

    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to fetch environments' },
        { status: 500 }
      );
    }

    // Return empty array for now - environments will be created via POST
    const environments: TeamEnvironment[] = [];
    return HttpResponse.json(environments);
  }),

  http.post('/api/environments', async ({ request }) => {
    await delay(SIMULATED_DELAY * 2); // Longer delay for creation

    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to create environment' },
        { status: 500 }
      );
    }

    const body = await request.json() as Partial<TeamEnvironment>;

    const newEnvironment: TeamEnvironment = {
      id: `env-${Date.now()}`,
      name: body.name || 'Unnamed Environment',
      teamId: body.teamId || 'team-1',
      templateId: body.templateId || '',
      awsAccountId: body.awsAccountId || '',
      parameters: body.parameters || { size: 'small', region: 'us-east-1' },
      status: 'READY',
      resourcesProvisioned: ['vpc-123', 'ecs-456', 's3-789'],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1',
      endpoints: {
        api: 'https://api.example.com',
        web: 'https://web.example.com',
      },
    };

    return HttpResponse.json(newEnvironment, { status: 201 });
  }),

  http.patch('/api/environments/:id', async ({ params, request }) => {
    await delay(SIMULATED_DELAY);

    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to update environment' },
        { status: 500 }
      );
    }

    const body = await request.json() as Partial<TeamEnvironment>;

    const updatedEnvironment: TeamEnvironment = {
      id: params.id as string,
      name: body.name || 'Updated Environment',
      teamId: body.teamId || 'team-1',
      templateId: body.templateId || '',
      awsAccountId: body.awsAccountId || '',
      parameters: body.parameters || { size: 'small', region: 'us-east-1' },
      status: body.status || 'READY',
      resourcesProvisioned: body.resourcesProvisioned || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1',
    };

    return HttpResponse.json(updatedEnvironment);
  }),

  http.delete('/api/environments/:id', async ({ params }) => {
    await delay(SIMULATED_DELAY * 2);

    if (shouldSimulateError()) {
      return HttpResponse.json(
        { error: 'Failed to delete environment' },
        { status: 500 }
      );
    }

    return HttpResponse.json({
      message: 'Environment deleted successfully',
      id: params.id
    });
  }),

  // ===================
  // Activity Feed
  // ===================
  http.get('/api/activity', async ({ request }) => {
    await delay(SIMULATED_DELAY);

    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') ?? '1');
    const pageSize = Number(url.searchParams.get('pageSize') ?? '20');

    const events = [
      {
        id: 'evt-1',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        type: 'environment.created',
        resourceType: 'environment',
        resourceId: 'env-dev-001',
        resourceName: 'Development Environment',
        actor: { id: 'user-1', name: 'John Doe', email: 'john@example.com' },
        action: 'Created development environment',
        metadata: { template: 'Development', size: 'medium' },
      },
      {
        id: 'evt-2',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        type: 'team.member.added',
        resourceType: 'team_member',
        resourceId: 'member-1',
        resourceName: 'Alice Smith',
        actor: { id: 'user-1', name: 'John Doe' },
        action: 'Added team member Alice Smith',
        metadata: { role: 'Developer' },
      },
      {
        id: 'evt-3',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'environment.scaled',
        resourceType: 'environment',
        resourceId: 'env-dev-001',
        resourceName: 'Development Environment',
        actor: { id: 'user-1', name: 'John Doe' },
        action: 'Scaled environment from medium to large',
        changes: [{ field: 'size', oldValue: 'medium', newValue: 'large' }],
      },
    ];

    return HttpResponse.json({
      events,
      total: events.length,
      page,
      pageSize,
      hasMore: false,
    });
  }),

  http.get('/api/activity/stats', async () => {
    await delay(SIMULATED_DELAY);

    return HttpResponse.json({
      total: 8,
      byResourceType: {
        environment: 3,
        team_member: 2,
        aws_account: 2,
        crossplane_resource: 1,
      },
      byActor: {
        'John Doe': 5,
        'Crossplane Controller': 2,
        'System': 1,
      },
      recentActivity: [],
    });
  }),
];

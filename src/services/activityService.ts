/**
 * Activity Feed Service
 * Frontend service for fetching activity events
 */

import type { 
  ActivityEvent, 
  ActivityFeedFilters, 
  ActivityFeedResponse 
} from '../types/activity';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function getActivityFeed(
  page: number = 1,
  pageSize: number = 20,
  filters?: ActivityFeedFilters
): Promise<ActivityFeedResponse> {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: pageSize.toString(),
    });

    if (filters) {
      if (filters.resourceType) params.append('resourceType', filters.resourceType);
      if (filters.actorId) params.append('actorId', filters.actorId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.search) params.append('search', filters.search);
    }

    const response = await fetch(`${API_BASE}/api/activity?${params}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity feed');
    }

    return response.json();
  } catch (error) {
    console.warn('Backend unavailable, using mock data:', error);
    // Return mock data when backend is unavailable
    return getMockActivityFeed(page, pageSize, filters);
  }
}

function getMockActivityFeed(
  page: number,
  pageSize: number,
  filters?: ActivityFeedFilters
): ActivityFeedResponse {
  const mockEvents: ActivityEvent[] = [
    {
      id: 'evt-1',
      timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
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
      timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
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
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
      type: 'environment.scaled',
      resourceType: 'environment',
      resourceId: 'env-dev-001',
      resourceName: 'Development Environment',
      actor: { id: 'user-1', name: 'John Doe' },
      action: 'Scaled environment from medium to large',
      changes: [{ field: 'size', oldValue: 'medium', newValue: 'large' }],
    },
  ];

  // Apply filters
  let filtered = [...mockEvents];
  if (filters?.resourceType) {
    filtered = filtered.filter(e => e.resourceType === filters.resourceType);
  }
  if (filters?.search) {
    const search = filters.search.toLowerCase();
    filtered = filtered.filter(e => 
      e.action.toLowerCase().includes(search) ||
      e.resourceName.toLowerCase().includes(search)
    );
  }

  const total = filtered.length;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const events = filtered.slice(startIndex, endIndex);

  return {
    events,
    total,
    page,
    pageSize,
    hasMore: endIndex < total,
  };
}

export async function getActivityStats(): Promise<{
  total: number;
  byResourceType: Record<string, number>;
  byActor: Record<string, number>;
  recentActivity: ActivityEvent[];
}> {
  try {
    const response = await fetch(`${API_BASE}/api/activity/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch activity stats');
    }

    return response.json();
  } catch (error) {
    console.warn('Backend unavailable, using mock stats:', error);
    // Return mock stats when backend is unavailable
    return {
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
    };
  }
}

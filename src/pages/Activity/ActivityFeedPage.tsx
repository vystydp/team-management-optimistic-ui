import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PorscheIcon } from '../../components/shared/PorscheIcon';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHeader } from '../../components/shared/PageHeader';
import { PageHero } from '../../components/layout/PageHero';
import { KpiRow } from '../../components/layout/KpiRow';
import * as activityService from '../../services/activityService';
import type { ActivityEvent, ActivityResourceType } from '../../types/activity';

/**
 * Activity Feed Page - Unified event timeline
 * Phase 5: Final Day-2 operations feature
 */
export const ActivityFeedPage = () => {
  const [page, setPage] = useState(1);
  const [selectedResourceType, setSelectedResourceType] = useState<ActivityResourceType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 20;

  // Fetch activity feed
  const { data: feedData, isLoading } = useQuery({
    queryKey: ['activity-feed', page, selectedResourceType, searchQuery],
    queryFn: () => activityService.getActivityFeed(
      page,
      pageSize,
      {
        resourceType: selectedResourceType !== 'all' ? selectedResourceType : undefined,
        search: searchQuery || undefined,
      }
    ),
  });

  // Fetch stats for KPI tiles
  const { data: stats } = useQuery({
    queryKey: ['activity-stats'],
    queryFn: () => activityService.getActivityStats(),
  });

  const resourceTypes: Array<ActivityResourceType | 'all'> = [
    'all',
    'team_member',
    'environment',
    'aws_account',
    'crossplane_resource',
    'system',
  ];

  const getResourceTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      all: 'All',
      team_member: 'Team',
      environment: 'Environments',
      aws_account: 'AWS Accounts',
      crossplane_resource: 'Crossplane',
      system: 'System',
    };
    return labels[type] || type;
  };

  const getEventIcon = (event: ActivityEvent): string => {
    if (event.type.startsWith('team.')) return 'userGroup';
    if (event.type.startsWith('environment.')) return 'globe';
    if (event.type.startsWith('aws.')) return 'success';
    if (event.type.startsWith('crossplane.')) return 'information';
    return 'clock';
  };

  const getEventColor = (event: ActivityEvent): string => {
    if (event.type.includes('created') || event.type.includes('added')) return 'text-green-600';
    if (event.type.includes('deleted') || event.type.includes('removed') || event.type.includes('failed')) return 'text-red-600';
    if (event.type.includes('updated') || event.type.includes('scaled') || event.type.includes('cloned')) return 'text-blue-600';
    if (event.type.includes('paused')) return 'text-orange-600';
    return 'text-gray-600';
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <PageContainer>
      <div className="space-y-fluid-lg">
        <PageHeader breadcrumb="Platform Operations · Activity Feed" />

        <PageHero
          title="Activity Feed"
          subtitle="Unified timeline of all platform events and user actions"
        />

        {/* KPI Tiles */}
        {stats && (
          <KpiRow
            tiles={[
              {
                label: 'Total Events',
                value: stats.total,
                color: 'gray',
              },
              {
                label: 'Environment Events',
                value: stats.byResourceType.environment || 0,
                color: 'blue',
                icon: <PorscheIcon name="globe" size={16} className="text-blue-600" />,
              },
              {
                label: 'AWS Account Events',
                value: stats.byResourceType.aws_account || 0,
                color: 'green',
                icon: <PorscheIcon name="success" size={16} className="text-green-600" />,
              },
            ]}
          />
        )}

        {/* Filters */}
        <div className="bg-white rounded-porsche p-fluid-md border border-porsche-silver shadow-porsche-sm space-y-4">
          {/* Resource Type Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Filter by resource:</label>
            <div className="flex items-center gap-2 flex-wrap">
              {resourceTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setSelectedResourceType(type);
                    setPage(1);
                  }}
                  className={`
                    px-3 py-1.5 rounded-porsche text-sm font-semibold uppercase tracking-wide transition-all
                    ${selectedResourceType === type
                      ? 'bg-console-primary text-white shadow-porsche-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {getResourceTypeLabel(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Search Filter */}
          <div>
            <label htmlFor="search" className="block text-sm font-semibold text-gray-700 mb-2">
              Search events:
            </label>
            <input
              id="search"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by action, resource, or actor..."
              className="w-full px-4 py-2 border border-porsche-silver rounded-porsche focus:outline-none focus:ring-2 focus:ring-console-primary"
            />
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white rounded-porsche border border-porsche-silver shadow-porsche-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-console-primary"></div>
              <p className="mt-4 text-gray-600">Loading activity feed...</p>
            </div>
          ) : feedData && feedData.events.length === 0 ? (
            <div className="p-12 text-center">
              <PorscheIcon name="clock" size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Activity Found</h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'No events match your search criteria'
                  : selectedResourceType !== 'all'
                  ? `No ${getResourceTypeLabel(selectedResourceType)} events found`
                  : 'No activity events recorded yet'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop: Timeline List */}
              <div className="hidden md:block divide-y divide-porsche-silver">
                {feedData?.events.map((event) => (
                  <div key={event.id} className="p-fluid-md hover:bg-porsche-neutral-50 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${getEventColor(event)}`}>
                        <PorscheIcon name={getEventIcon(event)} size={20} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-1">
                          <p className="text-sm font-semibold text-gray-900">{event.action}</p>
                          <span className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <PorscheIcon name="userGroup" size={14} />
                            {event.actor.name}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                            {getResourceTypeLabel(event.resourceType)}
                          </span>
                          <span>•</span>
                          <span className="font-mono">{event.resourceId}</span>
                        </div>

                        {/* Changes */}
                        {event.changes && event.changes.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                            {event.changes.map((change, idx) => (
                              <div key={idx}>
                                <span className="font-semibold">{change.field}:</span>{' '}
                                <span className="text-red-600">{String(change.oldValue)}</span>
                                {' → '}
                                <span className="text-green-600">{String(change.newValue)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="mt-2 text-xs text-gray-500">
                            {Object.entries(event.metadata).slice(0, 3).map(([key, value]) => (
                              <span key={key} className="mr-3">
                                <span className="font-semibold">{key}:</span> {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile: Card List */}
              <div className="md:hidden divide-y divide-porsche-silver">
                {feedData?.events.map((event) => (
                  <div key={event.id} className="p-fluid-sm">
                    <div className="flex items-start gap-3 mb-2">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${getEventColor(event)}`}>
                        <PorscheIcon name={getEventIcon(event)} size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{event.action}</p>
                        <p className="text-xs text-gray-600">{event.actor.name}</p>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>
                    <div className="ml-11 text-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {getResourceTypeLabel(event.resourceType)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {feedData && (
                <div className="px-fluid-md py-fluid-sm border-t border-porsche-silver bg-porsche-neutral-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      Showing {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, feedData.total)} of {feedData.total} events
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-porsche text-sm font-semibold bg-white border border-porsche-silver hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={!feedData.hasMore}
                        className="px-3 py-1.5 rounded-porsche text-sm font-semibold bg-white border border-porsche-silver hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

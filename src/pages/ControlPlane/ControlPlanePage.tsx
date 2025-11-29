import { useState, useEffect } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHero } from '../../components/layout/PageHero';
import { KpiRow } from '../../components/layout/KpiRow';
import { PorscheIcon } from '../../components/shared/PorscheIcon';

interface CrossplaneResource {
  kind: string;
  name: string;
  namespace?: string;
  status: 'SYNCED' | 'NOT_SYNCED' | 'ERROR';
  ready: boolean;
  lastReconciled: string;
  message?: string;
}

export const ControlPlanePage = () => {
  const [resources, setResources] = useState<CrossplaneResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedResourceType, setSelectedResourceType] = useState<string>('all');

  useEffect(() => {
    // Mock data for Phase 5 MVP
    // In production, this would call backend API that queries K8s API
    const mockResources: CrossplaneResource[] = [
      {
        kind: 'Release',
        name: 'env-sandbox-postgres',
        namespace: 'team-environments',
        status: 'SYNCED',
        ready: true,
        lastReconciled: '2 minutes ago',
      },
      {
        kind: 'Release',
        name: 'env-dev-postgres',
        namespace: 'team-environments',
        status: 'SYNCED',
        ready: true,
        lastReconciled: '5 minutes ago',
      },
      {
        kind: 'ProviderConfig',
        name: 'aws-provider',
        status: 'SYNCED',
        ready: true,
        lastReconciled: '10 minutes ago',
      },
      {
        kind: 'Provider',
        name: 'provider-kubernetes',
        status: 'SYNCED',
        ready: true,
        lastReconciled: '1 hour ago',
      },
      {
        kind: 'Provider',
        name: 'provider-helm',
        status: 'SYNCED',
        ready: true,
        lastReconciled: '1 hour ago',
      },
    ];

    setTimeout(() => {
      setResources(mockResources);
      setLoading(false);
    }, 500);
  }, []);

  const resourceTypes = ['all', 'Release', 'Provider', 'ProviderConfig', 'Composition', 'XRD'];
  
  const filteredResources = selectedResourceType === 'all'
    ? resources
    : resources.filter(r => r.kind === selectedResourceType);

  const syncedCount = resources.filter(r => r.status === 'SYNCED').length;
  const readyCount = resources.filter(r => r.ready).length;
  const errorCount = resources.filter(r => r.status === 'ERROR').length;

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'SYNCED':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'NOT_SYNCED':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'ERROR':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getReadyBadge = (ready: boolean) => {
    return ready ? (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
        <PorscheIcon name="success" size={12} />
        READY
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
        <PorscheIcon name="clock" size={12} />
        NOT READY
      </span>
    );
  };

  return (
    <PageContainer>
      <div className="space-y-fluid-lg">
        <PageHero
          title="Control Plane"
          subtitle="Crossplane resource observability and health monitoring"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Control Plane' },
          ]}
        />

        {/* KPIs */}
        <KpiRow
          tiles={[
            {
              label: 'Total Resources',
              value: resources.length,
              color: 'gray',
            },
            {
              label: 'Synced',
              value: syncedCount,
              color: 'green',
              sublabel: `${Math.round((syncedCount / (resources.length || 1)) * 100)}% healthy`,
              icon: <PorscheIcon name="success" size={16} className="text-green-600" />,
            },
            {
              label: 'Ready',
              value: readyCount,
              color: 'blue',
            },
            {
              label: 'Errors',
              value: errorCount,
              color: errorCount > 0 ? 'red' : 'gray',
              icon: errorCount > 0 ? <PorscheIcon name="error" size={16} className="text-red-600" /> : undefined,
            },
          ]}
        />

        {/* Health Status Strip */}
        <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-porsche-success rounded-full animate-pulse"></div>
                <span className="text-xs font-bold uppercase tracking-wide text-porsche-neutral-700 font-porsche">
                  Crossplane Healthy
                </span>
              </div>
              <span className="text-xs text-porsche-neutral-600 font-porsche">
                All providers and resources reconciling normally
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-porsche-neutral-500 font-porsche">
              <PorscheIcon name="clock" size={14} />
              <span>Last check: Just now</span>
            </div>
          </div>
        </div>

        {/* Resource Type Filter */}
        <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-gray-700 mr-2">Filter by type:</span>
            {resourceTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedResourceType(type)}
                className={`
                  px-3 py-1.5 rounded-porsche text-sm font-semibold uppercase tracking-wide transition-all
                  ${selectedResourceType === type
                    ? 'bg-console-primary text-white shadow-porsche-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Resources Table */}
        <div className="bg-white/90 backdrop-blur-porsche-sm shadow-porsche-md rounded-porsche-lg border border-porsche-silver overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-console-primary"></div>
              <p className="mt-4 text-gray-600">Loading Crossplane resources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="p-12 text-center">
              <PorscheIcon name="globe" size={64} className="text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Resources Found</h3>
              <p className="text-gray-600">
                {selectedResourceType === 'all'
                  ? 'No Crossplane resources detected in the cluster'
                  : `No ${selectedResourceType} resources found`
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden xl:block overflow-x-auto">
                <table className="w-full divide-y divide-porsche-silver">
                  <thead className="bg-porsche-neutral-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider">
                        Kind
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider">
                        Namespace
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider">
                        Ready
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider">
                        Last Reconciled
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-porsche-neutral-200">
                    {filteredResources.map((resource, idx) => (
                      <tr key={idx} className="hover:bg-porsche-neutral-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-sm text-porsche-neutral-800">{resource.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                            {resource.kind}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-porsche-neutral-600">
                          {resource.namespace || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(resource.status)}`}>
                            {resource.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getReadyBadge(resource.ready)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-porsche-neutral-600">
                          {resource.lastReconciled}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile/Tablet Cards */}
              <div className="xl:hidden divide-y divide-porsche-silver">
                {filteredResources.map((resource, idx) => (
                  <div key={idx} className="p-fluid-md">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm text-porsche-neutral-800 mb-1">
                          {resource.name}
                        </h4>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                          {resource.kind}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-3">
                      <div className="flex justify-between">
                        <span className="text-porsche-neutral-600">Namespace:</span>
                        <span className="text-porsche-neutral-800">{resource.namespace || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-porsche-neutral-600">Status:</span>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(resource.status)}`}>
                          {resource.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-porsche-neutral-600">Ready:</span>
                        {getReadyBadge(resource.ready)}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-porsche-neutral-600">Last Reconciled:</span>
                        <span className="text-porsche-neutral-800">{resource.lastReconciled}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-lg">ℹ️</span>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">About Control Plane</h3>
              <p className="text-sm text-blue-800">
                This page shows the health and status of Crossplane resources in your cluster. 
                Resources are automatically reconciled by Crossplane to match the desired state. 
                SYNCED indicates the resource is in sync with the cluster, and READY means it's fully operational.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

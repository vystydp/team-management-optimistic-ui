import { useState, useEffect } from 'react';
import { PorscheIcon } from '../../components/shared/PorscheIcon';
import { PageHeader } from '../../components/shared/PageHeader';
import { ActionButton } from '../../components/shared/ActionButton';
import { useEnvironmentStore } from '../../stores/environmentStore';
import { EnvironmentForm } from './EnvironmentForm';
import { ScaleEnvironmentDialog } from './ScaleEnvironmentDialog';
import { CloneEnvironmentDialog } from './CloneEnvironmentDialog';
import { TeamEnvironmentStatus, TeamEnvironment } from '../../types/aws';
import * as environmentsService from '../../services/environmentsService';
import { useEnvironmentsPolling } from '../../hooks/useEnvironmentPolling';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHero } from '../../components/layout/PageHero';
import { KpiRow } from '../../components/layout/KpiRow';
import { useToast } from '../../stores/toastStore';

const USE_REAL_BACKEND = import.meta.env.VITE_USE_REAL_BACKEND === 'true';

/**
 * Environments page - Team environment management
 * Phase 1: Full implementation with React Aria components
 * Task 6: ComboBox, Select, responsive list, optimistic UI
 */
export const EnvironmentsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [scaleEnvironment, setScaleEnvironment] = useState<TeamEnvironment | null>(null);
  const [cloneEnvironment, setCloneEnvironment] = useState<TeamEnvironment | null>(null);
  const { environments, templates, setEnvironments, setTemplates } = useEnvironmentStore();
  const { showSuccess, showError } = useToast();

  // Load templates and environments on mount
  useEffect(() => {
    // Mock templates (Phase 2: templates are still hardcoded)
    setTemplates([
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
    ]);

    // Load existing environments from backend
    if (USE_REAL_BACKEND) {
      environmentsService.listEnvironments()
        .then(response => {
          setEnvironments(response.environments);
        })
        .catch(error => {
          console.error('Failed to load environments:', error);
        });
    } else {
      setEnvironments([]);
    }
  }, [setEnvironments, setTemplates]);

  // Poll environments for status updates (Phase 2.8: Crossplane reconciliation)
  useEnvironmentsPolling(environments, {
    enabled: USE_REAL_BACKEND,
    onUpdate: (updatedEnv) => {
      const { commitOptimistic } = useEnvironmentStore.getState();
      // Find if this is an optimistic update
      const store = useEnvironmentStore.getState();
      const optimisticUpdate = Array.from(store.optimisticUpdates.values())
        .find(update => update.data.id === updatedEnv.id);
      
      if (optimisticUpdate) {
        // Only commit if backend state matches what we expect
        // For pause/resume, wait until backend confirms the status change
        const expectedStatus = optimisticUpdate.data.status;
        if (updatedEnv.status === expectedStatus || 
            (expectedStatus === 'PAUSING' && updatedEnv.status === 'PAUSED') ||
            (expectedStatus === 'RESUMING' && updatedEnv.status === 'READY')) {
          // Backend has caught up, commit the change
          commitOptimistic(optimisticUpdate.id, updatedEnv);
        }
        // Otherwise, keep the optimistic state until backend catches up
      } else {
        // Direct update for non-optimistic changes
        setEnvironments(environments.map(env => 
          env.id === updatedEnv.id ? updatedEnv : env
        ));
      }
    },
    onError: (error) => {
      console.error('Polling error:', error);
    },
  });

  // Mock AWS accounts - will be replaced with actual store
  const mockAwsAccounts = [
    { id: 'acc-1', name: 'Development Account', accountId: '123456789012' },
    { id: 'acc-2', name: 'Staging Account', accountId: '234567890123' },
  ];

  const handleCreateEnvironment = async (data: {
    name: string;
    templateId: string;
    awsAccountId: string;
    ttl?: Date;
  }) => {
    const template = templates.find(t => t.id === data.templateId);
    const awsAccount = mockAwsAccounts.find(a => a.id === data.awsAccountId);
    
    if (!template || !awsAccount) {
      console.error('Template or account not found');
      return;
    }

    // Create optimistic environment
    const optimisticEnv = {
      id: `env-${Date.now()}`,
      name: data.name,
      teamId: 'team-1', // Mock team ID for Phase 1
      templateId: data.templateId,
      template,
      awsAccountId: data.awsAccountId,
      awsAccount: {
        id: awsAccount.id,
        accountId: awsAccount.accountId,
        accountName: awsAccount.name,
        roleArn: `arn:aws:iam::${awsAccount.accountId}:role/CrossplaneRole`,
        type: 'linked' as const,
        status: 'guardrailed' as const,
        ownerEmail: 'user@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      parameters: {
        size: template.parameters.size || 'small',
        region: template.parameters.region || 'us-east-1',
        ttl: data.ttl,
        ...template.parameters,
      },
      status: 'CREATING' as const,
      resourcesProvisioned: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'user-1', // Mock user ID for Phase 1
    };

    // Add with optimistic UI
    const { addEnvironmentOptimistic, commitOptimistic, rollbackOptimistic } = useEnvironmentStore.getState();
    const updateId = addEnvironmentOptimistic(optimisticEnv);

    setShowForm(false);
    showSuccess('Environment creation started', `${data.name} is being provisioned`);

    // Real API call (Phase 2.8)
    try {
      if (USE_REAL_BACKEND) {
        // Call real backend - returns environment with CREATING status
        const createdEnv = await environmentsService.createEnvironment({
          name: data.name,
          teamId: 'team-1', // Mock team ID for Phase 2
          templateType: template.type as 'development' | 'staging' | 'production',
          size: (template.parameters.size || 'small') as 'small' | 'medium' | 'large' | 'xlarge',
          ttlDays: data.ttl ? Math.ceil((data.ttl.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined,
          enableDatabase: true,
          databaseEngine: 'postgres',
          enableCache: true,
        });
        
        // Commit with real backend data
        commitOptimistic(updateId, createdEnv);
        // Polling hook will watch for CREATING → READY transition
      } else {
        // MSW mock simulation
        await new Promise(resolve => setTimeout(resolve, 2000));
        const finalEnv = {
          ...optimisticEnv,
          status: 'READY' as const,
          updatedAt: new Date(),
        };
        commitOptimistic(updateId, finalEnv);
        showSuccess('Environment created successfully', `${data.name} is now ready`);
      }
    } catch (error) {
      // Error - rollback the optimistic update
      rollbackOptimistic(updateId);
      console.error('Failed to create environment:', error);
      showError('Failed to create environment', error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const getStatusColor = (status: TeamEnvironmentStatus): string => {
    switch (status) {
      case 'READY':
        return 'bg-porsche-success text-white';
      case 'CREATING':
      case 'VALIDATING':
        return 'bg-porsche-warning text-white';
      case 'UPDATING':
      case 'PAUSING':
      case 'RESUMING':
        return 'bg-console-primary text-white';
      case 'PAUSED':
        return 'bg-porsche-neutral-400 text-white';
      case 'ERROR':
        return 'bg-porsche-red text-white';
      case 'DELETING':
        return 'bg-porsche-neutral-600 text-white';
      default:
        return 'bg-porsche-neutral-400 text-white';
    }
  };

  const getStatusIcon = (status: TeamEnvironmentStatus): string => {
    switch (status) {
      case 'READY':
        return 'success';
      case 'CREATING':
      case 'UPDATING':
        return 'reload';
      case 'ERROR':
        return 'warning';
      case 'PAUSED':
        return 'pause';
      case 'DELETING':
        return 'delete';
      default:
        return 'information';
    }
  };

  const readyCount = environments?.filter((env) => env.status === 'READY').length ?? 0;
  const creatingCount = environments?.filter((env) => 
    env.status === 'CREATING' || env.status === 'VALIDATING'
  ).length ?? 0;
  const pausedCount = environments?.filter((env) => env.status === 'PAUSED').length ?? 0;

  const handlePauseEnvironment = async (envId: string) => {
    const { updateEnvironmentOptimistic, commitOptimistic, rollbackOptimistic } = useEnvironmentStore.getState();
    const env = environments.find(e => e.id === envId);
    
    if (!env) return;

    const updatedEnv = { ...env, status: 'PAUSING' as const, updatedAt: new Date() };
    const updateId = updateEnvironmentOptimistic(envId, updatedEnv, env);
    showSuccess('Pausing environment', `${env.name} is being paused`);

    try {
      if (USE_REAL_BACKEND) {
        // Phase 2: Simulate pause by reducing size
        const pausedEnv = await environmentsService.pauseEnvironment(envId);
        commitOptimistic(updateId, { ...pausedEnv, status: 'PAUSED' as const });
        showSuccess('Environment paused', `${env.name} is now paused`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const finalEnv = { ...updatedEnv, status: 'PAUSED' as const, updatedAt: new Date() };
        commitOptimistic(updateId, finalEnv);
        showSuccess('Environment paused', `${env.name} is now paused`);
      }
    } catch (error) {
      rollbackOptimistic(updateId);
      console.error('Failed to pause environment:', error);
      showError('Failed to pause environment', error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const handleResumeEnvironment = async (envId: string) => {
    const { updateEnvironmentOptimistic, commitOptimistic, rollbackOptimistic } = useEnvironmentStore.getState();
    const env = environments.find(e => e.id === envId);
    
    if (!env) return;

    const updatedEnv = { ...env, status: 'RESUMING' as const, updatedAt: new Date() };
    const updateId = updateEnvironmentOptimistic(envId, updatedEnv, env);
    showSuccess('Resuming environment', `${env.name} is being resumed`);

    try {
      if (USE_REAL_BACKEND) {
        // Phase 2: Resume by restoring size
        const resumedEnv = await environmentsService.resumeEnvironment(envId);
        commitOptimistic(updateId, resumedEnv);
        showSuccess('Environment resumed', `${env.name} is now ready`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const finalEnv = { ...updatedEnv, status: 'READY' as const, updatedAt: new Date() };
        commitOptimistic(updateId, finalEnv);
        showSuccess('Environment resumed', `${env.name} is now ready`);
      }
    } catch (error) {
      rollbackOptimistic(updateId);
      console.error('Failed to resume environment:', error);
      showError('Failed to resume environment', error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };
  const handleScaleEnvironment = async (envId: string, newSize: string) => {
    const { updateEnvironmentOptimistic, commitOptimistic, rollbackOptimistic } = useEnvironmentStore.getState();
    const env = environments.find(e => e.id === envId);
    
    if (!env) return;

    const updatedEnv: TeamEnvironment = {
      ...env,
      status: 'UPDATING',
      parameters: {
        ...env.parameters,
        size: newSize as 'small' | 'medium' | 'large' | 'xlarge',
      },
      updatedAt: new Date()
    };
    
    const updateId = updateEnvironmentOptimistic(envId, updatedEnv, env);
    setScaleEnvironment(null);
    showSuccess('Scaling environment', `${env.name} is being scaled to ${newSize}`);

    try {
      if (USE_REAL_BACKEND) {
        const scaledEnv = await environmentsService.updateEnvironment(envId, {
          size: newSize as 'small' | 'medium' | 'large' | 'xlarge',
        });
        commitOptimistic(updateId, scaledEnv);
        showSuccess('Environment scaled', `${env.name} is now ${newSize}`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const finalEnv: TeamEnvironment = { ...updatedEnv, status: 'READY', updatedAt: new Date() };
        commitOptimistic(updateId, finalEnv);
        showSuccess('Environment scaled', `${env.name} is now ${newSize}`);
      }
    } catch (error) {
      rollbackOptimistic(updateId);
      console.error('Failed to scale environment:', error);
      showError('Failed to scale environment', error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const handleCloneEnvironment = async (
    sourceEnvId: string,
    newName: string,
    customizations: { size?: string; region?: string; ttlDays?: number }
  ) => {
    const sourceEnv = environments.find(e => e.id === sourceEnvId);
    
    if (!sourceEnv) return;

    // Create cloned environment with customizations
    const clonedEnv: TeamEnvironment = {
      id: `env-${Date.now()}`,
      name: newName,
      teamId: sourceEnv.teamId,
      templateId: sourceEnv.templateId,
      template: sourceEnv.template,
      awsAccountId: sourceEnv.awsAccountId,
      awsAccount: sourceEnv.awsAccount,
      parameters: {
        ...sourceEnv.parameters,
        size: (customizations.size || sourceEnv.parameters?.size) as 'small' | 'medium' | 'large' | 'xlarge',
        region: customizations.region || sourceEnv.parameters?.region || 'us-east-1',
        ttl: customizations.ttlDays
          ? new Date(Date.now() + customizations.ttlDays * 24 * 60 * 60 * 1000)
          : sourceEnv.parameters?.ttl,
      },
      status: 'CREATING',
      resourcesProvisioned: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: sourceEnv.createdBy,
    };

    const { addEnvironmentOptimistic, commitOptimistic, rollbackOptimistic } = useEnvironmentStore.getState();
    const updateId = addEnvironmentOptimistic(clonedEnv);

    setCloneEnvironment(null);
    showSuccess('Cloning environment', `Creating ${newName} from ${sourceEnv.name}`);

    try {
      if (USE_REAL_BACKEND) {
        // In real backend, we'd call a clone endpoint
        // For now, treat it like creating a new environment with same template
        const newEnv = await environmentsService.createEnvironment({
          name: newName,
          teamId: sourceEnv.teamId,
          templateType: (sourceEnv.template?.type || 'development') as 'development' | 'staging' | 'production',
          size: ((customizations.size || sourceEnv.parameters?.size) || 'medium') as 'small' | 'medium' | 'large' | 'xlarge',
          ttlDays: customizations.ttlDays,
        });
        commitOptimistic(updateId, newEnv);
        showSuccess('Environment cloned', `${newName} created successfully`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const finalEnv: TeamEnvironment = { ...clonedEnv, status: 'READY', updatedAt: new Date() };
        commitOptimistic(updateId, finalEnv);
        showSuccess('Environment cloned', `${newName} created successfully`);
      }
    } catch (error) {
      rollbackOptimistic(updateId);
      console.error('Failed to clone environment:', error);
      showError('Failed to clone environment', error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const handleDeleteEnvironment = async (envId: string) => {
    const { deleteEnvironmentOptimistic, commitOptimistic, rollbackOptimistic } = useEnvironmentStore.getState();
    const env = environments.find(e => e.id === envId);
    
    if (!env) return;

    // Delete optimistically
    const updateId = deleteEnvironmentOptimistic(envId, env);
    showSuccess('Deleting environment', `${env.name} is being deleted`);
    showSuccess('Deleting environment', `${env.name} is being deleted`);

    try {
      if (USE_REAL_BACKEND) {
        // Call real backend delete
        await environmentsService.deleteEnvironment(envId);
        commitOptimistic(updateId);
        showSuccess('Environment deleted', `${env.name} has been removed`);
      } else {
        await new Promise(resolve => setTimeout(resolve, 2000));
        commitOptimistic(updateId);
        showSuccess('Environment deleted', `${env.name} has been removed`);
      }
    } catch (error) {
      rollbackOptimistic(updateId);
      console.error('Failed to delete environment:', error);
      showError('Failed to delete environment', error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  const addIcon = (
    <PorscheIcon name="add" size={16} className="text-white" />
  );

  return (
    <PageContainer>
      <div className="space-y-fluid-lg">
        <PageHeader breadcrumb="Platform Operations · Environments View" />

        <PageHero
          title="Environments"
          subtitle="Manage team environments across AWS accounts"
          primaryAction={{
            label: 'Create Environment',
            icon: addIcon,
            onPress: () => setShowForm(true)
          }}
        />

      {/* Create Environment Form Dialog */}
      {showForm && (
        <EnvironmentForm
          templates={templates}
          awsAccounts={mockAwsAccounts}
          onSubmit={handleCreateEnvironment}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Scale Environment Dialog */}
      {scaleEnvironment && (
        <ScaleEnvironmentDialog
          environment={scaleEnvironment}
          onSubmit={handleScaleEnvironment}
          onCancel={() => setScaleEnvironment(null)}
        />
      )}

      {/* Clone Environment Dialog */}
      {cloneEnvironment && (
        <CloneEnvironmentDialog
          environment={cloneEnvironment}
          onSubmit={handleCloneEnvironment}
          onCancel={() => setCloneEnvironment(null)}
        />
      )}

        <KpiRow
          tiles={[
            {
              label: 'Total Environments',
              value: environments?.length ?? 0,
              color: 'gray',
            },
            {
              label: 'Ready',
              value: readyCount,
              color: 'green',
              sublabel: (environments?.length ?? 0) > 0 ? `${Math.round((readyCount / (environments?.length ?? 1)) * 100)}% healthy` : '0% healthy',
              icon: <PorscheIcon name="success" size={16} className="text-green-600" />,
            },
            {
              label: 'Creating / Paused',
              value: `${creatingCount} / ${pausedCount}`,
              color: 'blue',
            },
          ]}
        />

      {/* Crossplane Health Strip */}
      <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-porsche-success rounded-full"></div>
            <span className="text-xs font-bold uppercase tracking-wide text-porsche-neutral-700 font-porsche">
              Crossplane Healthy
            </span>
          </div>
          <span className="text-xs text-porsche-neutral-600 font-porsche">
            All environment resources reconciled
          </span>
        </div>
        <div className="text-xs text-porsche-neutral-500 font-porsche">
          0 env ops today
        </div>
      </div>

      {/* Environment List or Empty State */}
      {(environments?.length ?? 0) === 0 ? (
        /* Empty State */
        <div className="bg-white/90 backdrop-blur-porsche-sm shadow-porsche-md rounded-porsche-lg border border-porsche-silver">
          <div className="px-4 py-12 sm:px-6 lg:px-8 text-center">
            <div className="mb-4 flex justify-center">
              <PorscheIcon name="globe" size={64} className="text-porsche-neutral-400" />
            </div>
            <h3 className="text-heading-md font-bold text-porsche-neutral-800 mb-3 font-porsche tracking-tight uppercase">
              No Environments Yet
            </h3>
            <p className="text-sm text-porsche-neutral-600 mb-fluid-lg max-w-md mx-auto font-porsche">
              Get started by creating your first team environment. Choose a template, select an AWS account, 
              and deploy your infrastructure.
            </p>
            <ActionButton
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              <PorscheIcon name="add" size={16} className="text-white" />
              <span className="ml-2">Create Your First Environment</span>
            </ActionButton>
          </div>
        </div>
      ) : (
        /* Environment List - Responsive: Mobile Cards, Desktop Table */
        <div className="bg-white/90 backdrop-blur-porsche-sm shadow-porsche-md rounded-porsche-lg border border-porsche-silver">
          {/* Desktop Table View */}
          <div className="hidden xl:block overflow-x-auto">
            <table className="w-full divide-y divide-porsche-silver">
              <thead className="bg-porsche-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider font-porsche">
                    Environment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider font-porsche">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider font-porsche">
                    AWS Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider font-porsche">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider font-porsche">
                    TTL
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-porsche-neutral-700 uppercase tracking-wider font-porsche">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-porsche-neutral-200">
                {environments?.map((env) => (
                  <tr key={env.id} className="hover:bg-porsche-neutral-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-sm text-porsche-neutral-800 font-porsche">{env.name}</div>
                      <div className="text-xs text-porsche-neutral-600 font-porsche">{env.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-porsche-neutral-800 font-porsche">{env.templateId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-porsche-neutral-800 font-porsche">{env.awsAccount?.accountName || 'N/A'}</div>
                      <div className="text-xs text-porsche-neutral-600 font-porsche">{env.awsAccount?.accountId || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(env.status)} font-porsche`}>
                        <PorscheIcon name={getStatusIcon(env.status)} size={12} />
                        {env.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-porsche-neutral-600 font-porsche">
                      {env.parameters?.ttl ? new Date(env.parameters.ttl).toLocaleDateString() : 'No expiration'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {(env.status === 'READY' || env.status === 'PAUSED') && (
                          <>
                            <ActionButton variant="secondary" onClick={() => setScaleEnvironment(env)}>
                              <PorscheIcon name="arrows" size={14} />
                            </ActionButton>
                            <ActionButton variant="secondary" onClick={() => setCloneEnvironment(env)}>
                              <PorscheIcon name="copy" size={14} />
                            </ActionButton>
                          </>
                        )}
                        {env.status === 'READY' && (
                          <ActionButton variant="secondary" onClick={() => handlePauseEnvironment(env.id)}>
                            <PorscheIcon name="pause" size={14} />
                          </ActionButton>
                        )}
                        {env.status === 'PAUSED' && (
                          <ActionButton variant="secondary" onClick={() => handleResumeEnvironment(env.id)}>
                            <PorscheIcon name="play" size={14} />
                          </ActionButton>
                        )}
                        <ActionButton variant="secondary" onClick={() => handleDeleteEnvironment(env.id)}>
                          <PorscheIcon name="delete" size={14} className="text-porsche-red" />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="xl:hidden divide-y divide-porsche-silver">
            {environments?.map((env) => (
              <div key={env.id} className="p-fluid-md hover:bg-porsche-neutral-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-porsche-neutral-800 font-porsche mb-1">
                      {env.name}
                    </h4>
                    <div className="text-xs text-porsche-neutral-600 font-porsche">{env.id}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusColor(env.status)} font-porsche`}>
                    <PorscheIcon name={getStatusIcon(env.status)} size={12} />
                    {env.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm mb-3">
                  <div className="flex justify-between">
                    <span className="text-porsche-neutral-600 font-porsche">Template:</span>
                    <span className="font-semibold text-porsche-neutral-800 font-porsche">{env.templateId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-porsche-neutral-600 font-porsche">AWS Account:</span>
                    <span className="font-semibold text-porsche-neutral-800 font-porsche">{env.awsAccount?.accountName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-porsche-neutral-600 font-porsche">TTL:</span>
                    <span className="text-porsche-neutral-800 font-porsche">
                      {env.parameters?.ttl ? new Date(env.parameters.ttl).toLocaleDateString() : 'No expiration'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {(env.status === 'READY' || env.status === 'PAUSED') && (
                    <>
                      <ActionButton variant="secondary" onClick={() => setScaleEnvironment(env)}>
                        <PorscheIcon name="arrows" size={14} />
                        <span className="ml-1">Scale</span>
                      </ActionButton>
                      <ActionButton variant="secondary" onClick={() => setCloneEnvironment(env)}>
                        <PorscheIcon name="copy" size={14} />
                        <span className="ml-1">Clone</span>
                      </ActionButton>
                    </>
                  )}
                  {env.status === 'READY' && (
                    <ActionButton variant="secondary" onClick={() => handlePauseEnvironment(env.id)}>
                      <PorscheIcon name="pause" size={14} />
                      <span className="ml-1">Pause</span>
                    </ActionButton>
                  )}
                  {env.status === 'PAUSED' && (
                    <ActionButton variant="secondary" onClick={() => handleResumeEnvironment(env.id)}>
                      <PorscheIcon name="play" size={14} />
                      <span className="ml-1">Resume</span>
                    </ActionButton>
                  )}
                  <ActionButton variant="secondary" onClick={() => handleDeleteEnvironment(env.id)}>
                    <PorscheIcon name="delete" size={14} className="text-porsche-red" />
                    <span className="ml-1">Delete</span>
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Templates Preview Section */}
      <div className="bg-white/90 backdrop-blur-porsche-sm shadow-porsche-md rounded-porsche-lg border border-porsche-silver">
        <div className="px-fluid-md py-fluid-lg sm:p-fluid-lg">
          <h3 className="text-heading-sm font-bold text-porsche-neutral-800 mb-fluid-md font-porsche tracking-tight">
            Available Templates
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {['Sandbox', 'Development', 'Staging'].map((template) => (
              <div
                key={template}
                className="border border-porsche-silver rounded-porsche-lg p-fluid-md hover:border-console-primary hover:shadow-porsche-md hover:scale-[1.02] transition-all duration-moderate ease-porsche-base cursor-pointer bg-porsche-surface"
              >
                <h4 className="font-bold text-porsche-black mb-2 uppercase tracking-wide text-sm font-porsche">
                  {template}
                </h4>
                <p className="text-sm text-porsche-neutral-600 mb-3 font-porsche">
                  {template === 'Sandbox' && 'Basic sandbox for development and testing'}
                  {template === 'Development' && 'Full development environment with monitoring'}
                  {template === 'Staging' && 'Pre-production staging environment'}
                </p>
                <div className="flex items-center text-xs text-porsche-neutral-400 font-semibold uppercase tracking-wide font-porsche">
                  <span>VPC • ECS • RDS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </PageContainer>
  );
};

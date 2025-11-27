import React, { useState } from 'react';
import { useTeamStore } from '../../stores/teamStore';
import { PorscheIcon } from '../../components/shared/PorscheIcon';

type MonitorContext = 'teams' | 'environments' | 'aws-accounts';

export const OptimisticUIMonitor: React.FC = () => {
  const optimisticUpdates = useTeamStore((state) => state.optimisticUpdates);
  const userSuccessRate = useTeamStore((state) => state.userSuccessRate);
  const networkCondition = useTeamStore((state) => state.networkCondition);
  const [context, setContext] = useState<MonitorContext>('teams');

  const pendingCount = optimisticUpdates.size;

  return (
    <div className="space-y-fluid-sm">
      {/* Reliability Strip - Console Aesthetic */}
      <div className="bg-white rounded-porsche-lg p-fluid-sm border-2 border-porsche-silver shadow-porsche-sm">
        {/* Segmented Control - Utilitarian with red underline */}
        <div className="flex items-center justify-between mb-fluid-sm">
          <div className="inline-flex bg-porsche-canvas rounded-porsche p-0.5 border border-porsche-silver">
            <button
              onClick={() => setContext('teams')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-moderate ease-porsche-base font-porsche relative ${
                context === 'teams'
                  ? 'text-console-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-console-primary'
                  : 'text-porsche-neutral-500 hover:text-porsche-neutral-700'
              }`}
            >
              Teams
            </button>
            <button
              onClick={() => setContext('environments')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-moderate ease-porsche-base font-porsche relative ${
                context === 'environments'
                  ? 'text-console-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-console-primary'
                  : 'text-porsche-neutral-500 hover:text-porsche-neutral-700'
              }`}
            >
              Environments
            </button>
            <button
              onClick={() => setContext('aws-accounts')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wide transition-all duration-moderate ease-porsche-base font-porsche relative ${
                context === 'aws-accounts'
                  ? 'text-console-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-console-primary'
                  : 'text-porsche-neutral-500 hover:text-porsche-neutral-700'
              }`}
            >
              AWS
            </button>
          </div>
        </div>

        {/* Three Key Metrics - Dense Instrument Gauges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-fluid-sm">
          {/* Pending Updates - Flat Card */}
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-neutral-600 uppercase tracking-wide font-porsche mb-1">
              Pending Updates
            </div>
            <div className="text-4xl font-bold text-porsche-neutral-800 font-porsche">{pendingCount}</div>
          </div>

          {/* Success Rate - PRIMARY with Desaturated Visual Anchor */}
          <div className="bg-porsche-success-bg rounded-porsche p-fluid-sm border-2 border-porsche-success shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-success uppercase tracking-wide font-porsche mb-1 flex items-center gap-2">
              <PorscheIcon name="success" size={12} className="text-porsche-success" />
              Success Rate
            </div>
            <div className="text-4xl font-bold text-porsche-success font-porsche">
              {(userSuccessRate * 100).toFixed(1)}%
            </div>
            <div className="mt-2 w-full bg-porsche-silver rounded-full h-2">
              <div
                className="bg-porsche-success h-2 rounded-full transition-all duration-long ease-porsche-out"
                style={{ width: `${userSuccessRate * 100}%` }}
              />
            </div>
          </div>

          {/* Network Condition - Flat Card */}
          <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
            <div className="text-xs font-semibold text-porsche-neutral-600 uppercase tracking-wide font-porsche mb-1">
              Network Condition
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div
                className={`
                  w-3 h-3 rounded-full animate-pulse
                  ${networkCondition === 'good' ? 'bg-porsche-success' : ''}
                  ${networkCondition === 'fair' ? 'bg-porsche-warning' : ''}
                  ${networkCondition === 'poor' ? 'bg-porsche-error' : ''}
                `}
              />
              <span className="text-2xl font-bold capitalize text-porsche-neutral-800 font-porsche">
                {networkCondition}
              </span>
            </div>
          </div>
        </div>

        {/* Active Operations Alert - Desaturated */}
        {pendingCount > 0 && (
          <div className="mt-fluid-sm p-2 bg-porsche-warning-bg border-l-4 border-porsche-warning rounded-porsche flex items-center gap-2">
            <PorscheIcon name="information" size={16} className="text-porsche-warning" />
            <p className="text-xs text-porsche-neutral-800 font-semibold font-porsche">
              {pendingCount} operation{pendingCount > 1 ? 's' : ''} in progress across {context}
            </p>
          </div>
        )}
      </div>

      {/* Crossplane Health Banner - Console Module */}
      <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-porsche-success"></div>
              <span className="text-xs font-bold uppercase tracking-wide text-porsche-neutral-700 font-porsche">
                Crossplane: Healthy
              </span>
            </div>
            <div className="text-xs text-porsche-neutral-500 font-porsche">
              • 3 reconciling • 0 degraded
            </div>
          </div>
          <div className="text-xs text-porsche-neutral-500 font-porsche">
            12 ops today
          </div>
        </div>
      </div>
    </div>
  );
};

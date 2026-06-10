import { PorscheIcon } from '../../components/shared/PorscheIcon';
import { ICONS_MANIFEST } from '@porsche-design-system/assets';

interface Operation {
  type: string;
  action: string;
  name: string;
  time: string;
  icon: keyof typeof ICONS_MANIFEST;
}

// Illustrative sample activity shown beside the team list (see the "Sample"
// tag). Swap for the activity feed to make it live.
const SAMPLE_OPERATIONS: Operation[] = [
  { type: 'environment', action: 'created', name: 'prod-us-east-1', time: '2m ago', icon: 'globe' },
  { type: 'account', action: 'secured', name: 'AWS-PROD-001', time: '15m ago', icon: 'success' },
  { type: 'deployment', action: 'completed', name: 'api-service v2.1', time: '1h ago', icon: 'check' },
  { type: 'environment', action: 'paused', name: 'dev-staging', time: '2h ago', icon: 'warning' },
  { type: 'member', action: 'added', name: 'Sarah Chen', time: '3h ago', icon: 'userGroup' },
];

/**
 * Sidebar listing recent platform operations. Presentational and self-contained.
 */
export function RecentOperationsPanel() {
  return (
    <div className="bg-white rounded-porsche p-fluid-sm border border-porsche-silver shadow-porsche-sm">
      <div className="flex items-center gap-2 mb-fluid-sm">
        <h3 className="text-heading-sm font-bold text-porsche-neutral-800 font-porsche tracking-tight">
          Recent Operations
        </h3>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-porsche-neutral-100 text-porsche-neutral-600">
          Sample
        </span>
      </div>
      <div className="space-y-3">
        {SAMPLE_OPERATIONS.map((op) => (
          <div
            key={`${op.type}-${op.name}`}
            className="flex items-start gap-3 p-2 rounded-porsche hover:bg-porsche-shading transition-colors cursor-pointer"
          >
            <div className="mt-0.5">
              <PorscheIcon name={op.icon} size={16} className="text-porsche-neutral-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold uppercase tracking-wide text-porsche-neutral-600 font-porsche">
                {op.type}
              </div>
              <div className="text-sm font-semibold text-porsche-neutral-800 font-porsche truncate">
                {op.action} · {op.name}
              </div>
              <div className="text-xs text-porsche-neutral-500 font-porsche">{op.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

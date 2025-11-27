import React from 'react';
import { useTeamStore } from '../stores/teamStore';

export const OptimisticUIMonitor: React.FC = () => {
  const optimisticUpdates = useTeamStore((state) => state.optimisticUpdates);
  const userSuccessRate = useTeamStore((state) => state.userSuccessRate);
  const networkCondition = useTeamStore((state) => state.networkCondition);

  const pendingCount = optimisticUpdates.size;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Optimistic UI Monitor</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-md p-3 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Pending Updates</div>
          <div className="text-2xl font-bold text-purple-600">{pendingCount}</div>
        </div>

        <div className="bg-white rounded-md p-3 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Success Rate</div>
          <div className="text-2xl font-bold text-green-600">
            {(userSuccessRate * 100).toFixed(1)}%
          </div>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${userSuccessRate * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-md p-3 shadow-sm">
          <div className="text-sm font-medium text-gray-600">Network Condition</div>
          <div className="flex items-center gap-2 mt-1">
            <div
              className={`
                w-3 h-3 rounded-full
                ${networkCondition === 'good' ? 'bg-green-500' : ''}
                ${networkCondition === 'fair' ? 'bg-yellow-500' : ''}
                ${networkCondition === 'poor' ? 'bg-red-500' : ''}
              `}
            />
            <span className="text-lg font-semibold capitalize">{networkCondition}</span>
          </div>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            ⚡ {pendingCount} operation{pendingCount > 1 ? 's' : ''} in progress...
          </p>
        </div>
      )}
    </div>
  );
};

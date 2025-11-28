import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { accountRequestService } from '../../services/accountRequestService';
import { ActionButton } from '../../components/shared/ActionButton';
import { 
  getStatusLabel, 
  getStatusColor, 
  getStatusProgress,
  isTerminalStatus,
  AWS_REGIONS,
  type AccountRequest
} from '../../types/account-request';

export const AccountRequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['accountRequest', id],
    queryFn: () => accountRequestService.getAccountRequest(id!),
    enabled: !!id,
    refetchInterval: (query: { state: { data?: AccountRequest } }) => {
      // Poll every 2 seconds while not terminal
      const status = query.state.data?.status;
      return status && !isTerminalStatus(status) ? 2000 : false;
    },
  });

  const handleBack = () => {
    navigate('/aws-accounts/requests');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading account request...</div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 mb-4">
          Failed to load account request: {error instanceof Error ? error.message : 'Not found'}
        </p>
        <ActionButton variant="secondary" onPress={handleBack}>
          Back to List
        </ActionButton>
      </div>
    );
  }

  const statusColor = getStatusColor(request.status);
  const progress = getStatusProgress(request.status);
  const regionLabel = AWS_REGIONS.find(r => r.value === request.primaryRegion)?.label || request.primaryRegion;

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  const progressColorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <button onClick={handleBack} className="hover:text-gray-700">
            ← Back to Requests
          </button>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {request.accountName}
            </h1>
            <p className="text-gray-600">{request.ownerEmail}</p>
          </div>
          <span
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${
              colorClasses[statusColor]
            }`}
          >
            {getStatusLabel(request.status)}
          </span>
        </div>
      </div>

      {/* Progress Timeline */}
      {!isTerminalStatus(request.status) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Provisioning Progress
          </h2>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{getStatusLabel(request.status)}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${progressColorClasses[statusColor] || progressColorClasses.blue}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Timeline Steps */}
          <div className="space-y-4">
            <TimelineStep
              label="Requested"
              status="completed"
              timestamp={request.createdAt}
              description="Request submitted and queued"
            />
            <TimelineStep
              label="Validating"
              status={['VALIDATING', 'CREATING', 'GUARDRAILING', 'READY'].includes(request.status) ? 'completed' : 'upcoming'}
              description="Pre-flight checks and validation"
            />
            <TimelineStep
              label="Creating Account"
              status={['CREATING', 'GUARDRAILING', 'READY'].includes(request.status) ? 'completed' : request.status === 'VALIDATING' ? 'current' : 'upcoming'}
              description="AWS Organizations creating account (5-10 minutes)"
            />
            <TimelineStep
              label="Applying Guardrails"
              status={['GUARDRAILING', 'READY'].includes(request.status) ? 'completed' : request.status === 'CREATING' ? 'current' : 'upcoming'}
              description="CloudTrail, Config, Budgets, and SCPs"
            />
            <TimelineStep
              label="Ready"
              status={request.status === 'READY' ? 'completed' : request.status === 'GUARDRAILING' ? 'current' : 'upcoming'}
              timestamp={request.completedAt}
              description="Account provisioned and ready to use"
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {request.status === 'FAILED' && request.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Provisioning Failed
          </h3>
          <p className="text-red-800 text-sm mb-4">{request.errorMessage}</p>
          <div className="text-sm text-red-700">
            <strong>What to do:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Check that the owner email is unique across all AWS accounts</li>
              <li>Verify your AWS Organizations quotas and limits</li>
              <li>Contact support if the issue persists</li>
            </ul>
          </div>
        </div>
      )}

      {/* Success Message */}
      {request.status === 'READY' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-green-900 mb-2">
            ✓ Account Ready
          </h3>
          <p className="text-green-800 text-sm mb-4">
            Your AWS account has been successfully provisioned with all security guardrails applied.
          </p>
          {request.awsAccountId && (
            <div className="bg-white rounded border border-green-200 p-3 mb-4">
              <div className="text-sm text-green-700 font-medium mb-1">AWS Account ID</div>
              <div className="font-mono text-lg text-gray-900">{request.awsAccountId}</div>
            </div>
          )}
          <div className="text-sm text-green-700">
            <strong>Next steps:</strong>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Access the account via AWS Organizations console</li>
              <li>Configure team member access permissions</li>
              <li>Review the applied guardrails and security controls</li>
              <li>Start deploying your workloads</li>
            </ul>
          </div>
        </div>
      )}

      {/* Account Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Account Details
        </h2>
        <dl className="grid grid-cols-2 gap-6">
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Account Name</dt>
            <dd className="text-gray-900">{request.accountName}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Owner Email</dt>
            <dd className="text-gray-900">{request.ownerEmail}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Purpose</dt>
            <dd className="text-gray-900 capitalize">{request.purpose}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Primary Region</dt>
            <dd className="text-gray-900">{regionLabel}</dd>
          </div>
          {request.budgetAmountUSD && (
            <>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Monthly Budget</dt>
                <dd className="text-gray-900">${request.budgetAmountUSD.toLocaleString()} USD</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 mb-1">Alert Threshold</dt>
                <dd className="text-gray-900">{request.budgetThresholdPercent}%</dd>
              </div>
            </>
          )}
          {request.awsAccountId && (
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">AWS Account ID</dt>
              <dd className="text-gray-900 font-mono">{request.awsAccountId}</dd>
            </div>
          )}
          {request.awsRequestId && (
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">AWS Request ID</dt>
              <dd className="text-gray-900 font-mono text-sm">{request.awsRequestId}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm font-medium text-gray-500 mb-1">Created</dt>
            <dd className="text-gray-900">{new Date(request.createdAt).toLocaleString()}</dd>
          </div>
          {request.completedAt && (
            <div>
              <dt className="text-sm font-medium text-gray-500 mb-1">Completed</dt>
              <dd className="text-gray-900">{new Date(request.completedAt).toLocaleString()}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
};

interface TimelineStepProps {
  label: string;
  status: 'completed' | 'current' | 'upcoming';
  timestamp?: string;
  description?: string;
}

const TimelineStep: React.FC<TimelineStepProps> = ({ label, status, timestamp, description }) => {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        {status === 'completed' && (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
        {status === 'current' && (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
          </div>
        )}
        {status === 'upcoming' && (
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <p className={`text-sm font-medium ${status === 'upcoming' ? 'text-gray-500' : 'text-gray-900'}`}>
            {label}
          </p>
          {timestamp && (
            <p className="text-xs text-gray-500">
              {new Date(timestamp).toLocaleTimeString()}
            </p>
          )}
        </div>
        {description && (
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

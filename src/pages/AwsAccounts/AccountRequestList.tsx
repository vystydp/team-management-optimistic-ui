import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { accountRequestService } from '../../services/accountRequestService';
import { ActionButton } from '../../components/shared/ActionButton';
import { KpiRow } from '../../components/layout/KpiRow';
import { FiltersBar } from '../../components/layout/FiltersBar';
import { 
  getStatusLabel, 
  getStatusColor, 
  getStatusProgress,
  isTerminalStatus,
  type AccountRequest,
  type ListAccountRequestsResponse
} from '../../types/account-request';

export const AccountRequestList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery<ListAccountRequestsResponse>({
    queryKey: ['accountRequests'],
    queryFn: () => accountRequestService.listAccountRequests(),
    refetchInterval: (query) => {
      // Poll every 3 seconds if there are any non-terminal requests
      const hasActiveRequests = query.state.data?.requests.some(
        (req: AccountRequest) => !isTerminalStatus(req.status)
      );
      return hasActiveRequests ? 3000 : false;
    },
  });

  const handleCreateNew = () => {
    navigate('/aws-accounts/new');
  };

  const handleViewDetails = (id: string) => {
    navigate(`/aws-accounts/${id}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading account requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">
          Failed to load account requests: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  const requests = data?.requests || [];
  const activeRequests = requests.filter((r: AccountRequest) => !isTerminalStatus(r.status));
  const completedRequests = requests.filter((r: AccountRequest) => isTerminalStatus(r.status));

  // Calculate status counts
  const readyCount = completedRequests.filter((r: AccountRequest) => r.status === 'READY').length;
  const failedCount = completedRequests.filter((r: AccountRequest) => r.status === 'FAILED').length;

  const plusIcon = (
    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  return (
    <div>
      {/* KPI Row */}
      <KpiRow
        tiles={[
          { label: 'Total Requests', value: requests.length, color: 'gray' },
          { label: 'In Progress', value: activeRequests.length, color: 'blue' },
          { label: 'Completed', value: readyCount, color: 'green' },
          { label: 'Failed', value: failedCount, color: 'red' },
        ]}
      />

      {/* Filters + CTA Row */}
      <FiltersBar
        searchPlaceholder="Search by name or email..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={{
          value: statusFilter,
          onChange: setStatusFilter,
          options: [
            { value: '', label: 'All statuses' },
            { value: 'REQUESTED', label: 'Requested' },
            { value: 'VALIDATING', label: 'Validating' },
            { value: 'PROVISIONING', label: 'Provisioning' },
            { value: 'CONFIGURING', label: 'Configuring' },
            { value: 'READY', label: 'Ready' },
            { value: 'FAILED', label: 'Failed' },
          ],
        }}
        primaryAction={{
          label: 'Request New Account',
          mobileLabel: 'New Request',
          icon: plusIcon,
          onPress: handleCreateNew,
        }}
        className="mb-4 sm:mb-6"
      />

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            In Progress ({activeRequests.length})
          </h2>
          <div className="space-y-4">
            {activeRequests.map((request: AccountRequest) => (
              <RequestCard
                key={request.id}
                request={request}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Completed ({completedRequests.length})
          </h2>
          <div className="space-y-4">
            {completedRequests.map((request: AccountRequest) => (
              <RequestCard
                key={request.id}
                request={request}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Account Requests Yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Create your first AWS account with automated security guardrails and compliance controls
          </p>
          <ActionButton variant="primary" onPress={handleCreateNew}>
            <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Request New AWS Account
          </ActionButton>
        </div>
      )}
    </div>
  );
};

interface RequestCardProps {
  request: AccountRequest;
  onViewDetails: (id: string) => void;
}

const RequestCard: React.FC<RequestCardProps> = ({ request, onViewDetails }) => {
  const statusColor = getStatusColor(request.status);
  const progress = getStatusProgress(request.status);
  
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    red: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1 truncate">
            {request.accountName}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 truncate">{request.ownerEmail}</p>
        </div>
        <span
          className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border self-start ${
            colorClasses[statusColor] || colorClasses.blue
          }`}
        >
          {getStatusLabel(request.status)}
        </span>
      </div>

      {/* Progress Bar */}
      {!isTerminalStatus(request.status) && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{getStatusLabel(request.status)}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                statusColor === 'blue' ? 'bg-blue-500' : 
                statusColor === 'yellow' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {request.status === 'FAILED' && request.errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {request.errorMessage}
        </div>
      )}

      {/* Account Details - Mobile: Stack, Tablet+: Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm mb-3 sm:mb-4">
        <div>
          <div className="text-gray-500 mb-0.5">Purpose</div>
          <div className="font-medium text-gray-900 capitalize">{request.purpose}</div>
        </div>
        <div>
          <div className="text-gray-500 mb-0.5">Region</div>
          <div className="font-medium text-gray-900">{request.primaryRegion}</div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <div className="text-gray-500 mb-0.5">Created</div>
          <div className="font-medium text-gray-900">
            {new Date(request.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <ActionButton variant="secondary" onPress={() => onViewDetails(request.id)}>
          <span className="hidden sm:inline">View Details</span>
          <span className="sm:hidden">View</span>
        </ActionButton>
      </div>
    </div>
  );
};

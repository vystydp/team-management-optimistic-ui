import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AwsAccountsPage } from './AwsAccountsPage';
import { AccountRequestList } from './AccountRequestList';
import { AccountRequestDetail } from './AccountRequestDetail';
import { CreateAccountWizard } from './CreateAccountWizard/CreateAccountWizard';

/**
 * AWS Accounts module router
 * Handles sub-routes for account management and account creation wizard
 */
export const AwsAccountsRouter: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'linked' | 'requests'>(
    location.pathname.includes('/requests') ? 'requests' : 'linked'
  );

  const handleTabChange = (tab: 'linked' | 'requests') => {
    setActiveTab(tab);
    navigate(tab === 'linked' ? '/aws-accounts' : '/aws-accounts/requests');
  };

  // Show tabs only on main pages, not wizard or detail views
  const showTabs = 
    location.pathname === '/aws-accounts' ||
    location.pathname === '/aws-accounts/requests';

  return (
    <div>
      {showTabs && (
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => handleTabChange('linked')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'linked'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Linked Accounts
            </button>
            <button
              onClick={() => handleTabChange('requests')}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Account Requests
            </button>
          </nav>
        </div>
      )}

      <Routes>
        <Route index element={<AwsAccountsPage />} />
        <Route path="requests" element={<AccountRequestList />} />
        <Route path="requests/new" element={<CreateAccountWizard />} />
        <Route path="requests/:id" element={<AccountRequestDetail />} />
        <Route path="*" element={<Navigate to="/aws-accounts" replace />} />
      </Routes>
    </div>
  );
};

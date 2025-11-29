import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer';
import { PageHero } from '../../components/layout/PageHero';
import { TabsBar } from '../../components/layout/TabsBar';
import { KpiRow } from '../../components/layout/KpiRow';
import { ActionButton } from '../../components/shared/ActionButton';
import { AccountRequestList } from './AccountRequestList';

type TabType = 'linked' | 'requests';

/**
 * AWS Accounts Main Page
 * Two-tab layout: Linked Accounts | Account Requests
 */
export const AwsAccountsMain: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('requests');

  const handleRequestNew = () => {
    navigate('/aws-accounts/new');
  };

  const handleLinkExisting = () => {
    // TODO: Implement linking wizard in future phase
    alert('Account linking wizard coming soon!');
  };

  const linkIcon = (
    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );

  const plusIcon = (
    <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  return (
    <PageContainer>
      <PageHero
        title="AWS Accounts"
        subtitle="Request new AWS accounts or link existing ones with automated security guardrails"
        primaryAction={{
          label: 'Request New Account',
          icon: plusIcon,
          onPress: handleRequestNew,
        }}
        secondaryAction={{
          label: 'Link Existing',
          icon: linkIcon,
          onPress: handleLinkExisting,
        }}
        mobileOverflowText="Or link an existing account"
      />

      <TabsBar
        tabs={[
          { id: 'linked', label: 'Linked Accounts' },
          { id: 'requests', label: 'Account Requests' },
        ]}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabType)}
        className="mb-6"
      />

      {/* Tab Content */}
      {activeTab === 'linked' ? <LinkedAccountsTab /> : <AccountRequestsTab />}
    </PageContainer>
  );
};

/**
 * Linked Accounts Tab
 * Shows existing AWS accounts with linking process
 */
const LinkedAccountsTab: React.FC = () => {
  const checkIcon = (
    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPI Cards Row */}
      <KpiRow
        tiles={[
          { label: 'Total Accounts', value: 0, color: 'gray' },
          { label: 'Linked & Secure', value: 0, color: 'green', icon: checkIcon, sublabel: 'All guardrails active' },
          { label: 'Pending / Violations', value: '0 / 0', color: 'orange' },
        ]}
      />

      {/* Main Content Grid - Mobile optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left: Account List (2/3 width on desktop, full on mobile) */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No Linked Accounts
            </h3>
            <p className="text-sm sm:text-base text-gray-500 mb-4">
              Connect your existing AWS account to start deploying environments
            </p>
            <ActionButton variant="secondary" onPress={() => alert('Linking wizard coming soon!')}>
              Link Your AWS Account
            </ActionButton>
          </div>
        </div>

        {/* Right: Linking Process Panel (1/3 width on desktop, full on mobile) */}
        <div className="lg:col-span-1">
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 sm:p-6">
            <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-4">
              Account Linking Process
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-gray-900">Initiate Link</h4>
                  <p className="text-xs text-gray-600 mt-1">Provide AWS account ID and select guardrail policies</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-gray-900">Configure IAM</h4>
                  <p className="text-xs text-gray-600 mt-1">Deploy CloudFormation template in your account</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  ✓
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-semibold text-gray-900">Verify & Deploy</h4>
                  <p className="text-xs text-gray-600 mt-1">Verify connection and deploy guardrails</p>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-blue-200">
              <div className="w-full">
                <ActionButton variant="secondary" onPress={() => alert('Linking wizard coming soon!')}>
                  Start Linking
                </ActionButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Account Requests Tab
 * Reuses the existing AccountRequestList component
 * This maintains all React Query logic, polling, and optimistic UI
 */
const AccountRequestsTab: React.FC = () => {
  return <AccountRequestList />;
};

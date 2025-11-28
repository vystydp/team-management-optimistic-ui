import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AwsAccountsMain } from './AwsAccountsMain';
import { AccountRequestDetail } from './AccountRequestDetail';
import { CreateAccountWizard } from './CreateAccountWizard/CreateAccountWizard';

/**
 * AWS Accounts Router
 * Handles routing between main page, wizard, and detail views
 */
export const AwsAccountsRouter: React.FC = () => {
  return (
    <div>
      <Routes>
        {/* Main page with tabs: Linked Accounts | Account Requests */}
        <Route index element={<AwsAccountsMain />} />
        
        {/* Wizard for creating new account */}
        <Route path="new" element={<CreateAccountWizard />} />
        
        {/* Detail view for tracking request progress */}
        <Route path=":id" element={<AccountRequestDetail />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/aws-accounts" replace />} />
      </Routes>
    </div>
  );
};

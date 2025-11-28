import React from 'react';
import { Select, SelectValue, ListBox, ListBoxItem, Popover, Button } from 'react-aria-components';
import { ActionButton } from '../../../components/shared/ActionButton';
import { AWS_REGIONS, ACCOUNT_PURPOSES } from '../../../types/account-request';
import type { CreateAccountRequestInput } from '../../../types/account-request';

interface WizardFormProps {
  formData: Partial<CreateAccountRequestInput>;
  onChange: (updates: Partial<CreateAccountRequestInput>) => void;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export const WizardForm: React.FC<WizardFormProps> = ({
  formData,
  onChange,
  onNext,
  onBack,
  isValid,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Account Details
        </h2>
        <p className="text-gray-600 mb-6">
          Provide the basic information for your new AWS account.
        </p>
      </div>

      {/* Account Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Account Name *
        </label>
        <input
          type="text"
          value={formData.accountName || ''}
          onChange={(e) => onChange({ accountName: e.target.value })}
          placeholder="e.g., my-team-dev"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          A descriptive name for your account (alphanumeric and hyphens only)
        </p>
      </div>

      {/* Owner Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Owner Email *
        </label>
        <input
          type="email"
          value={formData.ownerEmail || ''}
          onChange={(e) => onChange({ ownerEmail: e.target.value })}
          placeholder="owner@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        <p className="mt-1 text-sm text-gray-500">
          Must be unique across all AWS accounts (root account email)
        </p>
      </div>

      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Purpose *
        </label>
        <Select
          selectedKey={formData.purpose}
          onSelectionChange={(key) => onChange({ purpose: key as 'development' | 'staging' | 'production' })}
          placeholder="Select purpose"
          className="w-full"
        >
          <Button className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500">
            <SelectValue />
          </Button>
          <Popover className="bg-white border border-gray-300 rounded-md shadow-lg mt-1">
            <ListBox className="outline-none">
              {ACCOUNT_PURPOSES.map((purpose) => (
                <ListBoxItem
                  key={purpose.value}
                  id={purpose.value}
                  textValue={purpose.label}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 focus:bg-blue-50 outline-none"
                >
                  <div>
                    <div className="font-medium">{purpose.label}</div>
                    <div className="text-sm text-gray-500">{purpose.description}</div>
                  </div>
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>
      </div>

      {/* Primary Region */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Region *
        </label>
        <Select
          selectedKey={formData.primaryRegion}
          onSelectionChange={(key) => onChange({ primaryRegion: key as string })}
          placeholder="Select region"
          className="w-full"
        >
          <Button className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left focus:outline-none focus:ring-2 focus:ring-blue-500">
            <SelectValue />
          </Button>
          <Popover className="bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-auto">
            <ListBox className="outline-none">
              {AWS_REGIONS.map((region) => (
                <ListBoxItem
                  key={region.value}
                  id={region.value}
                  textValue={region.label}
                  className="px-3 py-2 cursor-pointer hover:bg-gray-100 focus:bg-blue-50 outline-none"
                >
                  {region.label}
                </ListBoxItem>
              ))}
            </ListBox>
          </Popover>
        </Select>
        <p className="mt-1 text-sm text-gray-500">
          The primary AWS region for your workloads
        </p>
      </div>

      {/* Optional: Budget Amount */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Budget (USD) - Optional
        </label>
        <input
          type="number"
          min="0"
          step="100"
          value={formData.budgetAmountUSD?.toString() || ''}
          onChange={(e) => onChange({ budgetAmountUSD: e.target.value ? parseFloat(e.target.value) : undefined })}
          placeholder="e.g., 1000"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Set a monthly budget for cost tracking and alerts
        </p>
      </div>

      {/* Optional: Budget Threshold */}
      {formData.budgetAmountUSD && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alert Threshold (%)
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={formData.budgetThresholdPercent?.toString() || '80'}
            onChange={(e) => onChange({ budgetThresholdPercent: e.target.value ? parseFloat(e.target.value) : 80 })}
            placeholder="80"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Receive alerts when spending exceeds this percentage of your budget
          </p>
        </div>
      )}

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <ActionButton
          variant="secondary"
          onPress={onBack}
        >
          Back
        </ActionButton>
        <ActionButton
          variant="primary"
          onPress={onNext}
          isDisabled={!isValid}
        >
          Continue to Review
        </ActionButton>
      </div>
    </div>
  );
};

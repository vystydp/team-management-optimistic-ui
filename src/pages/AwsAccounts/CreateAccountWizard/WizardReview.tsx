import React from 'react';
import { ActionButton } from '../../../components/shared/ActionButton';
import { AWS_REGIONS, ACCOUNT_PURPOSES } from '../../../types/account-request';
import type { CreateAccountRequestInput } from '../../../types/account-request';

interface WizardReviewProps {
  formData: CreateAccountRequestInput;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  error: Error | null;
}

export const WizardReview: React.FC<WizardReviewProps> = ({
  formData,
  onSubmit,
  onBack,
  isSubmitting,
}) => {
  const getRegionLabel = (value: string) => {
    return AWS_REGIONS.find(r => r.value === value)?.label || value;
  };

  const getPurposeLabel = (value: string) => {
    return ACCOUNT_PURPOSES.find(p => p.value === value)?.label || value;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Review Your Request
        </h2>
        <p className="text-gray-600 mb-6">
          Please verify all details before submitting your account creation request.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Account Name</div>
            <div className="text-gray-900 font-medium">{formData.accountName}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Owner Email</div>
            <div className="text-gray-900 font-medium">{formData.ownerEmail}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Purpose</div>
            <div className="text-gray-900 font-medium">{getPurposeLabel(formData.purpose)}</div>
          </div>

          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Primary Region</div>
            <div className="text-gray-900 font-medium">{getRegionLabel(formData.primaryRegion)}</div>
          </div>

          {formData.budgetAmountUSD && (
            <>
              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Monthly Budget</div>
                <div className="text-gray-900 font-medium">${formData.budgetAmountUSD.toLocaleString()} USD</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500 mb-1">Alert Threshold</div>
                <div className="text-gray-900 font-medium">{formData.budgetThresholdPercent}%</div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">What happens after submission?</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>Your request will be queued for processing</li>
          <li>AWS Organizations will create the account (typically 5-10 minutes)</li>
          <li>Automated guardrails will be applied:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li>CloudTrail logging enabled in all regions</li>
              <li>AWS Config compliance monitoring</li>
              <li>Budget alerts configured{formData.budgetAmountUSD ? ` ($${formData.budgetAmountUSD}/month)` : ''}</li>
              <li>Service Control Policies (SCPs) applied</li>
            </ul>
          </li>
          <li>You can track progress on the account requests page</li>
          <li>You'll receive access once provisioning is complete</li>
        </ol>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
        <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
          <li>The owner email <strong>{formData.ownerEmail}</strong> must be unique across all AWS accounts</li>
          <li>Account creation cannot be cancelled once submitted</li>
          <li>The process may take 5-15 minutes to complete</li>
          <li>You'll be able to monitor progress in real-time</li>
        </ul>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <ActionButton
          variant="secondary"
          onPress={onBack}
          isDisabled={isSubmitting}
        >
          Back to Edit
        </ActionButton>
        <ActionButton
          variant="primary"
          onPress={onSubmit}
          isDisabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </ActionButton>
      </div>
    </div>
  );
};

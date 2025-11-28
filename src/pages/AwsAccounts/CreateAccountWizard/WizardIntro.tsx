import React from 'react';
import { ActionButton } from '../../../components/shared/ActionButton';

interface WizardIntroProps {
  onNext: () => void;
  onCancel: () => void;
}

export const WizardIntro: React.FC<WizardIntroProps> = ({ onNext, onCancel }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Automated AWS Account Provisioning
        </h2>
        <p className="text-gray-700 mb-4">
          This wizard will guide you through requesting a new AWS account with automated security controls.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
        <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
          <li>You'll provide account details (name, purpose, region)</li>
          <li>Optional: Configure budget alerts and guardrails</li>
          <li>Review and submit your request</li>
          <li>AWS Organizations will create the account (~5-10 minutes)</li>
          <li>Automated guardrails will be applied (CloudTrail, Config, Budgets)</li>
          <li>You'll receive access once provisioning completes</li>
        </ol>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-900 mb-2">Prerequisites</h3>
        <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
          <li>Valid email address (must be unique across all AWS accounts)</li>
          <li>Clear business purpose for the account</li>
          <li>Understanding of the account's primary workload region</li>
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Security & Compliance</h3>
        <p className="text-gray-700 text-sm mb-2">
          All accounts are automatically configured with:
        </p>
        <ul className="grid grid-cols-2 gap-2 text-gray-700 text-sm">
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>AWS CloudTrail logging</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>AWS Config compliance monitoring</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Budget alerts and thresholds</span>
          </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">✓</span>
            <span>Service Control Policies (SCPs)</span>
          </li>
        </ul>
      </div>

      <div className="flex justify-between pt-4 border-t border-gray-200">
        <ActionButton
          variant="secondary"
          onPress={onCancel}
        >
          Cancel
        </ActionButton>
        <ActionButton
          variant="primary"
          onPress={onNext}
        >
          Get Started
        </ActionButton>
      </div>
    </div>
  );
};

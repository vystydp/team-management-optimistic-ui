import React, { useState } from 'react';
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
  TextField,
  Input,
  Label,
} from 'react-aria-components';
import { TeamEnvironment } from '../../types/aws';
import { ActionButton } from '../../components/shared/ActionButton';

interface CloneEnvironmentDialogProps {
  environment: TeamEnvironment;
  onSubmit: (sourceEnvId: string, newName: string, customizations: {
    size?: string;
    region?: string;
    ttlDays?: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export const CloneEnvironmentDialog: React.FC<CloneEnvironmentDialogProps> = ({
  environment,
  onSubmit,
  onCancel,
}) => {
  const [newName, setNewName] = useState(`${environment.name}-clone`);
  const [customizeSettings, setCustomizeSettings] = useState(false);
  const [size, setSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(
    (environment.parameters?.size as 'small' | 'medium' | 'large' | 'xlarge') || 'medium'
  );
  const [ttlDays, setTtlDays] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!newName || newName.trim().length < 3) {
      newErrors.name = 'Environment name must be at least 3 characters';
    }

    if (newName === environment.name) {
      newErrors.name = 'Cloned environment must have a different name';
    }

    if (ttlDays && (isNaN(Number(ttlDays)) || Number(ttlDays) < 1 || Number(ttlDays) > 90)) {
      newErrors.ttlDays = 'TTL must be between 1 and 90 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const customizations: any = {};
      
      if (customizeSettings) {
        if (size !== environment.parameters?.size) {
          customizations.size = size;
        }
        if (ttlDays) {
          customizations.ttlDays = Number(ttlDays);
        }
      }

      await onSubmit(environment.id, newName, customizations);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay
      isOpen={true}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out"
      isDismissable
      onOpenChange={onCancel}
    >
      <Modal className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <Dialog className="p-6 outline-none">
          {({ close }) => (
            <form onSubmit={handleSubmit}>
              <Heading slot="title" className="text-2xl font-bold text-gray-900 mb-2">
                Clone Environment
              </Heading>

              <div className="mb-6">
                <p className="text-gray-600 mb-1">
                  Source environment: <span className="font-semibold text-gray-900">{environment.name}</span>
                </p>
                <p className="text-sm text-gray-500">
                  Create a copy with the same configuration and template
                </p>
              </div>

              {/* New Name */}
              <TextField
                className="mb-4"
                isInvalid={!!errors.name}
                isRequired
              >
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  New Environment Name
                </Label>
                <Input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., my-env-clone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-console-primary data-[invalid]:border-red-500"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </TextField>

              {/* Configuration Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-gray-900 mb-2">Cloned Configuration</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Template:</span>
                    <span className="font-semibold text-gray-900">{environment.template?.name || environment.templateId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AWS Account:</span>
                    <span className="font-semibold text-gray-900">{environment.awsAccount?.accountName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-semibold text-gray-900 capitalize">{environment.parameters?.size || 'medium'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Region:</span>
                    <span className="font-semibold text-gray-900">{environment.parameters?.region || 'us-east-1'}</span>
                  </div>
                </div>
              </div>

              {/* Customize Settings Toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customizeSettings}
                    onChange={(e) => setCustomizeSettings(e.target.checked)}
                    className="w-4 h-4 text-console-primary border-gray-300 rounded focus:ring-console-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Customize clone settings
                  </span>
                </label>
              </div>

              {/* Customization Options */}
              {customizeSettings && (
                <div className="space-y-4 mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Custom Settings</h4>
                  
                  {/* Size Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Size
                    </label>
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value as 'small' | 'medium' | 'large' | 'xlarge')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-console-primary"
                    >
                      <option value="small">Small (1 vCPU, 2GB RAM)</option>
                      <option value="medium">Medium (2 vCPU, 4GB RAM)</option>
                      <option value="large">Large (4 vCPU, 8GB RAM)</option>
                      <option value="xlarge">X-Large (8 vCPU, 16GB RAM)</option>
                    </select>
                  </div>

                  {/* TTL */}
                  <TextField
                    isInvalid={!!errors.ttlDays}
                  >
                    <Label className="block text-sm font-medium text-gray-700 mb-2">
                      Time to Live (TTL) in Days
                    </Label>
                    <Input
                      type="number"
                      value={ttlDays}
                      onChange={(e) => setTtlDays(e.target.value)}
                      placeholder="e.g., 30"
                      min="1"
                      max="90"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-console-primary data-[invalid]:border-red-500"
                    />
                    {errors.ttlDays && (
                      <p className="mt-1 text-sm text-red-600">{errors.ttlDays}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Optional. Leave empty for no expiration.
                    </p>
                  </TextField>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-lg">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">
                      Cloning will create a new environment with the same template and configuration. 
                      This operation typically takes 2-5 minutes. The new environment will be independent 
                      from the source.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <ActionButton
                  variant="secondary"
                  onPress={() => {
                    close();
                    onCancel();
                  }}
                  isDisabled={isSubmitting}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  type="submit"
                  variant="primary"
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? 'Cloning...' : 'Clone Environment'}
                </ActionButton>
              </div>
            </form>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

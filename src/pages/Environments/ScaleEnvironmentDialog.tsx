import React, { useState } from 'react';
import {
  Dialog,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components';
import { TeamEnvironment } from '../../types/aws';
import { ActionButton } from '../../components/shared/ActionButton';

interface ScaleEnvironmentDialogProps {
  environment: TeamEnvironment;
  onSubmit: (envId: string, newSize: string) => Promise<void>;
  onCancel: () => void;
}

const SIZE_OPTIONS = [
  { value: 'small', label: 'Small', description: '1 vCPU, 2GB RAM', monthlyCost: 50 },
  { value: 'medium', label: 'Medium', description: '2 vCPU, 4GB RAM', monthlyCost: 100 },
  { value: 'large', label: 'Large', description: '4 vCPU, 8GB RAM', monthlyCost: 200 },
  { value: 'xlarge', label: 'X-Large', description: '8 vCPU, 16GB RAM', monthlyCost: 400 },
];

export const ScaleEnvironmentDialog: React.FC<ScaleEnvironmentDialogProps> = ({
  environment,
  onSubmit,
  onCancel,
}) => {
  const currentSize = environment.template?.parameters?.size || 'medium';
  const [selectedSize, setSelectedSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>(currentSize as 'small' | 'medium' | 'large' | 'xlarge');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedSize === currentSize) {
      onCancel();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(environment.id, selectedSize);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption = SIZE_OPTIONS.find(opt => opt.value === selectedSize) || SIZE_OPTIONS[1];
  const currentOption = SIZE_OPTIONS.find(opt => opt.value === currentSize) || SIZE_OPTIONS[1];
  const costDiff = selectedOption.monthlyCost - currentOption.monthlyCost;

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
                Scale Environment
              </Heading>

              <div className="mb-6">
                <p className="text-gray-600 mb-1">
                  Environment: <span className="font-semibold text-gray-900">{environment.name}</span>
                </p>
                <p className="text-gray-600">
                  Current size: <span className="font-semibold text-gray-900 capitalize">{currentSize}</span>
                </p>
              </div>

              {/* Size Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select New Size
                </label>
                <div className="space-y-3">
                  {SIZE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSelectedSize(option.value as 'small' | 'medium' | 'large' | 'xlarge')}
                      className={`
                        w-full p-4 rounded-lg border-2 text-left transition-all
                        ${selectedSize === option.value
                          ? 'border-console-primary bg-console-primary/5 ring-2 ring-console-primary/20'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }
                        ${option.value === currentSize ? 'opacity-75' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-5 h-5 rounded-full border-2 flex items-center justify-center
                            ${selectedSize === option.value ? 'border-console-primary' : 'border-gray-300'}
                          `}>
                            {selectedSize === option.value && (
                              <div className="w-3 h-3 rounded-full bg-console-primary" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {option.label}
                              {option.value === currentSize && (
                                <span className="ml-2 text-xs font-normal text-gray-500">(Current)</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">{option.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">${option.monthlyCost}/mo</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost Impact */}
              {selectedSize !== currentSize && (
                <div className={`
                  p-4 rounded-lg mb-6
                  ${costDiff > 0 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}
                `}>
                  <div className="flex items-start gap-2">
                    <span className="text-lg">{costDiff > 0 ? '⚠️' : '✅'}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1">
                        Cost Impact
                      </div>
                      <p className="text-sm text-gray-700">
                        {costDiff > 0 ? (
                          <>
                            Scaling up will <span className="font-semibold">increase</span> your monthly cost by{' '}
                            <span className="font-semibold text-orange-700">${Math.abs(costDiff)}/mo</span>
                          </>
                        ) : (
                          <>
                            Scaling down will <span className="font-semibold">reduce</span> your monthly cost by{' '}
                            <span className="font-semibold text-green-700">${Math.abs(costDiff)}/mo</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning for production */}
              {environment.template?.type === 'production' && selectedSize !== currentSize && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <div className="flex-1">
                      <div className="font-semibold text-red-900 mb-1">
                        Production Environment Warning
                      </div>
                      <p className="text-sm text-red-800">
                        Scaling a production environment may cause temporary disruption. Ensure you have a maintenance window scheduled.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-2">
                  <span className="text-lg">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-sm text-blue-800">
                      Crossplane will reconcile the environment to match the new size. This process typically takes 2-5 minutes.
                      The environment will show status <span className="font-semibold">UPDATING</span> during this time.
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
                  isDisabled={isSubmitting || selectedSize === currentSize}
                >
                  {isSubmitting ? 'Scaling...' : `Scale to ${selectedOption.label}`}
                </ActionButton>
              </div>
            </form>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

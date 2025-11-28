import { useState } from 'react';
import { Button, Dialog, Heading, Modal, ModalOverlay, TextField, Label, Input, TextArea } from 'react-aria-components';
import { PorscheIcon } from '../shared/PorscheIcon';

interface LinkAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: LinkAccountFormData) => Promise<void>;
}

export interface LinkAccountFormData {
  accountId: string;
  accountName: string;
  roleArn: string;
  ownerEmail: string;
}

export const LinkAccountModal = ({ isOpen, onClose, onSubmit }: LinkAccountModalProps) => {
  const [formData, setFormData] = useState<LinkAccountFormData>({
    accountId: '',
    accountName: '',
    roleArn: '',
    ownerEmail: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LinkAccountFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LinkAccountFormData, string>> = {};

    // Validate Account ID (12 digits)
    if (!formData.accountId.match(/^\d{12}$/)) {
      newErrors.accountId = 'Account ID must be exactly 12 digits';
    }

    // Validate Account Name
    if (formData.accountName.length < 3) {
      newErrors.accountName = 'Account name must be at least 3 characters';
    }

    // Validate Role ARN format
    if (!formData.roleArn.match(/^arn:aws:iam::\d{12}:role\/[\w+=,.@-]+$/)) {
      newErrors.roleArn = 'Invalid IAM role ARN format';
    }

    // Validate Email
    if (!formData.ownerEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      newErrors.ownerEmail = 'Invalid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        accountId: '',
        accountName: '',
        roleArn: '',
        ownerEmail: '',
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to link account:', error);
      setErrors({ accountId: error instanceof Error ? error.message : 'Failed to link account' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        accountId: '',
        accountName: '',
        roleArn: '',
        ownerEmail: '',
      });
      setErrors({});
      onClose();
    }
  };

  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={handleClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <Modal className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Dialog className="bg-white rounded-porsche-lg shadow-porsche-lg border border-porsche-silver p-fluid-lg outline-none">
          {({ close }) => (
            <>
              {/* Header */}
              <div className="flex items-start justify-between mb-fluid-md">
                <div>
                  <Heading className="text-heading-lg font-bold text-porsche-neutral-800 font-porsche tracking-tight">
                    Link Existing AWS Account
                  </Heading>
                  <p className="mt-2 text-sm text-porsche-neutral-600 font-porsche">
                    Connect your existing AWS account to deploy environments
                  </p>
                </div>
                <Button
                  onPress={close}
                  className="text-porsche-neutral-500 hover:text-porsche-neutral-700 transition-colors p-2"
                  isDisabled={isSubmitting}
                >
                  <PorscheIcon name="close" size={24} />
                </Button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-fluid-md">
                {/* Account ID */}
                <TextField
                  isRequired
                  isInvalid={!!errors.accountId}
                  className="space-y-2"
                >
                  <Label className="text-sm font-bold text-porsche-neutral-700 font-porsche uppercase tracking-wide">
                    AWS Account ID *
                  </Label>
                  <Input
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    placeholder="123456789012"
                    maxLength={12}
                    className="w-full px-4 py-3 border border-porsche-silver rounded-porsche shadow-porsche-sm font-porsche text-sm focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent disabled:bg-porsche-neutral-100 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  />
                  {errors.accountId && (
                    <p className="text-xs text-porsche-red font-porsche mt-1">{errors.accountId}</p>
                  )}
                  <p className="text-xs text-porsche-neutral-600 font-porsche">
                    Your 12-digit AWS account number
                  </p>
                </TextField>

                {/* Account Name */}
                <TextField
                  isRequired
                  isInvalid={!!errors.accountName}
                  className="space-y-2"
                >
                  <Label className="text-sm font-bold text-porsche-neutral-700 font-porsche uppercase tracking-wide">
                    Account Name *
                  </Label>
                  <Input
                    value={formData.accountName}
                    onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    placeholder="Production Account"
                    className="w-full px-4 py-3 border border-porsche-silver rounded-porsche shadow-porsche-sm font-porsche text-sm focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent disabled:bg-porsche-neutral-100 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  />
                  {errors.accountName && (
                    <p className="text-xs text-porsche-red font-porsche mt-1">{errors.accountName}</p>
                  )}
                  <p className="text-xs text-porsche-neutral-600 font-porsche">
                    A friendly name to identify this account
                  </p>
                </TextField>

                {/* Role ARN */}
                <TextField
                  isRequired
                  isInvalid={!!errors.roleArn}
                  className="space-y-2"
                >
                  <Label className="text-sm font-bold text-porsche-neutral-700 font-porsche uppercase tracking-wide">
                    Cross-Account Role ARN *
                  </Label>
                  <TextArea
                    value={formData.roleArn}
                    onChange={(e) => setFormData({ ...formData, roleArn: e.target.value })}
                    placeholder="arn:aws:iam::123456789012:role/CrossplaneAccess"
                    rows={2}
                    className="w-full px-4 py-3 border border-porsche-silver rounded-porsche shadow-porsche-sm font-porsche text-sm focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent disabled:bg-porsche-neutral-100 disabled:cursor-not-allowed resize-none"
                    disabled={isSubmitting}
                  />
                  {errors.roleArn && (
                    <p className="text-xs text-porsche-red font-porsche mt-1">{errors.roleArn}</p>
                  )}
                  <p className="text-xs text-porsche-neutral-600 font-porsche">
                    IAM role ARN for Crossplane to assume (arn:aws:iam::ACCOUNT:role/ROLE_NAME)
                  </p>
                </TextField>

                {/* Owner Email */}
                <TextField
                  isRequired
                  isInvalid={!!errors.ownerEmail}
                  className="space-y-2"
                >
                  <Label className="text-sm font-bold text-porsche-neutral-700 font-porsche uppercase tracking-wide">
                    Owner Email *
                  </Label>
                  <Input
                    type="email"
                    value={formData.ownerEmail}
                    onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
                    placeholder="team@porsche.com"
                    className="w-full px-4 py-3 border border-porsche-silver rounded-porsche shadow-porsche-sm font-porsche text-sm focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent disabled:bg-porsche-neutral-100 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                  />
                  {errors.ownerEmail && (
                    <p className="text-xs text-porsche-red font-porsche mt-1">{errors.ownerEmail}</p>
                  )}
                  <p className="text-xs text-porsche-neutral-600 font-porsche">
                    Contact email for this account
                  </p>
                </TextField>

                {/* Info Box */}
                <div className="bg-console-primary/5 border border-console-primary/20 rounded-porsche p-fluid-sm">
                  <div className="flex items-start gap-3">
                    <PorscheIcon name="information" size={20} className="text-console-primary flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-porsche-neutral-800 font-porsche mb-1 uppercase tracking-wide">
                        Setup Required
                      </p>
                      <p className="text-xs text-porsche-neutral-700 font-porsche leading-relaxed">
                        Before linking, create an IAM role in your AWS account with trust relationship to our Crossplane identity. 
                        View the <span className="font-bold text-console-primary">setup guide</span> for detailed instructions.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-fluid-sm border-t border-porsche-silver">
                  <Button
                    onPress={close}
                    className="px-6 py-3 border-2 border-porsche-silver rounded-porsche shadow-porsche-sm text-sm font-bold uppercase tracking-wide text-porsche-neutral-600 bg-white hover:bg-porsche-neutral-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:cursor-not-allowed disabled:opacity-50"
                    isDisabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="px-6 py-3 border border-transparent rounded-porsche shadow-porsche-md text-sm font-bold uppercase tracking-wide text-white bg-console-primary hover:bg-console-primary-soft active:scale-95 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed"
                    isDisabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⟳</span>
                        Linking...
                      </span>
                    ) : (
                      'Link Account'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

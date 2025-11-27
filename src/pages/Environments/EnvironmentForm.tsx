import React, { useState } from 'react';
import {
  Button,
  Dialog,
  Heading,
  Label,
  TextField,
  Input,
  Select,
  SelectValue,
  Popover,
  ListBox,
  ListBoxItem,
  FieldError,
  Modal,
  ModalOverlay,
  ComboBox,
} from 'react-aria-components';
import { EnvironmentTemplate } from '../../types/aws';
import { PorscheIcon } from '../../components/shared/PorscheIcon';

interface EnvironmentFormProps {
  templates: EnvironmentTemplate[];
  awsAccounts: Array<{ id: string; name: string; accountId: string }>;
  onSubmit: (data: {
    name: string;
    templateId: string;
    awsAccountId: string;
    ttl?: Date;
  }) => Promise<void>;
  onCancel: () => void;
}

export const EnvironmentForm: React.FC<EnvironmentFormProps> = ({
  templates,
  awsAccounts,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    awsAccountId: '',
    ttlDays: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'Environment name must be at least 3 characters';
    }

    if (!formData.templateId) {
      newErrors.templateId = 'Please select a template';
    }

    if (!formData.awsAccountId) {
      newErrors.awsAccountId = 'Please select an AWS account';
    }

    if (formData.ttlDays && (isNaN(Number(formData.ttlDays)) || Number(formData.ttlDays) < 1 || Number(formData.ttlDays) > 90)) {
      newErrors.ttlDays = 'TTL must be between 1 and 90 days';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const ttl = formData.ttlDays
        ? new Date(Date.now() + Number(formData.ttlDays) * 24 * 60 * 60 * 1000)
        : undefined;

      await onSubmit({
        name: formData.name,
        templateId: formData.templateId,
        awsAccountId: formData.awsAccountId,
        ttl,
      });
    } catch (error) {
      setErrors({ submit: 'Failed to create environment' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay
      isOpen={true}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out"
      isDismissable={!isSubmitting}
    >
      <Modal className="bg-white rounded-porsche-lg shadow-porsche-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto data-[entering]:animate-in data-[entering]:zoom-in-95 data-[exiting]:animate-out data-[exiting]:zoom-out-95">
        <Dialog className="outline-none">
          {({ close }) => (
            <form onSubmit={handleSubmit} className="p-fluid-lg">
              <div className="flex items-center justify-between mb-fluid-md">
                <Heading className="text-heading-lg font-bold text-porsche-neutral-800 font-porsche tracking-tight">
                  Create New Environment
                </Heading>
                <Button
                  onPress={() => {
                    if (!isSubmitting) {
                      close();
                      onCancel();
                    }
                  }}
                  className="p-2 rounded-porsche hover:bg-porsche-neutral-100 transition-colors"
                  isDisabled={isSubmitting}
                >
                  <PorscheIcon name="close" size={20} className="text-porsche-neutral-600" />
                </Button>
              </div>

              <div className="space-y-fluid-md">
                {/* Environment Name */}
                <TextField
                  name="name"
                  isRequired
                  isInvalid={!!errors.name}
                  className="flex flex-col gap-2"
                >
                  <Label className="text-sm font-semibold text-porsche-neutral-700 uppercase tracking-wide font-porsche">
                    Environment Name
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="px-4 py-3 rounded-porsche border border-porsche-silver focus:border-console-primary focus:ring-2 focus:ring-console-primary focus:ring-offset-2 outline-none transition-all font-porsche disabled:bg-porsche-neutral-100 disabled:cursor-not-allowed"
                    placeholder="e.g., my-dev-environment"
                    disabled={isSubmitting}
                  />
                  {errors.name && (
                    <FieldError className="text-sm text-porsche-red flex items-center gap-2 font-porsche">
                      <PorscheIcon name="warning" size={16} className="text-porsche-red" />
                      {errors.name}
                    </FieldError>
                  )}
                </TextField>

                {/* Template Selection - ComboBox for searchable dropdown */}
                <ComboBox
                  name="template"
                  isRequired
                  selectedKey={formData.templateId}
                  onSelectionChange={(key) => setFormData({ ...formData, templateId: key as string })}
                  className="flex flex-col gap-2"
                  isDisabled={isSubmitting}
                >
                  <Label className="text-sm font-semibold text-porsche-neutral-700 uppercase tracking-wide font-porsche">
                    Environment Template
                  </Label>
                  <div className="relative">
                    <Input
                      className="w-full px-4 py-3 rounded-porsche border border-porsche-silver focus:border-console-primary focus:ring-2 focus:ring-console-primary focus:ring-offset-2 outline-none transition-all font-porsche disabled:bg-porsche-neutral-100"
                      placeholder="Search templates..."
                    />
                    <Button className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                      <PorscheIcon name="arrow-down" size={16} className="text-porsche-neutral-600" />
                    </Button>
                  </div>
                  <Popover className="w-[--trigger-width] bg-white rounded-porsche shadow-porsche-lg border border-porsche-silver mt-1 overflow-hidden">
                    <ListBox className="outline-none max-h-60 overflow-y-auto">
                      {templates.map((template) => (
                        <ListBoxItem
                          key={template.id}
                          id={template.id}
                          textValue={template.name}
                          className="px-4 py-3 cursor-pointer hover:bg-porsche-neutral-50 focus:bg-console-primary focus:text-white outline-none transition-colors font-porsche"
                        >
                          <div>
                            <div className="font-semibold text-sm">{template.name}</div>
                            <div className="text-xs text-porsche-neutral-600 mt-1">
                              {template.description}
                            </div>
                            <div className="text-xs text-porsche-neutral-500 mt-1 uppercase tracking-wide font-semibold">
                              {template.type} • {template.parameters.size}
                            </div>
                          </div>
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </Popover>
                  {errors.templateId && (
                    <FieldError className="text-sm text-porsche-red flex items-center gap-2 font-porsche">
                      <PorscheIcon name="warning" size={16} className="text-porsche-red" />
                      {errors.templateId}
                    </FieldError>
                  )}
                </ComboBox>

                {/* AWS Account Selection */}
                <Select
                  name="awsAccount"
                  isRequired
                  selectedKey={formData.awsAccountId}
                  onSelectionChange={(key) => setFormData({ ...formData, awsAccountId: key as string })}
                  className="flex flex-col gap-2"
                  isDisabled={isSubmitting}
                >
                  <Label className="text-sm font-semibold text-porsche-neutral-700 uppercase tracking-wide font-porsche">
                    AWS Account
                  </Label>
                  <Button className="px-4 py-3 rounded-porsche border border-porsche-silver hover:border-console-primary focus:border-console-primary focus:ring-2 focus:ring-console-primary focus:ring-offset-2 outline-none transition-all font-porsche text-left flex items-center justify-between disabled:bg-porsche-neutral-100">
                    <SelectValue className="flex-1 text-porsche-neutral-800" />
                    <PorscheIcon name="arrow-down" size={16} className="text-porsche-neutral-600 ml-2" />
                  </Button>
                  <Popover className="w-[--trigger-width] bg-white rounded-porsche shadow-porsche-lg border border-porsche-silver mt-1 overflow-hidden">
                    <ListBox className="outline-none max-h-48 overflow-y-auto">
                      {awsAccounts.map((account) => (
                        <ListBoxItem
                          key={account.id}
                          id={account.id}
                          textValue={account.name}
                          className="px-4 py-3 cursor-pointer hover:bg-porsche-neutral-50 focus:bg-console-primary focus:text-white outline-none transition-colors font-porsche"
                        >
                          <div className="font-semibold text-sm">{account.name}</div>
                          <div className="text-xs text-porsche-neutral-600 mt-1">{account.accountId}</div>
                        </ListBoxItem>
                      ))}
                    </ListBox>
                  </Popover>
                  {errors.awsAccountId && (
                    <FieldError className="text-sm text-porsche-red flex items-center gap-2 font-porsche">
                      <PorscheIcon name="warning" size={16} className="text-porsche-red" />
                      {errors.awsAccountId}
                    </FieldError>
                  )}
                </Select>

                {/* TTL (Time to Live) - Simple number input for now */}
                <TextField
                  name="ttl"
                  isInvalid={!!errors.ttlDays}
                  className="flex flex-col gap-2"
                >
                  <Label className="text-sm font-semibold text-porsche-neutral-700 uppercase tracking-wide font-porsche">
                    TTL (Days) - Optional
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="90"
                    value={formData.ttlDays}
                    onChange={(e) => setFormData({ ...formData, ttlDays: e.target.value })}
                    className="px-4 py-3 rounded-porsche border border-porsche-silver focus:border-console-primary focus:ring-2 focus:ring-console-primary focus:ring-offset-2 outline-none transition-all font-porsche disabled:bg-porsche-neutral-100"
                    placeholder="e.g., 30 (max 90 days)"
                    disabled={isSubmitting}
                  />
                  <div className="text-xs text-porsche-neutral-600 font-porsche">
                    Environment will be automatically deleted after this many days
                  </div>
                  {errors.ttlDays && (
                    <FieldError className="text-sm text-porsche-red flex items-center gap-2 font-porsche">
                      <PorscheIcon name="warning" size={16} className="text-porsche-red" />
                      {errors.ttlDays}
                    </FieldError>
                  )}
                </TextField>

                {/* Submit Error */}
                {errors.submit && (
                  <div className="bg-porsche-error-bg border border-porsche-red rounded-porsche p-fluid-sm">
                    <div className="flex items-center gap-2 text-porsche-red font-porsche text-sm">
                      <PorscheIcon name="warning" size={16} />
                      {errors.submit}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 mt-fluid-lg pt-fluid-md border-t border-porsche-silver">
                <Button
                  onPress={() => {
                    close();
                    onCancel();
                  }}
                  className="px-6 py-2.5 rounded-lg border-2 border-porsche-neutral-300 text-porsche-neutral-700 font-bold uppercase tracking-wide text-sm hover:bg-porsche-neutral-50 transition-all font-porsche disabled:opacity-50 disabled:cursor-not-allowed"
                  isDisabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2.5 rounded-lg bg-console-primary hover:bg-console-primary-soft text-white font-bold uppercase tracking-wide text-sm shadow-md transition-all font-porsche disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed flex items-center gap-2"
                  isDisabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PorscheIcon name="add" size={16} className="text-white" />
                      Create Environment
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
};

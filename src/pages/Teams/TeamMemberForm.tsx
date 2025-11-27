import React, { useState, useEffect } from 'react';
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
} from 'react-aria-components';
import { TeamMember } from '../../types/team';

interface TeamMemberFormProps {
  member?: TeamMember | null;
  onSubmit: (data: Omit<TeamMember, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export const TeamMemberForm: React.FC<TeamMemberFormProps> = ({ member, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: string;
    department: string;
    status: 'active' | 'inactive';
  }>({
    name: '',
    email: '',
    role: '',
    department: '',
    status: 'active',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.name,
        email: member.email,
        role: member.role,
        department: member.department,
        status: member.status,
      });
    }
  }, [member]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.role.trim()) {
      newErrors.role = 'Role is required';
    }

    if (!formData.department.trim()) {
      newErrors.department = 'Department is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onCancel();
    } catch (error) {
      console.error('Failed to submit form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-porsche-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <Dialog className="bg-white rounded-porsche-xl shadow-porsche-xl max-w-md w-full p-8 outline-none border border-porsche-silver animate-in zoom-in-95 duration-200">
        <Heading className="text-2xl font-bold text-porsche-black mb-2 tracking-tight">
          {member ? 'Edit Team Member' : 'Add Team Member'}
        </Heading>
        <p className="text-sm text-porsche-neutral-600 mb-6 leading-relaxed">
          {member ? 'Update team member information' : 'Add a new member to your team'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <TextField
            name="name"
            value={formData.name}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, name: value }));
              if (errors.name) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.name;
                  return newErrors;
                });
              }
            }}
            isRequired
            isInvalid={!!errors.name}
            className="flex flex-col gap-2"
          >
            <Label className="text-sm font-semibold text-porsche-black flex items-center gap-1 tracking-wide uppercase text-xs">
              Name
              <span className="text-porsche-red">*</span>
            </Label>
            <Input className="w-full px-4 py-3 text-base border border-porsche-silver rounded-porsche bg-white focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent transition-all data-[invalid]:border-porsche-red data-[invalid]:ring-2 data-[invalid]:ring-porsche-red/20 data-[focus-visible]:ring-2 data-[focus-visible]:ring-console-primary shadow-porsche-sm hover:border-porsche-silver-dark" />
            {errors.name && (
              <FieldError className="text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                {errors.name}
              </FieldError>
            )}
          </TextField>

          <TextField
            name="email"
            type="email"
            value={formData.email}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, email: value }));
              if (errors.email) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.email;
                  return newErrors;
                });
              }
            }}
            isRequired
            isInvalid={!!errors.email}
            className="flex flex-col gap-2"
          >
            <Label className="text-sm font-semibold text-porsche-black flex items-center gap-1 tracking-wide uppercase text-xs">
              Email
              <span className="text-porsche-red">*</span>
            </Label>
            <Input className="w-full px-4 py-3 text-base border border-porsche-silver rounded-porsche bg-white focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent transition-all data-[invalid]:border-porsche-red data-[invalid]:ring-2 data-[invalid]:ring-porsche-red/20 data-[focus-visible]:ring-2 data-[focus-visible]:ring-console-primary shadow-porsche-sm hover:border-porsche-silver-dark" />
            {errors.email && (
              <FieldError className="text-sm text-porsche-red font-medium flex items-center gap-1">
                <span>⚠️</span>
                {errors.email}
              </FieldError>
            )}
          </TextField>

          <TextField
            name="role"
            value={formData.role}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, role: value }));
              if (errors.role) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.role;
                  return newErrors;
                });
              }
            }}
            isRequired
            isInvalid={!!errors.role}
            className="flex flex-col gap-2"
          >
            <Label className="text-sm font-semibold text-porsche-black flex items-center gap-1 tracking-wide uppercase text-xs">
              Role
              <span className="text-porsche-red">*</span>
            </Label>
            <Input className="w-full px-4 py-3 text-base border border-porsche-silver rounded-porsche bg-white focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent transition-all data-[invalid]:border-porsche-red data-[invalid]:ring-2 data-[invalid]:ring-porsche-red/20 data-[focus-visible]:ring-2 data-[focus-visible]:ring-console-primary shadow-porsche-sm hover:border-porsche-silver-dark" />
            {errors.role && (
              <FieldError className="text-sm text-porsche-red font-medium flex items-center gap-1">
                <span>⚠️</span>
                {errors.role}
              </FieldError>
            )}
          </TextField>

          <TextField
            name="department"
            value={formData.department}
            onChange={(value) => {
              setFormData((prev) => ({ ...prev, department: value }));
              if (errors.department) {
                setErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.department;
                  return newErrors;
                });
              }
            }}
            isRequired
            isInvalid={!!errors.department}
            className="flex flex-col gap-2"
          >
            <Label className="text-sm font-semibold text-porsche-black flex items-center gap-1 tracking-wide uppercase text-xs">
              Department
              <span className="text-porsche-red">*</span>
            </Label>
            <Input className="w-full px-4 py-3 text-base border border-porsche-silver rounded-porsche bg-white focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent transition-all data-[invalid]:border-porsche-red data-[invalid]:ring-2 data-[invalid]:ring-porsche-red/20 data-[focus-visible]:ring-2 data-[focus-visible]:ring-console-primary shadow-porsche-sm hover:border-porsche-silver-dark" />
            {errors.department && (
              <FieldError className="text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                {errors.department}
              </FieldError>
            )}
          </TextField>

          <Select
            name="status"
            selectedKey={formData.status}
            onSelectionChange={(key) => {
              setFormData((prev) => ({ ...prev, status: key as 'active' | 'inactive' }));
            }}
            className="flex flex-col gap-2"
          >
            <Label className="text-sm font-semibold text-porsche-black tracking-wide uppercase text-xs">Status</Label>
            <Button className="w-full px-4 py-3 text-base border border-porsche-silver rounded-porsche bg-white hover:bg-porsche-neutral-50 hover:border-porsche-silver-dark focus:outline-none focus:ring-2 focus:ring-console-primary focus:border-transparent transition-all flex justify-between items-center data-[focus-visible]:ring-2 data-[focus-visible]:ring-console-primary shadow-porsche-sm">
              <SelectValue className="text-porsche-black font-medium" />
              <svg className="w-4 h-4 text-porsche-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            <Popover className="w-[--trigger-width] bg-white border border-porsche-silver rounded-porsche shadow-porsche-lg mt-1 overflow-hidden">
              <ListBox className="outline-none p-1.5 max-h-60 overflow-auto">
                <ListBoxItem
                  id="active"
                  className="px-4 py-3 rounded-porsche cursor-pointer outline-none hover:bg-porsche-neutral-50 focus:bg-porsche-neutral-100 selected:bg-porsche-red selected:text-white transition-all flex items-center gap-2.5 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Active
                </ListBoxItem>
                <ListBoxItem
                  id="inactive"
                  className="px-4 py-3 rounded-porsche cursor-pointer outline-none hover:bg-porsche-neutral-50 focus:bg-porsche-neutral-100 selected:bg-porsche-red selected:text-white transition-all flex items-center gap-2.5 font-medium"
                >
                  <span className="w-2 h-2 rounded-full bg-porsche-neutral-400"></span>
                  Inactive
                </ListBoxItem>
              </ListBox>
            </Popover>
          </Select>

          <div className="flex gap-3 pt-6 border-t border-porsche-silver mt-6">
            <Button
              type="button"
              onPress={onCancel}
              isDisabled={isSubmitting}
              className="flex-1 px-5 py-3 bg-white border-2 border-porsche-silver text-porsche-black rounded-porsche hover:bg-porsche-neutral-50 hover:border-porsche-neutral-400 pressed:bg-porsche-neutral-100 transition-all font-bold uppercase text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-porsche-neutral-400 focus:ring-offset-2 shadow-porsche-sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isDisabled={isSubmitting}
              className="flex-1 px-5 py-3 bg-console-primary text-white rounded-porsche hover:bg-console-primary-soft pressed:bg-console-primary-dark active:scale-95 transition-all font-bold uppercase text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 shadow-porsche-md flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>{member ? 'Update' : 'Add'}</>
              )}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};

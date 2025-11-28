import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountRequestService } from '../../../services/accountRequestService';
import { useAccountRequestWizardStore } from '../../../stores/accountRequestWizardStore';
import { WizardIntro } from './WizardIntro';
import { WizardForm } from './WizardForm';
import { WizardReview } from './WizardReview';
import { StepProgress } from '../../../components/shared/StepProgress';
import type { CreateAccountRequestInput, AccountRequest } from '../../../types/account-request';

export const CreateAccountWizard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // UI state from Zustand
  const { currentStep, formData, setStep, updateFormData, resetWizard } = useAccountRequestWizardStore();

  // Server mutation from React Query with optimistic updates
  const createMutation = useMutation({
    mutationFn: (input: CreateAccountRequestInput) => 
      accountRequestService.createAccountRequest(input),
    
    // Optimistic update: add to cache immediately
    onMutate: async (input: CreateAccountRequestInput) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['accountRequests'] });

      // Snapshot previous value
      const previousRequests = queryClient.getQueryData(['accountRequests']);

      // Optimistically update cache with temporary ID
      const optimisticRequest: AccountRequest = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        status: 'REQUESTED',
        accountName: input.accountName,
        ownerEmail: input.ownerEmail,
        purpose: input.purpose,
        primaryRegion: input.primaryRegion,
        budgetAmountUSD: input.budgetAmountUSD,
        budgetThresholdPercent: input.budgetThresholdPercent,
        allowedRegions: input.allowedRegions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData(['accountRequests'], (old: any) => ({
        requests: [optimisticRequest, ...(old?.requests || [])],
        total: (old?.total || 0) + 1,
      }));

      return { previousRequests };
    },
    
    // On error: rollback to previous state
    onError: (err, variables, context) => {
      if (context?.previousRequests) {
        queryClient.setQueryData(['accountRequests'], context.previousRequests);
      }
    },
    
    // On success: replace temp with real data
    onSuccess: (newRequest: AccountRequest) => {
      // Replace optimistic request with real one
      queryClient.setQueryData(['accountRequests'], (old: any) => ({
        requests: [
          newRequest,
          ...(old?.requests || []).filter((r: AccountRequest) => !r.id.startsWith('temp-'))
        ],
        total: old?.total || 1,
      }));
      
      // Reset wizard state
      resetWizard();
      
      // Navigate to detail page to show progress
      navigate(`/aws-accounts/requests/${newRequest.id}`);
    },
  });

  const handleNext = () => {
    if (currentStep === 'intro') {
      setStep('form');
    } else if (currentStep === 'form') {
      setStep('review');
    }
  };

  const handleBack = () => {
    if (currentStep === 'review') {
      setStep('form');
    } else if (currentStep === 'form') {
      setStep('intro');
    }
  };

  const handleCancel = () => {
    resetWizard();
    navigate('/aws-accounts/requests');
  };

  const handleSubmit = async () => {
    if (!isFormValid()) return;
    
    try {
      await createMutation.mutateAsync(formData as CreateAccountRequestInput);
    } catch (error) {
      console.error('Failed to create account request:', error);
    }
  };

  const isFormValid = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return !!(
      formData.accountName?.trim() &&
      formData.ownerEmail?.trim() &&
      emailRegex.test(formData.ownerEmail) &&
      formData.purpose &&
      formData.primaryRegion
    );
  };

  const getSteps = () => {
    return [
      {
        label: 'Introduction',
        status: currentStep === 'intro' ? 'current' as const : 'completed' as const,
      },
      {
        label: 'Account Details',
        status: currentStep === 'intro' ? 'upcoming' as const : currentStep === 'form' ? 'current' as const : 'completed' as const,
      },
      {
        label: 'Review & Submit',
        status: currentStep === 'review' ? 'current' as const : 'upcoming' as const,
      },
    ];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create AWS Account
        </h1>
        <p className="text-gray-600">
          Request a new AWS account with automated guardrails and security controls
        </p>
      </div>

      <div className="mb-8">
        <StepProgress steps={getSteps()} />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {currentStep === 'intro' && (
          <WizardIntro onNext={handleNext} onCancel={handleCancel} />
        )}

        {currentStep === 'form' && (
          <WizardForm
            formData={formData}
            onChange={updateFormData}
            onNext={handleNext}
            onBack={handleBack}
            isValid={isFormValid()}
          />
        )}

        {currentStep === 'review' && (
          <WizardReview
            formData={formData as CreateAccountRequestInput}
            onSubmit={handleSubmit}
            onBack={handleBack}
            isSubmitting={createMutation.isPending}
            error={createMutation.error}
          />
        )}
      </div>

      {createMutation.isError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            <strong>Error:</strong> {createMutation.error instanceof Error ? createMutation.error.message : 'Failed to create account request'}
          </p>
        </div>
      )}
    </div>
  );
};

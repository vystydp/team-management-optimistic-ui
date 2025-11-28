import { create } from 'zustand';
import type { CreateAccountRequestInput } from '../types/account-request';

interface WizardState {
  // Current step in the wizard
  currentStep: 'intro' | 'form' | 'review';
  
  // Form data (unsaved until submission)
  formData: Partial<CreateAccountRequestInput>;
  
  // UI state
  isSubmitting: boolean;
  
  // Actions
  setStep: (step: 'intro' | 'form' | 'review') => void;
  updateFormData: (updates: Partial<CreateAccountRequestInput>) => void;
  setSubmitting: (isSubmitting: boolean) => void;
  resetWizard: () => void;
}

const initialFormData: Partial<CreateAccountRequestInput> = {
  purpose: 'development',
  primaryRegion: 'us-east-1',
  budgetThresholdPercent: 80,
};

export const useAccountRequestWizardStore = create<WizardState>((set) => ({
  currentStep: 'intro',
  formData: initialFormData,
  isSubmitting: false,
  
  setStep: (step) => set({ currentStep: step }),
  
  updateFormData: (updates) => 
    set((state) => ({
      formData: { ...state.formData, ...updates },
    })),
  
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  
  resetWizard: () => 
    set({
      currentStep: 'intro',
      formData: initialFormData,
      isSubmitting: false,
    }),
}));

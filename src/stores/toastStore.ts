import { create } from 'zustand';
import { Toast, ToastType } from '../components/shared/Toast';

interface ToastStore {
  toasts: Toast[];
  addToast: (title: string, type: ToastType, message?: string, action?: { label: string; onClick: () => void }) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (title, type, message, action) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    const toast: Toast = { id, title, type, message, action };
    
    set((state) => ({
      toasts: [...state.toasts, toast],
    }));
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  
  clearAll: () => {
    set({ toasts: [] });
  },
}));

// Helper hook for easier usage
export const useToast = () => {
  const { addToast } = useToastStore();
  
  return {
    showSuccess: (title: string, message?: string, action?: { label: string; onClick: () => void }) => 
      addToast(title, 'success', message, action),
    showError: (title: string, message?: string, action?: { label: string; onClick: () => void }) => 
      addToast(title, 'error', message, action),
    showInfo: (title: string, message?: string, action?: { label: string; onClick: () => void }) => 
      addToast(title, 'info', message, action),
    showWarning: (title: string, message?: string, action?: { label: string; onClick: () => void }) => 
      addToast(title, 'warning', message, action),
  };
};

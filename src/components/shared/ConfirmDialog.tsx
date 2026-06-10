import { Button, Dialog, Modal, ModalOverlay, Heading } from 'react-aria-components';
import { cn } from '../../utils/cn';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation dialog (role="alertdialog") replacing window.confirm.
 * Controlled via isOpen; supports a destructive variant and a busy state.
 */
export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open && !isBusy) onCancel();
      }}
      isDismissable={!isBusy}
      className="fixed inset-0 z-50 flex items-center justify-center bg-porsche-black/30 backdrop-blur-sm p-4"
    >
      <Modal className="w-full max-w-md">
        <Dialog
          role="alertdialog"
          className="bg-white rounded-porsche-xl shadow-porsche-xl border border-porsche-silver p-8 outline-none"
        >
          <Heading slot="title" className="text-xl font-bold text-porsche-black mb-2 tracking-tight">
            {title}
          </Heading>
          <p className="text-sm text-porsche-neutral-600 mb-6 leading-relaxed">{message}</p>

          <div className="flex gap-3 justify-end">
            <Button
              onPress={onCancel}
              isDisabled={isBusy}
              className="px-5 py-2.5 bg-white border-2 border-porsche-silver text-porsche-black rounded-porsche hover:bg-porsche-neutral-50 hover:border-porsche-neutral-400 pressed:bg-porsche-neutral-100 transition-all font-bold uppercase text-sm tracking-wide disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-porsche-neutral-400 focus:ring-offset-2"
            >
              {cancelLabel}
            </Button>
            <Button
              onPress={onConfirm}
              isDisabled={isBusy}
              className={cn(
                'px-5 py-2.5 text-white rounded-porsche transition-all font-bold uppercase text-sm tracking-wide active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-porsche-md',
                isDestructive
                  ? 'bg-porsche-red hover:bg-porsche-red/90 focus:ring-porsche-red'
                  : 'bg-console-primary hover:bg-console-primary-soft focus:ring-console-primary'
              )}
            >
              {isBusy ? 'Working…' : confirmLabel}
            </Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}

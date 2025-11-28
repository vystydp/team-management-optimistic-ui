import { AwsAccountRef } from '../../types/aws';
import { PorscheIcon } from '../shared/PorscheIcon';

interface AccountCardProps {
  account: AwsAccountRef;
  onSecure?: (accountId: string) => void;
  onRemove?: (accountId: string) => void;
  isProcessing?: boolean;
}

const statusConfig = {
  linked: {
    label: 'Linked',
    color: 'text-porsche-neutral-700',
    bgColor: 'bg-porsche-neutral-100',
    borderColor: 'border-porsche-neutral-300',
    icon: 'arrowRight' as const,
  },
  guardrailing: {
    label: 'Applying Guardrails',
    color: 'text-porsche-warning',
    bgColor: 'bg-porsche-warning/10',
    borderColor: 'border-porsche-warning',
    icon: 'loading' as const,
  },
  guardrailed: {
    label: 'Secured',
    color: 'text-porsche-success',
    bgColor: 'bg-porsche-success-bg',
    borderColor: 'border-porsche-success',
    icon: 'success' as const,
  },
  error: {
    label: 'Error',
    color: 'text-porsche-red',
    bgColor: 'bg-porsche-red/10',
    borderColor: 'border-porsche-red',
    icon: 'warning' as const,
  },
};

export const AccountCard = ({ account, onSecure, onRemove, isProcessing }: AccountCardProps) => {
  const config = statusConfig[account.status];
  const showSecureButton = account.status === 'linked' && onSecure;
  const canRemove = account.status !== 'guardrailing' && onRemove;

  return (
    <div className="bg-white rounded-porsche-lg border border-porsche-silver shadow-porsche-md p-fluid-md hover:shadow-porsche-lg transition-shadow duration-moderate">
      {/* Header with Status */}
      <div className="flex items-start justify-between mb-fluid-sm">
        <div className="flex-1">
          <h3 className="text-heading-sm font-bold text-porsche-neutral-800 font-porsche tracking-tight">
            {account.accountName}
          </h3>
          <p className="text-xs text-porsche-neutral-600 font-porsche mt-1">
            Account ID: {account.accountId}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-porsche border ${config.bgColor} ${config.borderColor}`}
        >
          {config.icon === 'loading' ? (
            <span className="animate-spin text-porsche-warning">⟳</span>
          ) : (
            <PorscheIcon name={config.icon} size={14} className={config.color} />
          )}
          <span className={`text-xs font-bold uppercase tracking-wide ${config.color} font-porsche`}>
            {config.label}
          </span>
        </div>
      </div>

      {/* Account Details */}
      <div className="space-y-2 mb-fluid-sm">
        <div className="flex items-start gap-2">
          <PorscheIcon name="user" size={14} className="text-porsche-neutral-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-porsche-neutral-700 font-porsche uppercase tracking-wide">
              Owner
            </p>
            <p className="text-xs text-porsche-neutral-600 font-porsche">{account.ownerEmail}</p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <PorscheIcon name="settings" size={14} className="text-porsche-neutral-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-porsche-neutral-700 font-porsche uppercase tracking-wide">
              Role ARN
            </p>
            <p className="text-xs text-porsche-neutral-600 font-porsche font-mono break-all">
              {account.roleArn}
            </p>
          </div>
        </div>

        {account.errorMessage && (
          <div className="flex items-start gap-2 bg-porsche-red/5 border border-porsche-red/20 rounded-porsche p-2">
            <PorscheIcon name="warning" size={14} className="text-porsche-red mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-porsche-red font-porsche uppercase tracking-wide">
                Error
              </p>
              <p className="text-xs text-porsche-neutral-700 font-porsche">{account.errorMessage}</p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {(showSecureButton || canRemove) && (
        <div className="flex gap-2 pt-fluid-sm border-t border-porsche-silver">
          {showSecureButton && (
            <button
              onClick={() => onSecure(account.id)}
              disabled={isProcessing}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-porsche shadow-porsche-sm text-xs font-bold uppercase tracking-wide text-white bg-console-primary hover:bg-console-primary-soft active:scale-95 focus:outline-none focus:ring-2 focus:ring-console-primary focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Securing...
                </>
              ) : (
                <>
                  <PorscheIcon name="success" size={14} className="mr-2" />
                  Apply Guardrails
                </>
              )}
            </button>
          )}
          {canRemove && (
            <button
              onClick={() => onRemove(account.id)}
              disabled={isProcessing}
              className="px-4 py-2 border-2 border-porsche-silver rounded-porsche shadow-porsche-sm text-xs font-bold uppercase tracking-wide text-porsche-neutral-600 bg-white hover:bg-porsche-neutral-50 hover:border-porsche-red hover:text-porsche-red active:scale-95 focus:outline-none focus:ring-2 focus:ring-porsche-red focus:ring-offset-2 transition-all duration-moderate ease-porsche-base font-porsche disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PorscheIcon name="delete" size={14} className="inline mr-1" />
              Remove
            </button>
          )}
        </div>
      )}

      {/* Metadata */}
      <div className="mt-fluid-sm pt-fluid-sm border-t border-porsche-silver flex items-center justify-between text-xs text-porsche-neutral-500 font-porsche">
        <span>Type: {account.type}</span>
        <span>Linked {new Date(account.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

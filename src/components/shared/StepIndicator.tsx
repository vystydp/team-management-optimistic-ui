import { PorscheIcon } from './PorscheIcon';
import { ICONS_MANIFEST } from '@porsche-design-system/assets';

type StepValue = number | { icon: keyof typeof ICONS_MANIFEST };

interface StepIndicatorProps {
  /** Step number (1, 2, 3, etc.) or object with icon for completed state */
  step: StepValue;
  /** Step title */
  title: string;
  /** Step description */
  description: string;
  /** Visual variant - determines background color */
  variant?: 'primary' | 'success';
}

/**
 * Reusable step indicator component for multi-step processes
 * Displays numbered or icon badge with title and description
 */
export const StepIndicator = ({ 
  step, 
  title, 
  description, 
  variant = 'primary' 
}: StepIndicatorProps) => {
  const isIcon = typeof step === 'object' && 'icon' in step;
  
  const badgeClasses = 
    variant === 'success'
      ? 'bg-porsche-success'
      : 'bg-console-primary';

  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0">
        <div 
          className={`inline-flex items-center justify-center h-12 w-12 rounded-full text-white font-bold font-porsche shadow-porsche-md ${badgeClasses}`}
        >
          {isIcon ? (
            <PorscheIcon name={step.icon} size={20} className="text-white" />
          ) : (
            <span>{step as number}</span>
          )}
        </div>
      </div>
      <div>
        <h4 className="font-bold text-porsche-neutral-800 mb-2 uppercase tracking-wide text-sm font-porsche">
          {title}
        </h4>
        <p className="text-sm text-porsche-neutral-600 font-porsche">
          {description}
        </p>
      </div>
    </div>
  );
};

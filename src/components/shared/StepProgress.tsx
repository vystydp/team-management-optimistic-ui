import React from 'react';

export interface StepProgressProps {
  steps: Array<{
    label: string;
    status: 'completed' | 'current' | 'upcoming';
  }>;
}

/**
 * Multi-step progress indicator for wizards
 * Shows horizontal progress bar with labeled steps
 */
export const StepProgress: React.FC<StepProgressProps> = ({ steps }) => {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => (
          <li key={index} className="flex-1 relative">
            {/* Connector line (except for last step) */}
            {index < steps.length - 1 && (
              <div
                className={`absolute top-4 left-[calc(50%+1.5rem)] right-[-50%] h-0.5 ${
                  step.status === 'completed' ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                aria-hidden="true"
              />
            )}
            
            <div className="flex flex-col items-center relative z-10">
              {/* Step indicator */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                  step.status === 'completed'
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : step.status === 'current'
                    ? 'bg-white border-blue-600 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
                aria-current={step.status === 'current' ? 'step' : undefined}
              >
                {step.status === 'completed' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              
              {/* Step label */}
              <span
                className={`mt-2 text-sm font-medium ${
                  step.status === 'current'
                    ? 'text-blue-600'
                    : step.status === 'completed'
                    ? 'text-gray-900'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

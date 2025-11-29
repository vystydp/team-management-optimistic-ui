import React from 'react';
import { ActionButton } from '../shared/ActionButton';

interface PageHeroProps {
  title: string;
  subtitle: string;
  primaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
  };
  secondaryAction?: {
    label: string;
    icon?: React.ReactNode;
    onPress: () => void;
  };
  breadcrumbs?: Array<{ label: string; href?: string }>;
  mobileOverflowText?: string;
}

/**
 * Reusable page hero component
 * Title, subtitle, and action buttons
 */
export const PageHero: React.FC<PageHeroProps> = ({
  title,
  subtitle,
  primaryAction,
  secondaryAction,
  mobileOverflowText,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
      <div className="flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {subtitle}
        </p>
      </div>

      {(primaryAction || secondaryAction) && (
        <>
          {/* Desktop: Show both buttons */}
          <div className="hidden sm:flex gap-3 flex-shrink-0">
            {secondaryAction && (
              <ActionButton variant="secondary" onPress={secondaryAction.onPress}>
                {secondaryAction.icon}
                {secondaryAction.label}
              </ActionButton>
            )}
            {primaryAction && (
              <ActionButton variant="primary" onPress={primaryAction.onPress}>
                {primaryAction.icon}
                {primaryAction.label}
              </ActionButton>
            )}
          </div>

          {/* Mobile: Primary CTA + overflow text */}
          <div className="sm:hidden w-full">
            {primaryAction && (
              <ActionButton variant="primary" onPress={primaryAction.onPress}>
                {primaryAction.icon}
                {primaryAction.label}
              </ActionButton>
            )}
            {secondaryAction && mobileOverflowText && (
              <button
                onClick={secondaryAction.onPress}
                className="w-full mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {mobileOverflowText} →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

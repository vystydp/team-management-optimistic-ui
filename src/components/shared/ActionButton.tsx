import { Button as AriaButton, ButtonProps as AriaButtonProps } from 'react-aria-components';
import { PorscheIcon } from './PorscheIcon';
import { ICONS_MANIFEST } from '@porsche-design-system/assets';

type ButtonVariant = 'primary' | 'secondary';

interface ActionButtonProps extends Omit<AriaButtonProps, 'className'> {
  variant?: ButtonVariant;
  icon?: keyof typeof ICONS_MANIFEST;
  iconSize?: number;
  children: React.ReactNode;
}

/**
 * Reusable action button component with consistent styling
 * Follows Porsche Design System with CloudOps console theme
 */
export const ActionButton = ({
  variant = 'primary',
  icon,
  iconSize = 16,
  children,
  isDisabled,
  ...props
}: ActionButtonProps) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 px-6 py-3 rounded-porsche shadow-porsche-md text-sm font-bold uppercase tracking-wide font-porsche transition-all duration-moderate ease-porsche-base focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary:
      'text-white bg-console-primary hover:bg-console-primary-soft pressed:bg-console-primary-dark active:scale-95 focus:ring-console-primary disabled:bg-porsche-neutral-400 disabled:cursor-not-allowed',
    secondary:
      'text-porsche-neutral-700 bg-white border-2 border-porsche-silver hover:bg-porsche-shading active:scale-95 focus:ring-console-primary disabled:bg-porsche-neutral-100 disabled:text-porsche-neutral-600 disabled:cursor-not-allowed',
  };

  return (
    <AriaButton
      {...props}
      isDisabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {icon && (
        <PorscheIcon
          name={icon}
          size={iconSize}
          className={variant === 'primary' ? 'text-white' : 'text-current'}
        />
      )}
      {children}
    </AriaButton>
  );
};

import React from 'react';
import { ActionButton } from '../shared/ActionButton';

interface FiltersBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  statusFilter?: {
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
  };
  primaryAction?: {
    label: string;
    mobileLabel?: string;
    icon?: React.ReactNode;
    onPress: () => void;
  };
  className?: string;
}

/**
 * Reusable filters bar component
 * Search, status dropdown, and optional primary action
 */
export const FiltersBar: React.FC<FiltersBarProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  statusFilter,
  primaryAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 ${className}`}>
      {onSearchChange && (
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      )}

      {statusFilter && (
        <select
          value={statusFilter.value}
          onChange={(e) => statusFilter.onChange(e.target.value)}
          className="px-3 sm:px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:w-auto"
        >
          {statusFilter.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}

      {primaryAction && (
        <ActionButton variant="primary" onPress={primaryAction.onPress}>
          {primaryAction.icon}
          <span className="hidden sm:inline">{primaryAction.label}</span>
          <span className="sm:hidden">{primaryAction.mobileLabel || primaryAction.label}</span>
        </ActionButton>
      )}
    </div>
  );
};

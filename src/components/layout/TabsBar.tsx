import React from 'react';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsBarProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

/**
 * Reusable tabs bar component
 * Horizontal tab switcher
 */
export const TabsBar: React.FC<TabsBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-gray-200 ${className}`}>
      <nav className="-mb-px flex">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1 sm:flex-none whitespace-nowrap py-3 px-4 sm:px-1 ${index > 0 ? 'sm:ml-8' : ''} 
              border-b-2 font-medium text-xs sm:text-sm transition-colors text-center
              ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 text-xs opacity-75">({tab.count})</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

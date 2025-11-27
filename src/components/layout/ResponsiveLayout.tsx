import { ReactNode } from 'react';
import { PorscheIcon } from '../shared/PorscheIcon';
import { ICONS_MANIFEST } from '@porsche-design-system/assets';

export type NavigationTab = 'teams' | 'environments' | 'aws-accounts' | 'control-plane';

export interface ResponsiveLayoutProps {
  children: ReactNode;
  currentTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

/**
 * Responsive layout component with mobile tabs and desktop sidebar
 * Implements CSS Grid for performance without JavaScript re-renders
 */
export const ResponsiveLayout = ({ children, currentTab, onTabChange }: ResponsiveLayoutProps) => {
  const tabs: { id: NavigationTab; label: string; icon: keyof typeof ICONS_MANIFEST }[] = [
    { id: 'teams', label: 'Teams', icon: 'userGroup' },
    { id: 'environments', label: 'Environments', icon: 'globe' },
    { id: 'aws-accounts', label: 'AWS Accounts', icon: 'success' },
    { id: 'control-plane', label: 'Control Plane', icon: 'information' },
  ];

  return (
    <div className="min-h-screen bg-porsche-canvas">
      {/* Mobile Navigation - Top Tabs (Console Theme) */}
      <nav className="lg:hidden bg-white backdrop-blur-porsche-sm border-b-2 border-porsche-silver sticky top-0 z-10 shadow-porsche-sm">
        <div className="px-4 pt-3 pb-2">
          <h1 className="text-heading-sm font-bold text-porsche-neutral-800 font-porsche tracking-tight">
            CloudOps Platform
          </h1>
        </div>
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex-1 min-w-[100px] px-4 py-3 text-xs font-bold uppercase tracking-wide font-porsche
                transition-all duration-moderate ease-porsche-base relative
                ${
                  currentTab === tab.id
                    ? 'text-console-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-console-primary'
                    : 'text-porsche-neutral-500 hover:text-porsche-neutral-700 hover:bg-porsche-shading'
                }
              `}
              aria-current={currentTab === tab.id ? 'page' : undefined}
            >
              <span className="mr-2" aria-hidden="true">
                <PorscheIcon name={tab.icon} size={16} className="inline" />
              </span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Desktop Layout - Grid with Sidebar */}
      <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-0">
        {/* Desktop Sidebar Navigation (Console Theme) */}
        <aside className="hidden lg:block bg-white border-r-2 border-porsche-silver min-h-screen sticky top-0 h-screen overflow-y-auto">
          <div className="p-fluid-lg">
            <h1 className="text-heading-md font-bold text-porsche-neutral-800 mb-fluid-lg font-porsche tracking-tight">
              CloudOps Platform
            </h1>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    w-full flex items-center px-4 py-3 text-sm font-bold uppercase tracking-wide rounded-porsche font-porsche
                    transition-all duration-moderate ease-porsche-base relative
                    ${
                      currentTab === tab.id
                        ? 'text-console-primary bg-porsche-shading before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-console-primary before:rounded-l-porsche'
                        : 'text-porsche-neutral-500 hover:bg-porsche-shading hover:text-porsche-neutral-700'
                    }
                  `}
                  aria-current={currentTab === tab.id ? 'page' : undefined}
                >
                  <span className="mr-3" aria-hidden="true">
                    <PorscheIcon name={tab.icon} size={20} className={currentTab === tab.id ? 'text-console-primary' : 'text-porsche-neutral-500'} />
                  </span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Sidebar Footer - Additional Info */}
            <div className="mt-fluid-xl pt-fluid-lg border-t border-porsche-silver">
              <div className="text-xs text-porsche-neutral-600 font-porsche">
                <p className="font-bold mb-2 uppercase tracking-wide">Platform Status</p>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-porsche-success rounded-full mr-2 animate-pulse"></span>
                  <span>All Systems Operational</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-fluid-lg">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

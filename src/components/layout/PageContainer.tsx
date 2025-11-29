import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Max-width container for consistent page layout
 * Centered on large screens, full-width on mobile
 */
export const PageContainer: React.FC<PageContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-0 ${className}`}>
      {children}
    </div>
  );
};

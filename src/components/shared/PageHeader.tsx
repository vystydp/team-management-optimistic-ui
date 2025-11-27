interface PageHeaderProps {
  breadcrumb: string;
  title?: string;
}

/**
 * Reusable page header component with CloudOps branding
 * Displays logo, breadcrumb, and platform title consistently across all pages
 */
export const PageHeader = ({ breadcrumb, title = 'CloudOps Platform' }: PageHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-fluid-md">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-porsche-neutral-800 rounded-porsche flex items-center justify-center">
            <span className="text-white font-bold text-xl font-porsche">CO</span>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide font-semibold text-porsche-neutral-500 mb-1 font-porsche">
              {breadcrumb}
            </div>
            <h1 className="text-heading-xl font-bold text-porsche-neutral-800 tracking-tight font-porsche">
              {title}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

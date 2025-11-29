import React from 'react';

interface KpiTile {
  label: string;
  value: string | number;
  color: 'gray' | 'blue' | 'green' | 'orange' | 'red';
  sublabel?: string;
  icon?: React.ReactNode;
}

interface KpiRowProps {
  tiles: KpiTile[];
}

/**
 * KPI Row component - displays metric tiles
 * Used for dashboards and overview pages
 */
export const KpiRow: React.FC<KpiRowProps> = ({ tiles }) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 text-blue-900';
      case 'green':
        return 'bg-green-50 border-green-200 text-green-900';
      case 'orange':
        return 'bg-orange-50 border-orange-200 text-orange-900';
      case 'red':
        return 'bg-red-50 border-red-200 text-red-900';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      {tiles.map((tile, index) => (
        <div
          key={index}
          className={`${getColorClasses(tile.color)} rounded-porsche p-4 border shadow-porsche-sm`}
        >
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
              {tile.label}
            </p>
            {tile.icon && <div>{tile.icon}</div>}
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold">{tile.value}</p>
          </div>
          {tile.sublabel && (
            <p className="text-xs text-gray-600 mt-1">{tile.sublabel}</p>
          )}
        </div>
      ))}
    </div>
  );
};

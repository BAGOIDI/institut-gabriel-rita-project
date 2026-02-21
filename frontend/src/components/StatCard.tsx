import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  subtitle,
  className = '',
  onClick
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`modern-card modern-card-hover rounded-xl p-4 transition-all duration-300 cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div>
          {icon && (
            <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30 mb-2">
              {icon}
            </div>
          )}
          <div className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-1 uppercase">
            {title}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </div>
          )}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold ${
            trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {trend.isPositive ? (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
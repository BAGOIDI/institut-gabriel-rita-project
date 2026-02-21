import React from 'react';

interface BancoCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const BancoCard: React.FC<BancoCardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  hoverEffect = true,
  onClick
}) => {
  const baseClasses = 'banco-card overflow-hidden';
  const hoverClasses = hoverEffect ? 'banco-card-hover cursor-pointer' : '';
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      onClick={handleClick}
    >
      {(title || subtitle) && (
        <div className="border-b border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white font-inter">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-inter">
              {subtitle}
            </p>
          )}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};

interface BancoStatCardProps {
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

export const BancoStatCard: React.FC<BancoStatCardProps> = ({
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
      className={`banco-stat-card rounded-xl p-4 transition-all duration-300 cursor-pointer ${className}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between min-h-[88px]">
        <div className="flex flex-col justify-between">
          {icon && (
            <div className="p-2 rounded-md bg-primary-light dark:bg-primary-dark/30 mb-3 flex items-center justify-center" style={{ width: '40px', height: '40px' }}>
              {icon}
            </div>
          )}
          <div className="text-sm font-semibold tracking-wide text-gray-500 dark:text-gray-400 mb-1 uppercase font-inter">
            {title}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white font-inter">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-inter">
              {subtitle}
            </div>
          )}
        </div>
        
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-bold font-inter ${
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
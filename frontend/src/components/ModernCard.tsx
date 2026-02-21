import React, { ReactNode } from 'react';

interface ModernCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  variant?: 'default' | 'hover' | 'enhanced';
  onClick?: () => void;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  variant = 'default',
  onClick
}) => {
  const baseClasses = 'modern-card border border-gray-200 dark:border-slate-700';
  
  const variantClasses = {
    default: '',
    hover: 'modern-card-hover',
    enhanced: 'modern-card-enhanced'
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} rounded-xl overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {(title || subtitle) && (
        <div className="border-b border-gray-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-800">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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

export default ModernCard;
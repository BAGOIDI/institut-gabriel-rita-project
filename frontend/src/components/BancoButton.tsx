import React from 'react';

interface BancoButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const BancoButton: React.FC<BancoButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button'
}) => {
  const baseClasses = 'banco-button font-semibold transition-all duration-300 flex items-center justify-center gap-2';
  
  const variantClasses = {
    primary: 'banco-button-primary banco-button-fill',
    secondary: 'banco-button-secondary banco-button-fill',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white'
  };
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-2xl'
  };
  
  const disabledClasses = disabled 
    ? 'opacity-50 cursor-not-allowed transform-none shadow-none' 
    : 'cursor-pointer';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {variant !== 'outline' && (
        <div className="hover-fill"></div>
      )}
      <span className="relative z-10 flex items-center gap-2">
        {children}
      </span>
    </button>
  );
};
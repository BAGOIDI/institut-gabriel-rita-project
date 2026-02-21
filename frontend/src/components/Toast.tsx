import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/30',
          border: 'border-emerald-200 dark:border-emerald-700',
          text: 'text-emerald-800 dark:text-emerald-200',
          icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        };
      case 'error':
        return {
          bg: 'bg-red-50 dark:bg-red-900/30',
          border: 'border-red-200 dark:border-red-700',
          text: 'text-red-800 dark:text-red-200',
          icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/30',
          border: 'border-amber-200 dark:border-amber-700',
          text: 'text-amber-800 dark:text-amber-200',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        };
      case 'info':
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/30',
          border: 'border-blue-200 dark:border-blue-700',
          text: 'text-blue-800 dark:text-blue-200',
          icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        };
    }
  };

  const styles = getStyles();

  return (
    <div 
      className={`${styles.bg} ${styles.border} ${styles.text} border rounded-md shadow-lg p-4 flex items-start gap-3 min-w-[300px] max-w-md animate-in slide-in-from-right duration-300`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {styles.icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: string; message: string; type: ToastType }>;
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => onRemove(toast.id)}
        />
      ))}
    </div>
  );
};

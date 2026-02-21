import React from 'react';
import { AlertTriangle, Info, Trash2, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  type = 'danger',
  loading = false,
}) => {
  if (!isOpen) return null;

  const getStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />,
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          confirmBg: 'bg-red-600 hover:bg-red-700 border-red-700',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
          iconBg: 'bg-amber-100 dark:bg-amber-900/30',
          confirmBg: 'bg-amber-600 hover:bg-amber-700 border-amber-700',
        };
      case 'info':
      default:
        return {
          icon: <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          confirmBg: 'bg-blue-600 hover:bg-blue-700 border-blue-700',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-md border border-gray-200 dark:border-slate-700 shadow-2xl max-w-md w-full animate-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              {styles.icon}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-700 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-md transition-colors border border-gray-200 dark:border-slate-600 disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors border ${styles.confirmBg} disabled:opacity-50 flex items-center gap-2`}
          >
            {loading && (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            )}
            <span>{loading ? 'Traitement...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

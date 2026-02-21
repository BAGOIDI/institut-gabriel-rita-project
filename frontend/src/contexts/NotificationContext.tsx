import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useToast } from '../hooks/useToast';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void | Promise<void>;
}

interface NotificationContextType {
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
  confirm: (options: ConfirmOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification doit être utilisé dans un NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toasts, removeToast, success, error, warning, info } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    options: ConfirmOptions | null;
    loading: boolean;
  }>({
    isOpen: false,
    options: null,
    loading: false,
  });

  const confirm = useCallback((options: ConfirmOptions) => {
    setConfirmDialog({ isOpen: true, options, loading: false });
  }, []);

  const handleConfirm = async () => {
    if (!confirmDialog.options?.onConfirm) return;

    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    
    try {
      await confirmDialog.options.onConfirm();
      setConfirmDialog({ isOpen: false, options: null, loading: false });
    } catch (err) {
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
      error('Une erreur est survenue');
    }
  };

  const handleClose = () => {
    if (!confirmDialog.loading) {
      setConfirmDialog({ isOpen: false, options: null, loading: false });
    }
  };

  return (
    <NotificationContext.Provider value={{ success, error, warning, info, confirm }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {confirmDialog.isOpen && confirmDialog.options && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={handleClose}
          onConfirm={handleConfirm}
          title={confirmDialog.options.title}
          message={confirmDialog.options.message}
          confirmText={confirmDialog.options.confirmText}
          cancelText={confirmDialog.options.cancelText}
          type={confirmDialog.options.type}
          loading={confirmDialog.loading}
        />
      )}
    </NotificationContext.Provider>
  );
};

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo } from 'react-icons/fi';
import Modal from './Modal';
import Button from './Button';

const ToastContext = createContext(null);
const ConfirmContext = createContext(null);

const toastStyles = {
  success: { icon: FiCheckCircle, className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  error: { icon: FiAlertCircle, className: 'bg-red-50 text-red-800 border-red-200' },
  info: { icon: FiInfo, className: 'bg-slate-50 text-slate-800 border-slate-200' },
};

let idCounter = 0;

export const FeedbackProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [confirmState, setConfirmState] = useState(null);
  const resolverRef = useRef(null);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = 'info') => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast]
  );

  const confirm = useCallback(({ title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = false }) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setConfirmState({ title, message, confirmLabel, danger });
    });
  }, []);

  const closeConfirm = (result) => {
    resolverRef.current?.(result);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={toast}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
          {toasts.map((t) => {
            const { icon: Icon, className } = toastStyles[t.type] || toastStyles.info;
            return (
              <div
                key={t.id}
                className={`pointer-events-auto flex items-start gap-2 rounded-lg border px-4 py-3 shadow-lg text-sm max-w-sm ${className}`}
              >
                <Icon className="mt-0.5 shrink-0" />
                <span>{t.message}</span>
              </div>
            );
          })}
        </div>

        <Modal
          open={!!confirmState}
          onClose={() => closeConfirm(false)}
          title={confirmState?.title}
          footer={
            <>
              <Button variant="secondary" onClick={() => closeConfirm(false)}>
                Cancel
              </Button>
              <Button variant={confirmState?.danger ? 'danger' : 'primary'} onClick={() => closeConfirm(true)}>
                {confirmState?.confirmLabel}
              </Button>
            </>
          }
        >
          <p className="text-sm text-slate-600">{confirmState?.message}</p>
        </Modal>
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
export const useConfirm = () => useContext(ConfirmContext);

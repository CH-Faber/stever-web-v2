import React, { useEffect, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const toastIcons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error: <AlertCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const toastStyles: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50',
  error: 'border-red-200 bg-red-50',
  warning: 'border-amber-200 bg-amber-50',
  info: 'border-blue-200 bg-blue-50',
};

function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setIsVisible(true));

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => onClose(toast.id), 300);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [toast.id, toast.duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(toast.id), 300);
  };

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-md transition-all duration-300',
        toastStyles[toast.type],
        isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      )}
    >
      {toastIcons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-gray-600 mt-1">{toast.message}</p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

// Toast Store Hook
let toastId = 0;
const listeners: Set<(toasts: ToastMessage[]) => void> = new Set();
let toasts: ToastMessage[] = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  show: (type: ToastType, title: string, message?: string, duration?: number) => {
    const id = `toast-${++toastId}`;
    toasts = [...toasts, { id, type, title, message, duration }];
    notifyListeners();
    return id;
  },
  success: (title: string, message?: string) => toast.show('success', title, message),
  error: (title: string, message?: string) => toast.show('error', title, message),
  warning: (title: string, message?: string) => toast.show('warning', title, message),
  info: (title: string, message?: string) => toast.show('info', title, message),
  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  },
  dismissAll: () => {
    toasts = [];
    notifyListeners();
  },
};

export function useToasts() {
  const [currentToasts, setCurrentToasts] = useState<ToastMessage[]>(toasts);

  useEffect(() => {
    listeners.add(setCurrentToasts);
    return () => {
      listeners.delete(setCurrentToasts);
    };
  }, []);

  const handleClose = useCallback((id: string) => {
    toast.dismiss(id);
  }, []);

  return { toasts: currentToasts, onClose: handleClose };
}

export default Toast;
